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
     light    the light he was designed under, so his colours come out as approved */
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

  let look = 0, up = 0;
  function update(t, dt, s) {
    s = s || {};
    look += ((s.look || 0) - look) * Math.min(1, dt * 7); up += ((s.up || 0) - up) * Math.min(1, dt * 5);
    const cheer = s.cheer || 0;
    a.idle = !s.still; a.walk = s.walk || 0; a.waving = s.held ? cheer > .5 : true; if (mesh) mesh.visible = !s.bare;
    a.update(dt);                                   // (his own bob, sway, blink, wave and waddle)
    mouth(s.talk || 0, dt);
    a.head.rotation.y = look * .5; a.head.rotation.x += (s.still ? 0 : jaw * .04) - up * .3;   // (a small nod with each word; none in a close-up, so the logo on his hat keeps still)
    a.armLeft.rotation.z += cheer * 1.05;           // the other arm comes up too
  }
  update(0, 0, null);
  // the light he was designed under: soft sky light with a blue bounce from the snow, and one warm lamp from the upper left front
  const light = { tone: false, env: 0, sky: '#EEF3FF', ground: '#6F8FE8', ambient: 2.3, key: { color: '#FFF1DC', power: 2.2, from: [-5, 8.2, 6.2] }, rim: 0 };
  return { object: a.group, update, focus, badge, light };
}
