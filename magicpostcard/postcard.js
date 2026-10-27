/* ─────────────────────────────────────────────────────────────
   MAGIC POSTCARD: draws the postcard, front and back.
   The same drawing is used for the live preview on the page, for the print files (6 × 4 in at 300 dpi,
   with 1/8 in bleed all round) and for the picture the camera looks for.
   MagicPostcard.draw(canvas, 'front' | 'back', card, { scale, bleed })
   MagicPostcard.print('front' | 'back', card) → a canvas ready to send to the printer
   No need to edit this file.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const W = 576, H = 384;                      // the card in CSS px (6 × 4 in at 96 px per inch)
  const NAVY = '#1f3352', CREAM = '#f6f1e8', SKY = '#b9cfe6';
  const ACCENTS = ['#ec9a72', '#7da7d1', '#f2c14e', '#f6f1e8'];
  const FONTS = ['900 46px Archivo', '800 17px Archivo', '27px Yellowtail', '700 19px Caveat', '500 22px Caveat', '400 12px "Atkinson Hyperlegible"', '700 12px "Atkinson Hyperlegible"'];
  let fontsReady = null;
  function ready() {
    if (fontsReady) return fontsReady;
    fontsReady = document.fonts ? Promise.all(FONTS.map(f => document.fonts.load(f).catch(() => {}))).then(() => document.fonts.ready) : Promise.resolve();
    return fontsReady;
  }

  const DEFAULTS = { place: 'Asbury Park', greet: true, greetText: null, to: '', message: '', from: '', accent: ACCENTS[0], qr: 'https://artalivestudio.com/magicpostcard/', address: null, hints: false };   // hints: grey example text in empty places (the live preview only, never printed)

  /* ── small drawing helpers ── */
  function font(g, weight, size, family, stretch) {
    g.font = weight + ' ' + size + 'px ' + family;
    if ('fontStretch' in g) g.fontStretch = stretch || 'normal';
  }
  function spacing(g, em, size) { if ('letterSpacing' in g) g.letterSpacing = (em * size) + 'px'; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function cover(g, img, x, y, w, h) {
    if (!img || !img.width) { g.fillStyle = '#7da7d1'; g.fillRect(x, y, w, h); return; }
    const iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height, s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    g.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }
  function contain(g, img, x, y, w, h) {
    if (!img || !img.width) return;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
    g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  // wrap text into lines no wider than max (words longer than the line are broken)
  function wrap(g, text, max) {
    const out = [];
    String(text || '').split('\n').forEach(par => {
      const words = par.split(/\s+/).filter(Boolean); let line = '';
      if (!words.length) { out.push(''); return; }
      for (let w of words) {
        while (g.measureText(w).width > max && w.length > 1) { let k = w.length - 1; while (k > 1 && g.measureText(w.slice(0, k)).width > max) k--; if (line) { out.push(line); line = ''; } out.push(w.slice(0, k)); w = w.slice(k); }
        const t = line ? line + ' ' + w : w;
        if (g.measureText(t).width <= max) line = t; else { out.push(line); line = w; }
      }
      out.push(line);
    });
    return out;
  }
  const sparkle = new Path2D('M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z');
  const rays = new Path2D('M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3');
  const horn = [new Path2D('M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1z'), new Path2D('M7 15l1.5 5h2.5l-1.2-4.2'), new Path2D('M19 9.5a3.5 3.5 0 0 1 0 5')];
  function icon(g, paths, x, y, size, color, width, fill) {
    g.save(); g.translate(x, y); g.scale(size / 24, size / 24); g.lineCap = g.lineJoin = 'round';
    if (fill) { g.fillStyle = color; [].concat(paths).forEach(p => g.fill(p)); } else { g.strokeStyle = color; g.lineWidth = width; [].concat(paths).forEach(p => g.stroke(p)); }
    g.restore();
  }
  function qrDraw(g, text, x, y, size) {
    g.fillStyle = '#fff'; g.fillRect(x, y, size, size);
    if (!window.qrcode) return;
    const q = window.qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), m = size / n;
    g.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(x + c * m, y + r * m, Math.ceil(m * 100) / 100 + .02, Math.ceil(m * 100) / 100 + .02);
  }

  /* ── the front: the square picture with its place name, and the Magic Postcard strip ── */
  // top: only what sits on top of the picture (shade, frame, place name, badge), on a clear background, for laying over a moving picture
  function front(g, d, bleed, top) {
    const A = d.accent || ACCENTS[0], b = bleed || 0;
    // the strip's navy runs into the bleed on the right, top and bottom
    if (!top) { g.fillStyle = NAVY; g.fillRect(-b, -b, W + 2 * b, H + 2 * b); }
    // the picture (into the bleed on the left, top and bottom)
    g.save(); g.beginPath(); g.rect(-b, -b, 384 + b, H + 2 * b); g.clip(); if (!top) cover(g, d.photo, -b, -b, 384 + b, H + 2 * b);
    // a soft shade in the top-left so the place name always reads
    const dir = [Math.sin(160 * Math.PI / 180), -Math.cos(160 * Math.PI / 180)], L = 384 * (Math.abs(dir[0]) + Math.abs(dir[1]));
    const gr = g.createLinearGradient(192 - dir[0] * L / 2, 192 - dir[1] * L / 2, 192 + dir[0] * L / 2, 192 + dir[1] * L / 2);
    gr.addColorStop(0, 'rgba(31,51,82,.28)'); gr.addColorStop(.38, 'rgba(31,51,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, 384, 384);
    g.restore();
    // the thin cream frame, like a printed photo
    g.save(); g.strokeStyle = 'rgba(246,241,232,.75)'; g.lineWidth = 1.5; rr(g, 9.75, 9.75, 384 - 19.5, 384 - 19.5, 3); g.stroke(); g.restore();
    // the greeting line ("Greetings from", or an occasion's: "Happy Birthday", "Happy Holidays from"…) and the big title
    const place = String(d.place || '').trim().toUpperCase(), greetText = d.greetText != null ? String(d.greetText).trim().slice(0, 28) : 'Greetings from';
    let ty = 22;
    if (d.greet !== false && place && greetText) {
      g.save(); g.translate(27, 49); g.rotate(-4 * Math.PI / 180); font(g, '400', 27, 'Yellowtail, "Brush Script MT", cursive'); spacing(g, 0, 27);
      g.shadowColor = 'rgba(20,38,66,.55)'; g.shadowBlur = 3; g.shadowOffsetY = 1; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; let gs = 27; while (gs > 18 && g.measureText(greetText).width > 330) { gs -= 1; font(g, '400', gs, 'Yellowtail, "Brush Script MT", cursive'); } g.fillText(greetText, 0, -6); g.restore();
      ty = 51;
    }
    if (place) {
      // two lines when the name has more than one word, then shrink until it fits the picture
      const words = place.split(/\s+/); let lines = [place];
      if (words.length > 1) { let best = null; for (let k = 1; k < words.length; k++) { const a = words.slice(0, k).join(' '), c = words.slice(k).join(' '), m = Math.max(a.length, c.length); if (!best || m < best.m) best = { m, l: [a, c] }; } lines = best.l; }
      let size = 46; font(g, '900', size, 'Archivo, "Arial Black", sans-serif', 'expanded'); spacing(g, -.005, size);
      while (size > 20 && Math.max(...lines.map(l => g.measureText(l).width)) > 330) { size -= 1; font(g, '900', size, 'Archivo, "Arial Black", sans-serif', 'expanded'); spacing(g, -.005, size); }
      const lh = size * .88; g.textBaseline = 'middle';
      lines.forEach((l, i) => {
        const y = ty + lh * i + lh / 2;
        g.save(); g.shadowColor = 'rgba(20,38,66,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.fillStyle = NAVY; g.fillText(l, 24 + 4, y + 4); g.restore();
        g.fillStyle = A; g.fillText(l, 24 + 2, y + 2);
        g.fillStyle = '#fff'; g.fillText(l, 24, y);
      });
    }
    // the badge along the bottom of the picture
    {
      font(g, '800', 9.5, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .1, 9.5);
      const l1a = 'SCAN QR CODE', l1b = ' AND SEE THIS IMAGE', l2 = 'COME TO LIFE THROUGH YOUR CAMERA';
      const w1 = g.measureText(l1a + l1b).width, w2 = g.measureText(l2).width, tw = Math.max(w1, w2), bw = 11 + 16 + 8 + tw + 14, bh = 7 + 9.5 * 1.35 * 2 + 7, bx = (384 - bw) / 2, by = 384 - 20 - bh;
      g.fillStyle = 'rgba(31,51,82,.82)'; rr(g, bx, by, bw, bh, 12); g.fill();
      icon(g, rays, bx + 11, by + bh / 2 - 8, 16, A, 2.4);
      const cx = bx + 11 + 16 + 8 + tw / 2; g.textBaseline = 'middle';
      const x1 = cx - w1 / 2; g.textAlign = 'left'; g.fillStyle = A; g.fillText(l1a, x1, by + 7 + 6.4); g.fillStyle = CREAM; g.fillText(l1b, x1 + g.measureText(l1a).width, by + 7 + 6.4);
      g.textAlign = 'center'; g.fillText(l2, cx, by + 7 + 12.8 + 6.4); g.textAlign = 'left';
    }
    if (top) { if ('letterSpacing' in g) g.letterSpacing = '0px'; return; }
    // stamp perforations where the picture meets the strip
    g.fillStyle = NAVY; for (let y = 6 - 12 * Math.ceil(b / 12); y < H + b; y += 12) { g.beginPath(); g.arc(384, y, 3.4, 0, Math.PI * 2); g.fill(); }

    /* the strip */
    const X = 402, SW = 156, CX = 480;
    // the recipient panel
    const inner = 128;
    font(g, '900', 14, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .02, 14);
    const name = String(d.to || '').trim().toUpperCase(), nameLines = name ? wrap(g, name, inner).slice(0, 3) : [];
    const ph = 8 + 34 + (name ? 8 + 19 + 3 + 16.8 * nameLines.length : 0) + 10;
    g.fillStyle = 'rgba(185,207,230,.09)'; rr(g, X, 18, SW, ph, 8); g.fill(); g.strokeStyle = 'rgba(185,207,230,.2)'; g.lineWidth = 1; rr(g, X + .5, 18.5, SW - 1, ph - 1, 8); g.stroke();
    icon(g, horn, 416, 26, 34, SKY, 1.7);
    font(g, '800', 9, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .12, 9); g.fillStyle = SKY; g.textBaseline = 'middle';
    ['PERSONAL', 'MESSAGE', 'INCLUDED'].forEach((t, i) => g.fillText(t, 456, 26 + 17 + (i - 1) * 11.25));
    if (name) {
      font(g, '700', 19, 'Caveat, "Segoe Print", cursive'); spacing(g, 0, 19); g.fillStyle = A; g.textBaseline = 'middle'; g.fillText('To', 416, 68 + 10);
      font(g, '900', 14, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .02, 14); g.fillStyle = '#fff';
      nameLines.forEach((t, i) => g.fillText(t, 416, 90 + 16.8 * i + 8.4));
    }
    const panelEnd = 18 + ph;
    // MAGIC POSTCARD along the bottom, with its sparkle, above the waves
    let ms = 38; font(g, '900', ms, 'Archivo, "Arial Black", sans-serif', 'expanded'); spacing(g, .01, ms);
    while (ms > 26 && g.measureText('MAGIC').width > 134) { ms -= 1; font(g, '900', ms, 'Archivo, "Arial Black", sans-serif', 'expanded'); spacing(g, .01, ms); }
    const mw = g.measureText('MAGIC').width - .01 * ms, mx = CX - mw / 2, my = 290 + (38 - ms);
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText('MAGIC', mx, my + ms / 2);
    font(g, '800', 17, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, 0, 17); g.fillStyle = A;
    const letters = 'POSTCARD'.split(''), lw = letters.map(c => g.measureText(c).width), gap = (mw - lw.reduce((a, c) => a + c, 0)) / (letters.length - 1);
    let lx = mx; letters.forEach((c, i) => { g.fillText(c, lx, my + ms + 7 + 8.5); lx += lw[i] + gap; });
    icon(g, sparkle, mx + mw + 1, my - 7, 14, A, 0, true);
    // the QR group, centred in the space between
    const qh = 11 + 8 + 101 + 8 + 11, qy0 = panelEnd + Math.max(6, (my - panelEnd - qh) / 2), qy = qy0;
    font(g, '900', 11, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .1, 11); g.fillStyle = CREAM; g.textAlign = 'center';
    g.fillText('SCAN QR CODE', CX + .55, qy + 5.5);
    const fx = CX - 50.5, fy = qy + 11 + 8;
    g.save(); g.strokeStyle = A; g.lineWidth = 1.5; g.setLineDash([4, 3]); rr(g, fx + .75, fy + .75, 99.5, 99.5, 9); g.stroke(); g.restore();
    g.fillStyle = '#fff'; rr(g, fx + 5.5, fy + 5.5, 90, 90, 5); g.fill();
    qrDraw(g, d.qr || DEFAULTS.qr, fx + 10.5, fy + 10.5, 80);
    font(g, '800', 11, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .1, 11); g.fillStyle = A;
    g.fillText('IMAGE ANIMATES', CX + .55, fy + 101 + 8 + 5.5); g.textAlign = 'left';
    // the waves
    g.save(); g.translate(384, 358); g.scale(192 / 192, 1);
    const wave = (y0, col) => { g.beginPath(); g.moveTo(0, y0); for (let x = 0; x < 192 + b; x += 32) { g.quadraticCurveTo(x + 8, y0 - 8, x + 16, y0); g.quadraticCurveTo(x + 24, y0 + 8, x + 32, y0); } g.lineTo(192 + b, 26 + b); g.lineTo(0, 26 + b); g.closePath(); g.fillStyle = col; g.fill(); };
    wave(10, '#27406a'); wave(17, '#2f4c7c'); g.restore();
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  /* ── the back: the personal message, the second picture to scan, and the address ── */
  function back(g, d, bleed) {
    const b = bleed || 0;
    g.fillStyle = '#fbf8f2'; g.fillRect(-b, -b, W + 2 * b, H + 2 * b);
    // left: the message
    font(g, '800', 11, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, .22, 11); g.fillStyle = '#b4531a'; g.textBaseline = 'middle';
    g.fillText('A MESSAGE FOR YOU', 28, 33.5);
    const top = 49, bottom = 264;
    g.fillStyle = '#d9d2c5'; for (let y = top + 27; y < bottom; y += 28) g.fillRect(28, y, 248, 1);
    let msg = String(d.message || '').trim(); const from = String(d.from || '').trim();
    // left empty: the lines stay blank, to write on by hand (the preview shows grey hints instead)
    const text = (msg || (d.hints ? '[Your greeting goes here: typed when you order, printed in this handwriting.]' : '')) + '\n\n' + (from ? '\u2014 ' + from : (msg || !d.hints ? '' : '[Your name]'));
    let size = 22, lines; spacing(g, 0, 22);
    if (!msg && from && !d.hints) { font(g, '500', size, 'Caveat, "Segoe Print", cursive'); g.fillStyle = '#1b1f26'; g.textBaseline = 'alphabetic';   // a blank card: sign it on the last line, the rest stays free to write on
      const n = Math.floor((bottom - top) / 28); g.fillText('\u2014 ' + from, 28, top + 2 + 28 * (n - 1) + 21); lines = []; }
    else {
    for (;;) { font(g, '500', size, 'Caveat, "Segoe Print", cursive'); lines = wrap(g, text.replace(/\n+$/, ''), 246); if (lines.length * 28 <= bottom - top || size <= 15) break; size -= 1; }
    g.fillStyle = msg ? '#1b1f26' : '#6f6857'; g.textBaseline = 'alphabetic';
    lines.slice(0, Math.floor((bottom - top) / 28)).forEach((l, i) => g.fillText(l, 28, top + 2 + 28 * i + 21)); }
    // the second picture to scan
    g.fillStyle = '#15191f'; rr(g, 28, 274, 64, 82, 8); g.fill();
    if (d.icon) contain(g, d.icon, 34, 280, 52, 70);
    font(g, '900', 14, 'Archivo, "Arial Black", sans-serif', 'semi-expanded'); spacing(g, 0, 14); g.fillStyle = '#1b1f26'; g.textBaseline = 'middle';
    g.fillText('SCAN ME TOO', 104, 299);
    font(g, '400', 12, '"Atkinson Hyperlegible", Verdana, sans-serif'); g.fillStyle = '#4a505a';
    wrap(g, 'Point your phone at this picture for one more surprise.', 172).forEach((l, i) => g.fillText(l, 104, 318 + i * 15.6));
    // the line down the middle
    g.fillStyle = '#cfc7b8'; g.fillRect(292, 28, 1, 328);
    // right: who it's from, the stamp, the address
    font(g, '900', 15, 'Archivo, "Arial Black", sans-serif', 'extra-expanded'); spacing(g, 0, 15); g.fillStyle = '#1b1f26'; g.fillText('ART ALIVE', 309, 37.5);
    font(g, '400', 12, '"Atkinson Hyperlegible", Verdana, sans-serif'); g.fillStyle = '#4a505a'; g.fillText('artalivestudio.com', 309, 55);
    g.save(); g.strokeStyle = '#9a927f'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.strokeRect(478.75, 28.75, 68.5, 82.5); g.restore();
    font(g, '800', 9, 'Archivo, Arial, sans-serif'); spacing(g, .12, 9); g.fillStyle = '#6f6857'; g.textAlign = 'center'; g.fillText('POSTAGE', 513.5, 70); g.textAlign = 'left';
    const a = d.address || {}, cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const rows = a.name || a.line1 || a.city ? [a.name || '', a.line1 || '', a.line2 || '', cityLine].filter((t, i) => i !== 2 || t) : d.hints ? ['[Recipient name]', '[Street address]', '[City, State ZIP]'] : ['', '', '', ''];
    font(g, rows[0] && a.name ? '700' : '400', 13, '"Atkinson Hyperlegible", Verdana, sans-serif'); spacing(g, 0, 13);
    rows.forEach((t, i) => { const y = 152 + 30 * i; g.fillStyle = '#b9b19f'; g.fillRect(309, y + 29, 239, 1); font(g, i === 0 && a.name ? '700' : '400', 13, '"Atkinson Hyperlegible", Verdana, sans-serif');
      g.fillStyle = a.name || a.line1 ? '#1b1f26' : '#4a505a'; g.textBaseline = 'alphabetic'; let s = t; while (s && g.measureText(s).width > 236) s = s.slice(0, -1); g.fillText(s, 309, y + 25); });
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  /* draw one side into a canvas. scale: canvas pixels per card px. bleed: extra card px drawn round the edge */
  async function draw(cv, side, card, opts) {
    await ready();
    const o = opts || {}, s = o.scale || 1, b = o.bleed || 0, d = Object.assign({}, DEFAULTS, card || {});
    cv.width = Math.round((W + 2 * b) * s); cv.height = Math.round((H + 2 * b) * s);
    const g = cv.getContext('2d'); g.setTransform(s, 0, 0, s, b * s, b * s); g.imageSmoothingQuality = 'high';
    (side === 'back' ? back : front)(g, d, b);
    g.setTransform(1, 0, 0, 1, 0, 0);
    return cv;
  }
  // the layer that sits on top of the moving picture: a square canvas the size of the picture
  async function drawTop(cv, card, opts) {
    await ready();
    const s = (opts && opts.scale) || 1, d = Object.assign({}, DEFAULTS, card || {});
    cv.width = cv.height = Math.round(384 * s); const g = cv.getContext('2d'); g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 384, 384);
    front(g, d, 0, true); g.setTransform(1, 0, 0, 1, 0, 0); return cv;
  }
  // print files: 6.25 × 4.25 in at 300 dpi (1875 × 1275 px), the card trims to 6 × 4 in
  function print(side, card) { return draw(document.createElement('canvas'), side, card, { scale: 300 / 96, bleed: 12 }); }

  // where the moving picture goes, as a fraction of each side of the card
  const REGIONS = { front: [0, 0, 384 / W, 1], back: [28 / W, 108 / H, 276 / W, 356 / H] };

  window.MagicPostcard = { W, H, ACCENTS, DEFAULTS, draw, drawTop, print, ready, REGIONS };
})();
