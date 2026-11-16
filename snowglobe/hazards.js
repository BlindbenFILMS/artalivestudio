/* ─────────────────────────────────────────────────────────────
   ART ALIVE: what lies in the snowman's way in the game (snowgame.js), and how it looks. All of it is drawn on the game's
   own 2D canvas.

   · The CAMPFIRE burns with the fire from 8 GATES ("the one fire", engine/fire.js there, made for the braziers of Luxor),
     drawn flat. The recipe is the same: TONGUES OF FLAME that rise off the coals, narrow to a point, lean in the gusts and
     die out red; SPARKS that fly up out of it; a steady BODY behind the tongues; a soft GLOW round it; a warm POOL OF LIGHT
     on the snow; and the same four colours (white-hot, flame, ember, glow). As there, nothing is kept from one frame to the
     next: where every tongue and spark is, is worked out from the clock alone, with the original's numbers. (Two things are
     this game's own: the pool of light is smaller, and the flames trail a little to the left as he walks.) With "reduce
     motion" on, the fire is its steady body (no tongues, no sparks, no flicker), as the original is from far away.
   · The FALLEN BRANCH is a thick limb lying right across the path: from where he walks, toward us, as far as the buttons,
     where its broken end faces us (pale wood and its rings). Bark, snow lying along the top of it, broken twigs standing up.
   · The HEAP is what is left of a snowball he has lost: a ball that slumps into a heap of snow.
   · A small FLAME on its own: the same fire (its glow, body, tongues and sparks; no coals, no logs, no light on the snow),
     for something of his that has caught fire: his hat, his scarf, the tip of his nose.

   const look = createHazards({ calm });
   look.pool(x, px, py, k, t, f)              the campfire's light on the snow (draw it with the snow, under whatever stands on it)
   look.fire(x, px, py, k, t, f)              the campfire: (px, py) the middle of its bed of coals, k its size (1 = 62 px of flame),
                                              t the clock in seconds, f = { ph: its own phase 0…1, lean: how far it trails to the left 0…1 }
   look.branch(x, px, walk, near, k, f)       the branch: its far end rests where he walks, at (px, walk); near = how far toward us it reaches
                                              (the top of the buttons); f = { ph: 0…1, which makes each one a little different }
   look.heap(x, px, py, r, p)                 a lost snowball of radius r resting on the snow at (px, py): p = 0 a ball … 1 a heap
   look.flame(x, px, py, k, t, f)             a flame rising from (px, py): k its size (1 = 62 px tall, as the campfire's), f = { ph, lean,
                                              a: how strongly it burns 0…1 (it grows and dies out with this), w: how wide (1 = as wide as the
                                              campfire's), glow: how bright the glow round it, cover: how much it hides what is behind it,
                                              sparks: how many }
   ───────────────────────────────────────────────────────────── */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, p) => a + (b - a) * p;
