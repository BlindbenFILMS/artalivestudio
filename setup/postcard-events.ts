// ─────────────────────────────────────────────────────────────
// ART ALIVE: the postcard helper (a Supabase Edge Function named postcard-events)
//
// The postcard page (magicpostcard/play.html) calls this when:
//   open        someone opens a postcard. The first time, the sender gets an email: "Pete just opened your postcard!"
//   reply-start the person who got it wants to send a video or voice reply: this hands back a one-time upload ticket
//               for the sender's private folder.
//   reply-done  the video is uploaded: this saves the reply and emails the sender.
//
// Secrets (Edge Functions → Secrets):
//   RESEND_API_KEY  from resend.com (free for 3,000 emails a month). Without it, nothing is emailed,
//                   but replies are still saved and shown on magicpostcard/replies.html.
//   EMAIL_FROM      optional, e.g.  Art Alive <postcards@artalivestudio.com>  (the domain must be verified in Resend)
//   SITE_URL        optional, defaults to https://artalivestudio.com
// Supabase gives it the rest. Turn OFF "Verify JWT" for this function (visitors don't have accounts).
// Setup steps are in README.md ("Opened emails and video replies").
// ─────────────────────────────────────────────────────────────
const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
let KEY = '';
try { KEY = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''; } catch (_) { /* older projects */ }
if (!KEY) KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('EMAIL_FROM') ?? 'Art Alive <postcards@artalivestudio.com>';
const SITE = (Deno.env.get('SITE_URL') ?? 'https://artalivestudio.com').replace(/\/$/, '');
const MAX_REPLIES = 10, MAX_BYTES = 50 * 1024 * 1024, MAX_TICKETS = 30;   // tickets: upload tries per postcard, finished or not

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-user-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const svc = (): Record<string, string> => { const h: Record<string, string> = { apikey: KEY, 'Content-Type': 'application/json' }; if (!KEY.startsWith('sb_')) h.Authorization = 'Bearer ' + KEY; return h; };   // older service_role keys also go in Authorization
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const clean = (s: unknown, n: number) => (typeof s === 'string' ? s : '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

async function rpc(fn: string, args: Record<string, unknown>) {
  const r = await fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: svc(), body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + ': ' + await r.text());
  return r.json();
}
async function info(code: string) { const rows = await rpc('postcard_info', { c: code }); return Array.isArray(rows) && rows.length ? rows[0] : null; }

// the visitor's own account, if they're signed in (so a sender testing their own card isn't "opened")
async function visitor(req: Request): Promise<string | null> {
  const a = req.headers.get('x-user-token') ?? ''; if (!a) return null;
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + a } });
  if (!r.ok) return null; const u = await r.json(); return u?.id ?? null;
}

