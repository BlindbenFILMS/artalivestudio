/* Art Alive capture tools, shared by the Creator Studio and the Game Maker.
   AACapture.open({ onDone })  — a camera view that finds the art on the wall, guides you to centre it by sound, voice and
                                 vibration, snaps it when steady, lets you nudge the four corners, then straightens it.
   AACapture.recordButton(label, onAudio) — a button that records from the microphone and hands back the audio. */
(function () {
'use strict';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ── styles ── */
const css = `
.aacap{position:fixed;inset:0;z-index:9999;background:#0b0d10;color:#f2ede4;display:flex;flex-direction:column;font:17px/1.4 'Atkinson Hyperlegible',Verdana,Arial,sans-serif}
.aacap[hidden]{display:none}
.aacap-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px}
.aacap-top h2{margin:0;font:900 18px/1.1 'Archivo','Arial Black',Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em}
.aacap-view{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.aacap-view video,.aacap-view canvas.aacap-ph{max-width:100%;max-height:100%;display:block}
.aacap-ov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.aacap-edit .aacap-ov{pointer-events:auto;touch-action:none}
.aacap-tip{position:absolute;left:12px;right:12px;bottom:14px;margin:0 auto;max-width:520px;text-align:center;padding:12px 16px;border-radius:14px;background:rgba(10,12,16,.82);font-weight:700;font-size:19px}
.aacap-tip.good{background:rgba(31,122,60,.92)}
.aacap-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;padding:12px 14px calc(14px + env(safe-area-inset-bottom))}
.aacap button,.aacap .aacap-btn{min-height:52px;padding:0 22px;border-radius:999px;border:2px solid #2c333d;background:#1d222a;color:#f2ede4;font:800 16px/1 'Archivo','Arial Black',Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}
.aacap .go{background:#ff7a2a;border-color:#ff7a2a;color:#14100c}
.aacap .shoot{width:76px;height:76px;min-height:0;padding:0;border-radius:50%;background:#f2ede4;border:6px solid #ff7a2a;font-size:0}
.aacap label{display:flex;align-items:center;gap:8px;font-size:15px}
.aacap input[type=checkbox]{width:22px;height:22px;accent-color:#ff7a2a}
.aacap :focus-visible{outline:3px solid #2aa8e0;outline-offset:3px}
.aarec{display:inline-flex;align-items:center;gap:8px}
.aarec i{display:inline-block;width:12px;height:12px;border-radius:50%;background:#e8433a}
.aarec.on{background:#e8433a!important;border-color:#e8433a!important;color:#fff!important}
.aarec.on i{border-radius:2px;background:#fff}
.aacap-intro{max-width:520px;margin:auto;padding:20px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;overflow:auto}
.aacap-intro svg{width:150px;height:auto}
.aacap-intro h3{margin:0;font:900 clamp(24px,6vw,34px)/1.05 'Archivo','Arial Black',Arial,sans-serif;text-transform:uppercase}
.aacap-intro ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:19px;text-align:left}
.aacap-intro li{padding-left:30px;position:relative}.aacap-intro li::before{content:'✓';position:absolute;left:0;color:#3ddc84;font-weight:900}
.aacap-intro b{color:#f5a623}
.aacap-head{position:absolute;left:12px;right:12px;top:10px;margin:0 auto;max-width:560px;text-align:center;padding:10px 14px;border-radius:12px;background:rgba(10,12,16,.82);font-weight:700;font-size:17px;z-index:2}
.aacap-head b{color:#ff7a2a}
.aa-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

/* ── sound and voice for guidance ── */
let AC = null;
function beep(f, d, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v || .12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (d || .1)); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + (d || .1) + .03); } catch (e) {} }
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

/* ── finding the art: a rectangle around the centre of the view (from the Art Alive demo) ── */
const PW = 240; let PH = 135, L = null, lab = null, pix = null, GX = null, GY = null, MAG = null, LB = null, ACC = null, EDGE_T = 40, prevC = null;
const pc = document.createElement('canvas'), pctx = pc.getContext('2d', { willReadFrequently: true });
const NT = 90, COS = new Float32Array(NT), SIN = new Float32Array(NT); for (let t = 0; t < NT; t++) { COS[t] = Math.cos(t * Math.PI / NT); SIN[t] = Math.sin(t * Math.PI / NT); }
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function quadArea(P) { let s = 0; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function convex(P) { let sg = 0; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], c = P[(i + 2) % 4], z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); if (Math.abs(z) < 1e-6) return false; const s = Math.sign(z); if (sg && s !== sg) return false; sg = s; } return true; }
function inQuad(P, x, y) { let sg = 0; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], z = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); const s = Math.sign(z); if (!s) continue; if (sg && s !== sg) return false; sg = s; } return true; }
function detect(src, sw, sh) {
  if (!sw || !sh) return null;
  PH = Math.round(PW * sh / sw);
  if (pc.width !== PW || pc.height !== PH) { pc.width = PW; pc.height = PH; L = new Uint8Array(PW * PH); lab = new Int32Array(PW * PH); pix = new Int32Array(PW * PH); }
  pctx.drawImage(src, 0, 0, PW, PH); const d = pctx.getImageData(0, 0, PW, PH).data, n = PW * PH, hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { const l = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8; L[i] = l; hist[l]++; }
  const pct = q => { let s = 0; for (let v = 0; v < 256; v++) { s += hist[v]; if (s >= n * q) return v; } return 255; };
  const p5 = pct(.05), p20 = pct(.2);
  let best = lineQuad(PW / 2, PH / 2);
  if (!best) for (const T of new Set([Math.min(90, p5 + 14), Math.min(90, p20 + 10), 42])) { const c = findAt(T); if (c && (!best || c.score > best.score)) best = c; }
  if (best) prevC = best.c;
  return best;
}
function lineQuad(cx, cy) {
  const n = PW * PH;
  if (!MAG || MAG.length !== n) { GX = new Float32Array(n); GY = new Float32Array(n); MAG = new Float32Array(n); LB = new Float32Array(n); }
  for (let i = 0; i < n; i++) LB[i] = L[i];
  for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) { const i = y * PW + x; LB[i] = (L[i - PW - 1] + L[i - PW] + L[i - PW + 1] + L[i - 1] + L[i] + L[i + 1] + L[i + PW - 1] + L[i + PW] + L[i + PW + 1]) / 9; }
  const samp = []; MAG.fill(0);
  for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) { const i = y * PW + x;
    const gx = LB[i - PW + 1] + 2 * LB[i + 1] + LB[i + PW + 1] - LB[i - PW - 1] - 2 * LB[i - 1] - LB[i + PW - 1], gy = LB[i + PW - 1] + 2 * LB[i + PW] + LB[i + PW + 1] - LB[i - PW - 1] - 2 * LB[i - PW] - LB[i - PW + 1];
    GX[i] = gx; GY[i] = gy; const m = Math.hypot(gx, gy); MAG[i] = m; if ((x + y) % 3 === 0) samp.push(m); }
  samp.sort((a, b) => a - b); EDGE_T = Math.max(36, samp[Math.floor(samp.length * .86)] || 36);
  const DIAG = Math.ceil(Math.hypot(PW, PH)), NR = 2 * DIAG + 1;
  if (!ACC || ACC.length !== NT * NR) ACC = new Float32Array(NT * NR); else ACC.fill(0);
  for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) { const i = y * PW + x; if (MAG[i] < EDGE_T) continue;
    let th = Math.atan2(GY[i], GX[i]); if (th < 0) th += Math.PI; const tb = Math.round(th / Math.PI * NT) % NT;
    for (let dd = -1; dd <= 1; dd++) { const t = (tb + dd + NT) % NT, r = Math.round(x * COS[t] + y * SIN[t]) + DIAG; ACC[t * NR + r] += 1; } }
  const minV = .16 * Math.min(PW, PH), peaks = [];
  for (let t = 0; t < NT; t++) for (let r = 0; r < NR; r++) { const v = ACC[t * NR + r]; if (v < minV) continue; let mx = true;
    for (let dt = -2; dt <= 2 && mx; dt++) for (let dr = -3; dr <= 3; dr++) { if (!dt && !dr) continue; const tt = (t + dt + NT) % NT, rr = r + dr; if (rr < 0 || rr >= NR) continue; if (ACC[tt * NR + rr] > v) { mx = false; break; } }
    if (mx) peaks.push({ t, r: r - DIAG, v }); }
  peaks.sort((a, b) => b.v - a.v);
  const top = [], bot = [], lef = [], rig = [];
  for (const p of peaks.slice(0, 48)) { const th = p.t * Math.PI / NT, c = COS[p.t], s_ = SIN[p.t];
    if (Math.abs(th - Math.PI / 2) < .6) { const y = (p.r - cx * c) / s_; (y < cy - 4 ? top : y > cy + 4 ? bot : []).push(p); }
    else if (th < .6 || th > Math.PI - .6) { const x = (p.r - cy * s_) / c; (x < cx - 4 ? lef : x > cx + 4 ? rig : []).push(p); } }
  const X = (a, b) => { const c1 = COS[a.t], s1 = SIN[a.t], c2 = COS[b.t], s2 = SIN[b.t], den = c1 * s2 - s1 * c2; if (Math.abs(den) < 1e-4) return null; return [(a.r * s2 - b.r * s1) / den, (c1 * b.r - c2 * a.r) / den]; };
  let best = null; const T6 = a => a.slice(0, 6);
  for (const a of T6(top)) for (const b of T6(bot)) for (const l of T6(lef)) for (const r of T6(rig)) {
    const P = [X(a, l), X(a, r), X(b, r), X(b, l)]; if (P.some(q => !q || q[0] < .5 || q[1] < .5 || q[0] > PW - .5 || q[1] > PH - .5)) continue;
    if (!convex(P) || !inQuad(P, cx, cy)) continue; const area = quadArea(P); if (area < n * .04) continue;
    const tl = dist(P[0], P[1]), bl = dist(P[3], P[2]), ll = dist(P[0], P[3]), rl = dist(P[1], P[2]), asp = (tl + bl) / (ll + rl);
    if (asp < .3 || asp > 3.4 || Math.max(tl, bl) / Math.min(tl, bl) > 2 || Math.max(ll, rl) / Math.min(ll, rl) > 2) continue;
    const cov = [cover(P[0], P[1]), cover(P[1], P[2]), cover(P[2], P[3]), cover(P[3], P[0])], mn = Math.min(...cov); if (mn < .5) continue;
    let score = mn * .6 + (cov[0] + cov[1] + cov[2] + cov[3]) / 4 * .4 + .15 * Math.sqrt(area / n);
    if (prevC) { let dsum = 0; for (let k = 0; k < 4; k++) dsum += dist(P[k], [prevC[k][0] * PW, prevC[k][1] * PH]); score += .15 * (1 - Math.min(1, dsum / (.6 * Math.hypot(PW, PH)))); }
    if (!best || score > best.score) best = { score, c: P.map(([x, y]) => [x / PW, y / PH]) }; }
  return best;
}
function cover(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, N = 26; let hit = 0;
  for (let k = 0; k < N; k++) { const t = .06 + .88 * k / (N - 1), px = a[0] + dx * t, py = a[1] + dy * t;
    for (let o = -1; o <= 1; o++) { const x = Math.round(px + nx * o), y = Math.round(py + ny * o); if (x < 1 || y < 1 || x >= PW - 1 || y >= PH - 1) continue; const i = y * PW + x;
      if (MAG[i] > EDGE_T * .6 && Math.abs(GX[i] * nx + GY[i] * ny) > .7 * MAG[i]) { hit++; break; } } }
  return hit / N;
}
function findAt(T) {
  lab.fill(0); let id = 0, best = null; const n = PW * PH, minArea = n * .04;
  for (let s = 0; s < n; s++) {
    if (lab[s] || L[s] > T) continue;
    id++; let head = 0, tail = 0; pix[tail++] = s; lab[s] = id; let border = 0, sMin = 1e9, sMax = -1e9, dMin = 1e9, dMax = -1e9, tl = 0, br = 0, tr = 0, bl = 0;
    while (head < tail) { const i = pix[head++], x = i % PW, y = (i / PW) | 0;
      if (x === 0 || y === 0 || x === PW - 1 || y === PH - 1) border++;
      const a = x + y, b = x - y; if (a < sMin) { sMin = a; tl = i; } if (a > sMax) { sMax = a; br = i; } if (b > dMax) { dMax = b; tr = i; } if (b < dMin) { dMin = b; bl = i; }
      if (x > 0 && !lab[i - 1] && L[i - 1] <= T) { lab[i - 1] = id; pix[tail++] = i - 1; }
      if (x < PW - 1 && !lab[i + 1] && L[i + 1] <= T) { lab[i + 1] = id; pix[tail++] = i + 1; }
      if (y > 0 && !lab[i - PW] && L[i - PW] <= T) { lab[i - PW] = id; pix[tail++] = i - PW; }
      if (y < PH - 1 && !lab[i + PW] && L[i + PW] <= T) { lab[i + PW] = id; pix[tail++] = i + PW; } }
    const count = tail; if (count < minArea || border > 2) continue;
    const P = [tl, tr, br, bl].map(i => [i % PW + .5, ((i / PW) | 0) + .5]);
    const area = quadArea(P); if (area < minArea || !convex(P)) continue;
    const fill = count / area; if (fill < .68 || fill > 1.25) continue;
    const top = dist(P[0], P[1]), bot = dist(P[3], P[2]), lef = dist(P[0], P[3]), rig = dist(P[1], P[2]), asp = (top + bot) / (lef + rig);
    if (asp < .3 || asp > 3.4 || Math.max(top, bot) / Math.min(top, bot) > 1.8 || Math.max(lef, rig) / Math.min(lef, rig) > 1.8) continue;
    if (!inQuad(P, PW / 2, PH / 2)) continue;
    const score = area * Math.min(1, fill) ** 2;
    if (!best || score > best.score) best = { score, c: P.map(([x, y]) => [x / PW, y / PH]) };
  }
  return best;
}

/* ── straightening: map the output rectangle onto the four corners and sample ── */
function homography(src, dst) { // solves the 3×3 map taking 4 src points to 4 dst points
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
  return b.map((v, i) => v / A[i][i]).concat([1]);
}
function straighten(img, W0, H0, Q, maxSide) {
  const P = Q.map(([x, y]) => [x * W0, y * H0]);
  const w = (dist(P[0], P[1]) + dist(P[3], P[2])) / 2, h = (dist(P[0], P[3]) + dist(P[1], P[2])) / 2, k = Math.min(1, (maxSide || 1400) / Math.max(w, h));
  const OW = Math.max(16, Math.round(w * k)), OH = Math.max(16, Math.round(h * k));
  const H = homography([[0, 0], [OW, 0], [OW, OH], [0, OH]], P);
  const sc = document.createElement('canvas'); sc.width = W0; sc.height = H0; const sx = sc.getContext('2d'); sx.drawImage(img, 0, 0, W0, H0);
  const sd = sx.getImageData(0, 0, W0, H0).data;
  const out = document.createElement('canvas'); out.width = OW; out.height = OH; const ox = out.getContext('2d'), od = ox.createImageData(OW, OH), o = od.data;
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    const X = x + .5, Y = y + .5, z = H[6] * X + H[7] * Y + 1, u = (H[0] * X + H[1] * Y + H[2]) / z - .5, v = (H[3] * X + H[4] * Y + H[5]) / z - .5;
    const x0 = clamp(Math.floor(u), 0, W0 - 2), y0 = clamp(Math.floor(v), 0, H0 - 2), fx = clamp(u - x0, 0, 1), fy = clamp(v - y0, 0, 1), i = (y0 * W0 + x0) * 4, j = (y * OW + x) * 4;
    for (let c = 0; c < 3; c++) { const a = sd[i + c] + (sd[i + 4 + c] - sd[i + c]) * fx, b2 = sd[i + W0 * 4 + c] + (sd[i + W0 * 4 + 4 + c] - sd[i + W0 * 4 + c]) * fx; o[j + c] = a + (b2 - a) * fy; }
    o[j + 3] = 255;
  }
  ox.putImageData(od, 0, 0);
  return out.toDataURL('image/jpeg', .9);
}

/* ── sticky tracking: once the rectangle is found, follow the texture inside it every frame (like Artivive),
      using optical flow on feature points and a homography fit; the rectangle finder only re-anchors it ── */
function tracker(opts) {
  opts = opts || {};
  let TW = opts.width || 320; const findRect = opts.detect || detect; let cost = 0;
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  let disagree = 0, w = 0, h = 0, prevPyr = null, pts = [], quad = null, sm = null, lastT = 0, frame = 0, lostFor = 0, lastDetectF = -99, mode = 'none';
  const LEVELS = 3, WIN = 4, ITERS = 10;
  function gray(src, sw, sh) {
    if (!sw || !sh) return null;
    const H = Math.round(TW * sh / sw);
    if (cv.width !== TW || cv.height !== H) { cv.width = TW; cv.height = H; }
    w = TW; h = H; cx.drawImage(src, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = d[j] * .299 + d[j + 1] * .587 + d[j + 2] * .114;
    return g;
  }
  function pyramid(g) {
    const L = [{ g, w, h }];
    for (let l = 1; l < LEVELS; l++) {
      const p = L[l - 1], nw = p.w >> 1, nh = p.h >> 1, o = new Float32Array(nw * nh);
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const i = (y * 2) * p.w + x * 2; o[y * nw + x] = (p.g[i] + p.g[i + 1] + p.g[i + p.w] + p.g[i + p.w + 1]) * .25; }
      L.push({ g: o, w: nw, h: nh });
    }
    for (const lv of L) { // gradients for the window sums
      const gx = new Float32Array(lv.w * lv.h), gy = new Float32Array(lv.w * lv.h), G = lv.g, W2 = lv.w;
      for (let y = 1; y < lv.h - 1; y++) for (let x = 1; x < W2 - 1; x++) { const i = y * W2 + x; gx[i] = (G[i + 1] - G[i - 1]) * .5; gy[i] = (G[i + W2] - G[i - W2]) * .5; }
      lv.gx = gx; lv.gy = gy;
    }
    return L;
  }
  const samp = (a, W2, H2, x, y) => { if (x < 0) x = 0; if (y < 0) y = 0; if (x > W2 - 1.001) x = W2 - 1.001; if (y > H2 - 1.001) y = H2 - 1.001;
    const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * W2 + x0; return (a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + W2] * (1 - fx) + a[i + W2 + 1] * fx) * fy; };
  const NW = (2 * WIN + 1) * (2 * WIN + 1), WA = new Float32Array(NW), WX = new Float32Array(NW), WY = new Float32Array(NW);
  function lk(P, N, x, y) { // pyramidal Lucas-Kanade: where did point (x,y) of P go in N?
    let gxs = 0, gys = 0;
    for (let l = LEVELS - 1; l >= 0; l--) {
      const A = P[l], B = N[l], s = 1 << l, px = x / s, py = y / s;
      let a11 = 0, a12 = 0, a22 = 0, n = 0;
      for (let j = -WIN; j <= WIN; j++) for (let i = -WIN; i <= WIN; i++, n++) { const ix = samp(A.gx, A.w, A.h, px + i, py + j), iy = samp(A.gy, A.w, A.h, px + i, py + j);
        WA[n] = samp(A.g, A.w, A.h, px + i, py + j); WX[n] = ix; WY[n] = iy; a11 += ix * ix; a12 += ix * iy; a22 += iy * iy; }
      const det = a11 * a22 - a12 * a12; if (det < 1e-3) return null;
      let vx = 0, vy = 0;
      for (let k = 0; k < ITERS; k++) {
        let b1 = 0, b2 = 0, m = 0; const ox = px + gxs + vx, oy = py + gys + vy;
        for (let j = -WIN; j <= WIN; j++) for (let i = -WIN; i <= WIN; i++, m++) { const dI = WA[m] - samp(B.g, B.w, B.h, ox + i, oy + j); b1 += dI * WX[m]; b2 += dI * WY[m]; }
        const ex = (a22 * b1 - a12 * b2) / det, ey = (a11 * b2 - a12 * b1) / det; vx += ex; vy += ey;
        if (ex * ex + ey * ey < .0009) break;
      }
      if (l > 0) { gxs = (gxs + vx) * 2; gys = (gys + vy) * 2; } else { gxs += vx; gys += vy; }
    }
    const nx = x + gxs, ny = y + gys; if (nx < 0 || ny < 0 || nx >= w || ny >= h) return null;
    return [nx, ny];
  }
  // homography from the unit square to the image, and its inverse
  const unit = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const apply = (H, x, y) => { const z = H[6] * x + H[7] * y + 1; return [(H[0] * x + H[1] * y + H[2]) / z, (H[3] * x + H[4] * y + H[5]) / z]; };
  function fitH(src, dst) { // least squares through all pairs (normal equations)
    const M = Array.from({ length: 8 }, () => new Float64Array(9));
    for (let k = 0; k < src.length; k++) { const [x, y] = src[k], [u, v] = dst[k];
      const r1 = [x, y, 1, 0, 0, 0, -u * x, -u * y, u], r2 = [0, 0, 0, x, y, 1, -v * x, -v * y, v];
      for (const r of [r1, r2]) for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) M[i][j] += r[i] * r[j]; M[i][8] += r[i] * r[8]; } }
    for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
      if (Math.abs(M[c][c]) < 1e-12) return null;
      for (let r = 0; r < 8; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 9; k++) M[r][k] -= f * M[c][k]; } }
    return Array.from({ length: 8 }, (_, i) => M[i][8] / M[i][i]).concat([1]);
  }
  function seed(g, Q) { // good corners (Shi-Tomasi) spread over the inside of the rectangle
    const cand = [], E = homography(unit, Q), grow = [[-.15, -.15], [1.15, -.15], [1.15, 1.15], [-.15, 1.15]].map(([u, v]) => apply(E, u, v));
    const xs = grow.map(p => p[0]), ys = grow.map(p => p[1]);
    const x0 = Math.max(WIN + 2, Math.floor(Math.min(...xs))), x1 = Math.min(w - WIN - 3, Math.ceil(Math.max(...xs))), y0 = Math.max(WIN + 2, Math.floor(Math.min(...ys))), y1 = Math.min(h - WIN - 3, Math.ceil(Math.max(...ys)));
    const L0 = prevPyr[0];
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
      if (!inQuad(grow, x, y)) continue;
      let a = 0, b = 0, c = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const k = (y + j) * w + x + i, ix = L0.gx[k], iy = L0.gy[k]; a += ix * ix; b += ix * iy; c += iy * iy; }
      const tr = a + c, mn = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - (a * c - b * b)));
      if (mn > 60) cand.push([mn, x, y]);
    }
    cand.sort((p, q) => q[0] - p[0]);
    const Hi = homography(Q, unit), out = [], cell = Math.max(6, Math.sqrt((x1 - x0) * (y1 - y0) / 140));
    const taken = new Set();
    let inner = 0;
    for (const [, x, y] of cand) { const key = Math.floor(x / cell) + ',' + Math.floor(y / cell); if (taken.has(key)) continue;
      const uv = apply(Hi, x, y), inside = uv[0] > .12 && uv[0] < .88 && uv[1] > .12 && uv[1] < .88;
      if (inside && inner >= 30) continue; // keep most points on the edges and around the shape
      taken.add(key); if (inside) inner++; out.push({ x, y, uv }); if (out.length >= 70) break; }
    return out;
  }
  /* picture matching: when the tracker is given the picture (opts.target: an image or canvas, or a function that returns one),
     every rectangle it finds is checked against it. A framed picture is several rectangles inside each other (frame, mat, art),
     and a pale edge can hide the art's own border, so the edges are slid in or out until what's inside matches the picture. */
  const TN = 24; let TS = [], lastFit = null;   // TS: the pictures to match, each turned four ways, with the turn it was last seen at
  const normz = a => { let m = 0; for (const x of a) m += x; m /= a.length; let v = 0; for (const x of a) v += (x - m) * (x - m); v = Math.sqrt(v / a.length) || 1; for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / v; return a; };
  function prep(src) {
    const sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height; if (!sw || !sh) return null;
    try { const c = document.createElement('canvas'); c.width = c.height = TN; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, TN, TN);
      const d = x.getImageData(0, 0, TN, TN).data, P = new Float32Array(TN * TN); for (let i = 0; i < P.length; i++) P[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114;
      const R = [P, new Float32Array(P.length), new Float32Array(P.length), new Float32Array(P.length)];   // the picture turned 0, 90, 180 and 270 degrees
      for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) { const v = P[j * TN + i]; R[1][i * TN + (TN - 1 - j)] = v; R[2][(TN - 1 - j) * TN + (TN - 1 - i)] = v; R[3][(TN - 1 - i) * TN + j] = v; }
      return { src, R: R.map(normz), rot: -1 }; } catch (e) { return null; }   // a picture from another site without permission can't be read: no matching
  }
  function targets() {   // opts.target: a picture, or a list of them (say, a card's front, its picture alone, and its back), or a function giving either
    let s = null; try { s = typeof opts.target === 'function' ? opts.target() : opts.target; } catch (e) {}
    const L = (Array.isArray(s) ? s : [s]).filter(Boolean);
    TS = L.map(src => TS.find(t => t.src === src) || prep(src)).filter(Boolean); return TS;
  }
  function score(lv, Q, t) {   // how alike the inside of Q (in this frame) and picture t are, -1..1
    const E = homography(unit, Q), sc = lv.w / w, P = new Float32Array(TN * TN);
    for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) { const q = apply(E, (i + .5) / TN, (j + .5) / TN); P[j * TN + i] = samp(lv.g, lv.w, lv.h, q[0] * sc, q[1] * sc); }
    normz(P); const rots = t.rot >= 0 ? [t.rot] : [0, 1, 2, 3]; let best = -2, br = 0;
    for (const r of rots) { const R = t.R[r]; let c = 0; for (let k = 0; k < P.length; k++) c += P[k] * R[k]; c /= P.length; if (c > best) { best = c; br = r; } }
    return { c: best, r: br };
  }
  const bestScore = (lv, Q) => TS.reduce((m, t) => Math.max(m, score(lv, Q, t).c), -2);
  function fit(Q, pyr) {
    if (!targets().length) return Q;
    const lv = pyr[1], E = homography(unit, Q), at = p => [[p[0], p[1]], [1 - p[2], p[1]], [1 - p[2], 1 - p[3]], [p[0], 1 - p[3]]].map(([u, v]) => apply(E, u, v));
    const ok = p => p.every(v => v > -.14 && v < .36) && 1 - p[0] - p[2] > .45 && 1 - p[1] - p[3] > .45;
    const near = lastFit && Q.every((q, i) => Math.hypot(q[0] - lastFit.Q[i][0], q[1] - lastFit.Q[i][1]) < w * .01);
    let pick = null;
    for (const t of TS) {
      const base = score(lv, Q, t); let p = [0, 0, 0, 0], best = base;
      // start from where it fitted last time if the rectangle hasn't moved much, else try even borders all round
      if (near && lastFit.t === t) { const s0 = score(lv, at(lastFit.p), t); if (s0.c > best.c) { best = s0; p = lastFit.p.slice(); } }
      else for (let e = -.1; e <= .3; e += .025) { const q = [e, e, e, e]; if (!ok(q)) continue; const s0 = score(lv, at(q), t); if (s0.c > best.c) { best = s0; p = q; } }
      for (const step of [.03, .012, .005]) { let moved = true, n = 0;
        while (moved && n++ < 12) { moved = false;
          for (let k = 0; k < 4; k++) for (const d of [-1, 1]) { const q = p.slice(); q[k] += d * step; if (!ok(q)) continue; const s0 = score(lv, at(q), t); if (s0.c > best.c + 1e-4) { best = s0; p = q; moved = true; } } } }
      if (!pick || best.c > pick.best.c) pick = { t, base, best, p };
    }
    const { t, base, best, p } = pick;
    if (best.c < .3) { lastFit = null; return null; }   // clearly not the picture (a door, a window, another frame): ignore it
    if (best.c < .45 || best.c < base.c + .02) { lastFit = null; Q.c = base.c; return Q; }   // not clearly better: keep the rectangle as found
    t.rot = best.r; lastFit = { Q: Q.map(q => q.slice()), p, t }; const F = at(p); F.c = best.c; return F;
  }
  // smoothing that stays still when you hold still and keeps up when you move (one-euro filter)
  function euro(prev, val, dt, dprev) {
    const mc = opts.minCutoff || 1.2, beta = opts.beta != null ? opts.beta : .08, dc = 1;
    const al = c => 1 / (1 + 1 / (2 * Math.PI * c * dt));
    const d = (val - prev) / dt, ad = al(dc), ds = dprev + ad * (d - dprev);
    const a = al(mc + beta * Math.abs(ds)); return [prev + a * (val - prev), ds];
  }
  function update(src, sw, sh, now) {
    now = now || performance.now(); frame++; const t0 = performance.now();
    const pw = w, ph = h, g = gray(src, sw, sh); if (!g) return null;
    if (pw && (w !== pw || h !== ph)) { prevPyr = null; pts = []; quad = null; sm = null; prevC = null; }   // the camera changed its picture size: start following afresh
    const pyr = pyramid(g); let tracked = null;
    // 1. follow the points from the last frame
    if (quad && prevPyr && pts.length >= 8) {
      const keep = [];
      for (const p of pts) { const n = lk(prevPyr, pyr, p.x, p.y); if (!n) continue; const back = lk(pyr, prevPyr, n[0], n[1]); if (!back || Math.hypot(back[0] - p.x, back[1] - p.y) > 1) continue; keep.push({ x: n[0], y: n[1], uv: p.uv }); }
      if (keep.length >= 8) { // robust fit: try a few 4-point guesses, keep the one most points agree with
        let best = null, bestIn = null;
        for (let it = 0; it < 40; it++) {
          const s = []; while (s.length < 4) { const k = keep[(Math.random() * keep.length) | 0]; if (!s.includes(k)) s.push(k); }
          let H; try { H = homography(s.map(k => k.uv), s.map(k => [k.x, k.y])); } catch (e) { continue; }
          if (!H.every(Number.isFinite)) continue;
          const inl = keep.filter(k => { const q = apply(H, k.uv[0], k.uv[1]); return Math.hypot(q[0] - k.x, q[1] - k.y) < 2.5; });
          if (!bestIn || inl.length > bestIn.length) { best = H; bestIn = inl; }
        }
        if (bestIn && bestIn.length >= Math.max(8, keep.length * .5)) {
          const H = fitH(bestIn.map(k => k.uv), bestIn.map(k => [k.x, k.y])) || best;
          const Q = unit.map(([u, v]) => apply(H, u, v));
          if (Q.every(p => p.every(Number.isFinite)) && convex(Q)) { tracked = Q; pts = bestIn; mode = 'track'; }
        }
      }
    }
    // 2. look for the rectangle: always when lost, and every few frames to correct drift and refresh points
    if (!tracked || frame - lastDetectF > (pts.length < 25 || disagree ? 3 : 10)) {
      lastDetectF = frame;
      const r = findRect(src, sw, sh);
      if (r) {
        const D = opts.target ? fit(r.c.map(([x, y]) => [x * w, y * h]), pyr) : r.c.map(([x, y]) => [x * w, y * h]);
        if (D) {
        if (!tracked) { tracked = D; mode = 'find'; }
        else { const off = D.reduce((s, p, i) => s + Math.hypot(p[0] - tracked[i][0], p[1] - tracked[i][1]), 0) / 4;
          if (off < Math.max(4, w * .02)) { tracked = tracked.map((p, i) => [p[0] + (D[i][0] - p[0]) * .25, p[1] + (D[i][1] - p[1]) * .25]); disagree = 0; }
          else if (D.c != null && TS.length && bestScore(pyr[1], tracked) > D.c + .02) disagree = 0;   // what we're following matches the picture better: stay on it
          else if (++disagree >= 2) { tracked = D; disagree = 0; mode = 'find'; } }
        prevPyr = pyr; pts = seed(g, tracked);
      } }
    }
    prevPyr = pyr;
    if (!tracked) { lostFor++; if (lostFor > 4) { quad = null; sm = null; pts = []; mode = 'none'; } return quad ? { c: quad.map(([x, y]) => [x / w, y / h]), mode: 'hold' } : null; }
    lostFor = 0; quad = tracked;
    if (pts.length < 20 && frame % 6 === 0) pts = pts.concat(seed(g, quad)).slice(0, 70);
    // 3. smooth the corners
    const dt = Math.max(1 / 120, Math.min(.1, (now - lastT) / 1000 || 1 / 30)); lastT = now;
    if (!sm || mode === 'find' && sm.jump) sm = { v: quad.flat(), d: new Array(8).fill(0) };
    else for (let i = 0; i < 8; i++) { const r = euro(sm.v[i], quad.flat()[i], dt, sm.d[i]); sm.v[i] = r[0]; sm.d[i] = r[1]; }
    const out = opts.raw ? quad.map(([x, y]) => [x / w, y / h]) : [0, 1, 2, 3].map(k => [sm.v[k * 2] / w, sm.v[k * 2 + 1] / h]);
    cost = cost * .9 + (performance.now() - t0) * .1;
    if (!opts.width && cost > 14 && TW > 240) { TW = 240; prevPyr = null; pts = []; } // slower phones: smaller frames
    return { c: out, mode, points: pts.length };
  }
  return { update, reset() { quad = null; sm = null; pts = []; prevPyr = null; prevC = null; mode = 'none'; }, get mode() { return mode; } };
}

/* ── one full-screen panel, reused for the camera and the crop tool ── */
let root = null, talkOn = true, lastTalk = 0;
const VOICE = { map: null, base: '' };
try { const src = document.currentScript && document.currentScript.src; VOICE.base = src ? new URL('voice/', src).href : new URL('../voice/', location.href).href;
  if (location.protocol !== 'file:') fetch(VOICE.base + 'voice.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { VOICE.map = m; }).catch(() => {}); } catch (e) {}
let voiceAudio = null;
function speak(t, force) { if (!talkOn) return; if (!force && performance.now() - lastTalk < 2200) return; lastTalk = performance.now();
  const f = VOICE.map && VOICE.map[String(t).trim().replace(/\s+/g, ' ')]; if (f) { try { speechSynthesis.cancel(); if (voiceAudio) voiceAudio.pause(); voiceAudio = new Audio(VOICE.base + f); voiceAudio.play().catch(() => {}); return; } catch (e) {} }
  try { if (voiceAudio) voiceAudio.pause(); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1.08; speechSynthesis.speak(u); } catch (e) {} }
function panel(title) {
  if (root && root._close) root._close(true);
  const prevFocus = document.activeElement;
  const r = document.createElement('div'); r.className = 'aacap'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); r.setAttribute('aria-labelledby', 'aacapH');
  r.innerHTML = `<div class="aacap-top"><h2 id="aacapH"></h2><button type="button" class="x">Cancel</button></div><div class="aacap-view"></div><div class="aacap-bar"></div>`;
  r.querySelector('h2').textContent = title;
  document.body.appendChild(r); root = r;
  const P = { root: r, view: r.querySelector('.aacap-view'), bar: r.querySelector('.aacap-bar'), q: s => r.querySelector(s), cleanup: [] };
  const esc = e => { if (e.key === 'Escape') { e.preventDefault(); P.close(); } };
  document.addEventListener('keydown', esc);
  P.title = t => { r.querySelector('h2').textContent = t; };
  P.close = quiet => { P.cleanup.forEach(f => f()); P.cleanup = []; document.removeEventListener('keydown', esc); try { speechSynthesis.cancel(); } catch (e) {} r.remove(); if (root === r) root = null; if (!quiet && prevFocus && prevFocus.focus) prevFocus.focus(); };
  r._close = P.close;
  r.querySelector('.x').onclick = () => P.close();
  return P;
}
const RECT_ICON = `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="22" y="14" width="76" height="62" rx="3" fill="rgba(255,122,42,.12)" stroke="#ff7a2a" stroke-width="4"/>
  <path d="M10 22V8h14M110 22V8H96M10 68v14h14M110 68v14H96" fill="none" stroke="#3ddc84" stroke-width="5" stroke-linecap="round"/><path d="M54 45h12M60 39v12" stroke="#f2ede4" stroke-width="3" stroke-linecap="round"/></svg>`;

/* ── Take photo: instructions, then the camera that guides you ── */
function open(opts) {
  opts = opts || {};
  const P = panel('Take a photo');
  P.view.innerHTML = `<div class="aacap-intro">${RECT_ICON}
    <h3>Photograph anything square or rectangle</h3>
    <ul><li>A painting, poster, photo, card, book cover or a sheet of paper.</li>
    <li><b>Center it</b> in the frame, with <b>all four corners showing</b>.</li>
    <li>Hold still. It snaps on its own when it’s lined up, then you can crop it tight.</li></ul></div>`;
  P.bar.innerHTML = `<label><input type="checkbox" class="talk" ${talkOn ? 'checked' : ''}> Spoken help</label><button type="button" class="go start">Open camera</button>`;
  P.q('.talk').onchange = e => { talkOn = e.target.checked; };
  P.q('.start').onclick = () => camera(P, opts);
  P.q('.start').focus();
  speak('Take a photo of anything square or rectangle. Center it, with all four corners showing. Then press Open camera.', true);
}
function camera(P, opts) {
  P.title('Center your rectangle');
  P.view.innerHTML = `<video playsinline muted autoplay></video><canvas class="aacap-ov"></canvas>
    <p class="aacap-head">Center a square or rectangle. Keep all four corners in view.</p>
    <p class="aacap-tip" aria-live="polite">Starting the camera…</p>`;
  P.bar.innerHTML = `<label><input type="checkbox" class="auto" checked> Snap when steady</label>
    <button type="button" class="shoot" aria-label="Take photo now">Take photo</button>
    <label><input type="checkbox" class="talk" ${talkOn ? 'checked' : ''}> Spoken help</label>`;
  P.q('.talk').onchange = e => { talkOn = e.target.checked; };
  const video = P.q('video'), ov = P.q('.aacap-ov'), tip = P.q('.aacap-tip'), view = P.view;
  let stream = null, raf = 0, quad = null, steady = 0, lastQ = null, lastTip = '', nextBeep = 0, stopped = false, lastDet = 0;
  const stop = () => { stopped = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
  P.cleanup.push(stop);
  const say = (t, good) => { if (t === lastTip) return; lastTip = t; tip.textContent = t; tip.classList.toggle('good', !!good); speak(t); };
  P.q('.shoot').onclick = () => snap();
  P.q('.shoot').focus();
  prevC = null;
  const box = () => { const r = view.getBoundingClientRect(), vw = video.videoWidth, vh = video.videoHeight; const s = Math.min(r.width / vw, r.height / vh); const w = vw * s, h = vh * s; return { x: (r.width - w) / 2, y: (r.height - h) / 2, w, h, rw: r.width, rh: r.height }; };
  function drawOverlay() {
    const b = box(), dpr = devicePixelRatio || 1; ov.width = b.rw * dpr; ov.height = b.rh * dpr; const c = ov.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, b.rw, b.rh);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    // a guide frame in the middle, so people know where to aim
    const gw = b.w * .72, gh = b.h * .62; c.strokeStyle = 'rgba(242,237,228,.55)'; c.lineWidth = 3; c.setLineDash([]);
    const L2 = Math.min(gw, gh) * .14; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { const x = cx + sx * gw / 2, y = cy + sy * gh / 2; c.beginPath(); c.moveTo(x - sx * L2, y); c.lineTo(x, y); c.lineTo(x, y - sy * L2); c.stroke(); });
    c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 14, cy); c.lineTo(cx + 14, cy); c.moveTo(cx, cy - 14); c.lineTo(cx, cy + 14); c.stroke();
    if (!quad) return;
    const Pq = quad.map(([x, y]) => [b.x + x * b.w, b.y + y * b.h]), ok = steady > 0;
    c.lineWidth = 5; c.strokeStyle = ok ? '#3ddc84' : '#ff7a2a'; c.fillStyle = ok ? 'rgba(61,220,132,.14)' : 'rgba(255,122,42,.1)';
    c.beginPath(); Pq.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke();
    for (const p of Pq) { c.beginPath(); c.arc(p[0], p[1], 9, 0, Math.PI * 2); c.fillStyle = '#f2ede4'; c.fill(); }
    if (ok) { c.strokeStyle = '#3ddc84'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, steady / 1.2)); c.stroke(); }
  }
  function guide(dt) {
    if (!quad) { steady = 0; say('Point at a square or rectangle. Center it, with all four corners in view.'); if (performance.now() > nextBeep) { beep(330, .08, .05); nextBeep = performance.now() + 1100; } return; }
    const area = quadArea(quad), mx = quad.reduce((s, p) => s + p[0], 0) / 4, my = quad.reduce((s, p) => s + p[1], 0) / 4, off = Math.hypot(mx - .5, my - .5);
    const move = lastQ ? quad.reduce((s, p, i) => s + dist(p, lastQ[i]), 0) / 4 : 1; lastQ = quad;
    let t = '', good = false;
    if (area < .18) t = 'Move closer.';
    else if (quad.some(p => p[0] < .02 || p[0] > .98 || p[1] < .02 || p[1] > .98) || area > .9) t = 'Step back a little. Keep all four corners in view.';
    else if (off > .1) { const h = mx < .45 ? 'left' : mx > .55 ? 'right' : '', v = my < .45 ? 'up' : my > .55 ? 'down' : ''; t = 'Move your phone ' + [h, v].filter(Boolean).join(' and ') + ' to center it.'; }
    else { t = 'Centered. Hold still…'; good = true; }
    say(t, good);
    if (good && move < .012) steady += dt; else if (!good) steady = 0; else steady = Math.max(0, steady - dt);
    if (performance.now() > nextBeep) { const score = clamp(area / .5, 0, 1) * (1 - clamp(off / .3, 0, 1)); beep(440 + score * 660 + steady * 300, .07, .08); nextBeep = performance.now() + (good ? 260 : 700); }
    if (good && steady >= 1.2 && P.q('.auto') && P.q('.auto').checked) snap();
  }
  let last = performance.now();
  function loop(now) {
    if (stopped) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (video.readyState >= 2 && now - lastDet > 110) { lastDet = now; const r = detect(video, video.videoWidth, video.videoHeight); quad = r ? r.c : null; guide(.11); }
    drawOverlay();
  }
  function snap() {
    if (!video.videoWidth || stopped) return;
    beep(1320, .12, .15); setTimeout(() => beep(1760, .18, .12), 90); buzz([40, 30, 60]);
    const W0 = video.videoWidth, H0 = video.videoHeight, ph = document.createElement('canvas'); ph.width = W0; ph.height = H0; ph.getContext('2d').drawImage(video, 0, 0, W0, H0);
    const Q = quad ? quad.map(p => p.slice()) : null; stop();
    cropIn(P, ph, Q, opts, () => camera(P, opts), 'Retake');
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('This browser can’t open the camera. Use Upload image instead.'); return; }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
    .then(s => { if (stopped) { s.getTracks().forEach(t => t.stop()); return; } stream = s; video.srcObject = s; video.play().catch(() => {}); raf = requestAnimationFrame(loop); })
    .catch(() => say('The camera wasn’t allowed. Use Upload image instead, or allow the camera and try again.'));
}

/* ── Crop: four corners onto the rectangle, then straighten ── */
function crop(src, opts) {
  opts = opts || {};
  const im = new Image();
  im.onload = () => {
    const k = Math.min(1, 2200 / Math.max(im.naturalWidth, im.naturalHeight)), ph = document.createElement('canvas');
    ph.width = Math.round(im.naturalWidth * k); ph.height = Math.round(im.naturalHeight * k); ph.getContext('2d').drawImage(im, 0, 0, ph.width, ph.height);
    prevC = null; const r = detect(ph, ph.width, ph.height);
    const P = panel('Crop your image');
    cropIn(P, ph, r ? r.c : null, opts, null, null);
  };
  im.onerror = () => opts.onDone && opts.onDone(src);
  im.src = src;
}
function cropIn(P, ph, Qin, opts, again, againLabel) {
  const W0 = ph.width, H0 = ph.height, found = !!Qin;
  const FULL = () => [[0, 0], [1, 0], [1, 1], [0, 1]];
  let Q = Qin ? Qin.map(p => p.slice()) : [[.08, .08], [.92, .08], [.92, .92], [.08, .92]];
  P.title('Crop to your rectangle');
  P.view.innerHTML = ''; ph.className = 'aacap-ph'; P.view.appendChild(ph);
  const ov = document.createElement('canvas'); ov.className = 'aacap-ov'; P.view.appendChild(ov);
  const head = document.createElement('p'); head.className = 'aacap-head';
  head.innerHTML = '<b>Crop:</b> drag the 4 orange corners onto the corners of your square or rectangle, as close to its edges as you can.'; P.view.appendChild(head);
  const tip = document.createElement('p'); tip.className = 'aacap-tip good'; tip.setAttribute('aria-live', 'polite');
  tip.textContent = found ? 'We found the edges. Check the corners, then press Crop and straighten.' : 'Drag each corner onto a corner of your rectangle.'; P.view.appendChild(tip);
  speak(found ? 'Found the edges. Check the four corners, then press Crop and straighten.' : 'Drag the four corners onto the corners of your rectangle.', true);
  P.bar.innerHTML = `${again ? `<button type="button" class="again">${againLabel}</button>` : ''}
    <button type="button" class="find">Find edges for me</button>
    <button type="button" class="whole">Use without cropping</button>
    <button type="button" class="go use">Crop and straighten</button>`;
  const bx = () => { const r = P.view.getBoundingClientRect(), pr = ph.getBoundingClientRect(); return { x: pr.left - r.left, y: pr.top - r.top, w: pr.width, h: pr.height, rw: r.width, rh: r.height }; };
  let drag = -1, ptr = null;
  const NAMES = ['Top left', 'Top right', 'Bottom right', 'Bottom left'];
  function draw() {
    const b = bx(), dpr = devicePixelRatio || 1; ov.width = b.rw * dpr; ov.height = b.rh * dpr; const c = ov.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const Pq = Q.map(([x, y]) => [b.x + x * b.w, b.y + y * b.h]);
    // darken everything outside the crop
    c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.rect(0, 0, b.rw, b.rh); c.moveTo(Pq[0][0], Pq[0][1]); for (let i = 3; i >= 1; i--) c.lineTo(Pq[i][0], Pq[i][1]); c.closePath(); c.fill('evenodd');
    c.strokeStyle = '#3ddc84'; c.lineWidth = 3; c.beginPath(); Pq.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
    // thirds inside the crop help line things up
    c.strokeStyle = 'rgba(242,237,228,.35)'; c.lineWidth = 1;
    for (const t of [1 / 3, 2 / 3]) { const a = lerp2(Pq[0], Pq[1], t), b2 = lerp2(Pq[3], Pq[2], t), d = lerp2(Pq[0], Pq[3], t), e = lerp2(Pq[1], Pq[2], t); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.moveTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.stroke(); }
    Pq.forEach((p, i) => { c.beginPath(); c.arc(p[0], p[1], drag === i ? 20 : 15, 0, Math.PI * 2); c.fillStyle = 'rgba(255,122,42,.95)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke(); });
    // a magnifier while dragging, placed away from the finger
    if (drag >= 0) {
      const p = Pq[drag], R = Math.min(70, b.w * .18), mx = p[0] < b.rw / 2 ? p[0] + R + 30 : p[0] - R - 30, my = clamp(p[1] - R - 30, R + 6, b.rh - R - 6), zoom = 3;
      c.save(); c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.clip();
      const sx = Q[drag][0] * W0, sy = Q[drag][1] * H0, sw = (R * 2 / zoom) * (W0 / b.w), sh = (R * 2 / zoom) * (H0 / b.h);
      c.fillStyle = '#000'; c.fillRect(mx - R, my - R, R * 2, R * 2); c.drawImage(ph, sx - sw / 2, sy - sh / 2, sw, sh, mx - R, my - R, R * 2, R * 2);
      c.strokeStyle = '#ff7a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx - R, my); c.lineTo(mx + R, my); c.moveTo(mx, my - R); c.lineTo(mx, my + R); c.stroke(); c.restore();
      c.beginPath(); c.arc(mx, my, R, 0, Math.PI * 2); c.lineWidth = 4; c.strokeStyle = '#f2ede4'; c.stroke();
    }
  }
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const pt = e => { const r = ov.getBoundingClientRect(), b = bx(); return [clamp((e.clientX - r.left - b.x) / b.w, 0, 1), clamp((e.clientY - r.top - b.y) / b.h, 0, 1)]; };
  ov.addEventListener('pointerdown', e => { const p = pt(e), b = bx(); let bd = 64; drag = -1; Q.forEach((c2, i) => { const d2 = Math.hypot((c2[0] - p[0]) * b.w, (c2[1] - p[1]) * b.h); if (d2 < bd) { bd = d2; drag = i; } });
    if (drag >= 0) { ptr = { id: e.pointerId, off: [Q[drag][0] - p[0], Q[drag][1] - p[1]] }; ov.setPointerCapture(e.pointerId); beep(660, .04, .05); draw(); } });
  ov.addEventListener('pointermove', e => { if (drag < 0 || !ptr || e.pointerId !== ptr.id) return; const p = pt(e); Q[drag] = [clamp(p[0] + ptr.off[0], 0, 1), clamp(p[1] + ptr.off[1], 0, 1)]; draw(); });
  const up = () => { if (drag >= 0) { beep(880, .05, .06); tip.textContent = NAMES[drag] + ' corner set.'; } drag = -1; ptr = null; draw(); };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  // keyboard: Tab to a corner and use the arrow keys (Shift for bigger steps)
  const kb = document.createElement('div'); kb.className = 'aa-sr';
  NAMES.forEach((n, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = n + ' crop corner. Arrow keys move it, Shift for bigger steps.';
    b.onkeydown = e => { const s = e.shiftKey ? .02 : .004, m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key]; if (!m) return; e.preventDefault(); Q[i] = [clamp(Q[i][0] + m[0], 0, 1), clamp(Q[i][1] + m[1], 0, 1)]; draw(); };
    b.onfocus = () => { drag = i; draw(); }; b.onblur = () => { drag = -1; draw(); };
    kb.appendChild(b); });
  P.bar.prepend(kb);
  addEventListener('resize', draw); P.cleanup.push(() => removeEventListener('resize', draw));
  if (ph.complete === false) ph.onload = draw; requestAnimationFrame(draw); setTimeout(draw, 120);
  const finish = url => { const cb = opts.onDone; P.close(); cb && cb(url); };
  if (again) P.q('.again').onclick = () => again();
  P.q('.find').onclick = () => { prevC = null; const r = detect(ph, W0, H0); if (r) { Q = r.c.map(p => p.slice()); tip.textContent = 'Found the edges. Check the corners.'; speak('Found the edges.', true); buzz(30); } else { Q = [[.08, .08], [.92, .08], [.92, .92], [.08, .92]]; tip.textContent = 'Couldn’t find clear edges. Drag the corners yourself.'; speak('Couldn’t find clear edges. Drag the corners yourself.', true); } draw(); };
  P.q('.whole').onclick = () => { const k = Math.min(1, 1400 / Math.max(W0, H0)), c = document.createElement('canvas'); c.width = Math.round(W0 * k); c.height = Math.round(H0 * k); c.getContext('2d').drawImage(ph, 0, 0, c.width, c.height); finish(c.toDataURL('image/jpeg', .9)); };
  P.q('.use').onclick = () => { P.q('.use').textContent = 'Straightening…'; setTimeout(() => finish(straighten(ph, W0, H0, Q, 1400)), 30); };
  P.q('.use').focus();
}

/* ── record from the microphone ── */
let micStream = null, active = null;
const MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
function recordButton(label, onAudio, cls) {
  const b = document.createElement('button'); b.type = 'button'; b.className = (cls || 'act') + ' aarec'; b.innerHTML = `<i aria-hidden="true"></i><span>${label}</span>`;
  const sp = b.querySelector('span'); let rec = null, t0 = 0, tick = 0;
  b.onclick = async () => {
    if (rec) { rec.stop(); return; }
    if (active) active.stop();
    if (!window.MediaRecorder || !navigator.mediaDevices) { sp.textContent = 'Recording isn’t available here'; return; }
    try { if (!micStream || !micStream.active) micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { sp.textContent = 'Microphone not allowed'; setTimeout(() => { sp.textContent = label; }, 2500); return; }
    const chunks = []; rec = new MediaRecorder(micStream, MIME ? { mimeType: MIME } : undefined); active = rec; t0 = performance.now();
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => { clearInterval(tick); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); const secs = Math.round((performance.now() - t0) / 1000); rec = null; active = null;
      const blob = new Blob(chunks, { type: (chunks[0] && chunks[0].type) || MIME || 'audio/webm' });
      if (blob.size < 800) { sp.textContent = 'Too short. ' + label; return; }
      const fr = new FileReader(); fr.onload = () => { sp.textContent = `Recorded ${secs} s · record again`; onAudio(fr.result, secs); }; fr.readAsDataURL(blob); };
    rec.start(); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); beep(880, .06, .08);
    tick = setInterval(() => { const s = (performance.now() - t0) / 1000; sp.textContent = `Stop · ${s.toFixed(0)} s`; if (s > 60) rec && rec.stop(); }, 250);
  };
  return b;
}

window.AACapture = { open, crop, recordButton, straighten, detect, homography, tracker, resetTracking: () => { prevC = null; } };
})();
