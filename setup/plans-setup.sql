-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: plans (how many pieces each account can have published)
-- Run once, after the other setup files.
-- In Supabase: SQL Editor → New query → paste all of this → Run.
-- Safe to run again; no customer data is removed.
--
-- Everyone starts on Free (3 published pieces). When someone pays,
-- open Table Editor → plans, and add or edit their row:
--   user_id  = their id (Authentication → Users → copy the user's ID)
--   tier     = pro20, pro50, pro100, pro250, custom or owner
--   max_live = 20, 50, 100, 250 (or any number you agree with them)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.plans (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  tier        text not null default 'free',
  max_live    int  not null default 3 check (max_live >= 0),
  note        text,
  updated_at  timestamptz not null default now()
);
drop trigger if exists plans_touch on public.plans;
create trigger plans_touch before update on public.plans
  for each row execute function public.touch_updated_at();

-- people can see their own plan; only you (in the dashboard) can change plans
alter table public.plans enable row level security;
grant select on public.plans to authenticated;
revoke insert, update, delete on public.plans from authenticated, anon;
drop policy if exists "plans: read own" on public.plans;
create policy "plans: read own" on public.plans for select to authenticated using (user_id = (select auth.uid()));

-- my plan, and how many pieces I have published right now
create or replace function public.my_plan()
returns table (tier text, max_live int, live int)
language sql stable security definer set search_path = '' as $$
  select coalesce(pl.tier, 'free'), coalesce(pl.max_live, 3),
    (select count(*)::int from public.publications pub where pub.owner = auth.uid() and pub.live)
  from (select auth.uid() as uid) me left join public.plans pl on pl.user_id = me.uid
$$;
revoke all on function public.my_plan() from public;
grant execute on function public.my_plan() to authenticated;

-- the limit: publishing one more piece than the plan allows is refused
create or replace function public.enforce_publish_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare lim int; n int;
begin
  if new.live and (tg_op = 'INSERT' or not old.live) then
    select max_live into lim from public.plans where user_id = new.owner;
    lim := coalesce(lim, 3);
    select count(*) into n from public.publications where owner = new.owner and live and code <> new.code;
    if n >= lim then
      raise exception 'PLAN_LIMIT:%', lim using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists publications_limit on public.publications;
create trigger publications_limit before insert or update of live on public.publications
  for each row execute function public.enforce_publish_limit();
