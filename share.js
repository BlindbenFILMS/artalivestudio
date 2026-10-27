/* ─────────────────────────────────────────────────────────────
   ART ALIVE: capture and share
   A photo of the moment, exactly as it looks on screen: the camera picture, with the living art laid on it (even the parts
   drawn in perspective), and a small "Made with Art Alive" credit. Then share it (Messages, Instagram…) or save it.

   AAShare.photo({ w, h, base: [video or canvas, ...], layers: [{ src, quad, alpha }], cover })
       base    drawn over the whole picture, in order (the camera, then any full-screen drawing)
       layers  each one's corners on the picture: quad = [[x,y] top-left, top-right, bottom-right, bottom-left]
       cover   true when the camera fills the screen like object-fit: cover (the demo), false when it's fitted inside
     → a canvas
   AAShare.sheet(canvas, { name, title, onShare, onSave })   the preview with Share and Save buttons
   AAShare.button(label)  a ready-made "Photo" button for a camera bar
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
    for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
    return b.map((v, i) => v / A[i][i]).concat([1]);
  }
  function inv3(m) { const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
    return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det); }

  // one WebGL canvas, reused: draws a picture into any four corners, in true perspective
  let G = null;
  function glLayer(w, h) {
    if (!G) { const c = document.createElement('canvas'), gl = c.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true }); if (!gl) return null;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision highp float;uniform sampler2D T;uniform mat3 Hi;uniform float H,A;void main(){vec3 q=Hi*vec3(gl_FragCoord.x,H-gl_FragCoord.y,1.);vec2 uv=q.xy/q.z;if(q.z<=0.||uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)discard;vec4 c=texture2D(T,uv);gl_FragColor=vec4(c.rgb,c.a*A);}'));
      gl.linkProgram(pr); gl.useProgram(pr); const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      G = { c, gl, uHi: gl.getUniformLocation(pr, 'Hi'), uH: gl.getUniformLocation(pr, 'H'), uA: gl.getUniformLocation(pr, 'A') }; }
    if (G.c.width !== w || G.c.height !== h) { G.c.width = w; G.c.height = h; }
    return G;
  }

  function photo(o) {
    const w = Math.round(o.w), h = Math.round(o.h), out = document.createElement('canvas'); out.width = w; out.height = h; const x = out.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    for (const b of o.base || []) { if (!b) continue; const sw = b.videoWidth || b.width, sh = b.videoHeight || b.height; if (!sw || !sh) continue;
      if (o.cover) { const s = Math.max(w / sw, h / sh); x.drawImage(b, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s); } else x.drawImage(b, 0, 0, w, h); }
    for (const L of o.layers || []) { if (!L || !L.src || !L.quad) continue; const sw = L.src.videoWidth || L.src.width, sh = L.src.videoHeight || L.src.height; if (!sw || !sh) continue;
      const g = glLayer(w, h); if (!g) continue; const gl = g.gl;
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      try { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L.src); } catch (e) { continue; }   // a picture from another site without permission: left out
      const I = inv3(homography([[0, 0], [1, 0], [1, 1], [0, 1]], L.quad));   // screen → picture
      gl.uniformMatrix3fv(g.uHi, false, new Float32Array([I[0], I[3], I[6], I[1], I[4], I[7], I[2], I[5], I[8]])); gl.uniform1f(g.uH, h); gl.uniform1f(g.uA, L.alpha == null ? 1 : L.alpha);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLES, 0, 3);
      x.drawImage(g.c, 0, 0); }
    // the credit, small, bottom corner
    const fs = Math.max(13, Math.round(Math.min(w, h) * .028)), pad = Math.round(fs * .6), t1 = 'Made with Art Alive', t2 = 'artalivestudio.com';
    x.font = `800 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; const w1 = x.measureText(t1).width; x.font = `400 ${Math.round(fs * .8)}px "Atkinson Hyperlegible", Verdana, sans-serif`; const w2 = x.measureText(t2).width;
    const bw = Math.max(w1, w2) + pad * 2, bh = fs * 2.1 + pad * 1.4, bx = w - bw - pad, by = h - bh - pad;
    x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); if (x.roundRect) x.roundRect(bx, by, bw, bh, fs * .6); else x.rect(bx, by, bw, bh); x.fill();
    x.fillStyle = '#ff7a2a'; x.font = `800 ${fs}px Archivo, "Arial Black", Arial, sans-serif`; x.textBaseline = 'top'; x.fillText(t1, bx + pad, by + pad * .7);
    x.fillStyle = '#f2ede4'; x.font = `400 ${Math.round(fs * .8)}px "Atkinson Hyperlegible", Verdana, sans-serif`; x.fillText(t2, bx + pad, by + pad * .7 + fs * 1.2);
    return out;
  }

  const CSS = `.aash{position:fixed;inset:0;z-index:10000;background:rgba(5,7,10,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
.aash img{max-width:100%;max-height:68vh;border-radius:12px;box-shadow:0 20px 50px -20px #000;display:block}
.aash .row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.aash button,.aash a{min-height:52px;padding:0 24px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:800 15px/1 Archivo,"Arial Black",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}
.aash .pri{background:#ff7a2a;border-color:#ff7a2a;color:#14100c}
.aash button:focus-visible,.aash a:focus-visible{outline:3px solid #2aa8e0;outline-offset:3px}
.aash p{margin:0;color:#c9ced6;font:15px/1.4 "Atkinson Hyperlegible",Verdana,sans-serif;text-align:center}
.aaflash{position:fixed;inset:0;z-index:9999;background:#fff;opacity:.85;pointer-events:none;transition:opacity .35s}
.aa-photo-btn{display:inline-flex;align-items:center;gap:8px}
.aash [hidden]{display:none!important}`;
  let styled = false; const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };
  function flash() { style(); const f = document.createElement('div'); f.className = 'aaflash'; document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0'; setTimeout(() => f.remove(), 400); }); }

  function sheet(canvas, o) {
    o = o || {}; style();
    const name = (o.name || 'art-alive') .replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.jpg';
    const ov = document.createElement('div'); ov.className = 'aash'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your photo');
    ov.innerHTML = '<img alt=""><p class="msg" aria-live="polite"></p><div class="row"><button type="button" class="pri" data-x="share">Share</button><a data-x="save">Save photo</a><button type="button" data-x="close">Back</button></div>';
    const img = ov.querySelector('img'), msg = ov.querySelector('.msg'), shareB = ov.querySelector('[data-x=share]'), saveA = ov.querySelector('[data-x=save]');
    img.alt = o.title ? 'Your photo of ' + o.title + ', alive' : 'Your photo';
    let blob = null, url = '';
    const prevFocus = document.activeElement, close = () => { ov.remove(); if (url) URL.revokeObjectURL(url); removeEventListener('keydown', esc, true); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
    const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }; addEventListener('keydown', esc, true);
    ov.querySelector('[data-x=close]').onclick = close;
    document.body.appendChild(ov);
    canvas.toBlob(b => { blob = b; if (!b) { msg.textContent = 'Couldn’t make the photo here.'; return; } url = URL.createObjectURL(b); img.src = url; saveA.href = url; saveA.download = name;
      const file = new File([b], name, { type: 'image/jpeg' });
      const canShare = navigator.canShare && navigator.canShare({ files: [file] });
      if (!canShare) shareB.hidden = true;
      shareB.onclick = async () => { try { await navigator.share({ files: [file], title: o.title || 'Art Alive', text: o.text || 'Made with Art Alive · artalivestudio.com' }); msg.textContent = 'Shared!'; if (o.onShare) o.onShare(); }
        catch (e) { if (e && e.name !== 'AbortError') msg.textContent = 'Sharing didn’t work here. Save the photo instead.'; } };
      saveA.onclick = () => { if (o.onSave) o.onSave(); msg.textContent = 'Saved. Look in your downloads or photos.'; };
      (canShare ? shareB : saveA).focus();
    }, 'image/jpeg', .9);
    return ov;
  }
  function button(label) { style(); const b = document.createElement('button'); b.type = 'button'; b.className = 'aa-photo-btn';
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span></span>';
    b.querySelector('span').textContent = label || 'Photo'; return b; }
  window.AAShare = { photo, sheet, button, flash, homography };
})();
