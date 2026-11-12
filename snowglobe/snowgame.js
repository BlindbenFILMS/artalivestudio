/* ─────────────────────────────────────────────────────────────
   ART ALIVE: Catch the Word. A game of about 30 seconds, played inside the snow globe.

   After a shake, as the snow settles, the view zooms in until the inside of the glass fills the screen. (With a figure that
   has a logo on it, the view zooms into that logo until it fills the screen, then back out of it into the game, and the
   same on the way back to the globe. Otherwise the snow rushes up white in between.) Snowflakes fall; the
   figure slides left and right to catch them. Big flakes carry letters, and the word at the top shows which one is needed
   next (it pulses). Catching it makes the figure grow one size. Around it fall wrong letters (a "nope", nothing more), big
   flakes with no letter and small ones (each helps a little), all at their own speeds. Now and then, just after a catch, a
   ray of sunshine comes down on the figure: it warns for a moment, then shines, and if he is still standing in it he melts
   one size (the letters he has caught stay caught). The letter he needs never falls inside a ray. A missed letter simply
   falls again: nobody loses. When the last letter is caught the snowflakes swirl together and spell the word across
   the sky, and the view zooms back out to the globe with the snow flying.

   const game = createGame({ stage, globe, figure, backdrop, say });
   await game.play('JOY', () => { …the moment the globe is back on screen (still hidden in white): shake it, change its name… });

   To play: drag a finger left and right (the figure follows it), tilt the phone, or use the arrow keys.
   By ear: the letter that is needed rings from its side (left or right); the ring gets quicker as it comes down, and higher
   when the figure is right under it. Sunshine shimmers from its side, faster once it is shining: bright while the figure is
   in it, low and soft once he is out. Screen readers are told
   each needed letter and its side, each ray of sunshine, and what happened.
   ───────────────────────────────────────────────────────────── */
