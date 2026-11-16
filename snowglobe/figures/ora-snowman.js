/* The Ora snowman, fitted for the snow globe.
   He was made in Claude Design; his own file is figures/ora-snowman/snowman-avatar.js and it is used here exactly as it came
   (shapes, colours and the white Ora logo on the front of his beanie). To take a newer version of him, replace that file.

   build(THREE) returns what globe3d.js asks of a figure built in code:
     object   the figure
     update   moves him every frame: his head turns toward what he is looking at (state.look: −1 left … 1 right, state.up: 0 … 1),
              both arms go up when he is pleased (state.cheer), he waddles as he slides (state.walk), and he keeps still for a
              close-up (state.still). In the globe he waves; in the game his arms are out until he cheers. With state.bare the logo
              on his hat is left off (the game draws a sharp one over it while it zooms in). state.talk (0 … 1) opens his mouth:
              his coal smile becomes a round, open mouth and back, as he speaks.
     focus    where the logo is on his hat, so the view can zoom into it and back out of it
     badge    the same logo as a flat picture (white, see-through around the letters) with the colour of the hat behind it
     light    the light he was designed under, so his colours come out as approved
     pieces   true: he can be built up piece by piece (the game does this). With state.made = { torso, base, armR, armL,
              gloveR, gloveL, scarf, buttons: [four] } (each 0 … 1) only the parts that are made are there: with nothing made
              he is a head in a hat sitting on the snow; his middle ball grows under the head and lifts it; his bottom ball
              grows under that; each arm (a bare twig), each mitten, his scarf and his four coal buttons arrive when they are
              asked for (R and L are his own right and left; made.arms sets both arms and both mittens at once). Every change
              lands with a small bounce (made.snap: at once). With no state.made he is whole, exactly as designed.
     shape    where his parts are just now, in his own measure (for the game: what a falling thing can land on, and where a
              button or the scarf belongs)
     marks    three points on him, each in the measure of the part it is on (for the game: where a flame can sit when a campfire
              has caught him): hat = the top of the pompom, nose = the tip of his carrot, scarf = the end of the tail in front */
import './ora-snowman/snowman-avatar.js';   // a plain script: it sets globalThis.SnowmanAvatar

