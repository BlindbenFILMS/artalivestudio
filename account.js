/* ─────────────────────────────────────────────────────────────
   ART ALIVE ACCOUNTS
   Sign in by email link, and save, list, rename, file, copy and delete projects.
   Uses Supabase (settings in site-config.js). No need to edit this file.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const CFG = window.ART_ALIVE || {};
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const ROOT = (function () { const s = document.currentScript; return s ? new URL('.', s.src).href : location.origin + '/'; })();
  const configured = !!(CFG.supabaseUrl && CFG.supabaseKey);
  const REF = configured ? (CFG.supabaseUrl.match(/https:\/\/([^.]+)\./) || [])[1] : '';
  let client = null, ready = null;

  function load() {
    if (ready) return ready;
    ready = new Promise((ok, no) => {
      if (!configured) return no(new Error('Accounts are not set up yet.'));
      if (window.supabase && window.supabase.createClient) return ok();
      const s = document.createElement('script'); s.src = LIB; s.onload = ok; s.onerror = () => no(new Error('Couldn’t reach the account service. Check your connection and try again.'));
      document.head.appendChild(s);
    }).then(() => (client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })));
    ready.catch(() => { ready = null; });
    return ready;
  }
  // a quick look for a saved sign-in, so pages for visitors never load the account library
  function maybeSignedIn() { try { return !!(REF && localStorage.getItem('sb-' + REF + '-auth-token')); } catch (e) { return false; } }
  async function user() { const c = await load(); const { data } = await c.auth.getSession(); return data && data.session ? data.session.user : null; }
  async function signIn(email, next) {
    const c = await load();
    const back = ROOT + 'projects.html' + (next ? '?next=' + encodeURIComponent(next) : '');
    const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: back, shouldCreateUser: CFG.openSignup !== false } });
    if (error) throw error;
  }
  async function signOut() { const c = await load(); await c.auth.signOut(); }

  /* ── pictures and recordings live in storage; the project keeps a pointer ("aa-media:…") ── */
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'audio/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'video/mp4': 'mp4', 'video/webm': 'webm' };
  const isData = v => typeof v === 'string' && v.startsWith('data:') && v.length > 1200;
  function dataToBlob(d) { const i = d.indexOf(','), head = d.slice(5, i), mime = head.split(';')[0] || 'application/octet-stream', b64 = /;base64/.test(head), body = d.slice(i + 1);
    if (!b64) return new Blob([decodeURIComponent(body)], { type: mime });
    const bin = atob(body), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k); return new Blob([u], { type: mime }); }
  const blobToData = b => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); });
  const sent = new Map();   // media already uploaded this visit: path → the exact data, so unchanged files aren't sent again
  async function stashMedia(c, obj, base) {
    const jobs = [];
    (function walk(o, path) { for (const k of Object.keys(o)) { const v = o[k], p = path ? path + '.' + k : k;
      if (isData(v)) { const blob = dataToBlob(v), name = p.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80) + '.' + (EXT[blob.type] || 'bin'), full = base + name; o[k] = 'aa-media:' + full;
        if (sent.get(full) !== v) jobs.push(c.storage.from('media').upload(full, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' }).then(({ error }) => { if (error) throw error; sent.set(full, v); })); }
      else if (v && typeof v === 'object') walk(v, p); } })(obj, '');
    await Promise.all(jobs);
  }
  async function fetchMedia(c, obj) {
    const jobs = [];
    (function walk(o) { for (const k of Object.keys(o)) { const v = o[k];
      if (typeof v === 'string' && v.startsWith('aa-media:')) { const path = v.slice(9);
        jobs.push(c.storage.from('media').download(path).then(async ({ data, error }) => { if (error) throw error; const d = await blobToData(data); o[k] = d; sent.set(path, d); })); }
      else if (v && typeof v === 'object') walk(v); } })(obj);
    await Promise.all(jobs);
  }
  function thumbBlob(src) { return new Promise(ok => { if (!src) return ok(null); const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { try { const s = Math.min(1, 480 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); cv.toBlob(b => ok(b), 'image/jpeg', .82); } catch (e) { ok(null); } };
    im.onerror = () => ok(null); im.src = src; }); }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => { const r = Math.random() * 16 | 0; return (ch === 'x' ? r : (r & 3 | 8)).toString(16); }));

  async function need() { const c = await load(); const u = await user(); if (!u) { const e = new Error('Please log in first.'); e.code = 'signin'; throw e; } return [c, u]; }

  /* save (new or existing): { id?, kind: 'studio' | 'game', title, data, thumbSrc?, folder? } → id */
  async function saveProject(p) {
    const [c, u] = await need(); const id = p.id || uuid(), base = u.id + '/' + id + '/';
    const data = JSON.parse(JSON.stringify(p.data || {})); await stashMedia(c, data, base);
    const row = { id, kind: p.kind, title: (p.title || 'Untitled').slice(0, 120), data };
    if (p.folder !== undefined) row.folder = (p.folder || '').slice(0, 60);
    const tb = await thumbBlob(p.thumbSrc);
    if (tb) { const { error } = await c.storage.from('media').upload(base + 'thumb.jpg', tb, { upsert: true, contentType: 'image/jpeg' }); if (!error) row.thumb = base + 'thumb.jpg'; }
    const { error } = await c.from('projects').upsert(row); if (error) throw error;
    return id;
  }
  async function listProjects() {
    const [c] = await need();
    const { data, error } = await c.from('projects').select('id,kind,title,folder,thumb,updated_at').order('updated_at', { ascending: false }); if (error) throw error;
    const paths = data.filter(r => r.thumb).map(r => r.thumb);
    if (paths.length) { const { data: urls } = await c.storage.from('media').createSignedUrls(paths, 3600); const m = new Map((urls || []).map(x => [x.path, x.signedUrl])); data.forEach(r => { r.thumbUrl = r.thumb ? m.get(r.thumb) || '' : ''; }); }
    const { data: pubs } = await c.from('publications').select('code,project_id,live,views'); const pm = new Map((pubs || []).map(x => [x.project_id, x])); data.forEach(r => { r.pub = pm.get(r.id) || null; });
    return data;
  }
  async function getProject(id) {
    const [c] = await need();
    const { data, error } = await c.from('projects').select('*').eq('id', id).maybeSingle(); if (error) throw error; if (!data) throw new Error('That project wasn’t found in your account.');
    await fetchMedia(c, data.data); return data;
  }
  async function updateProject(id, fields) { const [c] = await need(); const f = {};
    if (fields.title !== undefined) f.title = String(fields.title).slice(0, 120) || 'Untitled'; if (fields.folder !== undefined) f.folder = String(fields.folder).slice(0, 60);
    const { error } = await c.from('projects').update(f).eq('id', id); if (error) throw error; }
  async function deleteProject(id) { const [c, u] = await need(), dir = u.id + '/' + id;
    const { data: files } = await c.storage.from('media').list(dir, { limit: 1000 }); if (files && files.length) await c.storage.from('media').remove(files.map(f => dir + '/' + f.name));
    const { error } = await c.from('projects').delete().eq('id', id); if (error) throw error; }
  async function duplicateProject(id) { const [c] = await need(); const p = await getProject(id); let thumbSrc = '';
    if (p.thumb) { const { data } = await c.storage.from('media').download(p.thumb); if (data) thumbSrc = await blobToData(data); }
    return saveProject({ kind: p.kind, title: (p.title + ' (copy)').slice(0, 120), folder: p.folder, data: p.data, thumbSrc }); }

  /* publishing: a short code gives each project a public link and QR code; visitors see the latest saved version */
  // links: through the short share address when it is set up (it adds the picture and title to link previews), otherwise straight to the site
  const PUB_URL = (code, coll) => CFG.shareBase ? CFG.shareBase.replace(/\/?$/, '/') + (coll ? 'k/' : '') + code : ROOT + 'p/?' + (coll ? 'k=' : 'c=') + code;
  function newCode() { const A = 'abcdefghjkmnpqrstuvwxyz23456789', u = new Uint8Array(8); crypto.getRandomValues(u); return Array.from(u, x => A[x % A.length]).join(''); }
  async function publication(id) { const [c] = await need(); const { data, error } = await c.from('publications').select('code,live,views').eq('project_id', id).maybeSingle(); if (error) throw error; return data; }
  async function publishProject(id) { const [c] = await need(); const ex = await publication(id);
    if (ex) { if (!ex.live) { const { error } = await c.from('publications').update({ live: true }).eq('project_id', id); if (error) throw limitError(error); } return ex.code; }
    for (let k = 0; k < 6; k++) { const code = newCode(); const { error } = await c.from('publications').insert({ code, project_id: id }); if (!error) return code;
      if (!/duplicate|unique|23505/i.test((error.message || '') + (error.code || ''))) throw limitError(error); }
    throw new Error('Couldn’t make a link. Please try again.'); }
  // "you've reached your plan's limit" comes back from the database as PLAN_LIMIT:<number>
  function limitError(error) { const m = /PLAN_LIMIT:(\d+)/.exec(error && error.message || ''); if (!m) return error;
    const e = new Error('Your plan publishes up to ' + m[1] + ' pieces at a time. Unpublish one, or move up a plan to publish more.'); e.code = 'limit'; e.limit = +m[1]; return e; }
  async function myPlan() { const [c] = await need(); const { data, error } = await c.rpc('my_plan'); if (error) return null; return Array.isArray(data) ? data[0] : data; }
  async function unpublishProject(id) { const [c] = await need(); const { error } = await c.from('publications').update({ live: false }).eq('project_id', id); if (error) throw error; }
  // for visitors: no account needed
  async function published(code) { const c = await load(); const { data, error } = await c.rpc('published', { c: code }); if (error) throw error; const row = Array.isArray(data) ? data[0] : data; return row || null; }
  async function fillMedia(data) { const c = await load(); await fetchMedia(c, data); return data; }
  function countView(code) { load().then(c => c.rpc('count_view', { c: code })).then(() => {}, () => {}); }
  async function getPublished(code) { const row = await published(code); if (!row) return null; await fillMedia(row.data); countView(code); return row; }

  /* picture fingerprints: a tiny 24×24 grey version of each picture, so the camera can tell up to 50 pieces apart */
  const FPN = 24, FPI = .1;   // grid size, and how much of each edge to ignore (frames, mats, tracking slop)
  function fpNorm(a) { let m = 0; for (const x of a) m += x; m /= a.length; let v = 0; for (const x of a) v += (x - m) * (x - m); v = Math.sqrt(v / a.length) || 1; return a.map(x => (x - m) / v); }
  // a fingerprint = 24×24 brightness pattern + 12×12 colour pattern (two colour-difference channels), each evened out
  const FPC = 12;
  function fpFromRGBA(px, W, H, at) {   // at(u, v) → [x, y] pixel position for a point of the picture (u, v from 0 to 1)
    const g = new Float32Array(FPN * FPN), r = new Float32Array(FPC * FPC), b = new Float32Array(FPC * FPC), S = 3;
    for (let j = 0; j < FPN; j++) for (let i = 0; i < FPN; i++) { let sg = 0, sr = 0, sb = 0;
      for (let sj = 0; sj < S; sj++) for (let si = 0; si < S; si++) { const u = FPI + (1 - 2 * FPI) * (i + (si + .5) / S) / FPN, v = FPI + (1 - 2 * FPI) * (j + (sj + .5) / S) / FPN, [x, y] = at(u, v);
        const k = (Math.max(0, Math.min(H - 1, y | 0)) * W + Math.max(0, Math.min(W - 1, x | 0))) * 4, R = px[k], G = px[k + 1], B = px[k + 2];
        sg += R * .3 + G * .59 + B * .11; sr += R - G; sb += (R + G) / 2 - B; }
      g[j * FPN + i] = sg; const ci = ((j * FPC / FPN) | 0) * FPC + ((i * FPC / FPN) | 0); r[ci] += sr; b[ci] += sb; }
    const c = new Float32Array(FPC * FPC * 2); c.set(r); c.set(b, FPC * FPC); const out = new Float32Array(FPN * FPN + FPC * FPC * 2); out.set(fpNorm(g)); out.set(fpNorm(c), FPN * FPN); return out; }
  function fpFromImage(src, w, h) { const n = 96, cv = document.createElement('canvas'); cv.width = cv.height = n; const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h, 0, 0, n, n); const px = g.getImageData(0, 0, n, n).data; return fpFromRGBA(px, n, n, (u, v) => [u * n, v * n]); }
  function fpEncode(f) { let s = ''; for (const x of f) s += String.fromCharCode(Math.max(0, Math.min(255, Math.round(x * 40) + 128))); return btoa(s); }
  function fpDecode(b) { const s = atob(b), f = new Float32Array(s.length); for (let i = 0; i < s.length; i++) f[i] = (s.charCodeAt(i) - 128) / 40; return f; }
  // read the inside of a four-corner shape in a camera frame (RGBA pixels, W × H) as a fingerprint
  function fpFromQuad(px, W, H, q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q, dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1 || 1e-9;
    const g7 = (dx3 * dy2 - dx2 * dy3) / den, h8 = (dx1 * dy3 - dx3 * dy1) / den, a = x1 - x0 + g7 * x1, b = x3 - x0 + h8 * x3, c = x0, d = y1 - y0 + g7 * y1, e = y3 - y0 + h8 * y3, f = y0;
    return fpFromRGBA(px, W, H, (u, v) => { const z = g7 * u + h8 * v + 1; return [(a * u + b * v + c) / z, (d * u + e * v + f) / z]; }); }
  // how alike two fingerprints are: brightness pattern counts most, colour helps tell look-alikes apart (−1 … 1)
  function fpScore(a, b) { const n = FPN * FPN; let sg = 0; for (let i = 0; i < n; i++) sg += a[i] * b[i]; sg /= n;
    if (a.length < n + 2 || b.length < n + 2) return sg; let sc = 0; const m = Math.min(a.length, b.length); for (let i = n; i < m; i++) sc += a[i] * b[i]; sc /= (m - n); return .65 * sg + .35 * sc; }
  const FP = { fromImage: fpFromImage, fromQuad: fpFromQuad, encode: fpEncode, decode: fpDecode, score: fpScore, N: FPN };

  /* collections: up to 50 published pieces behind one QR code */
  async function listCollections() { const [c] = await need(); const { data, error } = await c.from('collections').select('id,title,code,live,views,items,updated_at').order('updated_at', { ascending: false }); if (error) throw error; return data || []; }
  async function saveCollection({ id, title, projectIds, onProgress }) {
    const [c] = await need(); if (projectIds.length > 50) throw new Error('A collection can hold up to 50 pieces.');
    const items = []; let n = 0;
    for (const pid of projectIds) { if (onProgress) onProgress(++n, projectIds.length);
      await publishProject(pid);   // every piece in a collection is published, so visitors can open it
      const { data: row } = await c.from('projects').select('thumb').eq('id', pid).maybeSingle(); let fp = null, aspect = 1;
      if (row && row.thumb) { const { data: blob } = await c.storage.from('media').download(row.thumb);
        if (blob) { const bm = await createImageBitmap(blob); fp = fpEncode(fpFromImage(bm, bm.width, bm.height)); aspect = bm.width / bm.height; } }
      items.push({ project_id: pid, fp, aspect: +aspect.toFixed(4) }); }
    const row = { title: (title || 'My collection').slice(0, 120), items };
    if (id) { const { error } = await c.from('collections').update(row).eq('id', id); if (error) throw error; return id; }
    row.id = uuid(); const { error } = await c.from('collections').insert(row); if (error) throw error; return row.id; }
  async function publishCollection(id) { const [c] = await need(); const { data: col, error: e1 } = await c.from('collections').select('code,live').eq('id', id).maybeSingle(); if (e1) throw e1;
    if (col && col.code) { if (!col.live) { const { error } = await c.from('collections').update({ live: true }).eq('id', id); if (error) throw error; } return col.code; }
    for (let k = 0; k < 6; k++) { const code = newCode(); const { error } = await c.from('collections').update({ code, live: true }).eq('id', id); if (!error) return code;
      if (!/duplicate|unique|23505/i.test((error.message || '') + (error.code || ''))) throw error; }
    throw new Error('Couldn’t make a link. Please try again.'); }
  async function unpublishCollection(id) { const [c] = await need(); const { error } = await c.from('collections').update({ live: false }).eq('id', id); if (error) throw error; }
  async function deleteCollection(id) { const [c] = await need(); const { error } = await c.from('collections').delete().eq('id', id); if (error) throw error; }
  async function publishedCollection(code) { const c = await load(); const { data, error } = await c.rpc('published_collection', { c: code }); if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data; if (!row) return null; load().then(cl => cl.rpc('count_collection_view', { c: code })).then(() => {}, () => {}); return row; }

  /* the share window: link, QR code, download, open */
  function loadQR() { if (window.qrcode) return Promise.resolve(); return new Promise((ok, no) => { const s = document.createElement('script'); s.src = ROOT + 'qr.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function qrPath(text) { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let x = 0; x < n; x++) if (q.isDark(r, x)) d += 'M' + (x + 4) + ',' + (r + 4) + 'h1v1h-1z'; return { d, size: n + 8 }; }
  function qrPNG(text, title, coll) { const { d, size } = qrPath(text), S = 1200, k = (S - 160) / size, cv = document.createElement('canvas'); cv.width = S; cv.height = S + 260; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.save(); g.translate(80, 60); g.scale(k, k); g.fillStyle = '#000'; g.fill(new Path2D(d)); g.restore();
    g.fillStyle = '#15191f'; g.textAlign = 'center'; g.font = '900 64px Archivo, "Arial Black", Arial, sans-serif'; g.fillText(coll ? 'Scan me, then point at any picture' : 'Scan me, then point at the picture', S / 2, S + 90, S - 80);
    g.font = '700 46px "Atkinson Hyperlegible", Verdana, Arial, sans-serif'; g.fillText(title.slice(0, 48), S / 2, S + 160, S - 80); g.fillStyle = '#5a6270'; g.font = '600 34px Verdana, Arial, sans-serif'; g.fillText('Art Alive · artalivestudio.com', S / 2, S + 220, S - 80);
    return new Promise(ok => cv.toBlob(ok, 'image/png')); }
  async function shareDialog(code, title, coll) {
    css(); await loadQR().catch(() => {}); const url = PUB_URL(code, coll); let dlg = document.getElementById('aaShare'); if (dlg) dlg.remove();
    dlg = document.createElement('dialog'); dlg.id = 'aaShare'; dlg.className = 'aa-share'; dlg.setAttribute('aria-labelledby', 'aaShareH');
    const qr = window.qrcode ? qrPath(url) : null;
    dlg.innerHTML = '<div class="aa-share-in"><p class="aa-share-k">Published</p><h2 id="aaShareH">' + (coll ? 'Your collection is live' : 'Your art is live') + '</h2><p class="aa-share-t">' + esc(title) + '</p>' +
      (qr ? '<svg class="aa-share-qr" viewBox="0 0 ' + qr.size + ' ' + qr.size + '" role="img" aria-label="QR code that opens ' + esc(title) + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + qr.d + '" fill="#000"/></svg>' : '') +
      '<label class="aa-share-l" for="aaShareUrl">Link</label><div class="aa-share-row"><input id="aaShareUrl" readonly value="' + esc(url) + '"><button type="button" data-x="copy">Copy link</button></div>' +
      '<div class="aa-share-row"><button type="button" data-x="png">Download QR code</button><a href="' + esc(url) + '" target="_blank" rel="noopener">Open it</a></div>' +
      '<p class="aa-share-n">' + (coll ? 'One QR code for the whole collection. Print it once, by the door or on your table card. Visitors scan it, then point their phone at any picture in the collection, and the right one comes alive.' : 'Print the QR code and put it next to your picture, or share the link. Visitors scan it, press Start, then point their phone at your picture and it comes alive on it. Each time you save, visitors see your latest version.') + '</p>' +
      '<p class="aa-share-st" role="status" aria-live="polite"></p><button type="button" class="aa-share-x" data-x="close">Done</button></div>';
    document.body.appendChild(dlg); const st = dlg.querySelector('.aa-share-st');
    dlg.querySelector('[data-x="copy"]').onclick = () => { const i = dlg.querySelector('input'); const ok = () => { st.textContent = 'Link copied.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => { i.select(); st.textContent = 'Link selected: copy it.'; }); else { i.select(); st.textContent = 'Link selected: copy it.'; } };
    dlg.querySelector('[data-x="png"]').onclick = async () => { if (!window.qrcode) { st.textContent = 'The QR maker didn’t load. Check your connection.'; return; }
      const b = await qrPNG(url, title, coll), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (title || 'art-alive').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-qr.png';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); st.textContent = 'QR code downloaded.'; };
    dlg.querySelector('[data-x="close"]').onclick = () => dlg.close(); dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal(); dlg.querySelector('[data-x="copy"]').focus();
  }

  /* work in progress waits safely on this device while someone creates an account (room for pictures and recordings) */
  function idb() { return new Promise((ok, no) => { const r = indexedDB.open('art-alive', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }); }
  async function stashPut(v) { const d = await idb(); return new Promise((ok, no) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, 'pending'); t.oncomplete = ok; t.onerror = () => no(t.error); }); }
  async function stashTake() { const d = await idb(); return new Promise(ok => { const t = d.transaction('kv', 'readwrite'), st = t.objectStore('kv'), g = st.get('pending');
    g.onsuccess = () => { const v = g.result; if (v) st.delete('pending'); t.oncomplete = () => ok(v || null); }; g.onerror = () => ok(null); }); }
  function toAccount(next) { location.href = ROOT + 'login.html?new=1&next=' + encodeURIComponent(next || (location.pathname + location.search)); }

  /* a floating "Save to my account" button for the Studio and the Game Maker */
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function css() { if (document.getElementById('aa-save-css')) return; const st = document.createElement('style'); st.id = 'aa-save-css';
    st.textContent = '.aa-save{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:calc(100% - 32px);pointer-events:none}' +
      '.aa-save>*{pointer-events:auto}.aa-save-btn{min-height:56px;padding:0 24px;border:0;border-radius:999px;background:#ff7a2a;color:#14100c;font:900 16px/1 Archivo,"Arial Black",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 30px -8px rgba(0,0,0,.8),0 0 0 3px #15191f}' +
      '.aa-save-btn:focus-visible{outline:3px solid #2aa8e0;outline-offset:3px}.aa-save-btn[disabled]{opacity:.7;cursor:wait}.aa-save-btn.ok{background:#7be08f}' +
      '.aa-save-st:empty{display:none}.aa-save-st{padding:10px 14px;border-radius:14px;background:#1d222a;border:1px solid #2c333d;color:#f2ede4;font:600 15px/1.4 "Atkinson Hyperlegible",Verdana,Arial,sans-serif;max-width:340px;text-align:right;box-shadow:0 10px 30px -8px rgba(0,0,0,.8)}' +
      '.aa-save-st a{color:#ffd23f}.aa-save-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}' +
      '.aa-pub-btn{min-height:56px;padding:0 22px;border:0;border-radius:999px;background:#2aa8e0;color:#08141d;font:900 16px/1 Archivo,"Arial Black",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 30px -8px rgba(0,0,0,.8),0 0 0 3px #15191f}' +
      '.aa-pub-btn:focus-visible{outline:3px solid #ffd23f;outline-offset:3px}.aa-pub-btn[disabled]{opacity:.7;cursor:wait}' +
      '@media (max-width:480px){.aa-save-btn,.aa-pub-btn{min-height:50px;padding:0 16px;font-size:14px}.aa-save{right:12px;bottom:12px}}' +
      'dialog.aa-share{width:min(460px,calc(100% - 24px));max-height:calc(100% - 24px);padding:0;border:1px solid #2c333d;border-radius:20px;background:#1d222a;color:#f2ede4;font:17px/1.45 "Atkinson Hyperlegible",Verdana,Arial,sans-serif}' +
      'dialog.aa-share::backdrop{background:rgba(0,0,0,.65)}.aa-share-in{display:flex;flex-direction:column;gap:12px;padding:22px}' +
      '.aa-share-k{margin:0;font:800 12px/1 Archivo,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#7be08f}.aa-share h2{margin:0;font:900 28px/1.05 Archivo,"Arial Black",Arial,sans-serif;text-transform:uppercase}' +
      '.aa-share-t{margin:0;color:#a7adb6}.aa-share-qr{width:min(240px,70%);height:auto;align-self:center;border-radius:12px}.aa-share-l{font-size:14px;color:#a7adb6}' +
      '.aa-share-row{display:flex;gap:8px;flex-wrap:wrap}.aa-share-row input{flex:1;min-width:0;min-height:48px;padding:0 12px;border-radius:12px;border:1px solid #2c333d;background:#15191f;color:#f2ede4;font:15px Verdana,Arial,sans-serif}' +
      '.aa-share-row button,.aa-share-row a,.aa-share-x{min-height:48px;padding:0 18px;border-radius:999px;border:2px solid #2c333d;background:transparent;color:#f2ede4;font:800 14px/1 Archivo,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}' +
      '.aa-share-row button[data-x="copy"]{background:#ff7a2a;border-color:#ff7a2a;color:#14100c}.aa-share-n{margin:0;font-size:15px;color:#c9ced6}.aa-share-st{margin:0;min-height:1em;color:#7be08f;font-size:15px}.aa-share-x{align-self:flex-end}';
    document.head.appendChild(st); }
  function saveBar(o) {
    if (!configured) return null; css();
    const box = document.createElement('div'); box.className = 'aa-save'; box.id = 'aaSave';
    box.innerHTML = '<p class="aa-save-st" role="status" aria-live="polite" style="margin:0"></p><div class="aa-save-row"><button type="button" class="aa-pub-btn">Publish</button><button type="button" class="aa-save-btn">Save to my account</button></div>';
    document.body.appendChild(box); document.body.style.paddingBottom = '96px';   // room so the button never hides the last controls
    const st = box.querySelector('.aa-save-st'), btn = box.querySelector('.aa-save-btn'), pub = box.querySelector('.aa-pub-btn'), btns = [btn].concat(o.buttons || []).filter(Boolean);
    let pid = new URLSearchParams(location.search).get('project'), tm = 0;
    const set = (html, keep) => { st.innerHTML = html; clearTimeout(tm); if (!keep) tm = setTimeout(() => { st.innerHTML = ''; }, 9000); if (o.onStatus) o.onStatus(st.textContent); };
    const LOGIN = '<a href="' + ROOT + 'login.html" target="_blank" rel="noopener">Create your free account or log back in</a> in a new tab, then press Save again. Your work stays here.';
    // not signed in yet: keep the work on this device, create the account, then come straight back and finish
    async function signInFirst(then) {
      set('First, create your free account (or log back in). Your work comes with you…', true);
      try { const g = o.get(); await stashPut({ kind: o.kind, path: location.pathname, pid, then, title: g.title, data: JSON.parse(JSON.stringify(g.data)), thumbSrc: g.thumbSrc, at: Date.now() }); } catch (e) {}
      setTimeout(() => toAccount(location.pathname), 700); }
    async function save() {
      if (!(await user().catch(() => null))) return signInFirst('save');
      btns.forEach(b => { b.disabled = true; }); set('Saving to your account…', true);
      try { const g = o.get(); pid = await saveProject({ id: pid, kind: o.kind, title: g.title, data: g.data, thumbSrc: g.thumbSrc });
        history.replaceState(null, '', location.pathname + '?project=' + pid);
        set('Saved. Open it any time from <a href="' + ROOT + 'projects.html">My projects</a>.'); btn.textContent = 'Saved ✓'; btn.classList.add('ok');
        setTimeout(() => { btn.textContent = 'Save to my account'; btn.classList.remove('ok'); }, 2600); }
      catch (er) { set(er.code === 'signin' ? LOGIN : esc(er.message || 'Couldn’t save. Check your connection and try again.'), true); }
      finally { btns.forEach(b => { b.disabled = false; }); } }
    btns.forEach(b => { b.onclick = save; });
    const pubLabel = live => { pub.textContent = live ? 'Share' : 'Publish'; pub.setAttribute('aria-label', live ? 'Share: get the link and QR code' : 'Publish: get a link and QR code for visitors'); };
    pub.onclick = async () => { pub.disabled = true;
      try { if (!(await user().catch(() => null))) return signInFirst('publish');
        await save(); if (!pid) return; set('Publishing…', true); const code = await publishProject(pid); pubLabel(true);
        set('Live! Visitors can scan your QR code. Each save updates what they see.'); await shareDialog(code, o.get().title || 'My art'); }
      catch (er) { set(er.code === 'limit' ? esc(er.message) + ' <a href="' + ROOT + 'plans.html">See plans</a>' : esc(er.message || 'Couldn’t publish. Check your connection and try again.'), true); }
      finally { pub.disabled = false; } };
    if (pid) publication(pid).then(p => pubLabel(!!(p && p.live))).catch(() => {});
    // back from creating an account: bring the work back and finish what they pressed
    user().then(async u => { if (!u) return; const w = await stashTake().catch(() => null);
      if (!w || w.kind !== o.kind || w.path !== location.pathname || Date.now() - w.at > 864e5) return;
      pid = w.pid || null; set('Welcome! Bringing your work back…', true);
      o.open({ title: w.title, data: w.data }, async () => { if (w.then === 'publish') pub.click(); else await save(); }); }).catch(() => {});
    if (pid && o.open) { if (!maybeSignedIn()) { toAccount(); return { save, get id() { return pid; } }; } set('Opening your project…', true);
      getProject(pid).then(p => { if (p.kind !== o.kind) throw new Error(o.kind === 'game' ? 'That project is an animation. Open it in the Creator Studio.' : 'That project is a game. Open it in the Game Maker.');
        o.open(p, () => set('Opened ' + esc(p.title) + ' from your account.')); })
        .catch(er => { pid = null; if (er.code === 'signin') return toAccount(); set(esc(er.message || 'Couldn’t open that project.'), true); }); }
    return { save, get id() { return pid; } };
  }

  /* the header: "Create account" becomes "Welcome back", and "Log in" becomes "My projects", once signed in */
  function headerSignedIn(on) { document.querySelectorAll('[data-acct]').forEach(a => { a.textContent = on ? 'Welcome back' : 'Create account'; a.href = ROOT + (on ? 'projects.html' : 'login.html?new=1');
    a.setAttribute('aria-label', on ? 'Welcome back: open My projects' : 'Create a free account'); }); }
  if (maybeSignedIn()) headerSignedIn(true);
  function navLinks(signedIn) { document.querySelectorAll('a[href$="login.html"]').forEach(a => { if (a.closest('.auth')) return;
    if (signedIn) { a.textContent = 'My projects'; a.href = ROOT + 'projects.html'; } }); }
  if (maybeSignedIn()) user().then(u => { navLinks(!!u); headerSignedIn(!!u); }).catch(() => {});

  window.AAAccount = { configured, ROOT, load, user, signIn, signOut, saveProject, listProjects, getProject, updateProject, deleteProject, duplicateProject, maybeSignedIn, saveBar, headerSignedIn,
    publication, publishProject, unpublishProject, published, fillMedia, countView, getPublished, shareDialog, PUB_URL, myPlan, toAccount,
    FP, listCollections, saveCollection, publishCollection, unpublishCollection, deleteCollection, publishedCollection };
})();
