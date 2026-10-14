// ─────────────────────────────────────────────────────────────
// ART ALIVE SHARE LINKS  (a Cloudflare Worker at share.artalivestudio.com)
//
// When someone texts or posts a published link, apps like iMessage, WhatsApp
// and Facebook look at the page for a picture and a title. The main site is
// one page for every project, so it can't do that by itself. This little
// helper answers those apps with the right picture and title, then sends
// people straight on to the piece on artalivestudio.com.
//
//   share.artalivestudio.com/k7m2qx9a     → one published piece
//   share.artalivestudio.com/k/k7m2qx9a   → a collection
//
// Setup steps are in README.md ("Link previews"). Nothing here is secret:
// the publishable key is the same one the website already uses.
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://skacvtlqmbnkkyatkogn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CtdqqBuI7ndfTOLfNUmetw_rjETRv1E';
const SITE = 'https://artalivestudio.com/';
const FALLBACK_IMAGE = SITE + 'share-card.jpg?v=2';

const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function card(fn, code) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ c: code })
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) ? rows[0] || null : rows;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    if (!parts.length) return Response.redirect(SITE, 302);

    // /img/<code>.jpg and /img/k/<code>.jpg : the preview picture
    const isImg = parts[0] === 'img';
    const rest = isImg ? parts.slice(1) : parts;
    const isColl = rest[0] === 'k';
    const code = String(isColl ? rest[1] : rest[0] || '').toLowerCase().replace(/\.jpg$/, '').replace(/[^a-z0-9]/g, '');
    if (!/^[a-z0-9]{8}$/.test(code)) return Response.redirect(SITE, 302);

    const dest = SITE + 'p/?' + (isColl ? 'k=' : 'c=') + code;
    const info = await card(isColl ? 'collection_card' : 'share_card', code).catch(() => null);

    if (isImg) {
      if (!info || !info.thumb) return Response.redirect(FALLBACK_IMAGE, 302);
      const cache = caches.default, key = new Request(url.toString());
      const hit = await cache.match(key); if (hit) return hit;
      const img = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${info.thumb}`, { headers: { apikey: SUPABASE_KEY } });
      if (!img.ok) return Response.redirect(FALLBACK_IMAGE, 302);
      const res = new Response(img.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
      ctx.waitUntil(cache.put(key, res.clone()));
      return res;
    }

    const title = info ? info.title : 'Art Alive';
    const desc = !info ? 'Point your phone at the picture and watch it come alive. No app to download.'
      : isColl ? `${info.pieces} pieces that come alive. Scan, then point your phone at any of them. No app needed.`
      : (info.artist ? `By ${info.artist}. ` : '') + 'Point your phone at the picture and watch it come alive. No app needed.';
    const image = info && info.thumb ? `${url.origin}/img/${isColl ? 'k/' : ''}${code}.jpg` : FALLBACK_IMAGE;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Art Alive</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Art Alive">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(url.origin + url.pathname)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(dest)}">
<link rel="canonical" href="${esc(dest)}">
</head><body style="background:#15191f;color:#f2ede4;font:18px Verdana,sans-serif;padding:24px">
<p>Opening <a style="color:#ffd23f" href="${esc(dest)}">${esc(title)}</a>…</p>
<script>location.replace(${JSON.stringify(dest)})</script>
</body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  }
};
