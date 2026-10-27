/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the snow globe. One engine for the holiday globes and for "Make your own".
   const g = AAGlobe.create(hostElement, {
     picture,            // a square image or canvas: the still inside the glass
     video, start, crop, // optional: a video (url) that plays once after a shake, from `start` seconds; crop = {x, y, w, h} as fractions of the video
     logo,               // optional: an image with a see-through background; drawn in gold on the base
     name,               // shown on the base when there's no logo
     base,               // 'red' | 'green' | 'blue' | 'black'
     top, bottom,        // space to leave above and below the globe, in px
     onHint(text, big),  // "Let it settle…", "Shake again!" (big = pulse it)
     say(text)           // for screen readers
   });
   g.start()  (call from a tap: turns on sound, motion and the video's sound)   g.shake()   g.set({...})   g.sound(on)   g.destroy()
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const BASES = {
    red: ['#3f0d16', '#9a2a3a', '#7c1f2d', '#330a12'], green: ['#0b2616', '#1f6b44', '#175434', '#08190f'],
    blue: ['#0b1a3a', '#2a5596', '#1e4277', '#081530'], black: ['#0b0b0d', '#3c3c43', '#2a2a30', '#070709']
  };
  const flake = document.createElement('canvas'); flake.width = flake.height = 32;
  { const g = flake.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
  function goldOf(logo) {   // the logo in gold, using its shape (its see-through parts stay see-through)
    const c = document.createElement('canvas'); c.width = logo.naturalWidth || logo.width; c.height = logo.naturalHeight || logo.height; const g = c.getContext('2d');
    g.drawImage(logo, 0, 0); g.globalCompositeOperation = 'source-in'; const gr = g.createLinearGradient(0, 0, c.width * .3, c.height);
    gr.addColorStop(0, '#fbe3a6'); gr.addColorStop(.45, '#e2b45a'); gr.addColorStop(.7, '#f6d68c'); gr.addColorStop(1, '#b5852f'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); return c;
  }

  function create(host, o) {
    o = Object.assign({ base: 'red', top: 0, bottom: 0, start: 0, onHint() {}, say() {} }, o || {});
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sky = document.createElement('canvas'), cv = document.createElement('canvas');
    for (const c of [sky, cv]) { c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; c.setAttribute('aria-hidden', 'true'); host.appendChild(c); }
    cv.style.touchAction = 'none';
    const sx = sky.getContext('2d'), x = cv.getContext('2d');
    let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 100, gold = null, shine = document.createElement('canvas'), dead = false;

    /* the picture, the video, the logo */
    const wave = document.createElement('video'); let waveOn = false, waveA = 0, unlocked = false;
    Object.assign(wave, { muted: true, loop: false, playsInline: true, preload: 'auto' }); wave.setAttribute('playsinline', '');
    function set(n) {
      Object.assign(o, n || {});
      if (n && 'video' in n) { waveOn = false; waveA = 0; if (o.video) { wave.src = o.video; wave.load(); } else wave.removeAttribute('src'); }
      if (n && 'logo' in n) gold = o.logo ? goldOf(o.logo) : null;
      if (n && ('top' in n || 'bottom' in n)) size();
    }
    if (o.video) { wave.src = o.video; }
    if (o.logo) gold = goldOf(o.logo);
    function startWave() {   // plays all the way through; a shake while it plays doesn't restart it
      if (!o.video || (waveOn && !wave.paused && !wave.ended)) return; waveOn = true;
      try { wave.currentTime = o.start || 0; } catch (e) {} wave.muted = !soundOn; wave.volume = .8;
      wave.play().catch(() => { wave.muted = true; wave.play().catch(() => { waveOn = false; }); });
    }

    function size() {
      DPR = Math.min(2, devicePixelRatio || 1); W = host.clientWidth; H = host.clientHeight;
      for (const c of [sky, cv]) { c.width = Math.max(1, Math.round(W * DPR)); c.height = Math.max(1, Math.round(H * DPR)); }
      const room = Math.max(120, H - o.top - o.bottom);
      R = Math.max(40, Math.min(W * .42, room / 2.7)); cx = W / 2; cy = o.top + (room - R * 2.7) / 2 + R;
    }
    const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(host); else addEventListener('resize', size); size();

    /* the snow (globe units: the glass is radius 1) */
    const N = calm ? 450 : 1000, NB = 56, WALL = .955, BW = 2 / NB, REPOSE = BW * .38, pile = new Float32Array(NB), F = [];
    for (let i = 0; i < N; i++) { const s = .006 + Math.pow(Math.random(), 2.2) * .02, a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .88;
      F.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, vu: 0, vv: .05, s, z: Math.random(), ph: Math.random() * 6.283, down: false, b: 0, add: s * .5, wu: 0, wv: 0, fm: .75 + Math.random() * .5 }); }
    let shineAt = 0, E = 0, stormT = 0, stormy = true, shook = false, hintStorm = false, gx = 0, gy = 1, tgx = 0, tgy = 1;
    const floorAt = u => Math.sqrt(Math.max(0, WALL * WALL - u * u));
    const binOf = u => Math.max(0, Math.min(NB - 1, Math.floor((u + 1) / 2 * NB))), uOf = b => (b + .5) * BW - 1, surf = b => floorAt(uOf(b)) - pile[b];
    function land(f) {   // rolls toward the middle until the slope is gentle, like real snow
      let b = binOf(f.u);
      for (let k = 0; k < NB; k++) { const y = surf(b), l = b > 0 ? surf(b - 1) : -9, r = b < NB - 1 ? surf(b + 1) : -9; if (Math.max(l, r) - y > REPOSE) b = l > r ? b - 1 : b + 1; else break; }
      pile[b] = Math.min(.5, pile[b] + f.add); f.b = b; f.down = true; f.u = uOf(b) + (Math.random() - .5) * BW; f.v = surf(b) + f.add * (.2 + Math.random() * .8) - f.s * .2; f.vu = f.vv = 0;
    }
    function stir(amount, pu, pv) {
      E = Math.min(3, E + amount); pu = pu || 0; pv = pv || 0;
      const lift = Math.min(1, amount * 1.6 + (E > 1.4 ? .35 : 0));
      for (const f of F) {
        if (f.down) { if (Math.random() < lift) { f.down = false; pile[f.b] = Math.max(0, pile[f.b] - f.add); f.vu = (Math.random() - .5) * 1.8 * Math.min(2, E) + pu; f.vv = -(.15 + Math.random() * 1.4) * Math.min(2, E) + pv; } }
        else { f.vu += pu * (.5 + Math.random() * .5); f.vv += pv * (.5 + Math.random() * .5); }
      }
      if (E > .9) { startWave(); shook = true; stormy = true; stormT = 0;
        if (!hintStorm) { hintStorm = true; o.onHint('Let it settle…', false); try { navigator.vibrate && navigator.vibrate(25); } catch (e) {} } }
    }
    function step(dt, t) {
      E *= Math.exp(-dt * (calm ? 1.3 : .75)); if (stormy) stormT += dt;
      gx += (tgx - gx) * Math.min(1, dt * 4); gy += (tgy - gy) * Math.min(1, dt * 4);
      const k = 1 - Math.exp(-dt * 2.4), A = .26 * E;
      for (const f of F) {
        if (f.down) continue;
        const term = (.1 + f.s * 3) * f.fm, sway = Math.sin(t * 1.3 + f.ph) * .045, jig = Math.sqrt(dt) * (.45 + 2.2 * E);
        f.wu += -2.2 * f.wu * dt + (Math.random() - .5) * jig; f.wv += -2.2 * f.wv * dt + (Math.random() - .5) * jig;   // each flake flutters on its own
        let fu = gx * term + gy * sway + f.wu, fv = gy * term - gx * sway + f.wv;
        if (E > .02) { const u = f.u, v = f.v, a1 = 2.2 * u + 1.3 * t, b1 = 2.6 * v - 1.1 * t, c2 = Math.cos(3.4 * u + 2.9 * v + 1.7 * t), s3 = Math.sin(4.6 * u - 3.8 * v - 2.1 * t);
          const pu = 2.2 * Math.cos(a1) * Math.sin(b1) + 1.7 * c2 - 1.61 * s3, pv = 2.6 * Math.sin(a1) * Math.cos(b1) + 1.45 * c2 + 1.33 * s3;
          fu += A * pv - .1 * E * v; fv += -A * pu + .1 * E * u; }   // swirls that stir without squeezing flakes together
        f.vu += (fu - f.vu) * k; f.vv += (fv - f.vv) * k; f.u += f.vu * dt; f.v += f.vv * dt;
        const r = Math.hypot(f.u, f.v), lim = WALL - f.s;
        if (r > lim) { const nu = f.u / r, nv = f.v / r, dot = f.vu * nu + f.vv * nv; f.u = nu * lim; f.v = nv * lim; if (dot > 0) { f.vu -= dot * nu * 1.2; f.vv -= dot * nv * 1.2; } }
        if (E < .5 && gy > .45 && f.vu * gx + f.vv * gy > 0 && f.v >= surf(binOf(f.u)) - f.s * .5) land(f);
      }
      if (stormy && E < .12 && (stormT > 14 || F.reduce((n, f) => n + f.down, 0) > N * .75)) {
        stormy = false; hintStorm = false; o.onHint(shook ? 'Shake again!' : 'Shake your phone!', true); chimes(); shineAt = performance.now() / 1000; o.say('The snow has settled.');
      }
    }

    /* drawing */
    const SKY = []; for (let i = 0; i < (calm ? 30 : 70); i++) SKY.push({ x: Math.random(), y: Math.random(), s: .6 + Math.random() * 1.8, sp: .012 + Math.random() * .03, ph: Math.random() * 6.3 });
    function drawSky(t, dt) {
      sx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const g = sx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1530'); g.addColorStop(1, '#22365e'); sx.fillStyle = g; sx.fillRect(0, 0, W, H);
      const glow = sx.createRadialGradient(cx, cy, R * .4, cx, cy, R * 2.2); glow.addColorStop(0, 'rgba(255,214,140,.16)'); glow.addColorStop(1, 'rgba(255,214,140,0)'); sx.fillStyle = glow; sx.fillRect(0, 0, W, H);
      sx.globalAlpha = .55;
      for (const p of SKY) { p.y += p.sp * dt; if (p.y > 1.02) { p.y = -.02; p.x = Math.random(); } sx.drawImage(flake, (p.x + Math.sin(t * .4 + p.ph) * .01) * W - p.s * 2, p.y * H - p.s * 2, p.s * 4, p.s * 4); }
      sx.globalAlpha = 1;
    }
    function rr(a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function plate(t) {
      const y0 = cy + R * .86, top = R * .8, bot = R * 1.04, hgt = R * .7, P = BASES[o.base] || BASES.red;
      x.beginPath(); x.moveTo(cx - top, y0); x.lineTo(cx + top, y0); x.lineTo(cx + bot, y0 + hgt); x.ellipse(cx, y0 + hgt, bot, R * .1, 0, 0, Math.PI); x.closePath();
      let g = x.createLinearGradient(cx - bot, 0, cx + bot, 0); g.addColorStop(0, P[0]); g.addColorStop(.35, P[1]); g.addColorStop(.6, P[2]); g.addColorStop(1, P[3]); x.fillStyle = g; x.fill();
      x.lineWidth = Math.max(1.5, R * .018); x.strokeStyle = '#e2b45a'; x.beginPath(); x.ellipse(cx, y0 + hgt * .9, top + (bot - top) * .9, R * .095, 0, 0, Math.PI); x.stroke();
      if (gold) {   // the logo in gold, with a glint of light passing over it now and then
        const lh = R * .37, lw = lh * gold.width / gold.height, mw = (top + (bot - top) * .5) * 1.5, k = Math.min(1, mw / lw), w = lw * k, h = lh * k, lx = cx - w / 2, ly = y0 + R * .435 - h / 2;
        x.save(); x.imageSmoothingQuality = 'high'; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = R * .03; x.shadowOffsetY = R * .01; x.drawImage(gold, lx, ly, w, h); x.shadowColor = 'transparent'; x.drawImage(gold, lx + .4, ly, w, h); x.restore();
        const p = ((t - shineAt) % 7) / 1.4;
        if (p >= 0 && p < 1 && o.logo) { if (shine.width !== gold.width || shine.height !== gold.height) { shine.width = gold.width; shine.height = gold.height; }
          const g2 = shine.getContext('2d'); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, shine.width, shine.height); g2.drawImage(o.logo, 0, 0); g2.globalCompositeOperation = 'source-in';
          const bx = (p * 1.6 - .3) * shine.width, gr = g2.createLinearGradient(bx - shine.width * .12, 0, bx + shine.width * .12, shine.height * .25);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,250,230,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, shine.width, shine.height);
          x.drawImage(shine, lx, ly, w, h); }
        return y0;
      }
      const label = String(o.name || '').trim().toUpperCase(); if (!label) return y0;
      const pw = R * 1.15, ph = R * .24, py = y0 + R * .4;
      x.fillStyle = 'rgba(10,6,10,.3)'; rr(cx - pw / 2, py - ph / 2, pw, ph, ph * .25); x.fill(); x.strokeStyle = 'rgba(226,180,90,.85)'; x.lineWidth = Math.max(1, R * .008); x.stroke();
      let fs = ph * .5; x.font = `900 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; const w = x.measureText(label).width; if (w > pw * .88) { fs *= pw * .88 / w; x.font = `900 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; }
      x.fillStyle = '#f1cf86'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, cx, py + fs * .05);
      return y0;
    }
    function cover(src, sw, sh, crop) {   // fills the glass with a picture (or the cropped part of a video)
      const S = 2 * R * 1.04;
      if (crop) x.drawImage(src, crop.x * sw, crop.y * sh, crop.w * sw, crop.h * sh, cx - S / 2, cy - S / 2, S, S);
      else { const s = Math.max(S / sw, S / sh), w = sw * s, h = sh * s; x.drawImage(src, cx - w / 2, cy - h / 2, w, h); }
    }
    let lt = 0;
    function draw(t) {
      const dtw = Math.max(0, Math.min(.05, t - (lt || t))); lt = t;
      x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, W, H);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx, cy + R * 1.58, R * 1.15, R * .14, 0, 0, 6.283); x.fill();
      const y0 = plate(t);
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.283); x.clip();
      const pic = o.picture, pw = pic && (pic.naturalWidth || pic.width), ph = pic && (pic.naturalHeight || pic.height);
      if (pw && ph) cover(pic, pw, ph); else { x.fillStyle = '#2a3b60'; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
      const playing = waveOn && !wave.paused && !wave.ended;
      waveA = Math.max(0, Math.min(1, waveA + (playing ? 1 : -1) * dtw / .9)); if (!playing && waveA === 0) waveOn = false;
      if (waveA > 0 && wave.readyState >= 2 && wave.videoWidth) { x.globalAlpha = waveA; cover(wave, wave.videoWidth, wave.videoHeight, o.crop); x.globalAlpha = 1; }
      let g = x.createRadialGradient(cx, cy, R * .55, cx, cy, R); g.addColorStop(0, 'rgba(10,20,45,0)'); g.addColorStop(1, 'rgba(10,20,45,.45)'); x.fillStyle = g; x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      x.beginPath(); x.moveTo(cx - R, cy + R);
      for (let b = 0; b <= NB; b++) { const u = b / NB * 2 - 1, i = Math.min(NB - 1, b), hh = (pile[Math.max(0, i - 1)] + pile[i] * 2 + pile[Math.min(NB - 1, i + 1)]) / 4, edge = Math.sqrt(Math.max(0, 1 - u * u));
        x.lineTo(cx + u * R, cy + (edge - Math.min(1, hh / .012) * (edge - floorAt(u)) - hh) * R); }
      x.lineTo(cx + R, cy + R); x.closePath(); x.fillStyle = 'rgba(244,247,255,.93)'; x.fill();
      for (const f of F) { const sz = f.s * R * (1.4 + f.z * 1.6) * 2; x.globalAlpha = .5 + f.z * .5; x.drawImage(flake, cx + f.u * R - sz / 2, cy + f.v * R - sz / 2, sz, sz); }
      x.globalAlpha = 1; x.restore();
      g = x.createRadialGradient(cx - R * .35, cy - R * .45, R * .05, cx, cy, R * 1.02); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.35, 'rgba(255,255,255,.04)'); g.addColorStop(.85, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(200,225,255,.28)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.283); x.fill(); x.lineWidth = Math.max(1.5, R * .022); x.strokeStyle = 'rgba(220,235,255,.55)'; x.stroke();
      x.save(); x.lineCap = 'round'; x.lineWidth = R * .045; x.strokeStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(cx, cy, R * .86, Math.PI * 1.08, Math.PI * 1.36); x.stroke();
      x.lineWidth = R * .02; x.strokeStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(cx, cy, R * .86, Math.PI * 1.42, Math.PI * 1.48); x.stroke(); x.restore();
      g = x.createLinearGradient(cx - R * .8, 0, cx + R * .8, 0); g.addColorStop(0, '#8a6324'); g.addColorStop(.4, '#f0cc7a'); g.addColorStop(1, '#6e4c18');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, y0, R * .8, R * .11, 0, 0, Math.PI); x.ellipse(cx, y0 - R * .05, R * .8, R * .11, 0, Math.PI, 0, true); x.closePath(); x.fill();
    }

    /* sound */
    let AC = null, OUT = null, WH = null, soundOn = true, tinkleT = 0;
    function ac() {
      try {
        if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); OUT = AC.createGain(); OUT.gain.value = .7; OUT.connect(AC.destination);
          const n = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const s = AC.createBufferSource(); s.buffer = n; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = .7;
          WH = AC.createGain(); WH.gain.value = 0; s.connect(f); f.connect(WH); WH.connect(OUT); s.start(); }
        if (AC.state === 'suspended') AC.resume();
      } catch (e) { AC = null; }
    }
    function bell(fq, when, v) { if (!AC || !soundOn) return; const t = AC.currentTime + (when || 0);
      for (const [m, a] of [[1, 1], [2.76, .25], [5.4, .08]]) { const os = AC.createOscillator(), g = AC.createGain(); os.type = 'sine'; os.frequency.value = fq * m;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime((v || .12) * a, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6 / m + .3); os.connect(g); g.connect(OUT); os.start(t); os.stop(t + 2.2); } }
    const NOTES = [1046.5, 1174.66, 1318.5, 1567.98, 1760, 2093];
    function chimes() { [0, 2, 4, 3, 5].forEach((n, i) => bell(NOTES[n] / 2, i * .32, .1)); bell(NOTES[0] / 4, 1.7, .08); }
    function sound(dt) {
      if (!AC || !WH) return; WH.gain.setTargetAtTime(soundOn ? Math.min(.22, E * .085) : 0, AC.currentTime, .08);
      tinkleT -= dt; if (E > .15 && tinkleT <= 0) { bell(NOTES[Math.floor(Math.random() * NOTES.length)], 0, .025 + Math.min(.05, E * .02)); tinkleT = .05 + Math.random() * .35 / (E + .2); }
    }

    /* input */
    let lastA = null, drag = null;
    function onMotion(e) {
      const m = e.acceleration;
      if (m && m.x != null) { const g = Math.hypot(m.x, m.y, m.z || 0); if (g > 2.5) stir(Math.min(.35, (g - 2.5) * .03), -m.x * .05, m.y * .05); return; }
      const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
      if (lastA) { const j = Math.hypot(a.x - lastA.x, a.y - lastA.y, (a.z || 0) - (lastA.z || 0)); if (j > 4) stir(Math.min(.35, (j - 4) * .03)); }
      lastA = { x: a.x, y: a.y, z: a.z };
    }
    function onTilt(e) {
      if (e.gamma == null) return; const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let side = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : ang === 180 ? -e.gamma : e.gamma;
      side = Math.max(-.85, Math.min(.85, Math.sin(side * Math.PI / 180) * 1.3)); tgx = side; tgy = Math.sqrt(1 - side * side);
    }
    const pd = e => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; ac(); }, pu = () => { drag = null; };
    const pm = e => {
      if (!drag) return; const b = cv.getBoundingClientRect(), now = performance.now(), dt = Math.max(8, now - drag.t) / 1000, du = (e.clientX - drag.x) / R / dt, dv = (e.clientY - drag.y) / R / dt;
      const qu = (e.clientX - b.left - cx) / R, qv = (e.clientY - b.top - cy) / R;
      if (qu * qu + qv * qv < 1.3) { for (const f of F) { const d = Math.hypot(f.u - qu, f.v - qv); if (d < .45) { const k = (1 - d / .45) * .5; if (f.down) { f.down = false; pile[f.b] = Math.max(0, pile[f.b] - f.add); } f.vu += du * k; f.vv += dv * k; } }
        stir(Math.min(.3, Math.hypot(du, dv) * .015), du * .08, dv * .08); }
      drag = { x: e.clientX, y: e.clientY, t: now };
    };
    cv.addEventListener('pointerdown', pd); addEventListener('pointerup', pu); cv.addEventListener('pointermove', pm);
    async function start() {
      ac();
      if (o.video && !unlocked) { unlocked = true; wave.muted = false; wave.play().then(() => { if (!waveOn) { wave.pause(); try { wave.currentTime = o.start || 0; } catch (e) {} } }, () => {}); }
      try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission(); } catch (e) {}
      try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) {}
      addEventListener('devicemotion', onMotion); addEventListener('deviceorientation', onTilt);
    }

    let last = performance.now();
    (function frame(now) {
      if (dead) return; const dt = Math.max(0, Math.min(.05, (now - last) / 1000)), t = now / 1000; last = now;
      step(dt, t); drawSky(t, dt); draw(t); sound(dt); requestAnimationFrame(frame);
    })(last);
    return {
      start, set, shake() { ac(); stir(2.6, (Math.random() - .5) * .6, -.4); },
      sound(on) { soundOn = !!on; if (waveOn) wave.muted = !soundOn; },
      destroy() { dead = true; if (ro) ro.disconnect(); removeEventListener('devicemotion', onMotion); removeEventListener('deviceorientation', onTilt); removeEventListener('pointerup', pu); wave.pause(); wave.removeAttribute('src'); sky.remove(); cv.remove(); try { AC && AC.close(); } catch (e) {} },
      get canvas() { return cv; }
    };
  }
  window.AAGlobe = { create, goldOf, BASES: Object.keys(BASES) };
})();
