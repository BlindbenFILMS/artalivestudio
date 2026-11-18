/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the Ora snowmobile, for the snowman game in the snow globe (snowgame.js): the big gift he unwraps when the phrase
   is spelled, and rides.

   It keeps the layout of the 8 GATES snowmobile (the SNOW RIDES pack: a track under a tunnel, a seat, a hood with a windshield
   and a handlebar, two skis in front) and is drawn again, in code, in the Ora snowman's own style: smooth, rounded shapes, his
   colours (the blue of his hat, the coral of his scarf, coal), the same kind of soft paint, and no outlines. It has a round
   headlight on the nose, a tail light, and the white Ora mark on each side of the hood (the mark itself is untouched: white,
   level, flat, in its own proportions). Nothing in the pack is used or changed: this is a separate drawing for this game.

   buildRide(THREE)   →   the snowman on the snowmobile, as a figure for createModel() in globe3d.js:
       { object, update, light, focus, badge, marks, state }
     state.rider   false: the snowmobile alone (as it is unwrapped); true: he is on it
     state.lamp    how bright the headlight is, 0 … 1
     marks         where things are in each picture drawn (globe3d.js reports them): his hat, nose and scarf, as on the walking
                   snowman; and of the snowmobile: lamp (the glass of the headlight), beam (a point straight ahead of it, the way
                   it shines), rear (where the track throws snow up), nose (the tips of the skis), and the ends of the track and
                   of each ski on the snow (for their shadows)
     The beam of the headlight is not part of the model: the game draws it flat, from where the lamp is to where it points.

   buildSnowmobile(THREE, { badge, detail })   the snowmobile alone. It faces +z and stands on y = 0; its measures are its own
     (it is drawn 1.5 times that size, like the pack's). badge: { image, aspect } = the Ora mark as a flat picture. detail: how
     finely its round parts are drawn (1 = for a close picture; the game uses less).
       sled.seat    [x, y, z] the top of the seat cushion where the rider sits
       sled.grips   [[x, y, z], [x, y, z]] the two grips of the handlebar: the rider's right hand (−x), then the left
       sled.lamp    the headlight (an Object3D at the middle of its glass, looking along its own +z); sled.glow: the soft glow
                    round its glass; sled.glass: the paint of the glass itself
   seatRider(THREE, sled, F)   seats the snowman on it (see below).

   How it was arrived at, and the pictures Ben approved, are in the README ("The snowmobile").
   ───────────────────────────────────────────────────────────── */
import { toCreasedNormals } from '../vendor/three/addons/BufferGeometryUtils.js';
import { build } from './ora-snowman.js';

export function buildSnowmobile(THREE, o = {}) {
  const S = 1.5, PI = Math.PI, TAU = PI * 2, Q = Math.max(.35, Math.min(1.5, o.detail == null ? 1 : o.detail)), n_ = (v, least = 3) => Math.max(least, Math.round(v * Q));   // (n_: a count of segments, at this detail)
  const COL = Object.assign({ body: '#243F88', accent: '#FF5A45', seat: '#2B2F4A', coal: '#262A42', rubber: '#1B1E2C', metal: '#D8DFEE', glass: '#CFEAFF', lamp: '#FFF3C8', tail: '#FF4A3A' }, o.colors);
  const paint = (c, rough) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const MAT = { body: paint(COL.body, .4), accent: paint(COL.accent, .55), seat: paint(COL.seat, .92), coal: paint(COL.coal, .62), rubber: paint(COL.rubber, .95), metal: paint(COL.metal, .3) };
  const root = new THREE.Group(); root.name = 'ora-snowmobile'; root.scale.setScalar(S);
  const V2 = (a, b) => new THREE.Vector2(a, b), V3 = (a, b, c) => new THREE.Vector3(a, b, c);
  const crease = g => toCreasedNormals(g, .7);
  const add = (geo, mat, parent, name) => { const m = new THREE.Mesh(geo, mat); if (name) m.name = name; (parent || root).add(m); return m; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ── how the shapes are made
  // a smooth line through points [z, value] that never overshoots them
  function curve(pts) {
    const n = pts.length, x = pts.map(p => p[0]), y = pts.map(p => p[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; } const h0 = x[i] - x[i - 1], h1 = x[i + 1] - x[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    return z => { if (z <= x[0]) return y[0]; if (z >= x[n - 1]) return y[n - 1]; let i = 0; while (z > x[i + 1]) i++; const h = x[i + 1] - x[i], t = (z - x[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1]; };
  }
  // A smooth shell drawn along its length (z). At each place sec(z) gives its outline: { w: half its width, b: its bottom, t: its top,
  // n: how square its upper half is (2 = round, 6 = a box with soft edges), nb: the same for its lower half }. It closes to a round
  // end over the first la and the last lb of its length. bands: heights that divide it into strips, each with its own paint.
  function shell(z0, z1, la, lb, sec0, opt = {}) {
    const sec = z => { const s = sec0(z); let k = 1; if (z < z0 + la) k = Math.sqrt(Math.max(1e-4, 1 - ((z0 + la - z) / la) ** 2)); else if (z > z1 - lb) k = Math.sqrt(Math.max(1e-4, 1 - ((z - z1 + lb) / lb) ** 2));
      if (k >= 1) return s; const yc = (s.b + s.t) / 2 + (opt.tip == null ? 0 : (opt.tip - (s.b + s.t) / 2) * (1 - k) * (z > z1 - lb ? 1 : 0)), hh = (s.t - s.b) / 2; return { w: s.w * k, b: yc - hh * k, t: yc + hh * k, n: s.n, nb: s.nb }; };
    const zs = [], TH = [.16, .36, .58, .8, 1.02, 1.24, 1.42]; for (const th of TH) zs.push(z0 + la * (1 - Math.cos(th)));
    const mid = Math.max(2, Math.round((z1 - lb - z0 - la) / ((opt.step || .035) / Q))); for (let i = 0; i <= mid; i++) zs.push(z0 + la + (z1 - lb - z0 - la) * i / mid);
    for (const th of TH) zs.push(z1 - lb + lb * Math.sin(th));
    const bands = opt.bands || [], counts = (opt.counts || (bands.length ? [6, 1, 17] : [22])).map(c => (c > 1 ? n_(c, 3) : c)), K = counts.reduce((a, b) => a + b, 0) + 1, N = 2 * K - 2, pos = [], groups = counts.map(() => []), stripOf = [];
    counts.forEach((c, j) => { for (let i = 0; i < c; i++) stripOf.push(j); });
    for (const z of zs) { const s = sec(z), yc = (s.b + s.t) / 2, hh = Math.max(1e-4, (s.t - s.b) / 2), nt = s.n, nb = s.nb || s.n;
      const phiOf = y => { const u = clamp((y - yc) / hh, -1, 1); return Math.sign(u) * Math.asin(Math.pow(Math.abs(u), (u < 0 ? nb : nt) / 2)); };
      const cuts = [-PI / 2]; bands.forEach(f => cuts.push(Math.max(cuts[cuts.length - 1], phiOf(f(z))))); cuts.push(PI / 2);
      const half = []; counts.forEach((c, j) => { for (let i = 0; i < c; i++) half.push(cuts[j] + (cuts[j + 1] - cuts[j]) * i / c); }); half.push(PI / 2);
      const pt = (phi, sx) => { const sn = Math.sin(phi), cs = Math.max(0, Math.cos(phi)), e = 2 / (sn < 0 ? nb : nt); pos.push(sx * s.w * Math.pow(cs, e), yc + hh * Math.sign(sn) * Math.pow(Math.abs(sn), e), z); };
      for (let i = 0; i < K; i++) pt(half[i], 1); for (let i = K - 2; i >= 1; i--) pt(half[i], -1); }
    const R = zs.length, strip = i => (i < K - 1 ? stripOf[i] : stripOf[N - 1 - i]);
    for (let r = 0; r < R - 1; r++) for (let i = 0; i < N; i++) { const a = r * N + i, b = r * N + (i + 1) % N, c = (r + 1) * N + (i + 1) % N, d = (r + 1) * N + i; groups[strip(i)].push(a, b, c, a, c, d); }
    const cap = (r, back) => { let cy = 0; for (let i = 0; i < N; i++) cy += pos[(r * N + i) * 3 + 1]; const c = pos.length / 3; pos.push(0, cy / N, zs[r]);
      for (let i = 0; i < N; i++) { const a = r * N + i, b = r * N + (i + 1) % N; groups[strip(i)].push(...(back ? [c, b, a] : [c, a, b])); } };
    cap(0, true); cap(R - 1, false);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); let idx = []; groups.forEach((q, j) => { g.addGroup(idx.length, q.length, j); idx = idx.concat(q); });
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // a shape drawn from the side (across: z, forward; up: y), given a thickness from side to side (x), with rounded edges
  function slab(shape, width, bevel = .03, segs = 5, curveSegs = 24) {
    const sh = Array.isArray(shape) ? new THREE.Shape(shape.map(p => V2(p[0], p[1]))) : shape, depth = Math.max(.001, width - 2 * bevel);
    const g = new THREE.ExtrudeGeometry(sh, { depth, steps: 1, curveSegments: n_(curveSegs, 6), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: n_(segs, 1) });
    g.rotateY(-PI / 2); g.translate(depth / 2, 0, 0); return crease(g); }
  const tube = (pts, r, seg = 40, closed = false, rad = 12) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => (p.isVector3 ? p : V3(p[0], p[1], p[2]))), closed, 'catmullrom', .5), n_(seg, 6), r, n_(rad, 5), closed);
  const rod = (a, b, r, mat, parent, r2) => { const A = V3(...a), B = V3(...b), d = B.clone().sub(A), m = add(new THREE.CylinderGeometry(r2 == null ? r : r2, r, d.length(), n_(18, 8)), mat, parent); m.position.copy(A).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m; };
  let dot = null; const softDot = () => { if (dot) return dot; const c = document.createElement('canvas'); c.width = c.height = 128; const q = c.getContext('2d'), gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.22, 'rgba(255,255,255,.62)'); gr.addColorStop(.55, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); return (dot = new THREE.CanvasTexture(c)); };   // a soft round spot of light
  const ball = (at, r, mat, parent) => { const m = add(new THREE.SphereGeometry(r, n_(20, 10), n_(14, 8)), mat, parent); m.position.set(at[0], at[1], at[2]); return m; };

  // ── the track: a loop of rubber with lugs, wheels showing in its side
  const TY = .03, TZ0 = -1.0, TZ1 = .06, TR = .15, tr = new THREE.Shape(); tr.moveTo(TZ0, TY); tr.lineTo(TZ1, TY); tr.absarc(TZ1, TY + TR, TR, -PI / 2, PI / 2, false); tr.lineTo(TZ0, TY + 2 * TR); tr.absarc(TZ0, TY + TR, TR, PI / 2, PI * 1.5, false);
  add(slab(tr, .46, .024, 4, 20), MAT.rubber, root, 'track');
  for (let i = 0; i < 9; i++) add(slab([[-.028, -.02], [.028, -.02], [.02, .016], [-.02, .016]], .47, .006, 2), MAT.coal, root).position.set(0, TY - .004, TZ0 + i * (TZ1 - TZ0) / 8);   // the lugs along the snow…
  for (const [zc, s] of [[TZ0, -1], [TZ1, 1]]) for (let i = 1; i < 5; i++) { const a = i * PI / 5, m = add(slab([[-.028, -.02], [.028, -.02], [.02, .016], [-.02, .016]], .47, .006, 2), MAT.coal, root);   // …and round each end
    m.position.set(0, TY + TR - Math.cos(a) * (TR + .004), zc + s * Math.sin(a) * (TR + .004)); m.rotation.x = -s * a; }
  for (const sx of [-1, 1]) {
    const inner = new THREE.Shape(); inner.moveTo(TZ0, TY + .045); inner.lineTo(TZ1, TY + .045); inner.absarc(TZ1, TY + TR, TR - .045, -PI / 2, PI / 2, false); inner.lineTo(TZ0, TY + 2 * TR - .045); inner.absarc(TZ0, TY + TR, TR - .045, PI / 2, PI * 1.5, false);
    add(slab(inner, .012, 0), MAT.coal, root).position.x = sx * .232;
    for (const [z, y, r] of [[TZ0, TY + TR, .092], [TZ1, TY + TR, .084], [-.735, TY + .108, .06], [-.47, TY + .108, .06], [-.205, TY + .108, .06]]) {
      const w = add(new THREE.CylinderGeometry(r, r, .034, n_(32, 14)), MAT.metal, root); w.rotation.z = PI / 2; w.position.set(sx * .246, y, z);
      const hub = add(new THREE.CylinderGeometry(r * .44, r * .44, .042, n_(24, 10)), MAT.body, root); hub.rotation.z = PI / 2; hub.position.set(sx * .248, y, z); }
    add(new THREE.BoxGeometry(.018, .028, 1.0), MAT.metal, root).position.set(sx * .244, TY + .108, -.47);   // the rail the small wheels run on
  }

  // ── the body: one smooth shell from the tail to the nose (the tunnel over the track, then the hood), blue above a coral line, coal below it
  const hw = curve([[-1.17, .29], [-.12, .29], [.04, .318], [.22, .384], [.77, .384], [.93, .345], [1.08, .285], [1.27, .225]]);
  const bot = curve([[-1.17, .29], [-.12, .29], [.12, .255], [.38, .235], [.9, .24], [1.08, .262], [1.27, .29]]);
  const top = curve([[-1.17, .48], [-.04, .48], [.08, .505], [.2, .6], [.32, .725], [.43, .78], [.6, .768], [.8, .728], [.95, .668], [1.06, .575], [1.14, .475], [1.21, .41], [1.27, .385]]);
  const sq = curve([[-1.17, 6], [-.12, 6], [.3, 4.8], [.7, 3.7], [1.27, 2.8]]), sqb = curve([[-1.17, 6], [-.12, 6], [.4, 5.5], [1.27, 3.2]]);
  const body = z => ({ w: hw(z), b: bot(z), t: top(z), n: sq(z), nb: sqb(z) }), LINE = .356, LW = .034;
  add(shell(-1.17, 1.27, .07, .15, body, { bands: [() => LINE - LW / 2, () => LINE + LW / 2], tip: .345 }), [MAT.coal, MAT.accent, MAT.body], root, 'body');
  const topAt = (x, z) => { const s = body(z), yc = (s.b + s.t) / 2, hh = (s.t - s.b) / 2; return yc + hh * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(x) / s.w), s.n)), 1 / s.n); };      // how high the body is at a place
  const sideAt = (y, z) => { const s = body(z), yc = (s.b + s.t) / 2, hh = (s.t - s.b) / 2, u = clamp((y - yc) / hh, -1, 1), n = u < 0 ? s.nb : s.n; return s.w * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), n)), 1 / n); };   // how far out its side is at a height

  // running boards for the rider's feet, a snow flap and a grab bar at the back, the tail light
  for (const sx of [-1, 1]) add(slab([[-.9, .282], [.3, .282], [.47, .372], [.47, .4], [.28, .312], [-.9, .312]], .17, .012, 3), MAT.coal, root, 'running-board').position.x = sx * .365;
  const flap = add(slab([[-.012, 0], [.012, 0], [.012, .21], [-.012, .21]], .44, .006, 2), MAT.rubber, root, 'snow-flap'); flap.position.set(0, .11, -1.19); flap.rotation.x = .3;
  add(tube([[-.21, .47, -.94], [-.235, .56, -1.08], [-.16, .6, -1.215], [.16, .6, -1.215], [.235, .56, -1.08], [.21, .47, -.94]], .019, 56), MAT.metal, root, 'grab-bar');
  const tail = add(slab([[-.03, -.028], [.03, -.028], [.03, .028], [-.03, .028]], .26, .014, 3), new THREE.MeshBasicMaterial({ color: COL.tail, toneMapped: false }), root, 'tail-light'); tail.position.set(0, .425, -1.15);
  const tailGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: COL.tail, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .55, toneMapped: false })); tailGlow.scale.set(.5, .26, 1); tailGlow.position.set(0, .425, -1.2); tailGlow.name = 'tail-glow'; tailGlow.renderOrder = 4; root.add(tailGlow);

  // ── the seat: a long cushion with a low rest at the back
  const seatTop = curve([[-1.1, .69], [-.99, .735], [-.84, .705], [-.58, .632], [-.2, .615], [-.03, .628], [.07, .6]]), seatW = curve([[-1.1, .21], [-.9, .225], [-.3, .222], [.07, .19]]);
  add(shell(-1.1, .07, .08, .09, z => ({ w: seatW(z), b: .465, t: seatTop(z), n: 3.2, nb: 9 }), { step: .04, counts: [24] }), [MAT.seat], root, 'seat');

  // ── the Ora mark on each side of the hood: a flat plate standing just clear of the paint, level, in its own proportions
  if (o.badge && o.badge.image) { const tex = new THREE.CanvasTexture(o.badge.image); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const w = o.markWidth || .375, h = w / o.badge.aspect, zc = .575, yc = .552, mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
    let sz = 0, sx_ = 0, szz = 0, szx = 0, n = 0; const pts = []; for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) { const z = zc + (i / 8 - .5) * w, y = yc + (j / 4 - .5) * h, x = sideAt(y, z); pts.push([z - zc, x]); sz += z - zc; sx_ += x; szz += (z - zc) ** 2; szx += (z - zc) * x; n++; }
    const slope = (n * szx - sz * sx_) / (n * szz - sz * sz), base = Math.max(...pts.map(p => p[1] - slope * p[0])) + .004, turn = Math.atan(slope);   // the plate follows the way the side runs there
    for (const sx of [-1, 1]) { const d = add(new THREE.PlaneGeometry(w, h), mat, root, 'ora-mark'); d.position.set(sx * base, yc, zc); d.rotation.y = sx * (PI / 2 + turn); d.renderOrder = 2; } }

  // ── the headlight: a round lamp in a pod on the nose (a blue shell, a bright rim, a warm glass) and its glow
  const lampDir = V3(0, -.2, 1).normalize(), lamp = new THREE.Group(); lamp.name = 'headlight'; lamp.position.set(0, .613, 1.115); lamp.quaternion.setFromUnitVectors(V3(0, 0, 1), lampDir); root.add(lamp);
  const pod = new THREE.LatheGeometry(new THREE.SplineCurve([V2(.002, -.5), V2(.05, -.47), V2(.092, -.37), V2(.118, -.23), V2(.13, -.09), V2(.132, -.02), V2(.127, .012), V2(.114, .026)]).getPoints(n_(40, 16)), n_(48, 20)); pod.rotateX(PI / 2);
  add(pod, MAT.body, lamp, 'lamp-pod');
  add(new THREE.TorusGeometry(.108, .021, n_(16, 8), n_(56, 24)), MAT.metal, lamp, 'lamp-rim').position.z = .022;
  const lensTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'), gr = q.createRadialGradient(128, 118, 6, 128, 128, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, '#fffae6'); gr.addColorStop(.82, COL.lamp); gr.addColorStop(1, '#ffdc96'); q.fillStyle = gr; q.fillRect(0, 0, 256, 256);
    q.strokeStyle = 'rgba(255,205,120,.5)'; q.lineWidth = 3; for (let i = 1; i < 7; i++) { q.beginPath(); q.moveTo(0, i * 36.6); q.lineTo(256, i * 36.6); q.stroke(); }   // (the fine ribs of a lamp glass)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glass = new THREE.MeshBasicMaterial({ map: lensTex, toneMapped: false }); add(new THREE.CircleGeometry(.104, n_(56, 24)), glass, lamp, 'lamp-glass').position.z = .03;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: '#fff0c0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .85, toneMapped: false })); glow.scale.setScalar(.7); glow.position.z = .09; glow.name = 'lamp-glow'; glow.renderOrder = 4; lamp.add(glow);

  // ── the windshield: a curved glass that sweeps up and back from the hood to just in front of the handlebar, with a bright edge
  const WB = { w: .275, z: .775, sweep: .2 }, WT = { w: .19, z: .465, sweep: .09, y: 1.1, drop: .09 };
  const wsAt = (u, v) => { const bx = u * WB.w, bz = WB.z - WB.sweep * u * u, by = topAt(bx, bz) - .012, tx = u * WT.w, tz = WT.z - WT.sweep * u * u, ty = WT.y - WT.drop * Math.pow(Math.abs(u), 2.6), k = Math.sin(PI * v);
    return V3(bx + (tx - bx) * v, by + (ty - by) * v + .016 * k, bz + (tz - bz) * v + .034 * k); };
  { const U = n_(28, 12), Vn = n_(14, 6), pos = [], uv = [], idx = []; for (let j = 0; j <= Vn; j++) for (let i = 0; i <= U; i++) { const u = i / U * 2 - 1, v = j / Vn, p = wsAt(u, v); pos.push(p.x, p.y, p.z); uv.push(i / U, v); }
    for (let j = 0; j < Vn; j++) for (let i = 0; i < U; i++) { const a = j * (U + 1) + i, b = a + 1, c = a + U + 2, d = a + U + 1; idx.push(a, b, c, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const q = c.getContext('2d'), gr = q.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(196,228,255,.2)'); gr.addColorStop(.7, 'rgba(206,234,255,.3)'); gr.addColorStop(1, 'rgba(232,246,255,.5)'); q.fillStyle = gr; q.fillRect(0, 0, 256, 128);
    const st = q.createLinearGradient(40, 128, 120, 0); st.addColorStop(0, 'rgba(255,255,255,0)'); st.addColorStop(.45, 'rgba(255,255,255,.34)'); st.addColorStop(.55, 'rgba(255,255,255,.34)'); st.addColorStop(1, 'rgba(255,255,255,0)');   // (a soft streak of light across the glass)
    q.fillStyle = st; q.beginPath(); q.moveTo(36, 128); q.lineTo(86, 128); q.lineTo(150, 0); q.lineTo(100, 0); q.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    add(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), root, 'windshield').renderOrder = 3;
    const rimPts = []; for (let k = 0; k <= 8; k++) rimPts.push(wsAt(-1, k / 8)); for (let k = 1; k <= 20; k++) rimPts.push(wsAt(-1 + k / 10, 1)); for (let k = 1; k <= 8; k++) rimPts.push(wsAt(1, 1 - k / 8));
    add(tube(rimPts, .0085, 110, false, 8), new THREE.MeshBasicMaterial({ color: '#EEF8FF', toneMapped: false }), root, 'windshield-edge');
    const foot = []; for (let k = 0; k <= 20; k++) { const p = wsAt(-1 + k / 10, 0); p.y += .006; foot.push(p); } add(tube(foot, .014, 60, false, 8), MAT.coal, root, 'windshield-foot'); }

  // ── the handlebar: a post from the dash, a bar with rubber grips where the rider's hands go, a pad in its middle, a small dial
  const SEATZ = -.34;   // where along the seat the rider sits
  const GX = .285, GY = 1.0957, GZ = .27, DASH = [0, topAt(0, .45) - .02, .45];
  rod(DASH, [0, GY - .02, GZ + .02], .03, MAT.coal, root, .024);
  add(tube([[-GX - .03, GY, GZ], [-.16, GY - .008, GZ + .014], [0, GY - .014, GZ + .02], [.16, GY - .008, GZ + .014], [GX + .03, GY, GZ]], .016, 48), MAT.metal, root, 'handlebar');
  const pad = add(new THREE.CapsuleGeometry(.034, .1, n_(6, 3), n_(16, 8)), MAT.accent, root, 'bar-pad'); pad.rotation.z = PI / 2; pad.position.set(0, GY - .014, GZ + .02);
  for (const sx of [-1, 1]) { const gr = add(new THREE.CylinderGeometry(.027, .027, .13, n_(20, 10)), MAT.rubber, root, 'grip'); gr.rotation.z = PI / 2; gr.position.set(sx * GX, GY, GZ); ball([sx * (GX + .068), GY, GZ], .031, MAT.accent, root); }
  const dial = new THREE.Group(); dial.position.set(0, topAt(0, .58) + .012, .58); dial.rotation.x = -.95; root.add(dial);
  add(new THREE.CylinderGeometry(.058, .066, .05, n_(28, 12)), MAT.coal, dial);
  const face = add(new THREE.CircleGeometry(.046, n_(28, 12)), new THREE.MeshBasicMaterial({ color: '#EAF2FF', toneMapped: false }), dial); face.rotation.x = -PI / 2; face.position.y = .0265;
  const hand = add(new THREE.BoxGeometry(.008, .002, .04), new THREE.MeshBasicMaterial({ color: COL.accent, toneMapped: false }), dial); hand.position.set(.008, .028, -.008); hand.rotation.y = .7;

  // ── two skis in front, each on a sprung leg that leans in to the hood, steadied by an arm from behind
  const SKX = .52, SKZ = .8;
  for (const sx of [-1, 1]) {
    const ski = new THREE.Group(); ski.name = sx < 0 ? 'ski-right' : 'ski-left'; ski.position.set(sx * SKX, 0, SKZ); root.add(ski);
    const sh = new THREE.Shape(); sh.moveTo(-.52, .03); sh.quadraticCurveTo(-.47, 0, -.4, 0); sh.lineTo(.3, 0); sh.splineThru([V2(.42, .012), V2(.52, .06), V2(.59, .15)]); sh.lineTo(.568, .164); sh.splineThru([V2(.5, .09), V2(.41, .046), V2(.3, .034)]); sh.lineTo(-.4, .034); sh.quadraticCurveTo(-.46, .034, -.5, .054); sh.lineTo(-.52, .03);
    add(slab(sh, .15, .014, 3, 16), MAT.coal, ski, 'ski');
    add(slab([[-.36, .034], [.3, .034], [.3, .046], [-.36, .046]], .056, .004, 2), MAT.accent, ski);                                  // a coral line along the top of the ski
    add(tube([[-.05, .152, .56], [-.035, .205, .605], [.035, .205, .605], [.05, .152, .56]], .013, 24), MAT.accent, ski, 'ski-loop');   // the loop at its tip
    add(slab([[-.11, .034], [.11, .034], [.06, .11], [-.06, .11]], .09, .012, 3), MAT.coal, ski);                                      // the saddle the leg stands in
    const A = V3(sx * SKX, .085, SKZ), B = V3(sx * (sideAt(.43, SKZ - .03) - .04), .43, SKZ - .03); rod(A.toArray(), B.toArray(), .024, MAT.metal, root);
    rod([sx * SKX, .075, SKZ - .04], [sx * (sideAt(.3, SKZ - .36) - .04), .3, SKZ - .36], .016, MAT.coal, root);
    const ax = B.clone().sub(A), L = ax.length(), un = ax.clone().normalize(), p1 = V3(0, 0, 1).cross(un).normalize(), p2 = un.clone().cross(p1), coil = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 5; coil.push(A.clone().addScaledVector(un, L * (.175 + .67 * t)).addScaledVector(p1, Math.cos(a) * .046).addScaledVector(p2, Math.sin(a) * .046)); }
    add(tube(coil, .0125, 170, false, 8), MAT.accent, root, 'spring');
    for (const t of [.165, .855]) { const c = add(new THREE.CylinderGeometry(.062, .062, .03, n_(28, 12)), MAT.coal, root); c.position.copy(A).addScaledVector(un, L * t); c.quaternion.setFromUnitVectors(V3(0, 1, 0), un); }   // the two cups the spring sits between
  }

  root.updateMatrixWorld(true);
  const LP = lamp.position, reach = LP.y / -lampDir.y * lampDir.z;   // how far ahead of the lamp its middle ray meets the snow
  const PL = o.pool || [.14, .46, .82, .55];                          // the pool of light on the snow: where it begins, its middle and its end (as parts of that reach), and half its width
  const marks = { lamp: { object: lamp, at: [0, 0, .05] }, beam: { object: lamp, at: [0, 0, 2.6] }, beamL: { object: lamp, at: [-.3, 0, 2.6] }, beamR: { object: lamp, at: [.3, 0, 2.6] }, beamU: { object: lamp, at: [0, .3, 2.6] }, beamD: { object: lamp, at: [0, -.3, 2.6] },
    pool: { object: root, at: [0, 0, LP.z + reach * PL[1]] }, poolNear: { object: root, at: [0, 0, LP.z + reach * PL[0]] }, poolFar: { object: root, at: [0, 0, LP.z + reach * PL[2]] }, poolSide: { object: root, at: [PL[3], 0, LP.z + reach * PL[1]] }, rear: { object: root, at: [0, .1, -1.2] }, nose: { object: root, at: [0, .08, SKZ + .59] }, tail: { object: root, at: [0, .3, -1.22] },
    track0: { object: root, at: [0, 0, -1.15] }, track1: { object: root, at: [0, 0, .2] }, skiR0: { object: root, at: [-SKX, 0, SKZ - .5] }, skiR1: { object: root, at: [-SKX, 0, SKZ + .5] }, skiL0: { object: root, at: [SKX, 0, SKZ - .5] }, skiL1: { object: root, at: [SKX, 0, SKZ + .5] }, across: { object: root, at: [.3, 0, -.45] } };
  return { object: root, scale: S, seat: [0, seatTop(SEATZ), SEATZ], grips: [[-GX, GY, GZ], [GX, GY, GZ]], lamp, glow, glass, tailGlow, lampDir: lampDir.toArray(), marks, materials: MAT, colors: COL, topAt, sideAt };
}

