/* ─────────────────────────────────────────────────────────────
   ART ALIVE LABS: pictures on mugs and cups
   A picture printed on a mug is wrapped round a cylinder, so it has no straight edges to find. This follows the picture
   itself: it knows how the picture looks bent round the mug, and every frame works out where the mug is, how big it
   looks, how far it has turned and how it's tilted, by testing which of those makes the camera picture match best.

   AAMug.tracker({ picture, rho, taper })
     picture  the printed picture (an image or canvas), as it looks unrolled
     rho      the picture's height ÷ the mug's radius (3.5 in on a 3¼ in mug: 2.15). Leave it out and the tracker works it
              out from how the picture curves, so nobody has to measure.
     taper    for cups that narrow toward the bottom (or the top): -0.3..0.3, the radius at the bottom is 1 + taper, at the top
              1 - taper (times the middle's). Leave it out to work it out too; 0 for a straight mug or can.
     → { update(video) → pose or null, reset() }
   AAMug.view(canvas) → { draw(pose, media, toScreen, alpha) }   draws a video or picture wrapped on the mug, shaded like the mug
   AAMug.project(pose, a, b, aspect) → [x, y, z]     where point (a across, b down, 0..1) of the picture is
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const GW = 320;   // the camera picture is looked at 320 pixels wide

  // where a point of the picture lands: pose = [x0, y0, size, turn, lean, look-down, nearness, rho, taper]
  // (x0, y0, size in working pixels; size is the mug's middle radius on screen). nearness is the mug's radius over its distance:
  // the near side of a mug looks a little bigger than the far side. aspect is the picture's width ÷ height.
  function project(p, a, b, aspect) {
    const rho = p[7], rad = 1 + p[8] * (2 * b - 1), psi = (a - .5) * aspect * rho - p[3], X = Math.sin(psi) * rad, Z = Math.cos(psi) * rad, Y = (b - .5) * rho;
    const cb = Math.cos(p[5]), sb = Math.sin(p[5]), y1 = Y * cb + Z * sb, z1 = Z * cb - Y * sb, m = 1 / (1 - (p[6] || 0) * z1), ca = Math.cos(p[4]), sa = Math.sin(p[4]);
    return [p[0] + p[2] * m * (X * ca - y1 * sa), p[1] + p[2] * m * (X * sa + y1 * ca), Math.cos(psi)];
  }

  function tracker(o) {
    const NA = 32, NB = 32, ASP = (o.picture.naturalWidth || o.picture.width) / (o.picture.naturalHeight || o.picture.height);
    const AUTO_R = o.rho == null, AUTO_T = o.taper == null, R0 = AUTO_R ? 2.15 : o.rho, T0 = AUTO_T ? 0 : o.taper;
    let settled = 0, seenR = [], seenT = [];   // while working out the mug's shape: its first answers, to settle on
    // the picture in grey, on a 32 x 32 grid (lightly blurred, like a camera sees it from a little way off)
    const T = new Float32Array(NA * NB);
    { const c = document.createElement('canvas'); c.width = NA * 4; c.height = NB * 4; const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(o.picture, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data;
      for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { let s = 0; for (let v = 0; v < 4; v++) for (let u = 0; u < 4; u++) { const k = ((j * 4 + v) * c.width + i * 4 + u) * 4; s += d[k] * .299 + d[k + 1] * .587 + d[k + 2] * .114; } T[j * NA + i] = s / 16; } }
    // detail, not shading: each grid value minus the average of its neighbours, so light falling across the curve doesn't count
    const W1 = NA + 1, SV = new Float32Array(W1 * (NB + 1)), SN = new Float32Array(W1 * (NB + 1)), HO = new Float32Array(NA * NB);
    const HP = (V, ok, out) => {   // running sums over the grid make each neighbourhood average a few steps
      for (let j = 0; j < NB; j++) { let rv = 0, rn = 0; for (let i = 0; i < NA; i++) { const k = j * NA + i, m = ok ? ok[k] : 1; rv += m ? V[k] : 0; rn += m;
        SV[(j + 1) * W1 + i + 1] = SV[j * W1 + i + 1] + rv; SN[(j + 1) * W1 + i + 1] = SN[j * W1 + i + 1] + rn; } }
      const O = out || new Float32Array(NA * NB);
      for (let j = 0; j < NB; j++) { const j0 = Math.max(0, j - 2), j1 = Math.min(NB, j + 3);
        for (let i = 0; i < NA; i++) { const k = j * NA + i; if (ok && !ok[k]) continue; const i0 = Math.max(0, i - 2), i1 = Math.min(NA, i + 3);
          const sv = SV[j1 * W1 + i1] - SV[j0 * W1 + i1] - SV[j1 * W1 + i0] + SV[j0 * W1 + i0], sn = SN[j1 * W1 + i1] - SN[j0 * W1 + i1] - SN[j1 * W1 + i0] + SN[j0 * W1 + i0];
          O[k] = V[k] - sv / sn; } }
      return O; };
    const TH = HP(T, null);
    const A = new Float32Array(NA), B = new Float32Array(NB); for (let i = 0; i < NA; i++) A[i] = (i + .5) / NA; for (let j = 0; j < NB; j++) B[j] = (j + .5) / NB;

    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    let G = null, gw = GW, gh = 0, H2 = null, hw = 0, hh = 0;
    function grab(src, sw, sh) {
      gh = Math.round(GW * sh / sw); if (cv.width !== gw || cv.height !== gh) { cv.width = gw; cv.height = gh; G = new Float32Array(gw * gh); }
      cx.drawImage(src, 0, 0, gw, gh); const d = cx.getImageData(0, 0, gw, gh).data;
      for (let i = 0, j = 0; i < G.length; i++, j += 4) G[i] = d[j] * .299 + d[j + 1] * .587 + d[j + 2] * .114;
      hw = gw >> 1; hh = gh >> 1; if (!H2 || H2.length !== hw * hh) H2 = new Float32Array(hw * hh);   // half size, for the wide search
      for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const i = y * 2 * gw + x * 2; H2[y * hw + x] = (G[i] + G[i + 1] + G[i + gw] + G[i + gw + 1]) * .25; }
    }
    const samp = (I, w, h, x, y) => { if (x < 0 || y < 0 || x > w - 1.001 || y > h - 1.001) return -1; const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
      return (I[i] * (1 - fx) + I[i + 1] * fx) * (1 - fy) + (I[i + w] * (1 - fx) + I[i + w + 1] * fx) * fy; };

    const VV = new Float32Array(NA * NB), OK = new Uint8Array(NA * NB);
    // how well a pose explains the camera picture: the correlation between the picture and what's under it, -1..1
    function score(p, half, stride) {
      const I = half ? H2 : G, w = half ? hw : gw, h = half ? hh : gh, k = half ? .5 : 1, st = stride || 1;
      let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, tot = 0;
      if (st === 1) {   // full detail: sample everything, then compare detail with detail
        for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { tot++; const kk = j * NA + i, q = project(p, A[i], B[j], ASP); OK[kk] = 0;
          if (q[2] < .22) continue; const v = samp(I, w, h, q[0] * k, q[1] * k); if (v < 0) continue; VV[kk] = v; OK[kk] = 1; }
        const D = HP(VV, OK, HO);
        for (let kk = 0; kk < NA * NB; kk++) { if (!OK[kk]) continue; const v = D[kk], t = TH[kk]; n++; sx += v; sy += t; sxx += v * v; syy += t * t; sxy += v * t; }
      } else
      for (let j = 0; j < NB; j += st) for (let i = 0; i < NA; i += st) { tot++;
        const q = project(p, A[i], B[j], ASP); if (q[2] < .22) continue;
        const v = samp(I, w, h, q[0] * k, q[1] * k); if (v < 0) continue;
        const t = T[j * NA + i]; n++; sx += v; sy += t; sxx += v * v; syy += t * t; sxy += v * t; }
      if (n < tot * .45) return -1;   // too little of the picture in view to be sure
      const vx = sxx - sx * sx / n, vy = syy - sy * sy / n; if (vx < 1e-3 || vy < 1e-3) return -1;
      // credit only for the share of the picture it explains: a pose that hides most of it round the back can't win by matching a sliver
      return (sxy - sx * sy / n) / Math.sqrt(vx * vy) * Math.min(1, n / (tot * .8));
    }
    const LIM = [[-1e4, 1e4], [-1e4, 1e4], [8, 400], [-1.5, 1.5], [-.4, .4], [-.3, .85], [0, .35], [1.2, 4], [-.3, .3]];   // x, y, size, turn, lean (sideways), how far above you're looking from, nearness, rho, taper
    const free = () => { const k = [0, 1, 2, 3, 4, 5, 6]; if (AUTO_R && settled < 2) k.push(7); if (AUTO_T && settled < 2) k.push(8); return k; };   // the mug's shape is worked out, then settled
    function descend(p, steps, rounds, half, stride) {   // try each setting a little up and down, keep what matches better; then smaller steps
      let best = score(p, half, stride), st = steps.slice();
      for (let r = 0; r < rounds; r++) { let moved = true, n = 0;
        while (moved && n++ < 8) { moved = false;
          for (const k of free()) for (const d of [-1, 1]) { const q = p.slice(); q[k] = Math.min(LIM[k][1], Math.max(LIM[k][0], q[k] + d * st[k])); const c = score(q, half, stride); if (c > best + 1e-4) { best = c; p = q; moved = true; } } }
        st = st.map(v => v / 2); }
      return { p, c: best };
    }
    // when lost: look everywhere, at every size and turn, on the half-size picture, a couple of sizes each frame so the
    // screen never stalls; when every size has been looked at, refine the best few and check them in full detail
    const SIZES = []; for (let z = 18; z <= 110; z *= 1.22) SIZES.push(z);
    let hunt = null;
    function scan(s, found, near) {
      const stepX = Math.max(5, s * .33), stepY = Math.max(5, s * .33);
      const xa = near ? Math.max(s * .4, near[0] - s * .7) : s * .4, xb = near ? Math.min(gw - s * .4, near[0] + s * .7) : gw - s * .4;
      const ya = near ? Math.max(s * .4, near[1] - s * .7) : s * .4, yb = near ? Math.min(gh - s * .4, near[1] + s * .7) : gh - s * .4;
      for (let th = -.9; th <= .91; th += .3) for (let y = ya; y < yb; y += stepY) for (let x = xa; x < xb; x += stepX) {
        const p = [x, y, s, th, 0, .15, .12, shape()[0], shape()[1]], c = score(p, true, 2); if (c > .3) found.push({ p, c }); }
    }
    function finish(found) {
      found.sort((a, b) => b.c - a.c); let best = null;
      for (const f of found.slice(0, 3)) for (const rr of (AUTO_R && settled < 2 ? [.85, 1, 1.25] : [1])) {   // not knowing the mug's width: try narrower and wider too
        const q = f.p.slice(); q[7] = Math.min(LIM[7][1], q[7] * rr); q[2] = q[2] / rr;
        const r = descend(q, [q[2] * .15, q[2] * .15, q[2] * .08, .12, .06, .12, .05, .15, .05], 3, true, 2); if (!best || r.c > best.c) best = r; }   // quick
      return best ? descend(best.p, [1.5, 1.5, best.p[2] * .02, .03, .02, .03, .02, .04, .02], 2, false) : null;   // careful
    }
    function search(near) {   // near: the pose we have, to look only around it (a quick check, all at once)
      const found = []; for (let s = near[2] * .8; s <= near[2] * 1.25; s *= 1.22) scan(s, found, near); return finish(found);
    }
    const shape = () => [settled >= 2 || !AUTO_R ? R0f() : R0, settled >= 2 || !AUTO_T ? T0f() : T0];
    let fixR = R0, fixT = T0; const R0f = () => fixR, T0f = () => fixT;
    const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    function learn(p, c) {   // the first good looks at the mug settle its width and taper (the middle answer of many, so one odd frame can't skew it)
      if (settled >= 2 || (!AUTO_R && !AUTO_T) || c < .55) return; seenR.push(p[7]); seenT.push(p[8]);
      if (seenR.length >= 40) { fixR = AUTO_R ? med(seenR) : R0; fixT = AUTO_T ? med(seenT) : T0; settled = 2; } }
    const pin = p => { if (settled >= 2) { p[7] = fixR; p[8] = fixT; } return p; };
    let pose = null, lost = 0, frame = 0, last = null;
    return {
      update(src, sw, sh) {
        sw = sw || src.videoWidth || src.width; sh = sh || src.videoHeight || src.height; if (!sw || !sh) return null;
        grab(src, sw, sh); frame++;
        if (pose) {
          const pred = (last ? pose.map((v, i) => v + (v - last[i]) * .5) : pose).map((v, k) => Math.min(LIM[k][1], Math.max(LIM[k][0], v)));   // a little of the last move carries on
          let r = descend(pin(pred), [2, 2, pose[2] * .025, .03, .02, .03, .02, .03, .015], 3, false);
          if (r.c < .5) { const w = descend(pin(pose.slice()), [pose[2] * .2, pose[2] * .2, pose[2] * .08, .15, .06, .1, .05, .1, .04], 4, false); if (w.c > r.c) { r.p = w.p; r.c = w.c; } }   // a quick move: look a little wider
          if (frame % 15 === 0) { const b = search(pose); if (b && b.c > r.c + .04) { r.p = b.p; r.c = b.c; last = null; } }   // now and then, make sure it's still the best answer
          if (r.c > .3) { if (last !== null || frame % 12) last = pose; pose = pin(r.p); lost = 0; learn(pose, r.c); return { pose, c: r.c, gw, gh, settled: settled >= 2 }; }
          if (++lost > 4) { pose = null; last = null; }
          return pose ? { pose, c: r.c, gw, gh, hold: true } : null;
        }
        if (!hunt) hunt = { i: 0, found: [] };
        for (let k = 0; k < 2 && hunt.i < SIZES.length; k++) scan(SIZES[hunt.i++], hunt.found);
        if (hunt.i < SIZES.length) return null;
        const b = finish(hunt.found); hunt = null;
        if (b && b.c > .45) { pose = pin(b.p); last = null; lost = 0; learn(pose, b.c); return { pose, c: b.c, gw, gh, found: true }; }
        return null;
      },
      reset() { pose = null; last = null; lost = 0; hunt = null; },
      get shape() { return { rho: settled >= 2 ? fixR : null, taper: settled >= 2 ? fixT : null }; },
      score: (p, half) => score(p, half),   // for testing
      get pose() { return pose; }
    };
  }

  /* drawing on the mug: the video (or picture) on a curved grid, shaded like the mug and fading where it turns away */
  function view(canvas) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true }); if (!gl) return null;
    const vs = 'attribute vec2 p;attribute vec2 t;attribute float z;varying vec2 vt;varying float vz;uniform vec2 R;void main(){vt=t;vz=z;gl_Position=vec4(p.x/R.x*2.-1.,1.-p.y/R.y*2.,0.,1.);}';
    const fs = 'precision mediump float;varying vec2 vt;varying float vz;uniform sampler2D M;uniform float A;void main(){vec3 c=texture2D(M,vt).rgb*(.72+.28*vz);float a=smoothstep(.12,.32,vz)*A;gl_FragColor=vec4(c*a,a);}';
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    const NX = 48, NY = 12, nv = (NX + 1) * (NY + 1), pos = new Float32Array(nv * 2), tc = new Float32Array(nv * 2), zz = new Float32Array(nv), idx = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const k = j * (NX + 1) + i; tc[k * 2] = i / NX; tc[k * 2 + 1] = j / NY; }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * (NX + 1) + i; idx.push(k, k + 1, k + NX + 1, k + 1, k + NX + 2, k + NX + 1); }
    const buf = n => { const b = gl.createBuffer(); return b; }, bP = buf(), bT = buf(), bZ = buf(), bI = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bT); gl.bufferData(gl.ARRAY_BUFFER, tc, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const L = n => gl.getAttribLocation(pr, n), aP = L('p'), aT = L('t'), aZ = L('z'), uR = gl.getUniformLocation(pr, 'R'), uA = gl.getUniformLocation(pr, 'A');
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return {
      // pose from the tracker; media: a playing video or a picture; toScreen(x, y): working pixels → canvas pixels
      draw(pose, media, toScreen, alpha, aspect) {
        if (canvas.width !== canvas.clientWidth * devicePixelRatio || canvas.height !== canvas.clientHeight * devicePixelRatio) { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; }
        gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (!pose || !media || (media.readyState !== undefined && media.readyState < 2)) return;
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const k = j * (NX + 1) + i, q = project(pose, i / NX, j / NY, aspect || 1), s = toScreen(q[0], q[1]);
          pos[k * 2] = s[0] * devicePixelRatio; pos[k * 2 + 1] = s[1] * devicePixelRatio; zz[k] = q[2]; }
        gl.useProgram(pr); gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uA, alpha == null ? 1 : alpha);
        gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bT); gl.enableVertexAttribArray(aT); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bZ); gl.bufferData(gl.ARRAY_BUFFER, zz, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(aZ); gl.vertexAttribPointer(aZ, 1, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, media);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    };
  }
  window.AAMug = { tracker, view, project };
})();
