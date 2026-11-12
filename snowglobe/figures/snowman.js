/* A stand-in snowman, built in code (until the real one arrives).
   build(THREE) returns { object, update(t, dt, state) }: update turns his head toward what he is looking at (state.look: −1 left … 1 right,
   state.up: 0 … 1), lifts his arms when he is pleased (state.cheer: 0 … 1) and lets him breathe a little. */
export function build(THREE) {
  const g = new THREE.Group();
  const mat = (color, roughness = .85) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  const snow = mat(0xf6f9ff, .82), coal = mat(0x14161b, .55), carrot = mat(0xff8a2a, .7), wood = mat(0x6b4423, .9), red = mat(0xc8283c, .78), felt = mat(0x1c2233, .72), gold = mat(0xe2b45a, .45);
  const ball = (r, y, squash = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), snow); m.position.y = y; m.scale.set(1, squash, 1); return m; };
  const dot = (r, x, y, z, m = coal) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); d.position.set(x, y, z); return d; };

  const bottom = ball(.62, .55, .92), middle = ball(.46, 1.34, .94); g.add(bottom, middle);
  for (const [y, z] of [[1.52, .43], [1.34, .47], [1.16, .43]]) g.add(dot(.045, 0, y, z));   // coat buttons

  // the head: eyes, a carrot, a coal smile, and a top hat set at a jaunty angle
  const head = new THREE.Group(); head.position.y = 2.0; g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(.34, 36, 26), snow));
  for (const sx of [-1, 1]) { head.add(dot(.05, sx * .125, .08, .305)); head.add(dot(.016, sx * .112, .1, .35, mat(0xffffff, .3))); }
  for (let i = -2; i <= 2; i++) { const a = i * .21; head.add(dot(.026, Math.sin(a) * .2, -.115 + Math.abs(i) * .022, .29 - Math.abs(i) * .012)); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.055, .32, 18), carrot); nose.rotation.x = Math.PI / 2; nose.position.set(0, -.005, .46); head.add(nose);
  const hat = new THREE.Group(); hat.position.set(.02, .27, -.02); hat.rotation.z = -.16; hat.rotation.x = -.06; head.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .04, 36), felt); hat.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.22, .245, .36, 36), felt); crown.position.y = .2; hat.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.25, .252, .085, 36), red); band.position.y = .075; hat.add(band);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(.09, .07, .02), gold); buckle.position.set(0, .075, .25); hat.add(buckle);

  // a scarf, with one end hanging down the front
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(.335, .08, 14, 44), red); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.72; scarf.scale.set(1, 1, .8); g.add(scarf);
  const end = new THREE.Mesh(new THREE.BoxGeometry(.15, .46, .055), red); end.position.set(.19, 1.5, .4); end.rotation.set(-.14, 0, -.16); g.add(end);
  for (let i = -1; i <= 1; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.03, .08, .04), red); f.position.set(.225 + i * .05, 1.25, .43); f.rotation.set(-.14, 0, -.16); g.add(f); }

  // twig arms, each on a pivot at the shoulder so they can lift and wave
  const arms = [-1, 1].map(side => { const p = new THREE.Group(); p.position.set(side * .4, 1.5, .02); g.add(p);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.02, .032, .66, 8), wood); t.position.y = .33; p.add(t);
    for (const [a, len, at] of [[.6, .2, .5], [-.55, .17, .58], [.15, .14, .66]]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(.012, .018, len, 6), wood); tw.position.set(Math.sin(a) * len / 2, at + Math.cos(a) * len / 2, 0); tw.rotation.z = -a; p.add(tw); }
    p.userData.side = side; return p; });

  let look = 0, up = 0;
  function update(t, dt, s) {
    look += (((s && s.look) || 0) - look) * Math.min(1, dt * 7); up += (((s && s.up) || 0) - up) * Math.min(1, dt * 5);
    const cheer = (s && s.cheer) || 0;
    head.rotation.y = look * .55; head.rotation.x = -up * .38 + Math.sin(t * 1.1) * .02; head.rotation.z = Math.sin(t * .7) * .03;
    for (const p of arms) { const side = p.userData.side; p.rotation.z = -side * (1.12 - cheer * .68 + Math.sin(t * 1.3 + side) * .03 + Math.sin(t * 11) * .1 * cheer); p.rotation.x = -cheer * .25; }
    middle.scale.set(1 + Math.sin(t * 1.6) * .008, .94 + Math.sin(t * 1.6) * .012, 1 + Math.sin(t * 1.6) * .008);
  }
  update(0, 0, null);
  return { object: g, update };
}