/* Seats the Ora snowman on the snowmobile: he sits on the cushion, leans forward a little, turns a little toward us (his own right
   side is the side we see), and holds the handlebar: each arm points from its shoulder at its own grip. His arms are not the same
   length, so the turn is what lets both mittens reach. Nothing in his own file is changed.
     const rider = seatRider(THREE, sled, F);    // F = what figures/ora-snowman.js builds: { object, update }
     rider.update(t, dt, state);                 // every frame, in place of F.update (it calls it)
   Sizes are in the snowmobile's own measure. rider.miss = how far each mitten is from its grip just now (for checking the fit). */
export function seatRider(THREE, sled, F, o = {}) {
  const size = o.size || 1.633, lean = o.lean == null ? .26 : o.lean, twist = o.twist == null ? -.214 : o.twist;
  const seat = new THREE.Group(); seat.name = 'rider'; seat.position.fromArray(sled.seat); seat.position.y -= o.sink == null ? .125 : o.sink; seat.position.z += o.fwd || 0; sled.object.add(seat);
  const man = F.object; man.scale.setScalar(size / 4.5); man.rotation.set(lean, twist, 0, 'XYZ'); seat.add(man);
  const body = man.getObjectByName('snowman-body'), tmp = new THREE.Vector3();
  const arms = ['right', 'left'].map((side, i) => { const piv = man.getObjectByName('snowman-arm-' + side), mit = man.getObjectByName('snowman-mitten-' + side), rest = mit.position.clone().sub(piv.position);
    return { piv, len: rest.length(), rest: rest.normalize(), grip: sled.grips[i] }; });
  const rider = { seat, man, arms, miss: [0, 0], update(t, dt, s) {
    F.update(t, dt, Object.assign({}, s, { held: true, cheer: 0 }));
    sled.object.updateWorldMatrix(true, true);
    arms.forEach((a, i) => { tmp.fromArray(a.grip); sled.object.localToWorld(tmp); body.worldToLocal(tmp); tmp.sub(a.piv.position); const d = tmp.length();
      a.piv.quaternion.setFromUnitVectors(a.rest, tmp.normalize()); rider.miss[i] = (d - a.len) * man.scale.x; });
  } };
  return rider;
}

/* The snowman on the snowmobile, as a figure for createModel() in globe3d.js (what this file is for: see the top). */
export function buildRide(THREE, o = {}) {
  const F = build(THREE), sled = buildSnowmobile(THREE, { badge: F.badge, detail: o.detail == null ? .62 : o.detail });
  const root = new THREE.Group(); root.name = 'ora-ride'; root.add(sled.object);
  const rider = seatRider(THREE, sled, F), state = { rider: true, lamp: 1 };
  function update(t, dt, s) {
    rider.seat.visible = !!state.rider; if (state.rider) rider.update(t, dt, s);
    const L = Math.max(0, Math.min(1, +state.lamp || 0)); sled.glow.material.opacity = .85 * L; sled.glow.scale.setScalar(.42 + .28 * L); sled.glass.color.setScalar(.3 + .7 * L);   // the headlight: its glow and its glass, as bright as the game says
  }
  return { object: root, update, light: F.light, focus: F.focus, badge: F.badge, marks: Object.assign({}, F.marks, sled.marks), state, sled, rider };
}
