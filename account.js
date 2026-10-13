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

  /* the header: "Log in" becomes "My projects" once signed in */
  function navLinks(signedIn) { document.querySelectorAll('a[href$="login.html"]').forEach(a => { if (a.closest('.auth')) return;
    if (signedIn) { a.textContent = 'My projects'; a.href = ROOT + 'projects.html'; } }); }
  if (maybeSignedIn()) user().then(u => navLinks(!!u)).catch(() => {});

  window.AAAccount = { configured, ROOT, load, user, signIn, signOut, saveProject, listProjects, getProject, updateProject, deleteProject, duplicateProject, maybeSignedIn };
})();
