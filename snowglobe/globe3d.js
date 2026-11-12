/* ─────────────────────────────────────────────────────────────
   ART ALIVE: a 3D figure for the snow globe.

   import { createModel, winterNight } from './globe3d.js';
   const figure = await createModel('models/snowman.glb', { fit: 1, yaw: 0, lift: 0 });   // a .glb file (a 3D model with its colours inside)
   const figure = await createModel(build, { … });                                        // or a figure built in code: build(THREE) returns the figure
   const g = AAGlobe.create(host, { picture: winterNight(), model: figure, … });

   The figure is sized to fit the glass, stood on the snow and lit like a winter evening. Drag to turn it, tap it and it hops,
   tilt the phone and it leans, shake and it jumps and spins.
   A .glb with animations: the first one plays on a loop; one called wave, dance, jump (and so on) plays on a shake.
   A figure built in code can return { object, update(t, dt, state), light } to move its own parts and ask for the light it was designed under (state: look, up, cheer, walk, air, grown,
   held = a game is holding it, still = keep still for a close-up, bare = leave its logo off, talk = how wide its mouth is open). It can also return focus (a spot on it, such as a logo: where
   it is in the picture is reported every frame as figure.focus) and badge (that logo as a flat picture), for a view that zooms
   into the spot and back out of it.

   Options (all optional):
     fit    1      bigger or smaller than the automatic size (1.1 = 10% bigger)
     size   1      how grown it is to begin with (the game grows it: figure.grow(0.8))
     yaw    0      which way it faces to begin with, in degrees (90 = a quarter turn)
     lift   0      raise (+) or lower (−) it, in globe units (the glass is 1 from middle to edge)
     sway   true   it turns gently from side to side when nobody is touching it
     light  1      brighter or dimmer
   ───────────────────────────────────────────────────────────── */
import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/addons/GLTFLoader.js';

const FOV = 22, DIST = 1 / Math.tan(FOV * Math.PI / 360);   // the camera sees exactly the square around the glass: 1 unit = the glass's radius
const ease = p => 1 - Math.pow(1 - p, 3);
const REACT = /wave|dance|jump|spin|shake|react|happy|cheer|hop|flip|twirl|celebrat|attack|bark|roar|flap/i;

// the light the glass would catch on a winter evening: pale sky above, snow below, one warm lamp and one cool one
function winterLight(renderer) {
  const s = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16), col = [], p = geo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10;
    if (y > 0) c.setRGB(.52 + .3 * (1 - y), .62 + .28 * (1 - y), .9 + .1 * (1 - y)); else c.setRGB(.93, .95, 1).multiplyScalar(.75 + .25 * (1 + y));
    col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const lamp = (r, g, b, x, y, z, w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  lamp(9, 7.6, 5.6, -5, 6, 5, 5); lamp(3, 4.2, 6.5, 6, 2, -4, 4); lamp(3.2, 3.2, 3.4, 0, 8, -1, 5);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(s, .05).texture;
  pm.dispose(); geo.dispose();
  return tex;
}

