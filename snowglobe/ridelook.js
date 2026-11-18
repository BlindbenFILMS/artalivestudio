/* ─────────────────────────────────────────────────────────────
   ART ALIVE: how the snowmobile ride in the snowman game (snowgame.js) looks, apart from the snowmobile itself (that is
   figures/ora-snowmobile.js): the LIGHT of its headlight, the DARK of the wood, the ORA COINS, and the small bar that shows how
   much light is left. All of it is drawn on the game's own 2D canvas.

   const look = createRideLook({ calm });

   look.beam(x, ax, ay, bx, by, half, a)      the headlight's beam through the air: a cone of warm light with soft sides, from the
                                              lamp at (ax, ay) to (bx, by), where it is 2 × half wide; a: how strong, 0 … 1.
                                              It is added light: it shows against the dark wood and sky, and not over bright snow.
   look.pool(x, cx, cy, rx, ry, a)            its light on the snow: a warm oval
   look.dark.begin(W, H, amount)              THE DARK. A layer the size of the screen, dark all over (amount: 0 none … 1 black
   look.dark.cone(ax, ay, bx, by, half, a)    night), out of which every light then takes its share: the beam (the same cone),
   look.dark.spot(px, py, rx, ry, a)          and round lights (a campfire, a coin, the snowmobile's own glow). end() lays what is
   look.dark.end(x)                           left of the dark over the picture. (It is drawn a third of the size and stretched:
                                              it is all soft, and that is quick on a phone.)
   look.coin(x, px, py, r, turn, lit, badge)  an Ora coin: gold rim, Ora blue face, the white Ora mark (badge: { image, aspect },
                                              the mark as a flat picture: it is never recoloured or redrawn). turn: where it is in
                                              its spin, in radians (0 = facing us; seen from the side the face is narrow, as any
                                              spinning coin's is); lit: 0 … 1, how brightly it shows (in the dark only its glint)
   look.meter(x, cx, cy, w, level, t, low)    the light that is left: a small lamp and a bar, in the middle at (cx, cy), w wide;
                                              low: it is nearly out (the bar turns coral and, unless "reduce motion" is on, pulses)
   ───────────────────────────────────────────────────────────── */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const WARM = [255, 232, 168];

