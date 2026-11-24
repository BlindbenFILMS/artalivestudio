/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the snow globe. One engine for the holiday globes and for "Make your own".
   const g = AAGlobe.create(hostElement, {
     picture,            // a square image or canvas: the still inside the glass
     video, start, crop, // optional: a video (url) that plays once after a shake, from `start` seconds; crop = {x, y, w, h} as fractions of the video
     logo,               // optional: an image with a see-through background; drawn in gold on the base
     name,               // shown on the base when there's no logo. A list (['JOY', 'NEXT WORD']) takes turns on the base, each arriving with a glow
     base,               // 'red' | 'green' | 'blue' | 'black'
     model,              // optional: a 3D figure that stands in the snow (made by globe3d.js). The snow falls behind it and in front of it,
                         //   it turns when you drag, hops when you tap it, and reacts to a shake. Without it the globe is exactly as before.
     onPlate(),          // optional: called when the base is tapped
     top, bottom,        // space to leave above and below the globe, in px
     onHint(text, big),  // "Let it settle…", "Shake again!" (big = pulse it)
     moon,               // optional: where the moon is in the picture, {u, v} in globe units (the glass is radius 1): flakes passing near it shine brighter
     glitter,            // false: no glitter in the water (it has gold and silver glitter unless told not to)
     say(text)           // for screen readers
   });
   g.start()  (call from a tap: turns on sound, motion and the video's sound)   g.shake()   g.set({...})   g.sound(on)   g.destroy()
   g.magic('JOY')  (the word arrives in gold across the front of the glass, pulses, then settles onto the base)
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const BASES = {
    red: ['#3f0d16', '#9a2a3a', '#7c1f2d', '#330a12'], green: ['#0b2616', '#1f6b44', '#175434', '#08190f'],
    blue: ['#0b1a3a', '#2a5596', '#1e4277', '#081530'], black: ['#0b0b0d', '#3c3c43', '#2a2a30', '#070709']
  };
  const flake = document.createElement('canvas'); flake.width = flake.height = 32;
  { const g = flake.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
  // (24 Nov 2026) more sprites: a soft out-of-focus flake (for flakes far back, and the big blurry ones in front of the glass), a six-pointed
  // snowflake that tumbles, and a glint of glitter (a small four-pointed star)
  const soft = document.createElement('canvas'); soft.width = soft.height = 48;
  { const g = soft.getContext('2d'), r = g.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, 'rgba(255,255,255,.75)'); r.addColorStop(.55, 'rgba(255,255,255,.5)'); r.addColorStop(.8, 'rgba(255,255,255,.18)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 48, 48); }
  const star = document.createElement('canvas'); star.width = star.height = 64;
  { const g = star.getContext('2d'); g.translate(32, 32); g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.shadowColor = 'rgba(255,255,255,.8)'; g.shadowBlur = 3; g.lineWidth = 3.2; g.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a); g.moveTo(0, 0); g.lineTo(c * 27, s * 27); for (const [m, b] of [[15, 8], [22, 5]]) { g.moveTo(c * m, s * m); g.lineTo(c * m + Math.cos(a + .75) * b, s * m + Math.sin(a + .75) * b); g.moveTo(c * m, s * m); g.lineTo(c * m + Math.cos(a - .75) * b, s * m + Math.sin(a - .75) * b); } }
    g.stroke(); g.beginPath(); g.arc(0, 0, 3.5, 0, 6.283); g.fillStyle = '#fff'; g.fill(); }
  const glint = c => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 7); r.addColorStop(0, '#ffffff'); r.addColorStop(.4, c); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(16, 1); g.lineTo(17.3, 14.7); g.lineTo(31, 16); g.lineTo(17.3, 17.3); g.lineTo(16, 31); g.lineTo(14.7, 17.3); g.lineTo(1, 16); g.lineTo(14.7, 14.7); g.closePath(); g.fill(); return cv; };
  const GLINT = [glint('rgba(255,214,120,.95)'), glint('rgba(232,240,255,.95)')];   // gold, silver
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
    const wave = document.createElement('video'); let waveOn = false, waveA = 0, unlocked = false, nameAt = 0, magic = null;
    Object.assign(wave, { muted: true, loop: false, playsInline: true, preload: 'auto' }); wave.setAttribute('playsinline', '');
    function set(n) {
      Object.assign(o, n || {});
      if (n && 'video' in n) { waveOn = false; waveA = 0; if (o.video) { wave.src = o.video; wave.load(); } else wave.removeAttribute('src'); }
      if (n && 'logo' in n) gold = o.logo ? goldOf(o.logo) : null;
      if (n && 'model' in n) ground();
      if (n && 'name' in n) nameAt = performance.now() / 1000;
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
    // (24 Nov 2026) Among the snow: six-pointed snowflakes that tumble and flutter slowly as they drift; and gold and silver glitter that
    // twinkles as it catches the light and sinks a little faster than the snow. Neither adds to the snow on the ground.
    for (let i = 0; i < (calm ? 10 : 22); i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .85;
      F.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, vu: 0, vv: .05, s: .022 + Math.random() * .016, z: .2 + Math.random() * .8, ph: Math.random() * 6.283, down: false, b: 0, add: 0, wu: 0, wv: 0, fm: .32 + Math.random() * .16, star: true, rot: Math.random() * 6.283, vr: (Math.random() - .5) * 1.4, tilt: Math.random() * 6.283 }); }
    if (o.glitter !== false) for (let i = 0; i < (calm ? 45 : 120); i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .88;
      F.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, vu: 0, vv: .05, s: .0045 + Math.random() * .004, z: Math.random(), ph: Math.random() * 6.283, down: false, b: 0, add: 0, wu: 0, wv: 0, fm: 1.6 + Math.random() * .6, glit: Math.random() < .55 ? 0 : 1, tw: 2 + Math.random() * 5 }); }
    // (big soft out-of-focus flakes in front of the glass were tried on 24 Nov and taken out the same day: Ben found them too big and distracting. Set the count above 0 to bring them back)
    const BOKEH = []; for (let i = 0; i < 0; i++) BOKEH.push({ u: Math.random() * 1.8 - .9, v: Math.random() * 1.8 - .9, s: .07 + Math.random() * .07, a: .1 + Math.random() * .1, ph: Math.random() * 6.283, sp: .035 + Math.random() * .04 });
    let cap = 0, puffs = [];   // snow that has settled on the figure's hat (0 … 1); and the puff of it flying off when the globe is shaken
    let shineAt = 0, E = 0, stormT = 0, stormy = true, shook = false, hintStorm = false, gx = 0, gy = 1, tgx = 0, tgy = 1, calmed = true, resting = false;
    const floorAt = u => Math.sqrt(Math.max(0, WALL * WALL - u * u));
    // With a 3D figure inside, the bottom of the glass holds a fixed mound of snow for it to stand on (as a real snow globe
    // does), and the loose snow settles on top of that in a thinner layer, so the figure isn't buried. No figure: none of this.
    const GV = .69, base = new Float32Array(NB), groundV = u => GV + .16 * u * u, baseU = u => (o.model ? Math.max(0, floorAt(u) - groundV(u)) : 0);
    const binOf = u => Math.max(0, Math.min(NB - 1, Math.floor((u + 1) / 2 * NB))), uOf = b => (b + .5) * BW - 1, surf = b => floorAt(uOf(b)) - base[b] - pile[b];
    function ground() {
      for (let b = 0; b < NB; b++) { base[b] = baseU(uOf(b)); pile[b] = 0; }
      for (const f of F) { f.add = f.s * .5 * (o.model ? .4 : 1); if (f.down) { f.down = false; f.vv = .05; } }
    }
    if (o.model) ground();
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
      if (amount > .25 && cap > .08) { puffOff(); }   // a shake knocks the snow off his hat
      if (E > .9) { startWave(); shook = true; stormy = true; stormT = 0; calmed = false;
        if (o.model && o.model.shake) try { o.model.shake(E); } catch (e) {}
        if (o.onStorm) try { o.onStorm(); } catch (e) {}
        if (!hintStorm) { hintStorm = true; o.onHint('Let it settle…', false); try { navigator.vibrate && navigator.vibrate(25); } catch (e) {} } }
    }
    function puffOff() { const H = o.model && o.model.marks && o.model.marks.hat; if (H && !calm) for (let i = 0; i < Math.round(10 + cap * 22); i++) puffs.push({ u: H[0] + (Math.random() - .5) * .16, v: H[1] + .03 + Math.random() * .05, vu: (Math.random() - .5) * .9, vv: -(.2 + Math.random() * .7), s: .008 + Math.random() * .014, t: 0, life: .8 + Math.random() * .7 }); cap = 0; }
    function step(dt, t) {
      E *= Math.exp(-dt * (calm ? 1.3 : .75)); if (stormy) stormT += dt;
      if (o.model && E < .3) cap = Math.min(1, cap + dt * (E < .12 ? .09 : .03));   // as the snow settles, a little gathers on his hat (in about ten seconds)
      for (const p of puffs) { p.t += dt; p.vv += 1.4 * dt; p.u += p.vu * dt; p.v += p.vv * dt; } puffs = puffs.filter(p => p.t < p.life);
      if (stormy && !calmed && E < .35 && stormT > 2.4) { calmed = true; if (o.onCalm) try { o.onCalm(); } catch (e) {} }   // the snow is starting to settle
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
        if (f.star) { f.rot += (f.vr + Math.sin(t * .9 + f.ph) * .6) * dt * (1 + E); f.tilt += dt * (.8 + E); fu += Math.sin(t * 1.7 + f.ph) * .05; }   // (a snowflake tumbles and flutters from side to side)
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
      if (Array.isArray(o.name)) { labels(t, y0); return y0; }
      const label = String(o.name || '').trim().toUpperCase(); if (!label) return y0;
      const pw = R * 1.15, ph = R * .24, py = y0 + R * .4;
      x.fillStyle = 'rgba(10,6,10,.3)'; rr(cx - pw / 2, py - ph / 2, pw, ph, ph * .25); x.fill(); x.strokeStyle = 'rgba(226,180,90,.85)'; x.lineWidth = Math.max(1, R * .008); x.stroke();
      let fs = ph * .5; x.font = `900 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; const w = x.measureText(label).width; if (w > pw * .88) { fs *= pw * .88 / w; x.font = `900 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; }
      x.fillStyle = '#f1cf86'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, cx, py + fs * .05);
      return y0;
    }
    // Several names take turns on the base (a word, then "NEXT WORD", round and round), each arriving with a glow.
    const MAGIC = 2.6, FONT = 'Archivo, "Arial Black", Arial, sans-serif';   // how long a word stays on the glass (seconds) before it settles on the base
    function labels(t, y0) {
      const list = o.name.map(s => String(s || '').trim().toUpperCase()).filter(Boolean); if (!list.length) return;
      const pw = R * 1.3, ph = R * .3, py = y0 + R * .41, D0 = 3, D1 = 1.8, total = D0 + D1 * (list.length - 1);
      let u = t - nameAt, k = 0, a = 1, glow = 0;
      if (u < 0) { a = 0; glow = Math.max(0, 1 + u / .5); u = 0; }   // the big word is still on the glass: the base waits, warming up
      else { u %= total; if (u >= D0) { k = 1 + Math.floor((u - D0) / D1); u = (u - D0) % D1; } const dur = k ? D1 : D0;
        a = list.length > 1 ? Math.max(0, Math.min(1, u / .3, (dur - u) / .3)) : Math.min(1, (t - nameAt) / .3); glow = Math.max(0, 1 - u / 1.1) * (k ? .55 : 1); }
      x.save(); x.shadowColor = `rgba(255,214,120,${.8 * glow})`; x.shadowBlur = R * .16 * glow;
      x.fillStyle = 'rgba(10,6,10,.34)'; rr(cx - pw / 2, py - ph / 2, pw, ph, ph * .25); x.fill(); x.shadowColor = 'transparent';
      x.strokeStyle = `rgba(${Math.round(226 + 29 * glow)},${Math.round(180 + 50 * glow)},${Math.round(90 + 90 * glow)},.9)`; x.lineWidth = Math.max(1, R * (.008 + .008 * glow)); x.stroke();
      const label = list[k]; let fs = ph * .52; x.font = `900 ${fs}px ${FONT}`; const w = x.measureText(label).width; if (w > pw * .88) { fs *= pw * .88 / w; x.font = `900 ${fs}px ${FONT}`; }
      x.globalAlpha = a; x.shadowColor = `rgba(255,224,150,${glow})`; x.shadowBlur = fs * .7 * glow; x.fillStyle = glow > .05 ? '#ffeab0' : '#f1cf86'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const sc = calm ? 1 : 1 + .12 * glow * Math.sin(Math.min(1, u / .5) * Math.PI); x.translate(cx, py + fs * .05); x.scale(sc, sc); x.fillText(label, 0, 0); x.restore();
    }
    // A word arrives on the front of the glass in gold, pulses, then settles down onto the base.
    function drawMagic(t, y0) {
      const u = t - magic.t0; if (u < 0) return; if (u > MAGIC + .55) { magic = null; return; }
      const fly = Math.max(0, Math.min(1, (u - MAGIC) / .55)), e = fly * fly * (3 - 2 * fly), a = Math.min(1, u / .3) * (1 - e * e), y1 = cy - R * .06, y2 = y0 + R * .41;
      let fs = R * .6; x.save(); x.font = `900 ${fs}px ${FONT}`; let w = x.measureText(magic.text).width; if (w > R * 1.72) { fs *= R * 1.72 / w; w = R * 1.72; }
      const sc = (1 - e * .72) * (calm ? 1 : 1 + .09 * Math.sin(u * 6.6) * (1 - e)) * (.6 + .4 * Math.min(1, u / .3));
      x.translate(cx, y1 + (y2 - y1) * e); x.scale(sc, sc); x.globalAlpha = a; x.font = `900 ${fs}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.shadowColor = 'rgba(255,208,110,.95)'; x.shadowBlur = R * .22; x.lineWidth = fs * .09; x.strokeStyle = 'rgba(40,22,2,.6)'; x.strokeText(magic.text, 0, fs * .04);
      const gg = x.createLinearGradient(0, -fs * .5, 0, fs * .5); gg.addColorStop(0, '#fff8de'); gg.addColorStop(.5, '#f7d680'); gg.addColorStop(1, '#d59f3c'); x.fillStyle = gg; x.fillText(magic.text, 0, fs * .04);
      x.shadowColor = 'rgba(255,240,190,.9)'; x.shadowBlur = fs * .12; x.fillStyle = '#fff6d0';
      if (!calm) for (let k = 0; k < 12; k++) { const an = k * .5236 + u * .5, tw = Math.max(0, Math.sin(u * 5 + k * 1.7)); if (tw <= 0) continue;   // twinkles round the word
        x.globalAlpha = a * tw; x.beginPath(); x.arc(Math.cos(an) * (w / 2 + fs * .28), Math.sin(an) * fs * .78, fs * .028 * (1 + tw), 0, 6.283); x.fill(); }
      x.restore();
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
      // a 3D figure: the snow falling behind it, then the figure, then the snow it stands in, then the snow falling in front of it
      const fig = o.model && o.model.ready && o.model.canvas ? o.model : null;
      // the snow: far flakes soft and dim, near ones bright; near the moon they shine brighter; snowflakes tumble; glitter twinkles
      const mn = o.moon, near = f => mn ? Math.exp(-((f.u - mn.u) ** 2 + (f.v - mn.v) ** 2) / .05) : 0;
      const flakes = (z0, z1) => { for (const f of F) { if (f.z < z0 || f.z >= z1) continue; const px = cx + f.u * R, py = cy + f.v * R, m = near(f);
          if (f.glit != null) { const tw = calm ? .6 : Math.pow(.5 + .5 * Math.sin(t * f.tw + f.ph), 6), sz = f.s * R * (2.2 + 4.5 * tw + 2 * m) * 2; x.globalAlpha = Math.min(1, .35 + .65 * tw + .4 * m); x.drawImage(GLINT[f.glit], px - sz / 2, py - sz / 2, sz, sz); continue; }
          if (f.star) { const sz = f.s * R * (1.5 + f.z) * 2, sq = .45 + .55 * Math.abs(Math.cos(f.tilt)); x.globalAlpha = Math.min(1, .55 + f.z * .35 + .35 * m); x.save(); x.translate(px, py); x.rotate(f.rot); x.scale(1, sq); x.drawImage(star, -sz / 2, -sz / 2, sz, sz); x.restore(); continue; }
          const sz = f.s * R * (1.4 + f.z * 1.6) * 2; x.globalAlpha = Math.min(1, (f.z < .3 ? .32 + f.z : .5 + f.z * .5) + .45 * m); x.drawImage(f.z < .3 ? soft : flake, px - sz / 2, py - sz / 2, sz, sz); } x.globalAlpha = 1; };
      // the snow on his hat: a soft white cap round the bottom of the bobble, between it and the logo, growing as the snow settles
      const hatSnow = () => { const M = fig && fig.marks, Hm = M && M.hat, Fo = fig && fig.focus; if (!Hm || !Fo || cap < .02 || !(Fo.front > .3)) return;
        const hw = Math.hypot(Fo.ux, Fo.uy) * R, ang = Math.atan2(Fo.uy, Fo.ux), W8 = .42, hx = cx + (Hm[0] * W8 + Fo.x * (1 - W8)) * R, hy = cy + (Hm[1] * W8 + Fo.y * (1 - W8)) * R, k = Math.min(1, cap * 1.2), ca = Math.cos(-ang), sa = Math.sin(-ang);
        const pdx = (Hm[0] * R + cx - hx), pdy = (Hm[1] * R + cy - hy), px = pdx * ca - pdy * sa, py = pdx * sa + pdy * ca;   // (the bobble, in the hat's own level)
        x.save(); x.translate(hx, hy); x.rotate(ang); x.globalAlpha = .6 + .38 * k;
        const g = x.createLinearGradient(0, -hw * .5, 0, hw * .2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(226,236,255,.92)'); x.fillStyle = g;
        const rx = hw * (1.05 + .3 * k), top = hw * (.22 + .3 * k); x.beginPath(); x.moveTo(-rx, hw * .04);
        for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; x.lineTo(Math.cos(a) * rx, Math.sin(a) * top + (i % 2 ? -hw * .03 : 0)); }   // (a soft, lumpy top)
        for (let i = 0; i <= 8; i++) { const q = 1 - i / 8; x.lineTo(-rx + 2 * rx * q, hw * (.05 + .05 * Math.sin(i * 1.9)) * (q > 0 && q < 1 ? 1 : .4)); }   // (and a lumpy edge where it lies on the hat)
        x.closePath(); x.fill();
        x.globalAlpha = .55 + .4 * k; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(px, py - hw * .14, hw * (.2 + .1 * k), hw * (.08 + .07 * k), 0, 0, 6.283); x.fill(); x.restore(); };   // (and a little on the bobble)
      const puffDraw = () => { for (const p of puffs) { const sz = p.s * R * 2.4; x.globalAlpha = Math.max(0, 1 - p.t / p.life) * .9; x.drawImage(flake, cx + p.u * R - sz / 2, cy + p.v * R - sz / 2, sz, sz); } x.globalAlpha = 1; };
      if (fig) { flakes(0, .68);   // (two flakes in three fall behind it, so it is never lost in the snow)
        try { fig.frame(t, dtw, { px: 2 * R * DPR, gx, gy, E, feet: GV, calm }); x.drawImage(fig.canvas, cx - R, cy - R, 2 * R, 2 * R); hatSnow(); puffDraw(); } catch (e) {} }
      x.beginPath(); x.moveTo(cx - R, cy + R);
      for (let b = 0; b <= NB; b++) { const u = b / NB * 2 - 1, i = Math.min(NB - 1, b), hh = (pile[Math.max(0, i - 1)] + pile[i] * 2 + pile[Math.min(NB - 1, i + 1)]) / 4 + baseU(u), edge = Math.sqrt(Math.max(0, 1 - u * u));
        x.lineTo(cx + u * R, cy + (edge - Math.min(1, hh / .012) * (edge - floorAt(u)) - hh) * R); }
      x.lineTo(cx + R, cy + R); x.closePath();
      if (fig) {   // the mound has a little shape to it, and the figure's soft shadow lies on the snow at its feet
        const sy = cy + surf(binOf(0)) * R, sg = x.createLinearGradient(0, sy - R * .05, 0, cy + R); sg.addColorStop(0, 'rgba(247,250,255,.97)'); sg.addColorStop(1, 'rgba(206,220,246,.97)'); x.fillStyle = sg; x.fill();
        const rx = Math.max(.12, Math.min(.6, fig.reach || .3)) * R * 1.25, air = Math.max(0, Math.min(1, (fig.air || 0) * 4));
        x.save(); x.clip(); x.translate(cx, sy + R * .012); x.scale(1, .24); const sh = x.createRadialGradient(0, 0, rx * .15, 0, 0, rx * (1 + air * .4));
        sh.addColorStop(0, `rgba(36,58,112,${.34 * (1 - air * .6)})`); sh.addColorStop(1, 'rgba(36,58,112,0)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, rx * (1 + air * .4), 0, 6.283); x.fill(); x.restore();
        flakes(.68, 2);
      } else { x.fillStyle = 'rgba(244,247,255,.93)'; x.fill(); flakes(0, 2); }
      for (const b of BOKEH) { b.v += b.sp * dtw * (1 + E * 3); b.u += Math.sin(t * .3 + b.ph) * .01 * dtw + gx * .02 * dtw; if (b.v > 1.1) { b.v = -1.1; b.u = Math.random() * 1.8 - .9; } const sz = b.s * R * 2; x.globalAlpha = b.a; x.drawImage(soft, cx + b.u * R - sz / 2, cy + b.v * R - sz / 2, sz, sz); } x.globalAlpha = 1;   // (big soft flakes in front of the glass, out of focus)
      x.restore();
      g = x.createRadialGradient(cx - R * .35, cy - R * .45, R * .05, cx, cy, R * 1.02); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.35, 'rgba(255,255,255,.04)'); g.addColorStop(.85, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(200,225,255,.28)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.283); x.fill(); x.lineWidth = Math.max(1.5, R * .022); x.strokeStyle = 'rgba(220,235,255,.55)'; x.stroke();
      x.save(); x.lineCap = 'round'; x.lineWidth = R * .045; x.strokeStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(cx, cy, R * .86, Math.PI * 1.08, Math.PI * 1.36); x.stroke();
      x.lineWidth = R * .02; x.strokeStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(cx, cy, R * .86, Math.PI * 1.42, Math.PI * 1.48); x.stroke(); x.restore();
      g = x.createLinearGradient(cx - R * .8, 0, cx + R * .8, 0); g.addColorStop(0, '#8a6324'); g.addColorStop(.4, '#f0cc7a'); g.addColorStop(1, '#6e4c18');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, y0, R * .8, R * .11, 0, 0, Math.PI); x.ellipse(cx, y0 - R * .05, R * .8, R * .11, 0, Math.PI, 0, true); x.closePath(); x.fill();
      if (magic) drawMagic(t, y0);
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
    function bell(fq, when, v, pan) { if (!AC || !soundOn) return; const t = AC.currentTime + (when || 0);
      let out = OUT; if (pan && AC.createStereoPanner) { try { out = AC.createStereoPanner(); out.pan.value = Math.max(-1, Math.min(1, pan)); out.connect(OUT); } catch (e) { out = OUT; } }   // (pan: from the left or the right, for a game played by ear)
      for (const [m, a] of [[1, 1], [2.76, .25], [5.4, .08]]) { const os = AC.createOscillator(), g = AC.createGain(); os.type = 'sine'; os.frequency.value = fq * m;
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime((v || .12) * a, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6 / m + .3); os.connect(g); g.connect(out); os.start(t); os.stop(t + 2.2); } }
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
      side = Math.max(-.85, Math.min(.85, Math.sin(side * Math.PI / 180) * 1.3)); const d = side - tgx; tgx = side; tgy = Math.sqrt(1 - side * side);
      if (Math.abs(d) > .06) stir(Math.min(.2, Math.abs(d) * .6), d * 1.6, -Math.abs(d) * .3);   // (24 Nov) tilting the phone sloshes the water: the snow swirls toward the low side
    }
    let tap = null;   // a quick touch that doesn't move: on the glass (with a 3D figure) the figure hops; on the base, onPlate is called
    const pd = e => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; tap = o.model || o.onPlate ? { x: e.clientX, y: e.clientY, t: drag.t, moved: 0 } : null; ac(); };
    const pu = e => {
      drag = null; const k = tap; tap = null; if (!k || k.moved > 10 || performance.now() - k.t > 400) return;
      const b = cv.getBoundingClientRect(), qu = (k.x - b.left - cx) / R, qv = (k.y - b.top - cy) / R;
      if (o.onPlate && qv > .92 && qv < 1.62 && Math.abs(qu) < 1.05) { try { o.onPlate(); } catch (e2) {} return; }
      if (!o.model || !o.model.tap || qu * qu + qv * qv > 1) return;
      try { if (o.model.tap() !== false) { bell(NOTES[2 + Math.floor(Math.random() * 3)], 0, .07); try { navigator.vibrate && navigator.vibrate(12); } catch (e2) {} } } catch (e2) {}
    };
    const pm = e => {
      if (!drag) return; const b = cv.getBoundingClientRect(), now = performance.now(), dt = Math.max(8, now - drag.t) / 1000, du = (e.clientX - drag.x) / R / dt, dv = (e.clientY - drag.y) / R / dt;
      if (tap) tap.moved += Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      if (o.model && o.model.drag) try { o.model.drag((e.clientX - drag.x) / R, (e.clientY - drag.y) / R); } catch (e2) {}
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
      if (resting) E *= Math.exp(-dt * 2); else { step(dt, t); drawSky(t, dt); draw(t); }   // resting: a game is covering the globe
      sound(dt); requestAnimationFrame(frame);
    })(last);
    return {
      tilt(side) { onTilt({ gamma: Math.asin(Math.max(-.65, Math.min(.65, side / 1.3))) * 180 / Math.PI, beta: 0 }); },   // (for testing: tilt it as a phone would, −1 … 1)
      get cap() { return cap; },
      start, set, shake() { ac(); stir(2.6, (Math.random() - .5) * .6, -.4); },
      sound(on) { soundOn = !!on; if (waveOn) wave.muted = !soundOn; },
      // for a game played inside the globe: where the glass is on the screen, a pause while the game covers it, and the globe's bells
      get glass() { return { x: cx, y: cy, r: R, w: W, h: H }; }, get soundOn() { return soundOn; },
      rest(on) { resting = !!on; }, bell(fq, when, v, pan) { ac(); bell(fq, when, v, pan); }, chimes() { ac(); chimes(); },
      magic(text) { const s = String(text || '').trim().toUpperCase(); if (!s) return; magic = { text: s, t0: performance.now() / 1000 }; nameAt = magic.t0 + MAGIC + .25; },
      destroy() { dead = true; if (ro) ro.disconnect(); removeEventListener('devicemotion', onMotion); removeEventListener('deviceorientation', onTilt); removeEventListener('pointerup', pu); wave.pause(); wave.removeAttribute('src'); sky.remove(); cv.remove(); try { AC && AC.close(); } catch (e) {} },
      get canvas() { return cv; }
    };
  }
  window.AAGlobe = { create, goldOf, BASES: Object.keys(BASES) };
})();
