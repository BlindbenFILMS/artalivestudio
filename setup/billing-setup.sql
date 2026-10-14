-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: automatic plans with Stripe
-- Run once, after plans-setup.sql.
-- In Supabase: SQL Editor → New query → paste all of this → Run.
-- Safe to run again; no customer data is removed.
--
-- What it does:
--  • When someone pays, their plan switches on by itself.
--  • When they move up or down a plan, it follows.
--  • When they cancel, or Stripe gives up on a failed card, they go
--    back to Free. Nothing is deleted: visitors simply see their
--    first pieces up to the plan's limit, and the rest come back if
--    they subscribe again.
--  • Your own "owner" row, and any "custom" deals, are never touched.
-- ─────────────────────────────────────────────────────────────

-- 1. remember each person's Stripe customer and subscription
alter table public.plans
  add column if not exists stripe_customer text,
  add column if not exists stripe_sub      text,
  add column if not exists stripe_status   text,
  add column if not exists stripe_at       timestamptz;
create index if not exists plans_stripe_customer on public.plans (stripe_customer);
create index if not exists plans_stripe_sub on public.plans (stripe_sub);

-- 2. which monthly price buys which plan (in cents). If you change a price
--    in Stripe, change it here too (Table Editor → plan_prices).
create table if not exists public.plan_prices (
  amount    int primary key,
  tier      text not null,
  max_live  int  not null
);
alter table public.plan_prices enable row level security;   -- no rules: only you and the payment helper can read it
insert into public.plan_prices (amount, tier, max_live) values
  (1000, 'pro20', 20), (2500, 'pro50', 50), (5000, 'pro100', 100), (10000, 'pro250', 250)
on conflict (amount) do update set tier = excluded.tier, max_live = excluded.max_live;

-- 3. the payment helper (the stripe-webhook function) calls this for each Stripe message
create or replace function public.stripe_apply(
  p_ev text, p_at bigint, p_uid uuid, p_email text, p_customer text, p_sub text, p_status text, p_amount int)
returns text language plpgsql security definer set search_path = '' as $$
declare
  pr  public.plan_prices;
  cur public.plans;
  who uuid := p_uid;
  t   timestamptz := to_timestamp(coalesce(p_at, extract(epoch from now())));
begin
  select * into pr from public.plan_prices where amount = p_amount;
  -- who is it? the account that pressed the button, else the Stripe customer we already know, else the email
  if who is null then
    select * into cur from public.plans
      where (p_sub is not null and stripe_sub = p_sub) or (p_customer is not null and stripe_customer = p_customer)
      order by (stripe_sub = p_sub) desc nulls last, updated_at desc limit 1;
    who := cur.user_id;
  end if;
  if who is null and p_email is not null and p_ev = 'checkout.session.completed' then
    select id into who from auth.users where lower(email) = lower(p_email) limit 1;
  end if;
  if who is null then return 'unknown customer'; end if;
  select * into cur from public.plans where user_id = who;

  if cur.tier in ('owner', 'custom') then return 'left alone: ' || cur.tier; end if;
  if cur.stripe_at is not null and t < cur.stripe_at then return 'older message, skipped'; end if;

  -- paying (past_due means Stripe is still retrying the card, so the plan stays on for now)
  if p_status in ('active', 'trialing', 'past_due') then
    if pr.tier is null then return 'unknown price: ' || coalesce(p_amount::text, '?'); end if;
    insert into public.plans (user_id, tier, max_live, stripe_customer, stripe_sub, stripe_status, stripe_at)
      values (who, pr.tier, pr.max_live, p_customer, p_sub, p_status, t)
    on conflict (user_id) do update set
      tier = excluded.tier, max_live = excluded.max_live,
      stripe_customer = coalesce(excluded.stripe_customer, plans.stripe_customer),
      stripe_sub = coalesce(excluded.stripe_sub, plans.stripe_sub),
      stripe_status = excluded.stripe_status, stripe_at = excluded.stripe_at;
    return 'on: ' || pr.tier;
  end if;

  -- stopped paying
  if p_status in ('canceled', 'unpaid', 'incomplete_expired') then
    if cur.user_id is null then return 'nothing to stop'; end if;
    if cur.stripe_sub is not null and p_sub is not null and cur.stripe_sub <> p_sub then return 'an older subscription, skipped'; end if;
    update public.plans set tier = 'free', max_live = 3, stripe_status = p_status, stripe_at = t where user_id = who;
    return 'back to free';
  end if;
  return 'no change: ' || coalesce(p_status, '?');
end $$;
revoke all on function public.stripe_apply(text, bigint, uuid, text, text, text, text, int) from public, anon, authenticated;
grant execute on function public.stripe_apply(text, bigint, uuid, text, text, text, text, int) to service_role;

-- 4. over the limit (for example after cancelling): visitors see the first pieces
--    published, up to the plan's limit. The rest are kept, just not shown.
create or replace function public.pub_shown(c text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select x.n <= x.lim from (
      select pub.code, row_number() over (order by pub.created_at, pub.code) as n, coalesce(pl.max_live, 3) as lim
      from public.publications me
      join public.publications pub on pub.owner = me.owner and pub.live
      left join public.plans pl on pl.user_id = me.owner
      where me.code = c
    ) x where x.code = c), false)
$$;
revoke all on function public.pub_shown(text) from public;
grant execute on function public.pub_shown(text) to anon, authenticated;

-- the visitor side, now with that check (same as before otherwise)
create or replace function public.published(c text)
returns table (kind text, title text, data jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.kind, p.title, p.data, p.updated_at
  from public.publications pub join public.projects p on p.id = pub.project_id
  where pub.code = c and pub.live and public.pub_shown(pub.code)
$$;

create or replace function public.media_is_published(path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.publications pub
    where pub.live and pub.owner::text = split_part(path, '/', 1) and pub.project_id::text = split_part(path, '/', 2)
      and public.pub_shown(pub.code)
  )
$$;

create or replace function public.published_collection(c text)
returns table (title text, items jsonb)
language sql stable security definer set search_path = '' as $$
  select col.title, coalesce((
    select jsonb_agg(jsonb_build_object('code', pub.code, 'title', p.title, 'kind', p.kind, 'fp', e.it -> 'fp', 'aspect', e.it -> 'aspect') order by e.ord)
    from jsonb_array_elements(col.items) with ordinality as e(it, ord)
    join public.projects p on p.id::text = e.it ->> 'project_id' and p.owner = col.owner
    join public.publications pub on pub.project_id = p.id and pub.live and public.pub_shown(pub.code)
  ), '[]'::jsonb)
  from public.collections col
  where col.code = c and col.live
$$;

create or replace function public.share_card(c text)
returns table (title text, artist text, thumb text)
language sql stable security definer set search_path = '' as $$
  select p.title, coalesce(p.data ->> 'artist', ''), p.thumb
  from public.publications pub join public.projects p on p.id = pub.project_id
  where pub.code = c and pub.live and public.pub_shown(pub.code)
$$;
