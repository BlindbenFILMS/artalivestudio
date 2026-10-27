-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: analytics (how people enjoy each published piece)
-- Run once, after publish-setup.sql and collections-setup.sql.
-- Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
--
-- What's kept, and what isn't: for each moment (opened, camera on, found it, photo taken, shared, saved, replied) we keep
-- the piece's code, the kind of device (phone, tablet or computer), the visitor's local hour, their language and time
-- zone (like "America/New_York"), and when. No names, no emails, no IP addresses, nothing that identifies a person.
-- Only the creator who published a piece can see its numbers, and only as totals.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.view_events (
  id          bigint generated always as identity primary key,
  code        text not null check (code ~ '^[a-z0-9]{8}$'),
  kind        text not null check (kind in ('open', 'camera', 'found', 'capture', 'share', 'save', 'reply')),
  device      text check (device in ('phone', 'tablet', 'computer')),
  hour        smallint check (hour between 0 and 23),
  lang        text check (char_length(lang) <= 12),
  tz          text check (char_length(tz) <= 48),
  created_at  timestamptz not null default now()
);
create index if not exists view_events_code_time on public.view_events (code, created_at desc);

-- nobody reads or writes the table directly; visitors log through log_event, creators read through project_stats
alter table public.view_events enable row level security;
revoke all on public.view_events from anon, authenticated;

-- 1. log a moment (only for live published codes; a code can't be flooded past 20,000 moments a day)
create or replace function public.log_event(c text, k text, dev text default null, hr int default null, lg text default null, zone text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if k not in ('open', 'camera', 'found', 'capture', 'share', 'save', 'reply') then return; end if;
  if not exists (select 1 from public.publications where code = c and live)
     and not exists (select 1 from public.collections where code = c and live) then return; end if;
  if (select count(*) from public.view_events where code = c and created_at > now() - interval '1 day') >= 20000 then return; end if;
  insert into public.view_events (code, kind, device, hour, lang, tz)
  values (c, k,
    case when dev in ('phone', 'tablet', 'computer') then dev end,
    case when hr between 0 and 23 then hr end,
    left(coalesce(lg, ''), 12), left(coalesce(zone, ''), 48));
end $$;
revoke all on function public.log_event(text, text, text, int, text, text) from public;
grant execute on function public.log_event(text, text, text, int, text, text) to anon, authenticated;

-- 2. a piece's numbers, for the creator who published it (totals only)
create or replace function public.project_stats(c text, days int default 30)
returns jsonb language sql stable security definer set search_path = '' as $$
  with mine as (
    select 1 from public.publications where code = c and owner = (select auth.uid())
    union all select 1 from public.collections where code = c and owner = (select auth.uid())
  ), ev as (
    select * from public.view_events
    where code = c and exists (select 1 from mine) and created_at > now() - make_interval(days => greatest(1, least(days, 365)))
  )
  select case when not exists (select 1 from mine) then null else jsonb_build_object(
    'days', greatest(1, least(days, 365)),
    'totals', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from ev group by kind) t), '{}'::jsonb),
    'byDay', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'open', o, 'found', f, 'capture', p) order by d)
                       from (select (created_at at time zone 'utc')::date d, count(*) filter (where kind = 'open') o, count(*) filter (where kind = 'found') f,
                                    count(*) filter (where kind = 'capture') p from ev group by 1) t), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(coalesce(device, 'unknown'), n) from (select device, count(*) n from ev where kind = 'open' group by device) t), '{}'::jsonb),
    'hours', coalesce((select jsonb_object_agg(hour, n) from (select hour, count(*) n from ev where kind = 'open' and hour is not null group by hour) t), '{}'::jsonb),
    'zones', coalesce((select jsonb_agg(jsonb_build_object('tz', tz, 'n', n) order by n desc) from (select tz, count(*) n from ev where kind = 'open' and tz <> '' group by tz order by n desc limit 8) t), '[]'::jsonb),
    'langs', coalesce((select jsonb_agg(jsonb_build_object('lang', lang, 'n', n) order by n desc) from (select lang, count(*) n from ev where kind = 'open' and lang <> '' group by lang order by n desc limit 6) t), '[]'::jsonb),
    'views', coalesce((select views from public.publications where code = c), (select views from public.collections where code = c), 0)
  ) end
$$;
revoke all on function public.project_stats(text, int) from public, anon;
grant execute on function public.project_stats(text, int) to authenticated;
