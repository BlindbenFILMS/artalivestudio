// ─────────────────────────────────────────────────────────────
// ART ALIVE: the pet snow globe helper (a Supabase Edge Function named petglobe)
//
// The pet snow globe page (petglobe/index.html) calls this when:
//   create  someone presses "Get a link to share": this saves the pet's cutout picture, name, message and
//           eye/nose spots, and hands back a short code (the link) plus a private "claim" proof for the maker.
//           No account needed. One person can make up to 15 an hour.
//   claim   the maker later signs in and wants to keep it: with their claim proof, it moves to their account
//           and stops expiring.
//   report  a visitor reports a globe. Three different people reporting it hides it and removes its picture.
//
// Supabase gives it everything it needs (no secrets to add). Turn OFF "Verify JWT" for this function
// (people making and opening globes don't have accounts). Setup steps are in README.md ("Pet snow globes").
// ─────────────────────────────────────────────────────────────
const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
let KEY = '';
try { KEY = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''; } catch (_) { /* older projects */ }
if (!KEY) KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const PER_HOUR = 15, PER_DAY_ALL = 3000, MAX_BYTES = 900 * 1024, REPORTS_TO_HIDE = 3;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-user-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const svc = (extra: Record<string, string> = {}): Record<string, string> => { const h: Record<string, string> = { apikey: KEY, 'Content-Type': 'application/json', ...extra }; if (!KEY.startsWith('sb_')) h.Authorization = 'Bearer ' + KEY; return h; };
const clean = (s: unknown, n: number) => (typeof s === 'string' ? s : '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
function newCode() { const A = 'abcdefghjkmnpqrstuvwxyz23456789', u = new Uint8Array(8); crypto.getRandomValues(u); return Array.from(u, x => A[x % A.length]).join(''); }
function ipOf(req: Request) { return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'unknown'; }

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, { ...init, headers: svc((init.headers as Record<string, string>) ?? {}) });
  if (!r.ok) throw new Error(path.split('?')[0] + ': ' + r.status + ' ' + await r.text());
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function count(path: string) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, { method: 'HEAD', headers: svc({ Prefer: 'count=exact' }) });
  const m = /\/(\d+)$/.exec(r.headers.get('content-range') ?? ''); return m ? +m[1] : 0;
}
// the signed-in maker, if any (their sign-in token comes in x-user-token)
async function account(req: Request): Promise<string | null> {
  const a = req.headers.get('x-user-token') ?? ''; if (!a) return null;
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + a } });
  if (!r.ok) return null; const u = await r.json(); return u?.id ?? null;
}
function decodeImage(b64: string): Uint8Array | null {
  try { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; } catch (_) { return null; }
}
const isWebp = (u: Uint8Array) => u.length > 12 && String.fromCharCode(...u.slice(0, 4)) === 'RIFF' && String.fromCharCode(...u.slice(8, 12)) === 'WEBP';
const isPng = (u: Uint8Array) => u.length > 8 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47;
function cleanFace(f: unknown) {
  if (!f || typeof f !== 'object') return null;
  const o = f as Record<string, unknown>, w = Number(o.w), h = Number(o.h), taps = o.taps;
  if (!(w > 0 && w < 5000 && h > 0 && h < 5000) || !Array.isArray(taps) || taps.length !== 3) return null;
  const t = taps.map(p => Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [NaN, NaN]);
  if (t.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || x < -w || x > 2 * w || y < -h || y > 2 * h)) return null;
  return { w: Math.round(w), h: Math.round(h), taps: t.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ ok: true, about: 'Art Alive pet snow globe helper' });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_) { return reply({ error: 'bad request' }, 400); }
  try {
    if (b.action === 'create') {
      const ipHash = await sha(ipOf(req) + '|' + SB_URL);
      const since = new Date(Date.now() - 3600e3).toISOString(), day = new Date(Date.now() - 86400e3).toISOString();
      if (await count(`petglobes?select=code&ip_hash=eq.${ipHash}&created_at=gt.${since}`) >= PER_HOUR) return reply({ error: 'You’ve made a lot of snow globes in the last hour. Please try again a little later.' }, 429);
      if (await count(`petglobes?select=code&created_at=gt.${day}`) >= PER_DAY_ALL) return reply({ error: 'Lots of people are making snow globes right now. Please try again later today.' }, 429);
      const type = b.type === 'image/png' ? 'image/png' : 'image/webp';
      const bytes = decodeImage(typeof b.image === 'string' ? b.image : '');
      if (!bytes || bytes.length < 200) return reply({ error: 'The picture didn’t come through. Please try again.' }, 400);
      if (bytes.length > MAX_BYTES) return reply({ error: 'That picture is too big. Please try another photo.' }, 400);
      if (type === 'image/webp' ? !isWebp(bytes) : !isPng(bytes)) return reply({ error: 'That isn’t a picture we can use. Please try another photo.' }, 400);
      const owner = await account(req), claim = hex(crypto.getRandomValues(new Uint8Array(24)).buffer);
      let code = '';
      for (let i = 0; i < 5 && !code; i++) { const c = newCode(); if (!(await rest(`petglobes?select=code&code=eq.${c}`)).length) code = c; }
      if (!code) throw new Error('no free code');
      const img = code + (type === 'image/png' ? '.png' : '.webp');
      const up = await fetch(`${SB_URL}/storage/v1/object/petglobes/${img}`, { method: 'POST', headers: svc({ 'Content-Type': type, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' }), body: bytes });
      if (!up.ok) throw new Error('upload: ' + up.status + ' ' + await up.text());
      await rest('petglobes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
        code, img, name: clean(b.name, 22), message: clean(b.message, 34), face: cleanFace(b.face),
        owner, expires_at: owner ? null : undefined, claim_hash: await sha(claim), ip_hash: ipHash }) });
      return reply({ ok: true, code, claim, kept: !!owner });
    }

    const code = clean(b.code, 8).toLowerCase();
    if (!/^[a-z0-9]{8}$/.test(code)) return reply({ error: 'bad code' }, 400);

    if (b.action === 'claim') {
      const owner = await account(req);
      if (!owner) return reply({ error: 'Please sign in first.' }, 401);
      const rows = await rest(`petglobes?select=claim_hash,owner&code=eq.${code}`);
      if (!rows.length) return reply({ error: 'We couldn’t find that snow globe. It may have expired.' }, 404);
      if (rows[0].owner === owner) return reply({ ok: true, already: true });
      if (rows[0].owner || rows[0].claim_hash !== await sha(clean(b.claim, 64))) return reply({ error: 'This snow globe was made on another phone or computer.' }, 403);
      await rest(`petglobes?code=eq.${code}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ owner, expires_at: null }) });
      return reply({ ok: true });
    }

    if (b.action === 'report') {
      const ipHash = await sha(ipOf(req) + '|' + SB_URL);
      const r = await fetch(SB_URL + '/rest/v1/petglobe_reports', { method: 'POST', headers: svc({ Prefer: 'return=minimal,resolution=ignore-duplicates' }), body: JSON.stringify({ code, ip_hash: ipHash }) });
      if (!r.ok && r.status !== 409) throw new Error('report: ' + r.status + ' ' + await r.text());
      if (await count(`petglobe_reports?select=code&code=eq.${code}`) >= REPORTS_TO_HIDE) {
        const rows = await rest(`petglobes?select=img&code=eq.${code}`);
        await rest(`petglobes?code=eq.${code}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ hidden: true }) });
        if (rows.length) await fetch(`${SB_URL}/storage/v1/object/petglobes`, { method: 'DELETE', headers: svc(), body: JSON.stringify({ prefixes: [rows[0].img] }) });
      }
      return reply({ ok: true });
    }
    return reply({ error: 'unknown action' }, 400);
  } catch (e) {
    console.log('error', String(e));
    return reply({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