export function createRideLook({ calm = false } = {}) {
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // One picture of a cone of light, lying along +x from its point at the left edge: brightest along its middle and at the lamp,
  // fading to nothing at its far end and at its sides. (Worked out point by point, once.)
  let cone = null;
  const conePic = () => { if (cone) return cone; const w = 256, h = 128, thin = .1; cone = canvas(w, h); const q = cone.getContext('2d'), im = q.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = (x + .5) / w, half = h / 2 * (thin + (1 - thin) * t), u = Math.abs(y + .5 - h / 2) / half, i = (y * w + x) * 4;
      const across = u >= 1 ? 0 : Math.pow(1 - u * u, 1.6), along = Math.pow(1 - t, 1.1) * (.4 + .6 * Math.exp(-t * 3)) * Math.min(1, thin / (thin + (1 - thin) * t) * 2.4 + .45);
      d[i] = WARM[0]; d[i + 1] = WARM[1]; d[i + 2] = WARM[2]; d[i + 3] = Math.round(255 * Math.min(1, across * along * 1.2)); }
    q.putImageData(im, 0, 0); return cone; };
  // (the same cone for the dark to be taken out of: it stays strong for longer along its length, so the far end of the beam is still lit)
  let mask = null;
  const maskPic = () => { if (mask) return mask; const w = 256, h = 128, thin = .12; mask = canvas(w, h); const q = mask.getContext('2d'), im = q.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = (x + .5) / w, half = h / 2 * (thin + (1 - thin) * t), u = Math.abs(y + .5 - h / 2) / half, i = (y * w + x) * 4;
      const across = u >= 1 ? 0 : Math.pow(1 - u * u, 1.2), along = 1 - Math.pow(t, 3.2);
      d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.round(255 * clamp(across * along * 1.5, 0, 1)); }
    q.putImageData(im, 0, 0); return mask; };
  const lay = (g, pic, ax, ay, bx, by, half) => { const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy); if (len < 2 || half <= 0) return; g.translate(ax, ay); g.rotate(Math.atan2(dy, dx)); g.drawImage(pic, 0, -half, len, 2 * half); };

  function beam(x, ax, ay, bx, by, half, a) { if (!(a > .004)) return; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, a); lay(x, conePic(), ax, ay, bx, by, half); x.restore(); }
  function pool(x, cx, cy, rx, ry, a) { if (!(a > .004) || rx <= 0 || ry <= 0) return; x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
    const g = x.createRadialGradient(-rx * .2, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(255,238,188,${.7 * a})`); g.addColorStop(.4, `rgba(255,238,188,${.4 * a})`); g.addColorStop(.75, `rgba(255,238,188,${.13 * a})`); g.addColorStop(1, 'rgba(255,238,188,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, 6.283); x.fill(); x.restore(); }

  // THE DARK
  const layer = canvas(2, 2), sg = layer.getContext('2d'), K = 1 / 3; let SW = 2, SH = 2, FW = 1, FH = 1;
  const dark = {
    begin(W, H, amount) { FW = W; FH = H; const w = Math.max(2, Math.ceil(W * K)), h = Math.max(2, Math.ceil(H * K)); if (w !== SW || h !== SH) { SW = layer.width = w; SH = layer.height = h; }
      sg.setTransform(SW / W, 0, 0, SH / H, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.clearRect(0, 0, W, H); sg.fillStyle = `rgba(4,8,24,${clamp(amount, 0, 1)})`; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'destination-out'; },
    cone(ax, ay, bx, by, half, a) { if (!(a > .004)) return; sg.save(); sg.globalAlpha = Math.min(1, a); lay(sg, maskPic(), ax, ay, bx, by, half); sg.restore(); },
    spot(px, py, rx, ry, a) { if (!(a > .004) || rx <= 0 || ry <= 0) return; sg.save(); sg.translate(px, py); sg.scale(1, ry / rx); const g = sg.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(0,0,0,${Math.min(1, a)})`); g.addColorStop(.45, `rgba(0,0,0,${Math.min(1, a) * .72})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = g; sg.beginPath(); sg.arc(0, 0, rx, 0, 6.283); sg.fill(); sg.restore(); },
    end(x) { x.drawImage(layer, 0, 0, SW, SH, 0, 0, FW, FH); }
  };

  // AN ORA COIN
  const glint = canvas(48, 48); { const g = glint.getContext('2d'), r = g.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, 'rgba(255,236,170,.85)'); r.addColorStop(.4, 'rgba(255,214,120,.36)'); r.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 48, 48); }
  function coin(x, px, py, r, turn, lit, badge) {
    const c = calm ? 1 : Math.cos(turn), w = Math.max(.14, Math.abs(c)), L = clamp(lit, 0, 1), a = .28 + .72 * L;
    x.save(); x.translate(px, py);
    x.globalAlpha = .35 + .65 * L; x.drawImage(glint, -r * 2.1, -r * 2.1, r * 4.2, r * 4.2);                                  // its glow (all that shows of it in the dark)
    x.globalAlpha = a;
    x.fillStyle = '#b9832a'; x.beginPath(); x.ellipse(0, 0, r * Math.min(1, w + .16), r, 0, 0, 6.283); x.fill();               // its edge, seen as it turns
    x.fillStyle = '#ffd66b'; x.beginPath(); x.ellipse(0, 0, r * w, r, 0, 0, 6.283); x.fill();                                 // its gold rim
    x.fillStyle = '#243f88'; x.beginPath(); x.ellipse(0, 0, r * w * .8, r * .8, 0, 0, 6.283); x.fill();                       // its face, Ora blue
    if (badge && badge.image && w > .34) { const mh = r * 1.2 / badge.aspect; x.globalAlpha = a * clamp((w - .34) / .3, 0, 1); x.drawImage(badge.image, -r * .6 * w, -mh / 2, r * 1.2 * w, mh); }   // the Ora mark
    x.globalAlpha = a * .85; x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineCap = 'round'; x.lineWidth = Math.max(1, r * .1); x.beginPath(); x.ellipse(0, 0, r * w * .9, r * .9, 0, Math.PI * 1.1, Math.PI * 1.45); x.stroke();   // a glint on its rim
    x.restore();
  }

  // THE LIGHT THAT IS LEFT: a small lamp, and a bar
  function meter(x, cx, cy, w, level, t, low) {
    const h = Math.max(12, w * .1), x0 = cx - w / 2, lv = clamp(level, 0, 1), beat = low && !calm ? .7 + .3 * Math.sin(t * 9) : 1, r = h / 2, lampR = h * .62, bx = x0 + lampR * 2 + 6, bw = w - lampR * 2 - 6;
    const bar = (a, b, ww, hh) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + ww, b, a + ww, b + hh, r); x.arcTo(a + ww, b + hh, a, b + hh, r); x.arcTo(a, b + hh, a, b, r); x.arcTo(a, b, a + ww, b, r); x.closePath(); };
    x.save();
    x.fillStyle = 'rgba(8,14,32,.66)'; bar(x0 - 6, cy - h / 2 - 5, w + 12, h + 10); x.fill();
    x.globalAlpha = .55 + .45 * lv; x.drawImage(glint, x0 + lampR - lampR * 2.4, cy - lampR * 2.4, lampR * 4.8, lampR * 4.8); x.globalAlpha = 1;
    x.fillStyle = low ? '#ff8a6a' : '#fff3c8'; x.beginPath(); x.arc(x0 + lampR, cy, lampR * .78, 0, 6.283); x.fill(); x.lineWidth = Math.max(1.5, h * .16); x.strokeStyle = '#d8dfee'; x.stroke();   // the lamp
    x.fillStyle = 'rgba(255,255,255,.16)'; bar(bx, cy - h / 2, bw, h); x.fill();
    if (lv > .01) { x.save(); bar(bx, cy - h / 2, bw, h); x.clip(); x.globalAlpha = beat; const g = x.createLinearGradient(bx, 0, bx + bw, 0); if (low) { g.addColorStop(0, '#ff5a45'); g.addColorStop(1, '#ff9a6a'); } else { g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#fff6d8'); }
      x.fillStyle = g; x.fillRect(bx, cy - h / 2, Math.max(h * .5, bw * lv), h); x.restore(); }
    x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,.75)'; bar(bx, cy - h / 2, bw, h); x.stroke();
    x.restore(); return h + 10;
  }

  return { beam, pool, dark, coin, meter };
}
