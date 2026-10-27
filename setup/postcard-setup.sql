-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: MAGIC POSTCARDS (run once, after the other setup files)
-- Supabase → SQL Editor → New query → paste all of this → Run.
-- 1. Lets a project be a Magic Postcard.
-- 2. Keeps mailing addresses in their own private table (never part of what visitors see).
-- 3. Postcards don't use up a plan's published pieces.
-- Safe to run again.
-- ─────────────────────────────────────────────────────────────

-- 1. a project can be a postcard
alter table public.projects drop constraint if exists projects_kind_check;
alter table public.projects add constraint projects_kind_check check (kind in ('studio', 'game', 'postcard'));

-- 2. orders: where each postcard goes. Customers add their own and can read their own; only you change the status.
create table if not exists public.postcard_orders (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  code        text,
  to_name     text not null check (char_length(to_name) between 1 and 60),
  line1       text not null check (char_length(line1) between 1 and 80),
  line2       text not null default '' check (char_length(line2) <= 80),
  city        text not null check (char_length(city) between 1 and 50),
  state       text not null check (char_length(state) between 1 and 20),
  zip         text not null check (zip ~ '^[0-9]{5}(-[0-9]{4})?$'),
  country     text not null default 'US' check (country = 'US'),
  copies      int  not null default 1 check (copies between 1 and 20),
  status      text not null default 'new' check (status in ('new', 'paid', 'printed', 'mailed', 'cancelled')),
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists postcard_orders_status on public.postcard_orders (status, created_at desc);
drop trigger if exists postcard_orders_touch on public.postcard_orders;
create trigger postcard_orders_touch before update on public.postcard_orders
  for each row execute function public.touch_updated_at();

alter table public.postcard_orders enable row level security;
revoke all on public.postcard_orders from anon, authenticated;
grant select, insert on public.postcard_orders to authenticated;

drop policy if exists "postcard orders: read own" on public.postcard_orders;
drop policy if exists "postcard orders: add own"  on public.postcard_orders;
create policy "postcard orders: read own" on public.postcard_orders for select to authenticated using (owner = (select auth.uid()));
create policy "postcard orders: add own"  on public.postcard_orders for insert to authenticated
  with check (owner = (select auth.uid()) and status = 'new'
    and exists (select 1 from public.projects p where p.id = project_id and p.owner = (select auth.uid()) and p.kind = 'postcard'));

-- 3. postcards don't count towards "published pieces"
create or replace function public.my_plan()
returns table (tier text, max_live int, live int)
language sql stable security definer set search_path = '' as $$
  select coalesce(pl.tier, 'free'), coalesce(pl.max_live, 3),
    (select count(*)::int from public.publications pub join public.projects p on p.id = pub.project_id
       where pub.owner = auth.uid() and pub.live and p.kind <> 'postcard')
  from (select auth.uid() as uid) me left join public.plans pl on pl.user_id = me.uid
$$;
revoke all on function public.my_plan() from public;
grant execute on function public.my_plan() to authenticated;

create or replace function public.enforce_publish_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare lim int; n int;
begin
  if new.live and (tg_op = 'INSERT' or not old.live) then
    if exists (select 1 from public.projects p where p.id = new.project_id and p.kind = 'postcard') then
      return new;
    end if;
    select max_live into lim from public.plans where user_id = new.owner;
    lim := coalesce(lim, 3);
    select count(*) into n from public.publications pub join public.projects p on p.id = pub.project_id
      where pub.owner = new.owner and pub.live and pub.code <> new.code and p.kind <> 'postcard';
    if n >= lim then
      raise exception 'PLAN_LIMIT:%', lim using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

-- visitors always see postcards, and postcards don't push other pieces over the limit
create or replace function public.pub_shown(c text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.publications pub join public.projects p on p.id = pub.project_id where pub.code = c and p.kind = 'postcard') then true
    else coalesce((
      select x.n <= x.lim from (
        select pub.code, row_number() over (order by pub.created_at, pub.code) as n, coalesce(pl.max_live, 3) as lim
        from public.publications me
        join public.publications pub on pub.owner = me.owner and pub.live
        join public.projects pp on pp.id = pub.project_id and pp.kind <> 'postcard'
        left join public.plans pl on pl.user_id = me.owner
        where me.code = c
      ) x where x.code = c), false)
  end
$$;
revoke all on function public.pub_shown(text) from public;
grant execute on function public.pub_shown(text) to anon, authenticated;