export function build(THREE) {
  const A = globalThis.SnowmanAvatar, a = A.create(THREE, { castShadow: false, receiveShadow: false });

  // the logo on the hat: its middle, its four edges and the way it faces, in the hat's own measure
  let focus = null;
  const part = A.parts(a.look).find(p => p.name === 'hat-logo'), mesh = a.parts['hat-logo'];
  if (part && part.wrap && mesh) { const w = part.wrap, dome = w.on === 'dome', lift = 1.006;
    const at = (th, y) => { const r = dome ? Math.sqrt(Math.max(0, 1 - y * y)) : 1; return [r * Math.sin(th) * lift, dome ? y * lift : y, r * Math.cos(th) * lift]; };
    const c = at(w.yaw, w.y), n = Math.hypot(c[0], dome ? c[1] : 0, c[2]) || 1;
    focus = { object: mesh, center: c, left: at(w.yaw - w.halfAngle, w.y), right: at(w.yaw + w.halfAngle, w.y), top: at(w.yaw, w.y + w.halfHeight), bottom: at(w.yaw, w.y - w.halfHeight),
      normal: [c[0] / n, dome ? c[1] / n : 0, c[2] / n] }; }

  // the logo as a flat picture: first from the copy inside the avatar's file, then the sharper picture file once it has loaded
  let badge = null;
  if (focus) { const px = A.logoPixels(), cv = document.createElement('canvas'); cv.width = px.width; cv.height = px.height;
    const g = cv.getContext('2d'), im = g.createImageData(px.width, px.height);
    for (let y = 0; y < px.height; y++) for (let x = 0; x < px.width; x++) { const i = (y * px.width + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = px.alpha[(px.height - 1 - y) * px.width + x]; }   // (its rows run from the bottom up)
    g.putImageData(im, 0, 0);
    badge = { image: cv, aspect: px.aspect, color: a.look.hatColor, name: 'Ora' };
    try { const img = new Image(); img.onload = () => { if (img.naturalWidth) badge.image = img; }; img.src = new URL('./ora-snowman/ora-mark-white.png', import.meta.url).href; } catch (e) {} }

  // His coal smile can open when he speaks. Each coal slides over his face from its place in the smile to its place in a round,
  // open mouth (places given as angles across and down his face, the middle coal first); at rest the smile is exactly as designed.
  const face = a.parts.head, coals = [], OPEN = [[0, -29.2], [7.5, -28.2], [11, -25.2], [5.5, -21.6]], RAD = Math.PI / 180;
  if (face) for (let k = 1; k <= 7; k++) { const m = a.parts['smile-' + k]; if (!m) continue; const i = k - 4, C = face.position, S = face.scale;
    const d = [(m.position.x - C.x) / S.x, (m.position.y - C.y) / S.y, (m.position.z - C.z) / S.z], len = Math.hypot(d[0], d[1], d[2]) || 1, o = OPEN[Math.abs(i)];
    coals.push({ m, len, y0: Math.atan2(d[0], d[2]), p0: Math.asin(d[1] / len), y1: Math.sign(i) * o[0] * RAD, p1: o[1] * RAD }); }
  let jaw = 0;
  function mouth(open, dt) {
    jaw += (open - jaw) * Math.min(1, dt * 32); if (!face) return; const C = face.position, S = face.scale;
    for (const c of coals) { const y = c.y0 + (c.y1 - c.y0) * jaw, p = c.p0 + (c.p1 - c.p0) * jaw, cp = Math.cos(p);
      c.m.position.set(C.x + Math.sin(y) * cp * S.x * c.len, C.y + Math.sin(p) * S.y * c.len, C.z + Math.cos(y) * cp * S.z * c.len); }
  }

  // Built piece by piece. Nothing in his own file is changed: his snowballs, arms, buttons and scarf are only moved and sized
  // here, every frame, from where they were designed to be. Each ball rests in the one below it (or in the snow) as deeply as
  // it does in the finished snowman, so a growing ball lifts whatever is on top of it.
  const P = a.parts, keep = n => (P[n] ? { m: P[n], p: P[n].position.clone(), s: P[n].scale.clone() } : null);
  const base = keep('base'), torso = keep('torso'), ball = P.head, btns = [1, 2, 3, 4].map(k => keep('button-' + k));   // (buttons 1 and 2 are on his middle, 3 and 4 on his bottom ball)
  const pieces = !!(base && torso && ball && a.head && a.armRight && a.armLeft);
  let shape = null, lay = () => {};
  if (pieces) {
    const BC = base.p, BR = base.s, TC = torso.p, TR = torso.s, HC = ball.position.clone(), HR = ball.scale.clone(), TOP = a.naturalHeight || 4.5;
    const FT = (TC.y - BC.y) / (BR.y + TR.y), FH = (HC.y - TC.y) / (TR.y + HR.y), SIT = BC.y / BR.y, SITH = .89;
    const head0 = a.head.position.clone();
    // each arm on its own (the twig and its little branch), and each mitten on its own (mitten, thumb and cuff)
    const arm = (pv, side, key) => ({ pv, p0: pv.position.clone(), key, glove: 'glove' + key.slice(3), out: side === 'right' ? -1 : 1, mit: ['mitten-' + side, 'mitten-' + side + '-thumb', 'mitten-' + side + '-cuff'].map(keep).filter(Boolean) });
    const arms = [arm(a.armRight, 'right', 'armR'), arm(a.armLeft, 'left', 'armL')], at = new THREE.Vector3();
    // the scarf (ring, knot and two tails) on one handle at the middle of the ring: it arrives in one piece and stays under his head
    const scarf = new THREE.Group(), ring = P.scarf, knot = P['scarf-knot']; scarf.name = 'snowman-scarf';
    if (ring) { scarf.position.copy(ring.position); a.body.add(scarf); for (const n of ['scarf', 'scarf-knot', 'scarf-tail-1', 'scarf-tail-2']) { const m = P[n]; if (m) { m.position.sub(scarf.position); scarf.add(m); } } }
    const scarf0 = scarf.position.clone(), knotAt = knot ? knot.position.clone() : new THREE.Vector3(.4, -.08, .58);
    const KEYS = ['torso', 'base', 'scarf', 'armR', 'armL', 'gloveR', 'gloveL'], cur = { b: [1, 1, 1, 1] }, vel = { b: [0, 0, 0, 0] }; for (const k of KEYS) { cur[k] = 1; vel[k] = 0; }
    const unit = v => Math.max(0, Math.min(1, +v || 0)), want = (m, k) => unit(m[k] != null ? m[k] : /^(arm|glove)[RL]$/.test(k) ? m.arms : 0);   // (made.arms stands for both arms and both mittens)
    const spring = (o, v, k, to, dt) => { for (let n = Math.max(1, Math.ceil(dt / .008)), h = dt / n; n-- > 0;) { v[k] += (-230 * (o[k] - to) - 15 * v[k]) * h; o[k] = Math.max(0, o[k] + v[k] * h); } };   // (it overshoots a little, then settles: a bounce)
    let whole = false;
    shape = { top: 0, half: 0, arms: true, balls: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], spots: { b1: [0, 0, 0], b2: [0, 0, 0], b3: [0, 0, 0], b4: [0, 0, 0], scarf: [0, 0, 0], armR: [0, 0, 0], armL: [0, 0, 0], gloveR: [0, 0, 0], gloveL: [0, 0, 0] } };
    lay = (m, dt) => {
      if (!m) { if (whole) return; for (const k of KEYS) { cur[k] = 1; vel[k] = 0; } cur.b.fill(1); vel.b.fill(0); whole = true; }
      else { whole = false; const tb = m.buttons || [];
        if (m.snap) { for (const k of KEYS) { cur[k] = want(m, k); vel[k] = 0; } for (let i = 0; i < 4; i++) { cur.b[i] = unit(tb[i]); vel.b[i] = 0; } m.snap = false; }
        else { for (const k of KEYS) spring(cur, vel, k, want(m, k), dt); for (let i = 0; i < 4; i++) spring(cur.b, vel.b, i, unit(tb[i]), dt); } }
      const st = cur.torso, sb = cur.base;
      const yb = BC.y * sb, yt = Math.max(SIT * TR.y * st, yb + (BR.y * sb + TR.y * st) * FT), yh = Math.max(SITH * HR.y, st > 0 ? yt + (TR.y * st + HR.y) * FH : 0);   // how high the middle of each ball is
      base.m.position.y = yb; base.m.scale.copy(base.s).multiplyScalar(Math.max(.001, sb)); base.m.visible = sb > .02;
      torso.m.position.y = yt; torso.m.scale.copy(torso.s).multiplyScalar(Math.max(.001, st)); torso.m.visible = st > .02;
      a.head.position.y = head0.y + yh - HC.y;
      for (const A of arms) { const ar = cur[A.key] * (.7 + .3 * Math.min(1, st)), gl = cur[A.glove], pv = A.pv, sa = shape.spots[A.key], sg = shape.spots[A.glove];
        pv.position.set((A.p0.x - TC.x) * st, yt + (A.p0.y - TC.y) * st, (A.p0.z - TC.z) * st); pv.scale.setScalar(Math.max(.001, ar)); pv.visible = ar > .02;
        for (const q of A.mit) { q.m.scale.copy(q.s).multiplyScalar(Math.max(.001, gl)); q.m.visible = gl > .02; }
        sa[0] = pv.position.x + A.out * .3 * st; sa[1] = pv.position.y + .12 * st; sa[2] = pv.position.z;                                  // where the arm joins him, a little way out
        if (A.mit[0]) { at.setFromMatrixPosition(A.mit[0].m.matrixWorld); a.group.worldToLocal(at); sg[0] = at.x; sg[1] = at.y; sg[2] = at.z; } }   // where its hand is (as last drawn)
      btns.forEach((b, i) => { const on = i < 2 ? st : sb, C = i < 2 ? TC : BC, y = i < 2 ? yt : yb, sp = shape.spots['b' + (i + 1)];
        sp[0] = b ? (b.p.x - C.x) * on : 0; sp[1] = b ? y + (b.p.y - C.y) * on : y; sp[2] = b ? (b.p.z - C.z) * on : 0; if (!b) return;
        const k = cur.b[i] * on; b.m.position.set(sp[0], sp[1], sp[2]); b.m.scale.copy(b.s).multiplyScalar(Math.max(.001, k)); b.m.visible = k > .02; });
      scarf.position.y = scarf0.y + yh - HC.y; scarf.scale.setScalar(Math.max(.001, cur.scarf)); scarf.visible = cur.scarf > .02;
      shape.top = yh + TOP - HC.y; shape.arms = cur.armR > .5 || cur.armL > .5; shape.half = Math.max(HR.x, TR.x * st, BR.x * sb);
      const B = shape.balls; B[0][1] = yh + HR.y * .82; B[0][2] = HR.x * .8; B[1][1] = yh; B[1][2] = HR.x; B[2][1] = yt; B[2][2] = TR.x * st; B[3][1] = yb; B[3][2] = BR.x * sb;   // his hat, his head, his middle, his bottom ball
      const S = shape.spots.scarf; S[0] = scarf0.x + knotAt.x; S[1] = scarf.position.y + knotAt.y; S[2] = scarf0.z + knotAt.z;
    };
  }

  let look = 0, up = 0;
  function update(t, dt, s) {
    s = s || {};
    look += ((s.look || 0) - look) * Math.min(1, dt * 7); up += ((s.up || 0) - up) * Math.min(1, dt * 5);
    const cheer = s.cheer || 0;
    a.idle = !s.still; a.walk = s.walk || 0; a.waving = s.held ? cheer > .5 : true; if (mesh) mesh.visible = !s.bare;
    a.update(dt);                                   // (his own bob, sway, blink, wave and waddle)
    lay(s.made || null, dt);                        // (whole, or as far as the game has built him)
    mouth(s.talk || 0, dt);
    a.head.rotation.y = look * .5; a.head.rotation.x += (s.still ? 0 : jaw * .04) - up * .3;   // (a small nod with each word; none in a close-up, so the logo on his hat keeps still)
    a.armLeft.rotation.z += cheer * 1.05;           // the other arm comes up too
  }
  update(0, 0, null);
  // the light he was designed under: soft sky light with a blue bounce from the snow, and one warm lamp from the upper left front
  const light = { tone: false, env: 0, sky: '#EEF3FF', ground: '#6F8FE8', ambient: 2.3, key: { color: '#FFF1DC', power: 2.2, from: [-5, 8.2, 6.2] }, rim: 0 };
  // (his own file says how each shape lies in its own measure: a ball is 1 from its middle to its rim; the carrot runs from y = 0 on
  // his face to y = 1 at its tip; a scarf tail runs from y = −1 at the knot to y = 1 at its end)
  const marks = {}; for (const [n, part, at] of [['hat', 'hat-pom', [0, .82, 0]], ['nose', 'nose', [0, .97, 0]], ['scarf', 'scarf-tail-1', [0, .86, 0]]]) if (a.parts[part]) marks[n] = { object: a.parts[part], at };
  return { object: a.group, update, focus, badge, light, pieces, marks, get shape() { return shape; } };
}