export const WORDS = ['JOY', 'LOVE', 'HOPE', 'GIFT', 'CARE', 'JOLLY', 'MERRY'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - Math.pow(1 - clamp(p, 0, 1), 3), easeIn = p => Math.pow(clamp(p, 0, 1), 2.4), smooth = (a, b, v) => { const p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
const FONT = 'Archivo, "Arial Black", Arial, sans-serif';
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];   // the catch notes climb, one per letter
const PACE = [1.15, .8, 1, .75, 1.2];                                     // the needed letters come quick and slow by turns
// letters that are easy to mistake for one another are never used as the wrong letter for each other
const LOOK = { O: 'QCDG', Q: 'O', C: 'OG', G: 'OC', D: 'O', I: 'LJT', L: 'I', J: 'I', T: 'I', E: 'F', F: 'EP', P: 'FRB', R: 'PB', B: 'PR', M: 'NW', N: 'M', W: 'M', U: 'V', V: 'UY', Y: 'V' };

export function createGame({ stage, globe, figure, backdrop, say = () => {}, cues = true }) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:none;touch-action:none;z-index:3';
  document.body.appendChild(cv);
  const x = cv.getContext('2d');
  // one soft snowflake dot (for the falling snow and for the word made of snow)
  const dotImg = document.createElement('canvas'); dotImg.width = dotImg.height = 32;
  { const g = dotImg.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }

  let W = 1, H = 1, DPR = 1, PW = 1, PX = 0, groundY = 1;
  function size() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
    PW = Math.min(W, H * .8); PX = (W - PW) / 2; groundY = H * .87; }
  const moundY = px => groundY + Math.pow((px - W / 2) / (W / 2), 2) * H * .03;

  let G = null, raf = 0, last = 0;   // G: the round being played
  const WARN = calm ? 1.9 : 1.4, BURN = 1.5, FADE = .5;   // a ray of sunshine: it warns, it shines, it goes

  /* ── what is on the screen ── */
  // A ray of sunshine comes just after a letter is caught, never after the last one: he is standing still and nothing he needs
  // is falling yet, so there is always time to get away. A three-letter word has one, after the second letter (by then the
  // player knows how to slide); a longer word has two, after any two of its letters.
  function sunTimes(n) { if (n <= 3) return [Math.max(1, n - 1)]; const all = []; for (let k = 1; k < n; k++) all.push(k);
    for (let k = all.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [all[k], all[j]] = [all[j], all[k]]; }
    return all.slice(0, 2).sort((a, b) => a - b); }
  function newRound(word) {
    const amb = [], n = Math.round(clamp(W * H / 5200, 60, 150)), nl = word.length;
    for (let i = 0; i < n; i++) amb.push({ u: Math.random(), v: Math.random(), s: 1.2 + Math.pow(Math.random(), 2) * 3.4, z: Math.random(), ph: Math.random() * 6.283 });
    return { word, letters: word.split(''), i: 0, phase: 'in', pt: 0, t: 0, amb, sparks: [], pops: [], fly: [], big: [], letter: null, nextAt: 1.6, sparkAt: .4, wrongAt: 2.8, blankAt: 1.1, cueAt: 0,
      sx: W / 2, tx: W / 2, vx: 0, hf: .25, level: 0, caught: 0, bonus: 0, misses: 0, missRow: 0, nopes: 0, melts: 0, cheerT: -9, nopeT: -9, meltT: -9, toldT: -9,
      sunAfter: sunTimes(nl), sunDue: 0, sun: null, note: null,
      veil: 0, hud: 1, logo: false, cam: null, e: 0, view: null, geo: null, yaw0: 0, word3: null, done: null, keys: { l: 0, r: 0 }, tilt: 0, tilt0: null, touchT: -9, back: null, zoom: null, played: 0 };
  }
  const hfGoal = () => lerp(.25, .43, clamp((G.level + G.bonus * .1) / G.letters.length, 0, 1));
  const figH = () => figure.height || 1.2;                    // the figure's height in its own picture (the picture is 2 units tall)
  const unit = () => G.hf * H / figH();                       // pixels per unit, so that it stands hf of the screen tall
  const headY = () => groundY - G.hf * H;
  const reach = () => Math.max(24, (figure.reach || .3) * unit());   // how far its arms spread
  const grab = () => Math.max(22, reach() * .6);                      // how near a flake must be to be caught
  const need = () => G.letters[G.i] || '';
  const note = (txt, dur) => { G.note = { txt, t0: G.t, dur: dur || 1.8 }; };
  const side = px => (Math.abs(px - G.sx) < grab() ? 'right above you' : px < G.sx ? 'on your left' : 'on your right');

  // a column clear of the other big flakes that are still high up, so two never fall on top of each other
  const clearOf = (c, r) => !G.big.some(f => f.y < H * .5 && Math.abs(f.bx - c) < (f.r + r) * 1.12);
  function freeX(r) { const lo = PX + r + 8, hi = PX + PW - r - 8, S = G.sun; for (let k = 0; k < 12; k++) { const c = lo + Math.random() * (hi - lo); if (clearOf(c, r) && !(S && Math.abs(c - S.x) < S.w / 2 + r * .4)) return c; } return null; }
  const flake = (kind, ch, c, r, secs) => ({ kind, ch, x: c, bx: c, y: -r * 1.4, r, vy: (headY() + r * 1.4) / secs, rot: Math.random() * 6, spin: (Math.random() < .5 ? -1 : 1) * (.3 + Math.random() * .5), ph: Math.random() * 6 });

  function spawnLetter() {   // the letter that is needed: never right over the figure, so there is somewhere to go
    const ch = need(), r = clamp(PW * .088, 30, 46), easy = G.missRow >= 2, lo = PX + r + 8, hi = PX + PW - r - 8;
    const S = G.sun, shone = c => S && Math.abs(c - S.x) < S.w / 2 + r * .7;                   // (never inside a ray of sunshine)
    const twin = G.big.find(f => f.kind !== 'blank' && f.ch === ch && f.y < headY() * .45 && !shone(f.x));   // it is already falling (it was a wrong letter a moment ago): that one will do
    if (twin) { twin.kind = 'need'; G.letter = twin; say(ch + ', ' + side(twin.x) + '.'); return; }
    let lx = null, c = G.sx;
    if (S) {   // there is a ray of sunshine: the letter comes down beside it, on the figure's side if there is room there
      const z = S.w / 2 + r * .7, L = [lo, Math.min(hi, S.x - z)], R = [Math.max(lo, S.x + z), hi], wide = a => a[1] - a[0];
      let a = G.sx < S.x ? L : R; if (wide(a) < r * .6) a = a === L ? R : L; if (wide(a) < 0) a = [lo, hi];
      for (let k = 0; k < 12 && lx == null; k++) { c = a[0] + Math.random() * wide(a); if (clearOf(c, r)) lx = c; }
    } else for (let k = 0; k < 12 && lx == null; k++) { const far = easy ? .12 : .2 + Math.random() * .2; c = G.sx + (Math.random() < .5 ? -1 : 1) * far * PW; if (c < lo || c > hi) c = G.sx - (c - G.sx); c = clamp(c, lo, hi); if (clearOf(c, r)) lx = c; }
    if (lx == null) lx = c;
    const base = (calm ? 4.2 : 3.4) + (5 - Math.min(5, G.letters.length)) * .5;   // short words fall a little slower, so every round is about 30 seconds
    const secs = Math.max(2.3, base * (easy ? 1.15 : PACE[G.i % PACE.length])) + (easy ? .8 : 0);
    G.letter = flake('need', ch, lx, r, secs); G.big.push(G.letter);
    say(ch + ', ' + side(lx) + '.');
  }
  function wrongLetter() {
    const bad = need() + (LOOK[need()] || ''), pool = [];
    for (const c of G.letters) if (!bad.includes(c)) pool.push(c, c);                       // other letters of this word: right later, wrong now
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!bad.includes(c)) pool.push(c);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function spawnOther(kind) {
    const r = kind === 'blank' ? clamp(PW * .07, 22, 36) : clamp(PW * .088, 30, 46), c = freeX(r); if (c == null) return;
    G.big.push(flake(kind, kind === 'wrong' ? wrongLetter() : '', c, r, 2.4 + Math.random() * 2.9));   // every flake at its own speed
  }
  function pop(px, py, col, n, big) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = (60 + Math.random() * 160) * (big ? 1.5 : 1); G.pops.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .5 + Math.random() * .4, t: 0, s: 2 + Math.random() * 3, col }); } }

  function caught(f) {
    const t = G.t;
    if (f.kind !== 'blank' && f.ch === need()) {   // the letter that is needed, whichever flake carries it
      const k = G.i; G.fly.push({ ch: f.ch, k, x: f.x, y: f.y, t: 0, r: f.r }); pop(f.x, f.y, '#ffe9a8', 16, true);
      globe.bell(SCALE[k % SCALE.length], 0, .13); globe.bell(SCALE[k % SCALE.length] * 2, .07, .06); try { navigator.vibrate && navigator.vibrate(25); } catch (e) {}
      try { figure.tap(); } catch (e) {} G.cheerT = t; G.caught++; G.level++; G.i++; G.missRow = 0; G.nextAt = t + .8; say(f.ch + '!');
      if (G.letter === f || (G.letter && G.letter.ch !== need())) G.letter = null;   // (another flake with the old letter is just a wrong letter now)
      if (G.i >= G.letters.length) G.nextAt = t + .9;
      else if (G.sunAfter.length && G.i >= G.sunAfter[0]) { G.sunAfter.shift(); G.sunDue = t + .35; }   // …and now and then, sunshine
    } else if (f.kind !== 'blank') {   // a wrong letter: a "nope", and it doesn't count
      pop(f.x, f.y, '#9fb0d6', 10); globe.bell(207.65, 0, .07); globe.bell(155.56, .1, .07); G.nopes++; G.nopeT = t;
      if (G.nopes <= 2) note('Not ' + f.ch + ': you need ' + need(), 1.7);
      if (t - G.toldT > 3) { G.toldT = t; say('Not ' + f.ch + '. You need ' + need() + '.'); }
    } else { pop(f.x, f.y, '#ffffff', 8); G.bonus += 2; globe.bell(1760 + Math.random() * 400, 0, .03, (f.x - W / 2) / (W / 2) * .6); }   // no letter: a little more snow for him
  }
  function landed(f) {
    pop(f.x, moundY(f.x), '#ffffff', f === G.letter ? 10 : 5);
    if (f === G.letter) { globe.bell(196, 0, .05); G.misses++; G.missRow++; G.letter = null; G.nextAt = G.t + .8; say('Missed. ' + f.ch + ' is coming again.'); }   // it comes round again
  }

  // a ray of sunshine, where the figure is standing: a warning, then the heat
  function startSun() {
    const w = clamp(PW * .34, 110, 240); G.sun = { x: clamp(G.sx, PX + w / 2 + 4, PX + PW - w / 2 - 4), w, t: 0, hit: 0, done: false, cue: 0, n: 0 };
    if (G.melts + (G.sunsSeen || 0) < 2) note('Sunshine! Slide away', 2); G.sunsSeen = (G.sunsSeen || 0) + 1;
    say('Sunshine ' + side(G.sun.x) + '! Slide away.');
  }
  const inSun = S => Math.abs(G.sx - S.x) < S.w * .5 + reach() * .15;
  // the ray is narrow at the top and wide on the snow; while it shines, the snowflakes inside it melt away
  const inBeam = (px, py) => { const S = G.sun; return !!S && S.t >= WARN && S.t < WARN + BURN && Math.abs(px - S.x) < lerp(S.w * .36, S.w, clamp(py / Math.max(1, moundY(S.x)), 0, 1)) / 2; };
  function melt(S) {
    S.done = true; G.melts++; G.level = Math.max(0, G.level - 1); G.bonus = Math.max(0, G.bonus - 1); G.meltT = G.t;
    for (let k = 0; k < 16; k++) G.pops.push({ x: G.sx + (Math.random() - .5) * reach() * 1.4, y: headY() + Math.random() * G.hf * H * .7, vx: (Math.random() - .5) * 30, vy: 30 + Math.random() * 90, life: .7 + Math.random() * .5, t: 0, s: 2 + Math.random() * 2.5, col: '#bfe3ff' });
    [392, 329.63, 261.63].forEach((f, k) => globe.bell(f, k * .13, .08)); try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) {}
    note('The sun melted him a little', 1.9); say('The sun melted him a little. Catch more snow.');
  }

  // the points that make the word, sampled from big letters (so the snowflakes can gather into it)
  function wordPoints(word, most) {
    const c = document.createElement('canvas'), fw = 900, fh = 460; c.width = fw; c.height = fh; const g = c.getContext('2d', { willReadFrequently: true });
    let fs = 230; g.font = `900 ${fs}px ${FONT}`; fs = Math.min(400, fs * fw * .94 / g.measureText(word).width); g.font = `900 ${fs}px ${FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(word, fw / 2, fh / 2 + fs * .04);
    const d = g.getImageData(0, 0, fw, fh).data; let pts = [], step = 11;
    for (; step < 40; step++) { pts = [];
      for (let y = step / 2, row = 0; y < fh; y += step * .87, row++) for (let px = step / 2 + (row % 2 ? step / 2 : 0); px < fw; px += step) if (d[((y | 0) * fw + (px | 0)) * 4 + 3] > 110) pts.push([px / fw - .5, (y - fh / 2) / fw]);
      if (pts.length <= most) break; }
    pts.gap = step / fw; pts.fs = fs / fw;   // how far apart the dots are, and how tall the letters (as parts of the word's width)
    return pts;
  }
  // the snow word sits in the open sky above the figure's head, as big as fits there
  const wordW = () => G.WW || Math.min(PW * .88, 580), wordY = () => H * .235;
  function startWord() {
    G.phase = 'word'; G.pt = 0; G.letter = null; G.sun = null; G.note = null; G.cheerT = G.t; try { figure.shake(0, true); } catch (e) {}
    for (const f of G.big) pop(f.x, f.y, '#ffffff', 6); G.big = []; G.sparks = [];
    const pts = wordPoints(G.word, clamp(Math.round(Math.min(PW * .88, 580)), 300, 620)); G.wfs = pts.fs; G.WW = Math.min(PW * .88, 580, .28 * H / pts.fs);   // (more dots on a bigger screen, so the letters stay crisp)
    const WW = wordW(), wy = wordY(), [hx, hy] = [G.sx, headY() + G.hf * H * .25];
    G.amb.sort(() => Math.random() - .5); const take = Math.min(pts.length, G.amb.length), pool = G.amb.slice(0, take).map(f => [f.u * W, f.v * H]); G.amb = G.amb.slice(take);   // those flakes are in the word now
    G.word3 = pts.map((p, k) => { const from = k < pool.length ? pool[k] : [hx + (Math.random() - .5) * 30, hy + (Math.random() - .5) * 30];
      return { x0: from[0], y0: from[1], x1: W / 2 + p[0] * WW, y1: wy + p[1] * WW, d: Math.random() * .55, ph: Math.random() * 6.283, s: Math.max(4, pts.gap * WW * 1.9), vx: 0, vy: 0, x: from[0], y: from[1] }; });
    for (let k = 0; k < 4; k++) globe.bell([523.25, 659.25, 783.99, 1046.5][k], k * .12, .09);
    globe.bell(1318.5, .6, .08); try { navigator.vibrate && navigator.vibrate([30, 40, 30, 40, 90]); } catch (e) {}
    say(G.word + '!');
  }

  /* ── one step of the game ── */
  function step(dt) {
    const t = (G.t += dt); G.pt += dt;
    // the figure follows the finger, the keys or the tilt of the phone
    const lo = PX + Math.min(reach(), PW * .3), hi = PX + PW - Math.min(reach(), PW * .3);   // it stays whole on the screen
    if (G.phase === 'play') {
      const lean = t - G.touchT > 1.5 ? clamp(G.tilt - (G.tilt0 || 0), -1, 1) : 0;   // the tilt of the phone (from how it was held when the round began), unless a finger is steering
      const push = (G.keys.r - G.keys.l) + (Math.abs(lean) > .1 ? lean * 1.6 : 0); if (push) G.tx += push * PW * 1.15 * dt;
      G.tx = clamp(G.tx, lo, hi); const want = (G.tx - G.sx) * 12, cap = PW * 2.4; G.vx = clamp(want, -cap, cap); G.sx += G.vx * dt;
    } else { G.vx *= Math.exp(-dt * 6); G.sx = clamp(G.sx + G.vx * dt, lo, hi); }
    G.hf += (hfGoal() - G.hf) * Math.min(1, dt * 3);
    for (const f of G.amb) { f.v += (18 + f.s * 16) * (1 + f.z) * dt / H; f.u += Math.sin(t * .9 + f.ph) * 6 * dt / W; if (f.v > 1.02) { f.v = -.02; f.u = Math.random(); } }

    if (G.phase === 'play') {
      const top = headY(), bottom = top + G.hf * H * .5, going = G.i < G.letters.length, most = PW < 360 ? 3 : PW < 520 ? 4 : 5;
      // small flakes to catch all the while: each one helps a little
      if (t >= G.sparkAt) { G.sparkAt = t + .8 + Math.random() * .8; const r = 9 + Math.random() * 5; G.sparks.push({ x: PX + r + Math.random() * (PW - 2 * r), y: -r * 2, r, vy: (top + r * 2) / (2.2 + Math.random() * 2.2), rot: Math.random() * 6, ph: Math.random() * 6 }); }
      for (const s of G.sparks) { s.y += s.vy * dt; s.rot += dt * 1.2; s.x += Math.sin(t * 1.4 + s.ph) * 10 * dt;
        if (s.y > top - s.r && s.y < bottom && Math.abs(s.x - G.sx) < grab() + s.r * 1.5) { s.gone = true; G.bonus++; pop(s.x, s.y, '#ffffff', 5); globe.bell(1568 + Math.random() * 500, 0, .022, (s.x - W / 2) / (W / 2) * .6); }
        else if (s.y > moundY(s.x) - 2 || inBeam(s.x, s.y)) s.gone = true; }
      G.sparks = G.sparks.filter(s => !s.gone);

      // the big flakes: the letter that is needed (one at a time), wrong letters and flakes with no letter
      if (going && !G.letter && t >= G.nextAt) spawnLetter();
      if (going && t >= G.wrongAt) { G.wrongAt = t + 1.5 + Math.random() * 1.1; if (G.big.length < most) spawnOther('wrong'); }
      if (going && t >= G.blankAt) { G.blankAt = t + 2.2 + Math.random() * 1.6; if (G.big.length < most) spawnOther('blank'); }
      for (const f of G.big) {
        f.y += f.vy * dt; f.rot += dt * f.spin; f.x = f.bx + Math.sin(t * 1.2 + f.ph) * Math.min(10, PW * .02);
        if (f.y + f.r * .5 > top && f.y - f.r < bottom && Math.abs(f.x - G.sx) < grab() + f.r * .5) { f.gone = true; caught(f); }
        else if (f.y - f.r * .3 > moundY(f.x)) { f.gone = true; landed(f); }
        else if (f !== G.letter && f.y > f.r && inBeam(f.x, f.y)) { f.gone = true; pop(f.x, f.y, '#bfe3ff', 7); }   // melted by the sunshine
      }
      G.big = G.big.filter(f => !f.gone);
      const L = G.letter;
      if (L && cues && t >= G.cueAt) { const dx = L.x - G.sx, under = Math.abs(dx) < grab() + L.r * .5, near = clamp((L.y + L.r) / Math.max(1, top), 0, 1);
        G.cueAt = t + lerp(.62, .17, near); globe.bell(under ? 1318.5 : 659.25, 0, under ? .05 : .032, clamp(dx / (PW * .3), -1, 1)); }
      if (G.played > 75 && L) L.bx += (G.sx - L.bx) * Math.min(1, dt * 3);     // (a very long round: the letters come to the figure)

      // sunshine
      if (going && G.sunDue && t >= G.sunDue) {
        if (G.letter) { G.sunDue = 0; G.sunAfter.unshift(G.i + 1); }   // the next letter is already on its way: after the next catch, then
        else if (!G.sun) { G.sunDue = 0; startSun(); } }               // (while the last ray is still fading, it waits a moment)
      const S = G.sun;
      if (S) { S.t += dt; const burn = S.t >= WARN && S.t < WARN + BURN;
        if (cues && t >= S.cue && S.t < WARN + BURN) { const inIt = inSun(S); S.cue = t + (burn ? .12 : .23);   // bright and clear while he is in it, low and soft once he is out
          globe.bell([523.25, 659.25, 783.99, 1046.5][S.n++ % 4] * (burn ? 2 : 1) * (inIt ? 1 : .5), 0, inIt ? .04 : .016, clamp((S.x - G.sx) / (PW * .3), -1, 1)); }
        if (burn && !S.done && inSun(S)) { S.hit += dt; if (S.hit > .3) melt(S); }
        if (S.t > WARN + BURN + FADE) G.sun = null; }

      if (!going && !G.letter && t >= G.nextAt && !G.fly.length) startWord();
      G.played += dt;
    }
    for (const f of G.fly) f.t += dt / .6; G.fly = G.fly.filter(f => f.t < 1);
    for (const p of G.pops) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } G.pops = G.pops.filter(p => p.t < p.life);

    if (G.phase === 'word') {
      G.hud = Math.max(0, 1 - G.pt / .7);
      for (const p of G.word3) { const q = easeOut((G.pt - p.d) / 1.25), bend = Math.sin(Math.PI * clamp((G.pt - p.d) / 1.25, 0, 1)) * 26;
        p.x = lerp(p.x0, p.x1, q) + Math.cos(p.ph) * bend; p.y = lerp(p.y0, p.y1, q) + Math.sin(p.ph) * bend; }
      if (G.pt > (calm ? 3.2 : 4.1)) { G.phase = 'out'; G.pt = 0; for (const p of G.word3) { const a = Math.atan2(p.y - wordY(), p.x - W / 2) + (Math.random() - .5); p.vx = Math.cos(a) * (200 + Math.random() * 500); p.vy = Math.sin(a) * (200 + Math.random() * 500) - 80; } }
    }
    if (G.phase === 'out' && G.word3) for (const p of G.word3) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }

    // the figure itself: it faces the way it is going, looks up at the letter, throws its arms up at a catch, shakes its head at a
    // wrong letter, and droops when the sun has melted it
    if (G.back) return;
    if (G.logo && G.phase !== 'play' && G.phase !== 'word') { figure.pose = FRONT(); return; }   // a close-up of its logo: it faces us and keeps still
    const L = G.letter, glad = t - G.cheerT < .9, nope = t - G.nopeT < .55, sad = t - G.meltT < 1.3, S = G.sun;
    figure.pose = { yaw: clamp(G.vx / (PW * 1.6), -1, 1) * .5, lean: clamp(G.vx / (PW * 1.8), -1, 1) * -.9,
      look: nope ? Math.sin((t - G.nopeT) * 24) * .9 : L ? clamp((L.x - G.sx) / (PW * .3), -1, 1) : 0, up: sad ? -.8 : S && S.t < WARN && inSun(S) ? 1 : L ? .75 : glad ? .4 : 0,
      cheer: G.phase === 'word' || G.phase === 'out' || glad ? 1 : sad || nope ? 0 : L && Math.abs(L.x - G.sx) < reach() * 1.6 && L.y > headY() * .45 ? .65 : 0,
      walk: G.phase === 'play' ? clamp(Math.abs(G.vx) / (PW * .8), 0, 1) : 0 };
  }
  const FRONT = () => ({ yaw: 0, lean: 0, look: 0, up: 0, cheer: 1, walk: 0, still: true, bare: !calm && G.e > .24 });   // (bare: its own logo is off, because the sharp one is drawn over it)
  const midY = () => groundY + H * .012 - figure.feetV * unit();   // the middle of the figure's picture, in the game

  // Draw the figure's picture for this frame. Zoomed in, only the part of it that is on the screen is drawn, so it stays sharp.
  // (ox, oy: where the middle of its picture is on the page; u: pixels to one of its units; own: the game is drawing it, not the globe)
  function renderFigure(dt, ox, oy, u, own) {
    let view = null; const c = G.cam;
    if (c && c.Z > 1.25) { let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
      for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const q = unCam(c, sx, sy), px = (q[0] - ox) / u, py = (q[1] - oy) / u; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      x0 = Math.max(-1, x0); y0 = Math.max(-1, y0); x1 = Math.min(1, x1); y1 = Math.min(1, y1);
      if (x1 > x0 && y1 > y0) { const half = Math.max(x1 - x0, y1 - y0) / 2 * 1.03; if (half < .85) view = [(x0 + x1) / 2, (y0 + y1) / 2, half]; } }
    G.view = view; if (!own && !view) return;   // (over the globe, the globe draws the figure itself)
    try { figure.frame(performance.now() / 1000, dt, own ? { px: clamp(2 * u * DPR, 256, 1280), view } : { view }); } catch (e) {}
  }
  function drawFigure(ox, oy, u) { const V = G.view; if (!figure.canvas) return;
    if (V) x.drawImage(figure.canvas, ox + (V[0] - V[2]) * u, oy + (V[1] - V[2]) * u, 2 * V[2] * u, 2 * V[2] * u); else x.drawImage(figure.canvas, ox - u, oy - u, 2 * u, 2 * u); }

  /* ── drawing ── */
  function flake6(px, py, r, rot, a) {   // a six-armed snowflake
    x.save(); x.translate(px, py); x.rotate(rot); x.globalAlpha = a; x.strokeStyle = '#ffffff'; x.lineCap = 'round'; x.lineWidth = Math.max(1.4, r * .11); x.shadowColor = 'rgba(190,220,255,.9)'; x.shadowBlur = r * .5;
    x.beginPath(); for (let k = 0; k < 6; k++) { const c = Math.cos(k * Math.PI / 3), s = Math.sin(k * Math.PI / 3); x.moveTo(0, 0); x.lineTo(c * r, s * r);
      for (const [d, l] of [[.55, .3], [.8, .2]]) for (const sg of [-1, 1]) { const bx = c * r * d, by = s * r * d, a2 = k * Math.PI / 3 + sg * 1.0; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a2) * r * l, by + Math.sin(a2) * r * l); } }
    x.stroke(); x.restore();
  }
  function letterFlake(L, a) {   // the right letters and the wrong ones look alike: you have to read them
    flake6(L.x, L.y, L.r * 1.25, L.rot, a * .95);
    x.save(); x.globalAlpha = a; x.shadowColor = 'rgba(255,255,255,.95)'; x.shadowBlur = L.r * .7; x.fillStyle = '#f6f9ff'; x.beginPath(); x.arc(L.x, L.y, L.r * .68, 0, 6.283); x.fill();
    x.shadowColor = 'transparent'; x.lineWidth = Math.max(2, L.r * .07); x.strokeStyle = '#9fc0f5'; x.stroke();
    x.fillStyle = '#10295f'; x.font = `900 ${Math.round(L.r * 1.02)}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(L.ch, L.x, L.y + L.r * .05); x.restore();
  }
  function drawSun(S) {   // pale and slowly pulsing while it warns, strong while it shines
    const a = lerp(calm ? .2 : .19 + .08 * Math.sin(S.t * 12), .56, smooth(WARN, WARN + .25, S.t)) * smooth(0, .25, S.t) * (1 - smooth(WARN + BURN, WARN + BURN + FADE, S.t));
    if (a <= 0) return; const gy = moundY(S.x), tw = S.w * .36, bw = S.w;
    x.save(); x.translate(S.x, gy + 5); x.scale(1, .22); x.fillStyle = `rgba(255,206,92,${Math.min(.62, a * 1.5)})`; x.beginPath(); x.arc(0, 0, bw * .56, 0, 6.283); x.fill(); x.restore();   // where it falls on the snow
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [k, m] of [[1, .55], [.72, .45]]) { const g = x.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, `rgba(255,236,160,${a * m})`); g.addColorStop(1, `rgba(255,212,104,${a * m * .7})`); x.fillStyle = g;
      x.beginPath(); x.moveTo(S.x - tw * k / 2, -12); x.lineTo(S.x + tw * k / 2, -12); x.lineTo(S.x + bw * k / 2, gy + 8); x.lineTo(S.x - bw * k / 2, gy + 8); x.closePath(); x.fill(); }
    let g = x.createRadialGradient(S.x, -H * .03, 4, S.x, -H * .03, S.w * 1.05); g.addColorStop(0, `rgba(255,246,196,${Math.min(1, a * 1.9)})`); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(S.x - S.w * 1.1, 0, S.w * 2.2, S.w * 1.1);
    x.translate(S.x, gy + 5); x.scale(1, .22); g = x.createRadialGradient(0, 0, 4, 0, 0, bw * .62); g.addColorStop(0, `rgba(255,222,120,${Math.min(1, a * 1.5)})`); g.addColorStop(1, 'rgba(255,222,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, bw * .62, 0, 6.283); x.fill();
    x.restore();
  }
  function slots() {   // the word at the top: outlines that fill with gold as the letters are caught
    const n = G.letters.length, fs = clamp(PW / (n + 1.6), 30, 68), gap = fs * 1.02, y = Math.max(H * .085, 46), x0 = W / 2 - gap * (n - 1) / 2;
    return { fs, y, at: k => x0 + gap * k };
  }
  function draw() {
    const t = G.t; x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, W, H);
    const ph = G.phase, globeSide = G.logo && (ph === 'in' || ph === 'card2' || ph === 'back');
    const seen = G.logo ? !globeSide : ph === 'in' ? G.veil >= 1 : !G.back;   // (while the globe itself is on the screen, only what lies over it is drawn)
    const lens = c => { if (c) x.setTransform(DPR * c.a, DPR * c.b, DPR * c.c, DPR * c.d, DPR * c.tx, DPR * c.ty); else x.setTransform(DPR, 0, 0, DPR, 0, 0); };
    if (seen) {
      if (G.cam) { x.fillStyle = '#0b1530'; x.fillRect(0, 0, W, H); lens(G.cam); }   // (zoomed toward the logo)
      // the same winter night as in the glass, filling the screen
      if (backdrop) { const bw = backdrop.width, bh = backdrop.height, s = Math.max(W / bw, H / bh); x.drawImage(backdrop, Math.min(0, Math.max(W - bw * s, W / 2 - bw * s * .58)), H - bh * s, bw * s, bh * s); }
      else { x.fillStyle = '#17306a'; x.fillRect(0, 0, W, H); }
      let g = x.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .35, W / 2, H * .5, Math.hypot(W, H) * .56); g.addColorStop(0, 'rgba(10,20,45,0)'); g.addColorStop(1, 'rgba(8,16,40,.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const flakes = far => { for (const f of G.amb) { if ((f.z < .5) !== far) continue; const sz = f.s * (1.2 + f.z * 1.6) * 2; x.globalAlpha = .45 + f.z * .5; x.drawImage(dotImg, f.u * W - sz / 2, f.v * H - sz / 2, sz, sz); } x.globalAlpha = 1; };
      flakes(true);
      // the figure, then the snow it stands in, and its shadow on the snow
      const u = unit(), fy = groundY + H * .012;
      drawFigure(G.sx, fy - figure.feetV * u, u);
      x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W + 8; px += 8) x.lineTo(px, moundY(px)); x.lineTo(W, H); x.closePath();
      g = x.createLinearGradient(0, groundY - 4, 0, H); g.addColorStop(0, '#f7faff'); g.addColorStop(1, '#cfdcf6'); x.fillStyle = g; x.fill();
      { const rx = reach() * 1.3, air = clamp((figure.air || 0) * 4, 0, 1); x.save(); x.clip(); x.translate(G.sx, moundY(G.sx) + 3); x.scale(1, .24); const sh = x.createRadialGradient(0, 0, rx * .15, 0, 0, rx * (1 + air * .4));
        sh.addColorStop(0, `rgba(36,58,112,${.34 * (1 - air * .6)})`); sh.addColorStop(1, 'rgba(36,58,112,0)'); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, rx * (1 + air * .4), 0, 6.283); x.fill(); x.restore(); }
      flakes(false);
      if (G.sun) drawSun(G.sun);
      for (const s of G.sparks) flake6(s.x, s.y, s.r, s.rot, .9);
      for (const f of G.big) { if (f.kind === 'blank') { flake6(f.x, f.y, f.r * 1.3, f.rot, .95); x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(f.x, f.y, f.r * .16, 0, 6.283); x.fill(); } else letterFlake(f, 1); }
      for (const p of G.pops) { x.globalAlpha = 1 - p.t / p.life; x.fillStyle = p.col; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 6.283); x.fill(); } x.globalAlpha = 1;
      // the word made of snow
      if (G.word3) { const hold = G.phase === 'word' ? smooth(.2, 1.4, G.pt) : 1, fade = G.phase === 'out' ? 1 - smooth(0, .5, G.pt) : 1;
        const WW = wordW(), fs = WW * (G.wfs || .25), wy = wordY();
        { x.save(); x.globalAlpha = hold * fade * .5; x.translate(W / 2, wy); x.scale(1, Math.max(.3, fs * 1.5 / WW)); const dk = x.createRadialGradient(0, 0, WW * .1, 0, 0, WW * .62); dk.addColorStop(0, 'rgba(6,12,34,1)'); dk.addColorStop(1, 'rgba(6,12,34,0)'); x.fillStyle = dk; x.beginPath(); x.arc(0, 0, WW * .62, 0, 6.283); x.fill(); x.restore(); }   // a darker patch of sky behind the word, so it reads against the moon
        if (G.phase === 'word' && hold > .4) { x.save(); x.globalAlpha = (hold - .4) * .42; x.fillStyle = '#ffffff'; x.shadowColor = '#bfe0ff'; x.shadowBlur = 30; x.font = `900 ${fs}px ${FONT}`;
          x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(G.word, W / 2, wy + fs * .04); x.restore(); }
        for (const p of G.word3) { const sz = p.s * (1 + .14 * Math.sin(t * 5 + p.ph)); x.globalAlpha = fade * (.82 + .18 * Math.sin(t * 3 + p.ph * 2)); x.drawImage(dotImg, p.x - sz / 2, p.y - sz / 2, sz, sz); } x.globalAlpha = 1; }
      // a glint of the glass, top left: we are inside the globe
      x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = Math.min(W, H) * .028; x.beginPath(); x.arc(W * .5, H * .62, Math.hypot(W, H) * .56, Math.PI * 1.14, Math.PI * 1.3); x.stroke(); x.restore();
      lens(null);
      // the word at the top: caught letters in gold, the one that is needed next pulsing
      if (G.hud > 0) { const S = slots(); x.save(); x.globalAlpha = G.hud; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
        G.letters.forEach((ch, k) => { const got = k < G.i && !G.fly.some(f => f.k === k), px = S.at(k), next = k === G.i && G.phase === 'play', beat = next && !calm ? 1 + .09 * Math.sin(t * 5.5) : 1, fs = S.fs * beat; x.font = `900 ${fs}px ${FONT}`;
          if (got) { x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .35; x.fillStyle = '#f6d37f'; x.fillText(ch, px, S.y); x.shadowColor = 'transparent'; x.lineWidth = Math.max(1.5, fs * .04); x.strokeStyle = 'rgba(60,36,4,.55)'; x.strokeText(ch, px, S.y); x.fillText(ch, px, S.y); }
          else if (next) { x.fillStyle = 'rgba(8,16,40,.45)'; x.fillText(ch, px, S.y); x.shadowColor = 'rgba(255,214,120,.95)'; x.shadowBlur = fs * .3; x.lineWidth = Math.max(2.5, fs * .07); x.strokeStyle = '#ffe08a'; x.strokeText(ch, px, S.y); x.shadowColor = 'transparent';
            x.fillStyle = '#ffe08a'; x.beginPath(); x.moveTo(px - fs * .16, S.y + fs * .66); x.lineTo(px + fs * .16, S.y + fs * .66); x.lineTo(px, S.y + fs * .5); x.closePath(); x.fill(); }   // (a small pointer under it)
          else { x.fillStyle = 'rgba(8,16,40,.35)'; x.fillText(ch, px, S.y); x.lineWidth = Math.max(2, fs * .055); x.strokeStyle = 'rgba(255,255,255,.8)'; x.strokeText(ch, px, S.y); } });
        for (const f of G.fly) { const q = easeOut(f.t), px = lerp(f.x, S.at(f.k), q), py = lerp(f.y, S.y, q) - Math.sin(Math.PI * q) * 40, fs = lerp(f.r * 1.02, S.fs, q); x.font = `900 ${fs}px ${FONT}`; x.shadowColor = 'rgba(255,214,120,.9)'; x.shadowBlur = fs * .4; x.fillStyle = '#ffe9a8'; x.fillText(f.ch, px, py); x.shadowColor = 'transparent'; }
        // a few words under it, when there is something to say
        const N = G.note, ha = N && G.phase === 'play' ? smooth(0, .3, t - N.t0) * (1 - smooth(N.dur - .5, N.dur, t - N.t0)) : 0;
        if (ha > 0) { let fs = clamp(PW * .052, 17, 26); x.globalAlpha = ha * G.hud; x.font = `800 ${fs}px ${FONT}`; let w = x.measureText(N.txt).width; if (w > PW * .86) { fs *= PW * .86 / w; x.font = `800 ${fs}px ${FONT}`; w = PW * .86; } w += fs * 1.6; const by = S.y + S.fs * 1.08;
          x.fillStyle = 'rgba(8,14,32,.66)'; x.beginPath(); x.roundRect ? x.roundRect(W / 2 - w / 2, by - fs * .9, w, fs * 1.8, fs * .9) : x.rect(W / 2 - w / 2, by - fs * .9, w, fs * 1.8); x.fill(); x.fillStyle = '#ffffff'; x.fillText(N.txt, W / 2, by + fs * .04); }
        x.restore(); }
    } else if (globeSide && G.cam && G.view) {   // over the globe as the view goes into it: the figure once more, sharp
      const gl = globe.glass, a = smooth(1.3, 2.2, G.cam.Z);
      if (a > 0) { lens(G.cam); x.save(); x.beginPath(); x.rect(gl.x - gl.r, gl.y - gl.r, 2 * gl.r, (1 + figure.feetV - .16) * gl.r); x.clip(); x.globalAlpha = a; drawFigure(gl.x, gl.y, gl.r); x.restore(); lens(null); }
    }
    if (G.logo) { drawPlate(); return; }
    // the white of rushing snow, between the globe and the game
    if (G.veil > 0) { const v = G.veil; x.fillStyle = `rgba(244,248,255,${smooth(.25, 1, v)})`; x.fillRect(0, 0, W, H);
      if (!calm) { const m = Math.hypot(W, H) * .6; for (let k = 0; k < 54; k++) { const a = k * 2.399, rr = ((k * 37 % 54) / 54 * .7 + .3) * m * Math.pow(v, 1.6), sz = (6 + (k % 7) * 5) * (1 + v * 3); x.globalAlpha = clamp(v * 1.4, 0, 1) * .9; x.drawImage(dotImg, W / 2 + Math.cos(a) * rr - sz / 2, H * .5 + Math.sin(a) * rr - sz / 2, sz, sz); } x.globalAlpha = 1; } }
  }

  /* ── zooming the globe itself (the stage holds its two canvases) ── */
  function zoomTo(z) {   // z = 1: as it is; bigger: toward the glass, which ends up filling the screen
    const gl = globe.glass; if (z <= 1.001) { stage.style.transform = ''; stage.style.willChange = ''; return; }
    stage.style.willChange = 'transform'; stage.style.transformOrigin = `${gl.x}px ${gl.y}px`;
    const k = (z - 1) / Math.max(.001, G.zoom - 1); stage.style.transform = `translate(${(W / 2 - gl.x) * k}px, ${(H / 2 - gl.y) * k}px) scale(${z})`;
  }

  /* ── through the logo: when the figure has a logo on it (figure.focus, figure.badge), the way into the game is a zoom into
     that logo until it fills the screen, then a zoom back out of the same logo into the game; and the same on the way back ── */
  const TZ = 1.15, TH = .35;   // seconds: each zoom, and the moment the logo is held between them
  const tint = (hex, f) => { const v = parseInt(String(hex || '#243f88').replace('#', '').slice(0, 6), 16) || 0; return `rgb(${[16, 8, 0].map(sh => Math.round(Math.min(255, ((v >> sh) & 255) * f))).join(',')})`; };
  const plateGeo = () => ({ x: W / 2, y: H * .5, hw: Math.min(W * .8, H * .42 * figure.badge.aspect) / 2 });   // the logo on its card: level, in the middle
  // where the logo is on the page when nothing is zoomed: its middle, half its width and height, and its tilt
  function logoAt(ox, oy, u) { const F = figure.focus; if (!F || !(F.front > .45)) return G.geo;
    return (G.geo = { x: ox + F.x * u, y: oy + F.y * u, hw: Math.max(2, Math.hypot(F.ux, F.uy) * u), ang: Math.atan2(F.uy, F.ux), ux: F.ux * u, uy: F.uy * u, vx: F.vx * u, vy: F.vy * u }); }
  // the view for an amount of zoom e (0 = as it is … 1 = the logo level, in the middle, as big as on its card)
  function camFor(g, e) {
    if (!g || !(e > 0)) return null; const P = plateGeo(), Z1 = Math.max(1, P.hw / g.hw), Z = Math.pow(Z1, e), m = Z1 > 1.001 ? (Z - 1) / (Z1 - 1) : e, rot = -g.ang * e;
    const cx = g.x + (P.x - g.x) * m, cy = g.y + (P.y - g.y) * m, co = Math.cos(rot) * Z, si = Math.sin(rot) * Z;
    return { Z, rot, a: co, b: si, c: -si, d: co, tx: cx - (co * g.x - si * g.y), ty: cy - (si * g.x + co * g.y),
      lx: cx, ly: cy, ux: co * g.ux - si * g.uy, uy: si * g.ux + co * g.uy, vx: co * g.vx - si * g.vy, vy: si * g.vx + co * g.vy };   // (the logo on the screen: its middle, half its width and half its height, as arrows)
  }
  const unCam = (c, sx, sy) => { const dx = sx - c.tx, dy = sy - c.ty, k = c.Z * c.Z; return [(c.d * dx - c.c * dy) / k, (-c.b * dx + c.a * dy) / k]; };   // a point on the screen, back in the unzoomed picture
  function setStage(c) { if (!c) { stage.style.transform = ''; stage.style.willChange = ''; return; }
    stage.style.willChange = 'transform'; stage.style.transformOrigin = '0 0'; stage.style.transform = `matrix(${c.a.toFixed(5)},${c.b.toFixed(5)},${c.c.toFixed(5)},${c.d.toFixed(5)},${c.tx.toFixed(2)},${c.ty.toFixed(2)})`; }
  // The logo, sharp, drawn over the one on the figure (which is then switched off, so there is only ever one), and its colour
  // spreading out behind it until that is all there is. Small, it takes the shape the logo has on the hat (tilted, seen a little
  // from below); as it grows it straightens, and on its card it is exactly itself: level and in its true proportions.
  function drawPlate() {
    const e = G.e, B = figure.badge; if (!(e > 0) || !B) return; const c = G.cam, flat = calm || !c, P = plateGeo();
    const mx = flat ? P.x : c.lx, my = flat ? P.y : c.ly, aF = flat ? e : smooth(.5, .96, e), aL = flat ? e : smooth(.08, .22, e);
    if (aF > 0) { x.globalAlpha = aF; const r = x.createRadialGradient(mx, my, 0, mx, my, Math.hypot(W, H) * .62); r.addColorStop(0, tint(B.color, 1.22)); r.addColorStop(1, tint(B.color, .72)); x.fillStyle = r; x.fillRect(0, 0, W, H); }
    if (aL > 0 && B.image) { let ux = P.hw, uy = 0, vx = 0, vy = P.hw / B.aspect;
      if (!flat) { const w = Math.hypot(c.ux, c.uy), a = Math.atan2(c.uy, c.ux), k = smooth(.15, .8, e); ux = c.ux; uy = c.uy; vx = lerp(c.vx, -Math.sin(a) * w / B.aspect, k); vy = lerp(c.vy, Math.cos(a) * w / B.aspect, k); }
      x.globalAlpha = aL; x.save(); x.transform(ux, uy, vx, vy, mx, my); x.drawImage(B.image, -1, -1, 2, 2); x.restore(); }
    x.globalAlpha = 1;
  }
  function logoFrame(dt) {
    const gl = globe.glass, T = calm ? .45 : TZ, hold = calm ? .5 : TH, chime = () => { globe.bell(1568, 0, .05); globe.bell(2093, .09, .04); };
    figure.sharp = G.phase === 'play' || G.phase === 'word' ? 0 : 1280;
    if (G.phase === 'in') {             // over the globe: the figure turns to face us, and the view goes into the logo on its hat
      G.pt += dt; G.t += dt; const p = clamp(G.pt / T, 0, 1);
      G.e = smooth(.06, 1, p); figure.pose = Object.assign(FRONT(), { yaw: G.yaw0 * (1 - smooth(0, .28, p)) }); G.cam = calm ? null : camFor(logoAt(gl.x, gl.y, gl.r), G.e); setStage(G.cam); renderFigure(0, gl.x, gl.y, gl.r, false);
      if (p >= 1) { G.phase = 'card'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; setStage(null); globe.rest(true); figure.grow(1, true); G.hud = 0; chime(); }
    } else if (G.phase === 'card') {    // the logo fills the screen for a moment; behind it the game takes the globe's place
      step(dt); renderFigure(dt, G.sx, midY(), unit(), true);
      if (G.pt >= hold) { G.phase = 'open'; G.pt = 0; }
    } else if (G.phase === 'open') {    // out of the logo, into the game
      step(dt); const p = clamp(G.pt / T, 0, 1);
      G.e = 1 - smooth(0, .94, p); G.cam = calm ? null : camFor(logoAt(G.sx, midY(), unit()), G.e); G.hud = smooth(.7, 1, p); renderFigure(dt, G.sx, midY(), unit(), true);
      if (p >= 1) { G.phase = 'play'; G.pt = 0; G.t = 0; G.e = 0; G.cam = null; G.geo = null; G.hud = 1; note('Catch the letters in order', 3.6);
        say('Catch the letters in order to spell a word. Slide the snowman left and right. Keep out of the sunshine.'); }
    } else if (G.phase === 'out') {     // the word is spelled: into the logo again
      step(dt); const p = clamp(G.pt / T, 0, 1);
      G.e = smooth(.06, 1, p); G.cam = calm ? null : camFor(logoAt(G.sx, midY(), unit()), G.e); renderFigure(dt, G.sx, midY(), unit(), true);
      if (p >= 1) { G.phase = 'card2'; G.pt = 0; G.e = 1; G.cam = null; G.geo = null; G.back = { t: 0 }; figure.pose = FRONT(); globe.rest(false); chime(); try { G.done && G.done(); } catch (e) {} }
    } else if (G.phase === 'card2') {   // behind the logo the globe is back, its snow flying
      G.pt += dt; G.back.t += dt; figure.pose = FRONT(); if (G.pt >= hold + .1) { G.phase = 'back'; G.pt = 0; }
    } else if (G.phase === 'back') {    // out of the logo, back to the globe
      G.pt += dt; G.back.t += dt; const p = clamp(G.pt / T, 0, 1);
      G.e = 1 - smooth(0, .94, p); figure.pose = FRONT(); G.cam = calm ? null : camFor(logoAt(gl.x, gl.y, gl.r), G.e); setStage(G.cam); renderFigure(0, gl.x, gl.y, gl.r, false);
      if (p >= 1) { setStage(null); figure.pose = null; figure.sharp = 0; const fin = G.fin; G = null; cv.style.display = 'none'; removeEventListener('resize', size); fin(); }
    } else {                            // the game itself
      step(dt); if (G.phase === 'out') { G.pt = 0; [659.25, 880, 1174.66].forEach((f, k) => globe.bell(f, k * .1, .045)); }
      renderFigure(dt, G.sx, midY(), unit(), true);
    }
  }

  function frame(now) {
    if (!G) return; const dt = clamp((now - last) / 1000, 0, .05); last = now;
    if (G.logo) { logoFrame(dt); if (!G) return; }
    else if (G.phase === 'in') {        // zoom in; the snow rushes up white; then the game is there
      G.pt += dt; const p = G.pt / (calm ? .6 : 1.25);
      if (!calm) zoomTo(lerp(1, G.zoom, easeIn(p))); G.veil = smooth(.5, 1, p); G.t += dt;
      if (p >= 1) { zoomTo(1); globe.rest(true); G.phase = 'play'; G.pt = 0; G.t = 0; G.veilOut = .5; figure.grow(1, true); note('Catch the letters in order', 3.6);
        say('Catch the letters in order to spell a word. Slide the snowman left and right. Keep out of the sunshine.'); }
    } else {
      if (G.veilOut > 0) { G.veilOut -= dt; G.veil = clamp(G.veilOut / .5, 0, 1); }
      step(dt); if (!G.back) renderFigure(dt, G.sx, midY(), unit(), true);
      if (G.phase === 'out') {          // the word bursts into white; behind it the globe comes back, close up, and pulls away
        if (!G.back) { G.veil = smooth(0, .45, G.pt); if (G.pt >= .5) { G.back = { t: 0 }; figure.pose = null; globe.rest(false); try { G.done && G.done(); } catch (e) {} if (!calm) zoomTo(1.9 > G.zoom ? G.zoom : 1.9); } }
        else { G.back.t += dt; const q = G.back.t / (calm ? .5 : 1.3); G.veil = 1 - smooth(0, .42, q); if (!calm) zoomTo(lerp(Math.min(1.9, G.zoom), 1, easeOut(q)));
          if (q >= 1) { zoomTo(1); const fin = G.fin; G = null; cv.style.display = 'none'; removeEventListener('resize', size); fin(); return; } }
      }
    }
    draw(); raf = requestAnimationFrame(frame);
  }

  /* ── input ── */
  const toX = e => { if (G && G.phase === 'play') { G.tx = e.clientX; G.touchT = G.t; } };
  cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (er) {} toX(e); });
  cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) return; toX(e); });
  const key = on => e => { if (!G) return; if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { G.keys.l = on; e.preventDefault(); } if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { G.keys.r = on; e.preventDefault(); } };
  addEventListener('keydown', key(1)); addEventListener('keyup', key(0));
  addEventListener('deviceorientation', e => { if (!G || e.gamma == null) return; const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const tip = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : ang === 180 ? -e.gamma : e.gamma; G.tilt = clamp(Math.sin(tip * Math.PI / 180) * 1.6, -1, 1); if (G.tilt0 == null) G.tilt0 = G.tilt; });

  return {
    get playing() { return !!G; },
    // play one round. back() is called at the moment the globe is on screen again (still hidden: in white, or behind the logo).
    play(word, back) {
      if (G) return Promise.resolve(false);
      return new Promise(fin => {
        size(); addEventListener('resize', size);
        G = newRound(String(word || 'JOY').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'JOY'); G.done = back; G.fin = () => fin(true);
        const gl = globe.glass; G.zoom = Math.max(1.6, 1.06 * Math.hypot(W, H) / 2 / Math.max(20, gl.r));
        G.logo = !!(figure.focus && figure.badge && figure.badge.image);   // a figure with a logo: the way in and out is through the logo
        if (G.logo) { G.yaw0 = figure.facing || 0; [523.25, 659.25, 783.99].forEach((f, k) => globe.bell(f, k * .1, .045)); }
        cv.style.display = 'block'; last = performance.now(); raf = requestAnimationFrame(frame);
      });
    },
    // (for testing)
    get state() { return G && { phase: G.phase, word: G.word, i: G.i, caught: G.caught, level: G.level, bonus: G.bonus, misses: G.misses, nopes: G.nopes, melts: G.melts, sx: G.sx, grab: grab(), W, H, PX, PW, t: G.t, pt: G.pt, back: G.back ? G.back.t : null, logo: G.logo, e: G.e, Z: G.cam ? G.cam.Z : 1, cam: G.cam, view: G.view, figAt: [G.sx, midY(), unit()],
      letter: G.letter && { ch: G.letter.ch, x: G.letter.x, y: G.letter.y, r: G.letter.r }, big: G.big.map(f => ({ kind: f.kind, ch: f.ch, x: f.x, y: f.y, r: f.r, vy: f.vy })), sun: G.sun && { x: G.sun.x, w: G.sun.w, t: G.sun.t, done: G.sun.done, warn: WARN, burn: BURN } }; }
  };
}