function card(title: string, lines: string[], button: string, href: string) {
  return `<!doctype html><html><body style="margin:0;background:#1f3352;font-family:Verdana,Arial,sans-serif;color:#1b1f26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf8f2;border-radius:14px">
<tr><td style="padding:26px 26px 6px;font:800 12px Arial,sans-serif;letter-spacing:3px;color:#b4531a">MAGIC POSTCARD</td></tr>
<tr><td style="padding:0 26px;font:900 26px/1.15 Arial Black,Arial,sans-serif;color:#1f3352">${esc(title)}</td></tr>
${lines.map(l => `<tr><td style="padding:12px 26px 0;font:16px/1.5 Verdana,Arial,sans-serif">${l}</td></tr>`).join('')}
<tr><td style="padding:22px 26px 26px"><a href="${href}" style="display:inline-block;background:#ec9a72;color:#14100c;text-decoration:none;font:800 15px Arial,sans-serif;letter-spacing:1px;padding:14px 22px;border-radius:999px">${esc(button)}</a></td></tr>
</table><p style="font:12px Verdana,Arial,sans-serif;color:#b9cfe6">Art Alive · artalivestudio.com</p></td></tr></table></body></html>`;
}
async function email(to: string, subject: string, html: string, text: string) {
  if (!RESEND || !to) return false;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }) });
  if (!r.ok) console.log('email failed', r.status, await r.text());
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ ok: true, about: 'Art Alive postcard helper' });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch (_) { return reply({ error: 'bad request' }, 400); }
  const code = clean(b.code, 8).toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(code)) return reply({ error: 'bad code' }, 400);
  try {
    const p = await info(code);
    if (!p) return reply({ error: 'not found' }, 404);
    const who = p.to_name || 'Your friend', place = p.place ? ' from ' + p.place : '';

    if (b.action === 'open') {
      if (p.opened_at) return reply({ ok: true, already: true });
      if ((await visitor(req)) === p.owner) return reply({ ok: true, own: true });
      const first = await rpc('postcard_mark_opened', { c: code });
      if (first === true && p.notify) {
        const link = SITE + '/magicpostcard/play.html?c=' + code;
        await email(p.email, `${who} just opened your Magic Postcard!`,
          card(`${who} just opened your postcard!`, [`Your Magic Postcard${esc(place)} arrived. ${esc(who)} just scanned it and watched it come alive.`,
            p.replies ? 'If they send you a video or voice reply, we’ll email you here.' : ''].filter(Boolean), 'See your postcard', link),
          `${who} just opened your Magic Postcard${place}. See it: ${link}`);
      }
      return reply({ ok: true, first });
    }

    if (b.action === 'reply-start') {
      if (!p.replies) return reply({ error: 'Replies are turned off for this postcard.' }, 403);
      if (p.reply_count >= MAX_REPLIES) return reply({ error: 'This postcard has all the replies it can take.' }, 429);
      const type = clean(b.type, 40), size = Number(b.size) || 0;
      if (!/^(video|audio)\//.test(type)) return reply({ error: 'Please choose a video or a voice recording.' }, 400);
      if (size > MAX_BYTES) return reply({ error: type.startsWith('audio/') ? 'That recording is too big. Please keep it under a minute.' : 'That video is too big. Please keep it under 50 MB (about a minute).' }, 400);
      // stop anyone filling the sender's storage: a postcard's reply folder holds only so many files
      const ls = await fetch(SB_URL + '/storage/v1/object/list/media', { method: 'POST', headers: svc(), body: JSON.stringify({ prefix: `${p.owner}/replies/${code}`, limit: MAX_TICKETS + 1 }) });
      if (ls.ok) { const files = await ls.json(); if (Array.isArray(files) && files.length >= MAX_TICKETS) return reply({ error: 'This postcard has all the replies it can take.' }, 429); }
      const aud = type.startsWith('audio/'), ext = /webm/.test(type) ? 'webm' : /quicktime/.test(type) ? 'mov' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav'
        : /mpeg|mp3/.test(type) ? 'mp3' : aud ? 'm4a' : 'mp4';
      const path = `${p.owner}/replies/${code}/${crypto.randomUUID()}${aud ? '-voice' : ''}.${ext}`;
      const r = await fetch(SB_URL + '/storage/v1/object/upload/sign/media/' + path, { method: 'POST', headers: svc(), body: '{}' });
      if (!r.ok) throw new Error('sign: ' + await r.text());
      const s = await r.json(), token = new URL(SB_URL + '/storage/v1' + s.url).searchParams.get('token');
      return reply({ ok: true, path, token });
    }

    if (b.action === 'reply-done') {
      if (!p.replies) return reply({ error: 'Replies are turned off for this postcard.' }, 403);
      if (p.reply_count >= MAX_REPLIES) return reply({ error: 'This postcard has all the replies it can take.' }, 429);
      const path = clean(b.path, 200);
      if (!new RegExp(`^${p.owner}/replies/${code}/[0-9a-f-]{36}(-voice)?\\.(webm|mp4|mov|m4a|mp3|ogg|wav)$`).test(path)) return reply({ error: 'bad path' }, 400);
      const head = await fetch(SB_URL + '/storage/v1/object/authenticated/media/' + path, { method: 'HEAD', headers: svc() });
      if (!head.ok) return reply({ error: 'The reply didn’t arrive. Please try again.' }, 400);
      const name = clean(b.name, 60), note = clean(b.note, 300), kind = path.includes('-voice.') ? 'audio' : 'video', what = kind === 'audio' ? 'voice' : 'video';
      const r = await fetch(SB_URL + '/rest/v1/postcard_replies', { method: 'POST', headers: { ...svc(), Prefer: 'return=minimal' },
        body: JSON.stringify({ code, owner: p.owner, path, from_name: name, note, kind }) });
      if (r.status === 409) return reply({ ok: true, already: true });   // the same reply sent twice: saved (and emailed) once
      if (!r.ok) throw new Error('save: ' + await r.text());
      const from = name || p.to_name || 'Someone', link = SITE + '/magicpostcard/replies.html';
      await email(p.email, `${from} sent you a ${what} reply!`,
        card(`${from} sent you a ${what} reply!`, [`They got your Magic Postcard${esc(place)} and recorded a ${kind === 'audio' ? 'voice message' : 'video'} just for you.`, note ? `“${esc(note)}”` : ''].filter(Boolean), kind === 'audio' ? 'Listen to the reply' : 'Watch the reply', link),
        `${from} sent you a ${what} reply to your Magic Postcard${place}. ${kind === 'audio' ? 'Listen' : 'Watch it'}: ${link}`);
      return reply({ ok: true });
    }
    return reply({ error: 'unknown action' }, 400);
  } catch (e) {
    console.log('error', String(e));
    return reply({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