const sm = (a, b, v) => { const p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const mix3 = (a, b, p) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
const HOT = [255, 243, 196], MID = [255, 182, 46], END = [242, 72, 26], GLOW = [255, 138, 42];   // the original's colours: born white-hot, then the flame, then the ember it dies to; and its glow
const FLAME = 62, BED = 22, METRE = FLAME / 1.4;   // at size 1: the flame stands 62 px and its bed of coals is 22 px from the middle to the rim (the original: 1.4 m and 0.5 m)
const STEPS = 12, TONGUES = 12, SPARKS = 4;

export function createHazards({ calm = false } = {}) {
  // a small picture worked out point by point: fn(u, v) → [r, g, b, a], u across (−1 … 1), v up (−1 the bottom … 1 the top)
  const picture = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = fn((i + .5) / w * 2 - 1, 1 - (j + .5) / h * 2), n = (j * w + i) * 4; d[n] = q[0]; d[n + 1] = q[1]; d[n + 2] = q[2]; d[n + 3] = clamp(q[3], 0, 1) * 255; }
    g.putImageData(im, 0, 0); return c; };
  const round = (u, v) => clamp(1 - Math.hypot(u, v), 0, 1);
  const drop = (u, v, taper, from) => clamp(1 - Math.hypot(u * (1 + taper * sm(from, 1, v)), v), 0, 1);   // round at the bottom, drawn out to a point at the top
  let P = null;
  const pics = () => P || (P = {
    tongue: Array.from({ length: STEPS }, (_, i) => { const age = (i + .5) / STEPS, c = age < .25 ? mix3(HOT, MID, age / .25) : mix3(MID, END, sm(.25, .9, age)); return picture(40, 60, (u, v) => [c[0], c[1], c[2], Math.min(1, drop(u, v, 2.2, -.2) * 2.2)]); }),
    spark: [0, .33, .66, 1].map(a => { const c = mix3(HOT, MID, a); return picture(16, 16, (u, v) => [c[0], c[1], c[2], Math.min(1, round(u, v) * 2.6)]); }),
    body: picture(64, 96, (u, v) => { const g = drop(u, v, 1.9, -.3), c = mix3(END, mix3(MID, HOT, sm(.5, .9, g)), sm(.06, .5, g)); return [c[0], c[1], c[2], sm(0, .3, g)]; }),
    glow: picture(96, 96, (u, v) => { const g = round(u, v); return [GLOW[0], GLOW[1], GLOW[2], g * g]; }),
    pool: picture(128, 64, (u, v) => { const g = round(u, v); return [255, 164, 72, g * Math.sqrt(g)]; }) });
  // One piece of the fire, as the original blends it: it covers what is behind it in part (so it reads over pale snow) and adds
  // its light in part (so it glows where tongues overlap, and against the dark wood).
  const put = (x, img, cx, cy, hw, hh, a, cover) => { if (a <= .004 || hw <= 0) return;
    if (cover > 0) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = Math.min(1, a * cover); x.drawImage(img, cx - hw, cy - hh, hw * 2, hh * 2); }
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, a * (1 - cover)); x.drawImage(img, cx - hw, cy - hh, hw * 2, hh * 2); };
  const beat = (t, f) => { const fp = (f && f.ph || 0) * 6.2832, T = calm ? 0 : t;   // the gusts that lean it, and its flicker
    return { fp, T, gust: calm ? 0 : Math.sin(T * 1.7 + fp) * .6 + Math.sin(T * 2.9 + fp * 1.7) * .4, flick: calm ? 1 : .88 + .12 * Math.sin(T * 11 + fp * 3) * Math.sin(T * 7.3 + fp) }; };
  const log = (x, k, a1, b1, a2, b2, w) => { x.lineCap = 'round'; x.beginPath(); x.moveTo(a1 * k, b1 * k); x.lineTo(a2 * k, b2 * k); x.strokeStyle = '#24160b'; x.lineWidth = w * k; x.stroke(); x.strokeStyle = '#6b4526'; x.lineWidth = w * .62 * k; x.stroke();
    x.beginPath(); x.moveTo(a1 * k, (b1 - w * .16) * k); x.lineTo(a2 * k, (b2 - w * .16) * k); x.strokeStyle = '#96683c'; x.lineWidth = w * .16 * k; x.stroke(); };

  function pool(x, px, py, k, t, f) {
    const B = beat(t, f), rx = 124 * k * (1 + .03 * B.gust), ry = 27 * k;
    x.save(); x.globalAlpha = .88 * (.82 + .18 * B.flick); x.drawImage(pics().pool, px - rx, py - ry + 2 * k, rx * 2, ry * 2); x.restore();
  }
  // The flames themselves, as the original builds them, rising from (0, by) in the drawing's own measure: r is half the width of
  // what is burning, h how tall the flame stands; o = { a: how strongly it burns 0…1, glow, cover, sparks }. First the glow, the
  // steady body and the tongues (blaze); then, in front of whatever is drawn after them, the sparks (fly).
  function blaze(x, S, B, by, r, h, trail, seed, o) {
    const fp = B.fp, T = B.T, gust = B.gust, flick = B.flick, wind = -1, cover = o.cover, a = o.a;   // (wind: it leans to the left, the way the air goes past him as he walks)
    put(x, S.glow, 0, by - h * .42, (r * 2.4 + h * 1.5) * (1 + .04 * gust), (r * 2.4 + h * 1.5) * (1 + .04 * gust), o.glow * flick * a, 0);   // the glow
    if (calm) put(x, S.body, 0, by - (h * .42 + r * .1), r * 1.05, h * .5 + r * .25, .95 * a, cover + .14);                     // the body alone: it stands still
    else {
      const br = (1 + .06 * gust + .05 * Math.sin(T * 13 + fp * 2)) * .74;
      put(x, S.body, wind * (gust * .05 + trail * .05) * h, by - (h * .3 + r * .1), r * 1.05 * br, (h * .5 + r * .25) * br, .45 * flick * a, cover);
      for (let i = 0; i < TONGUES; i++) {   // the tongues: each is born on the coals, rises, narrows, leans and dies out red; then the next is born somewhere else
        const ph = (i + hash(seed + i, seed * .37)) / TONGUES, life = lerp(.6, 1, hash(i * 3.1 + seed, seed * .61)) * 1.12, q = T / life + ph + 40, gen = Math.floor(q) % 61, age = q - Math.floor(q);
        const r1 = hash(ph * 97 + 1.3, gen), r2 = hash(gen + 7.7, ph * 53 + .9), r3 = hash(ph * 31 + 4.1, gen * 1.7 + 3.1);
        const rise = 1 - (1 - age) * (1 - age), pinch = 1 - .85 * sm(0, .85, age), lean = (gust * .14 + trail * .16 + Math.sin(T * 6 + fp + age * 5 + r1 * 6.2832) * .06) * h * age;
        const s = r * lerp(.66, .2, age) * (.8 + .4 * r3) * Math.min(1, .45 + age * 6);
        put(x, S.tongue[Math.min(STEPS - 1, Math.floor(age * STEPS))], Math.cos(r1 * 6.2832) * Math.sqrt(r2) * r * .52 * pinch + wind * lean, by - (h * (.42 + .58 * r3) * rise + r * .2), s, s * 1.5,
          Math.min(1, age * 9) * (1 - sm(.5, 1, age)) * flick * a, cover); }
    }
  }
  function fly(x, S, B, by, r, h, m, trail, seed, o) {
    const T = B.T, gust = B.gust, wind = -1, N = o.sparks;
    if (!calm) for (let i = 0; i < N; i++) {   // the sparks: they fly up out of it, drift with the gust and go out
      const ph = (i + hash(seed * .71 + i, seed)) / N, life = lerp(.9, 1.7, hash(i * 5.3 + seed * .71, seed)), q = T / life + ph + 40, gen = Math.floor(q) % 61, age = q - Math.floor(q);
      const r1 = hash(ph * 71 + 2.3, gen), r2 = hash(gen + 3.3, ph * 43 + 1.9), r3 = hash(ph * 29 + 6.1, gen * 1.3 + 5.1);
      const sp = r * (.25 + 1.5 * age) * (.35 + r3), s = (.042 + .04 * r3) * (1 - .45 * age) * 1.18 * m;
      put(x, S.spark[Math.min(3, Math.floor(age * 4))], Math.cos(r1 * 6.2832) * sp + wind * (gust * .45 + trail * .5) * h * age * age + Math.sin(T * 5 + r1 * 40) * .05 * m * (.5 + age), by - h * (.45 + (1.2 + 1.5 * r2) * age), s, s,
        Math.min(1, age * 12) * (1 - sm(.55, 1, age)) * (.65 + .35 * Math.sin(T * 23 + r1 * 50)) * o.a, .3); }
  }
  function fire(x, px, py, k, t, f) {
    const S = pics(), B = beat(t, f), flick = B.flick, r = BED * k, h = FLAME * k, m = METRE * k, seed = (f && f.ph || 0) * 97 + 3;
    const trail = calm ? 0 : clamp((f && f.lean) || 0, 0, 1);                // it leans to the left, the way the air goes past him as he walks
    const o = { a: 1, glow: .33, cover: .56, sparks: SPARKS };             // (cover: the original has .72 by day … .5 at night)
    const kl = k * BED / 17;                                                // (the logs are sized to the bed of coals)
    x.save(); x.translate(px, py);
    x.fillStyle = 'rgba(40,56,112,.36)'; x.beginPath(); x.ellipse(0, 3 * kl, 31 * kl, 6 * kl, 0, 0, 6.283); x.fill();        // the snow has melted round it
    log(x, kl, -20, 2, 15, -8, 10); log(x, kl, 20, 2, -15, -8, 10);                                                              // two logs, crossed
    for (const [col, rx, ry, dy] of [['#d8431a', .96, .27, -2], ['#ff8a1e', .62, .19, -3.6], ['#ffd04a', .3, .1, -5]]) { x.fillStyle = col; x.beginPath(); x.ellipse(0, dy * kl, r * rx * (.96 + .04 * flick), r * ry, 0, 0, 6.283); x.fill(); }   // the bed of coals
    const by = -5 * kl;   // the flames rise from the middle of the bed
    blaze(x, S, B, by, r, h, trail, seed, o);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; log(x, kl, -14, 4.5, 13, 5.5, 8.5);                          // a third log in front of it
    fly(x, S, B, by, r, h, m, trail, seed, o);
    x.restore();
  }
  // A small flame on its own, for something that has caught fire: the same fire, with nothing under it. It rises from (px, py).
  // As it catches and as it dies out (f.a: 0 … 1) it is smaller and fainter. With "reduce motion" on it is its steady body.
  function flame(x, px, py, k, t, f) {
    f = f || {}; const a = clamp(f.a == null ? 1 : f.a, 0, 1); if (a <= .01 || !(k > 0)) return;
    const S = pics(), B = beat(t, f), g = k * (calm ? 1 : lerp(.5, 1, a)), r = BED * g * (f.w == null ? .5 : f.w), h = FLAME * g, m = METRE * g, seed = (f.ph || 0) * 97 + 3;
    const trail = calm ? 0 : clamp(f.lean || 0, 0, 1), o = { a, glow: f.glow == null ? .2 : f.glow, cover: f.cover == null ? .68 : f.cover, sparks: f.sparks || 0 };
    x.save(); x.translate(px, py); blaze(x, S, B, 0, r, h, trail, seed, o); if (o.sparks) fly(x, S, B, 0, r, h, m, trail, seed, o); x.restore();
  }

  // The branch: a thick fallen limb lying right across the path. Its far end rests where he walks (px, walk); it runs toward
  // us to just above the buttons (near), where its broken end faces us, rings and all. Snow lies along the top of it.
  function branch(x, px, walk, near, k, f) {
    const ph = (f && f.ph) || 0, rA = 11.5 * k, rB = 16 * k, A = [px - 1.5 * k, walk + 1.5 * k - rA], B = [A[0] + (17 + 8 * hash(ph * 5.3, 1.1)) * k, Math.max(A[1] + 16 * k, near - 5 * k - rB)];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), d = [dx / len, dy / len], n = [d[1], -d[0]], phi = Math.atan2(dy, dx), beta = Math.acos(clamp((rA - rB) / len, -1, 1));   // n: across it, toward the upper right
    const at = (t, u) => { const r = lerp(rA, rB, t); return [A[0] + dx * t + n[0] * r * u, A[1] + dy * t + n[1] * r * u]; };   // a point on it: t along (0 far … 1 near), u across (−1 … 1)
    const hull = (ox = 0, oy = 0, g = 1) => { x.beginPath(); x.arc(A[0] + ox, A[1] + oy, rA * g, phi + beta, phi + 6.2832 - beta); x.arc(B[0] + ox, B[1] + oy, rB * g, phi - beta, phi + beta); x.closePath(); };
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    x.fillStyle = 'rgba(46,68,128,.3)'; hull(5 * k, 3.5 * k, 1.04); x.fill();                                       // its shadow on the snow
    // broken twigs standing up out of it: [where along it, how far to the side (left is minus), how far up, forked?]
    const twigs = [[.14, -22, 23, 1], [.48, 20, 29, 1], [.8, -15, 17, 0]];
    const twig = pass => { for (const [t, out, up, fork] of twigs) { const a = at(t, .15), b = [a[0] + out * k, a[1] - up * k], c = [a[0] + out * .25 * k, a[1] - up * .62 * k], m = [lerp(a[0], b[0], .5) + out * .02 * k, lerp(a[1], b[1], .58)], e = [m[0] - Math.sign(out) * 7 * k, m[1] - 10 * k];
        if (pass < 2) { x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(c[0], c[1], b[0], b[1]); if (fork) { x.moveTo(m[0], m[1]); x.lineTo(e[0], e[1]); } x.strokeStyle = pass ? '#7a5230' : '#24160b'; x.lineWidth = (pass ? 3.3 : 6.4) * k; x.stroke(); }
        else { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(b[0], b[1] - 1.5 * k, 2.9 * k, 0, 6.283); x.fill(); if (fork) { x.beginPath(); x.arc(e[0], e[1] - 1.2 * k, 2.4 * k, 0, 6.283); x.fill(); } } } };
    twig(0);
    hull(); x.strokeStyle = '#24160b'; x.lineWidth = 3 * k; x.stroke();                                              // the limb…
    { const p = at(.5, -1), q = at(.5, 1), g = x.createLinearGradient(p[0], p[1], q[0], q[1]); g.addColorStop(0, '#8a5d33'); g.addColorStop(.5, '#6b4526'); g.addColorStop(1, '#3b2613'); x.fillStyle = g; x.fill(); }   // …its bark
    x.save(); hull(); x.clip();
    x.strokeStyle = 'rgba(30,18,8,.7)'; x.lineWidth = 1.3 * k;                                                        // scored along its length
    for (const [u, t0, t1] of [[-.62, .02, .46], [-.62, .56, .92], [-.32, .1, .72], [-.86, .3, .66]]) { const a = at(t0, u), b = at(t1, u); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
    const snow = (u0, col) => { x.fillStyle = col; x.beginPath(); const N = 22; for (let i = 0; i <= N; i++) { const t = -.2 + 1.3 * i / N, p = at(t, u0 + .1 * Math.sin(i * .95 + ph * 20) + .05 * Math.sin(i * 2.3)); x[i ? 'lineTo' : 'moveTo'](p[0], p[1]); } for (let i = N; i >= 0; i--) { const p = at(-.2 + 1.3 * i / N, 1.6); x.lineTo(p[0], p[1]); } x.closePath(); x.fill(); };
    snow(-.1, '#aebfec'); snow(.06, '#ffffff');                                                                       // snow lying along the top of it (and its blue underside)
    x.restore();
    twig(1);
    { const r = rB * .93, c = B; x.fillStyle = '#d9ab76'; x.strokeStyle = '#24160b'; x.lineWidth = 2.8 * k; x.beginPath(); x.ellipse(c[0], c[1], r * .94, r, 0, 0, 6.283); x.fill(); x.stroke();   // its broken end, facing us: pale wood and its rings
      x.strokeStyle = '#a8763f'; x.lineWidth = 1.5 * k; for (const q of [.66, .36]) { x.beginPath(); x.ellipse(c[0] + r * .04, c[1] + r * .03, r * .94 * q, r * q, 0, 0, 6.283); x.stroke(); }
      x.fillStyle = '#a8763f'; x.beginPath(); x.arc(c[0] + r * .05, c[1] + r * .04, 1.5 * k, 0, 6.283); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(c[0] + r * .1, c[1] - r * .93, r * .86, r * .34, -.08, 0, 6.283); x.fill(); }                                                                 // …with snow on top of it
    twig(2);
    x.restore();
  }

  // a snowball he has lost: it comes to rest on the snow, slumps and spreads into a heap, and lumps of it roll off
  function heap(x, px, py, r, p) {
    p = clamp(p, 0, 1); const rx = r * lerp(1, 1.5, p), ry = r * lerp(1, .56, p), cy = py - ry * lerp(.92, .12, p);   // (a ball rests on the snow; a heap is the top of a wider, flatter one)
    x.save();
    x.fillStyle = `rgba(46,68,128,${.26 * (1 - p * .35)})`; x.beginPath(); x.ellipse(px + r * .12, py, rx * 1.06, Math.max(2, r * .15), 0, 0, 6.283); x.fill();
    const ball = (bx, by, br, soft) => { const g = x.createRadialGradient(bx - br * .3, by - br * .45, br * .08, bx, by, br * 1.02); g.addColorStop(0, '#ffffff'); g.addColorStop(.42, '#eceeff'); g.addColorStop(.78, soft ? '#cdd6f3' : '#aab4de'); g.addColorStop(1, soft ? '#b3c0ea' : '#7389cc'); return g; };
    x.save(); x.beginPath(); x.rect(px - rx * 2, py - r * 3, rx * 4, r * 3 + 2); x.clip();                           // (what has sunk into the snow is not seen)
    x.translate(px, cy); x.scale(rx / r, ry / r);
    x.fillStyle = ball(0, 0, r, true); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
    if (p < 1) { x.globalAlpha = 1 - p; x.fillStyle = ball(0, 0, r, false); x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); }
    x.restore();
    const a = sm(.25, .8, p); if (a > 0) for (const [dx, q] of [[-1.22, .2], [1.14, .25], [.74, .14]]) { const br = r * q * a, bx = px + rx * dx * lerp(.7, 1, a), by = py - br * .8; x.fillStyle = ball(bx, by, br, false); x.beginPath(); x.arc(bx, by, br, 0, 6.283); x.fill(); }
    x.restore();
  }
  return { pool, fire, flame, branch, heap };
}
