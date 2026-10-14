// ─────────────────────────────────────────────────────────────
// ART ALIVE: the payments helper (a Supabase Edge Function named stripe-webhook)
//
// Stripe sends this a short message whenever someone pays, changes plan or
// cancels. It checks the message really came from Stripe, then switches
// that person's plan on or off (see billing-setup.sql).
//
// It needs one secret, STRIPE_WEBHOOK_SECRET (starts with whsec_), which
// Stripe shows you when you add the webhook. Supabase gives it the rest.
// Setup steps are in README.md ("Automatic plans").
// ─────────────────────────────────────────────────────────────
const WHSEC = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
let KEY = '';
try { KEY = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? ''; } catch (_) { /* older projects */ }
if (!KEY) KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

// Stripe signs each message: header "t=time,v1=signature"; signature = HMAC-SHA256(secret, "time.body")
async function fromStripe(body: string, header: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(',').filter(p => p.trim().startsWith('v1=')).map(p => p.trim().slice(3));
  const t = Number(parts.t);
  if (!WHSEC || !t || !sigs.length || Math.abs(Date.now() / 1000 - t) > 600) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(WHSEC), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const want = hex(await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + body)));
  return sigs.some(s => s.length === want.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ want.charCodeAt(i)), 0) === 0);
}

const uuid = (s: unknown) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s : null;
const reply = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ ok: true, about: 'Art Alive payments helper' });
  const body = await req.text();
  if (!(await fromStripe(body, req.headers.get('stripe-signature') ?? ''))) return reply({ error: 'not from Stripe' }, 400);

  const ev = JSON.parse(body), o = ev?.data?.object ?? {};
  let args: Record<string, unknown> | null = null;
  if (ev.type === 'checkout.session.completed' && o.mode === 'subscription') {
    const paid = o.payment_status === 'paid' || o.payment_status === 'no_payment_required';
    args = { p_uid: uuid(o.client_reference_id), p_email: o.customer_details?.email ?? o.customer_email ?? null,
      p_customer: o.customer ?? null, p_sub: o.subscription ?? null, p_status: paid ? 'active' : 'incomplete', p_amount: o.amount_subtotal ?? null };
  } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(ev.type)) {
    args = { p_uid: null, p_email: null, p_customer: o.customer ?? null, p_sub: o.id ?? null,
      p_status: ev.type === 'customer.subscription.deleted' ? 'canceled' : o.status, p_amount: o.items?.data?.[0]?.price?.unit_amount ?? null };
  }
  if (!args) return reply({ ok: true, ignored: ev.type });
  args.p_ev = ev.type; args.p_at = ev.created;

  const headers: Record<string, string> = { apikey: KEY, 'Content-Type': 'application/json' };
  if (!KEY.startsWith('sb_')) headers.Authorization = 'Bearer ' + KEY;   // older service_role keys also go here
  const r = await fetch(SB_URL + '/rest/v1/rpc/stripe_apply', { method: 'POST', headers, body: JSON.stringify(args) });
  const out = await r.text();
  console.log(ev.type, ev.id, r.status, out);
  if (!r.ok) return reply({ error: out }, 500);   // Stripe will try again later
  return reply({ ok: true, result: JSON.parse(out) });
});