export async function createModel(source, o = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });   // (throws where 3D isn't available)
  renderer.setPixelRatio(1); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05 * (o.light || 1);
  const scene = new THREE.Scene(); scene.environment = winterLight(renderer);
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60); camera.position.set(0, 0, DIST); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const hemi = new THREE.HemisphereLight(0xeaf2ff, 0xc3d0ee, .55); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0dc, 1.9); key.position.set(-2.6, 4, 3.6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c8ff, 1.1); rim.position.set(3, 1.6, -2.8); scene.add(rim);

  // the figure: a .glb file, or one built in code
  let root, clips = [], custom = null;
  if (typeof source === 'string') { const gltf = await new GLTFLoader().loadAsync(source); root = gltf.scene || gltf.scenes[0]; clips = gltf.animations || []; }
  else { const made = typeof source === 'function' ? await source(THREE) : source; root = made && made.isObject3D ? made : made && made.object;
    if (made && !made.isObject3D) { clips = made.animations || []; if (typeof made.update === 'function') custom = made; } }
  if (!root) throw new Error('no figure');
  // a figure designed under its own light can ask for it: { sky, ground, ambient, key: { color, power, from }, rim, env, tone }
  // (tone: false shows its colours exactly as designed, with no film-like softening)
  const L = custom && custom.light;
  if (L) { const k = o.light || 1;
    if (L.sky) hemi.color.set(L.sky); if (L.ground) hemi.groundColor.set(L.ground); if (L.ambient != null) hemi.intensity = L.ambient * (L.tone === false ? k : 1);
    if (L.key) { if (L.key.color) key.color.set(L.key.color); if (L.key.power != null) key.intensity = L.key.power * (L.tone === false ? k : 1); if (L.key.from) key.position.fromArray(L.key.from); }
    if (L.rim != null) rim.intensity = L.rim; if (L.env === 0) scene.environment = null;
    if (L.tone === false) renderer.toneMapping = THREE.NoToneMapping; }
  let tris = 0;
  root.traverse(n => { if (!n.isMesh) return; n.frustumCulled = false; const g = n.geometry; tris += Math.round((g.index ? g.index.count : g.attributes.position.count) / 3);
    for (const m of [].concat(n.material || [])) { for (const k of ['map', 'emissiveMap']) if (m[k]) m[k].anisotropy = 4; } });

  // animations in the file: the first one loops; a "reaction" one (wave, dance, jump…) plays once on a shake
  const mixer = clips.length ? new THREE.AnimationMixer(root) : null;
  const reactClip = clips.find(c => REACT.test(c.name)) || null, idleClip = clips.find(c => c !== reactClip && /idle|stand|breath|loop|rest/i.test(c.name)) || clips.find(c => c !== reactClip) || null;
  let idleAct = null, reactAct = null;
  if (mixer && idleClip) { idleAct = mixer.clipAction(idleClip); idleAct.play(); mixer.update(0); }
  if (mixer && reactClip) { reactAct = mixer.clipAction(reactClip); reactAct.setLoop(THREE.LoopOnce, 1);
    mixer.addEventListener('finished', e => { if (e.action === reactAct && idleAct) idleAct.reset().fadeIn(.3).play(); }); }

  // its size: as big as fits inside the glass above the snow, whichever way it is turned
  root.updateMatrixWorld(true);
  root.traverse(n => { if (n.isSkinnedMesh) { try { n.computeBoundingBox(); } catch (e) {} } });
  const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  if (!isFinite(size.y) || size.y <= 0) throw new Error('empty figure');
  const feet = o.feet == null ? .7 : o.feet, RAD = .9, h = size.y, wide = Math.max(1e-4, Math.hypot(size.x, size.z) / 2 * .82);
  let s = 1.42 / h;
  for (let i = 0; i < 80; i++) { const H = s * h, r = s * wide, top = feet - H; if (r <= .55 && (top > 0 || r * r + top * top <= RAD * RAD)) break; s *= .975; }
  s *= o.fit || 1;
  const fitG = new THREE.Group(); fitG.add(root);
  const spin = new THREE.Group(); spin.add(fitG);
  const tilt = new THREE.Group(); tilt.add(spin); tilt.rotation.x = .1;   // seen from a little above, the way you look down into a globe
  const SINK = .03, y0 = -(feet + SINK) + (o.lift || 0); tilt.position.set(0, y0, 0); scene.add(tilt);

  let px = 0, yaw = (o.yaw || 0) * Math.PI / 180, yawV = 0, lastDrag = -9, lean = 0, hop = null, spinT = null, lastShake = -9, now = 0, dead = false, swayA = 0;
  let grown = o.size == null ? 1 : o.size, growTo = grown, cheer = 0, held = false;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // where the figure's spot (its logo) is in the picture just drawn: its middle, half its width and half its height as arrows
  // (the picture runs from −1 to 1 each way, y downward), and how squarely it faces us (1 = straight at us)
  const fv = new THREE.Vector3(), fw = new THREE.Vector3(), fn = new THREE.Vector3();
  function spot() {
    const f = custom && custom.focus; if (!f || !f.object) return;
    const mw = f.object.matrixWorld, P = q => { fv.fromArray(q).applyMatrix4(mw).project(camera); return [fv.x, -fv.y]; };
    const c = P(f.center), l = P(f.left), r = P(f.right), tp = P(f.top), b = P(f.bottom);
    fw.fromArray(f.center).applyMatrix4(mw); fn.fromArray(f.normal).transformDirection(mw);
    M.focus = { x: c[0], y: c[1], ux: (r[0] - l[0]) / 2, uy: (r[1] - l[1]) / 2, vx: (b[0] - tp[0]) / 2, vy: (b[1] - tp[1]) / 2, front: fn.dot(fv.copy(camera.position).sub(fw).normalize()) };
  }
  const M = {
    canvas, ready: true, air: 0, tris, clips: clips.map(c => c.name), reach: 0, height: 0,
    feetV: feet + SINK - (o.lift || 0),   // where its feet are in the picture it draws (0 = the middle, 1 = the bottom edge)
    pose: null,                           // a game can hold it: { yaw, lean, look, up, cheer, walk, still, bare } (then it doesn't sway, follow a drag or jump at a shake)
    focus: null,                          // where its spot (a logo) is in the picture, if the figure has one
    badge: (custom && custom.badge) || null,
    get grown() { return grown; },
    get facing() { const a = spin.rotation.y % (Math.PI * 2); return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a; },   // which way it is turned just now
    grow(to, now_) { growTo = Math.max(.2, to); if (now_) grown = growTo; },
    sharp: 0,                             // draw the picture at least this many pixels across (for a close-up), whoever asks for it
    talk: 0,                              // how wide its mouth is open, 0 … 1: a number, or a function that gives it (for a figure that can speak)
    // called every frame: the size of the picture in real pixels, which way is down, how wild the snow is.
    // env.view = [x, y, half] draws only that square of the picture (in the picture's own −1…1 measure), filling the canvas with
    // it: zoomed in, the part on screen stays sharp. Without env.px the picture keeps the size it has.
    frame(t, dt, env) {
      if (dead) return; now = t; env = env || {};
      const S = Math.max(96, Math.min(o.maxPx || 1280, Math.round(Math.max(env.px || px || 512, M.sharp || 0) / 16) * 16));
      if (S !== px) { px = S; renderer.setSize(S, S, false); }
      if (mixer) mixer.update(dt);
      grown += (growTo - grown) * Math.min(1, dt * 2.4); const k = s * grown;
      fitG.scale.setScalar(k); fitG.position.set(-mid.x * k, -box.min.y * k, -mid.z * k); M.reach = Math.min(.6, wide * k); M.height = h * k;
      let y = 0, extra = 0, sq = 1;
      if (hop) { const p = (t - hop.t0) / hop.dur;
        if (p >= 1) hop = hop.next ? { t0: t, dur: hop.dur * .55, h: hop.h * .32, next: false } : null;
        else { y = Math.sin(Math.PI * p) * hop.h; sq = 1 + .1 * Math.sin(Math.PI * p) - .08 * Math.pow(1 - Math.min(1, p * 6), 2) - .08 * Math.pow(Math.max(0, p * 6 - 5), 2); } }
      if (spinT != null) { const p = (t - spinT) / 1.15; if (p >= 1) spinT = null; else extra = Math.PI * 2 * ease(p); }
      M.air = y;
      const P = M.pose;
      if (!P && held) { yaw = 0; yawV = 0; swayA = 0; lastDrag = t; }   // let go by the game: it faces us, and takes up its gentle turning again in a moment
      held = !!P;
      if (P) { spin.rotation.y = (P.yaw || 0) + extra; tilt.rotation.z = -(P.lean || 0) * .16; cheer += (((P.cheer || 0)) - cheer) * Math.min(1, dt * 6); }
      else {
        yawV *= Math.exp(-dt * 2.4); yaw += yawV * dt;
        // left alone, it turns gently from side to side; touched, it stays where you turned it for a moment
        const free = t - lastDrag > 2.2 && o.sway !== false && !calm; swayA += ((free ? 1 : 0) - swayA) * Math.min(1, dt * 1.5);
        lean += ((env.gx || 0) - lean) * Math.min(1, dt * 5);
        spin.rotation.y = yaw + extra + Math.sin(t * .5) * .34 * swayA + lean * .45; tilt.rotation.z = -lean * .16;
        cheer += ((hop || spinT != null ? 1 : 0) - cheer) * Math.min(1, dt * 6);
      }
      spin.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); tilt.position.y = y0 + y * grown;
      let talk = 0; try { talk = Math.max(0, Math.min(1, +(typeof M.talk === 'function' ? M.talk() : M.talk) || 0)); } catch (e) {}
      if (custom) try { custom.update(t, dt, { look: P ? P.look || 0 : 0, up: P ? P.up || 0 : 0, cheer, air: y, grown, held, still: !!(P && P.still), bare: !!(P && P.bare), walk: P ? P.walk || 0 : 0, talk }); } catch (e) {}
      if (camera.view && camera.view.enabled) camera.clearViewOffset();
      scene.updateMatrixWorld(); spot();           // (measured with the whole picture in view)
      const V = env.view; if (V) camera.setViewOffset(2, 2, V[0] - V[2] + 1, V[1] - V[2] + 1, V[2] * 2, V[2] * 2);
      renderer.render(scene, camera);
    },
    drag(du) { yawV = Math.max(-9, Math.min(9, yawV * .6 + du * 14)); yaw += du * 1.7; lastDrag = now; },
    tap() { if (hop) return false; hop = { t0: now, dur: .42, h: .09, next: false }; return true; },
    // a real shake: it jumps and spins, or plays its own reaction if the file has one (not while you are turning it by hand)
    shake(E, force) {
      if (!force && (M.pose || now - lastShake < 1.6 || now - lastDrag < .5)) return; lastShake = now;   // (not while a game is holding it)
      hop = { t0: now, dur: .5, h: .17, next: true };
      if (reactAct) { if (idleAct) idleAct.fadeOut(.2); reactAct.reset().fadeIn(.2).play(); } else if (!calm) spinT = now;
    },
    dispose() { dead = true; M.ready = false; try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} }
  };
  M.frame(0, 0, { px: 256 });
  return M;
}

/* A backdrop for inside the glass: a winter night with a moon, stars and pines. (Any square picture works instead.) */
export function winterNight(size = 1024, seed = 7) {
  let a = seed >>> 0; const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), S = size;
  let gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#081028'); gr.addColorStop(.45, '#17306a'); gr.addColorStop(.74, '#5b7fbd'); gr.addColorStop(.86, '#cfe0fb'); gr.addColorStop(1, '#e9f1ff');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // the moon and its halo
  const mx = S * .7, my = S * .24, mr = S * .062;
  gr = g.createRadialGradient(mx, my, mr * .6, mx, my, mr * 6); gr.addColorStop(0, 'rgba(255,244,214,.5)'); gr.addColorStop(.25, 'rgba(210,226,255,.16)'); gr.addColorStop(1, 'rgba(210,226,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(214,198,160,.35)'; for (const [dx, dy, r] of [[-.3, -.2, .22], [.25, .3, .16], [.1, -.4, .1]]) { g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, 6.283); g.fill(); }
  // stars
  for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S * .6, r = (.4 + rnd() * 1.2) * S / 1024; g.fillStyle = `rgba(255,255,255,${.25 + rnd() * .65})`; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
  // far hills, then three rows of pines, each row nearer and darker
  const hill = (y, amp, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, S); for (let x = 0; x <= S; x += 8) g.lineTo(x, y - Math.sin(x / S * 5 + y) * amp - Math.sin(x / S * 13 + y * 2) * amp * .35); g.lineTo(S, S); g.closePath(); g.fill(); };
  hill(S * .74, S * .03, '#9db7e6'); hill(S * .78, S * .022, '#c4d6f6');
  const pine = (x, base, hgt, col) => { const w = hgt * .42; g.fillStyle = col; g.beginPath();
    for (let k = 0; k < 4; k++) { const ty = base - hgt * (1 - k * .2), by = base - hgt * (.62 - k * .2), hw = w * (.28 + k * .24); g.moveTo(x, ty); g.lineTo(x + hw, by); g.lineTo(x - hw, by); g.closePath(); }
    g.fill(); g.fillRect(x - hgt * .03, base - hgt * .06, hgt * .06, hgt * .08); };
  const rows = [[S * .77, S * .1, '#56719f', 16], [S * .8, S * .15, '#34507f', 12], [S * .835, S * .21, '#1c3159', 9]];
  for (const [base, hgt, col, n] of rows) for (let i = 0; i < n; i++) { const x = (i + rnd()) / n * S, k = .7 + rnd() * .6; if (Math.abs(x - S / 2) < S * .1 && hgt > S * .14) continue; pine(x, base + rnd() * S * .012, hgt * k, col); }
  gr = g.createLinearGradient(0, S * .8, 0, S); gr.addColorStop(0, 'rgba(233,241,255,0)'); gr.addColorStop(.35, 'rgba(240,246,255,.95)'); gr.addColorStop(1, '#f4f8ff'); g.fillStyle = gr; g.fillRect(0, S * .8, S, S * .2);
  return c;
}
