-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: MAGIC POSTCARDS, "they opened it" emails and video replies
-- Run once, after postcard-setup.sql.
-- Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
-- 1. Remembers when each postcard is first opened (so the sender is emailed once).
-- 2. Keeps the video and voice replies people send back, private to the sender.
-- 3. Two lookups only the postcard helper (postcard-events) can use.
-- ─────────────────────────────────────────────────────────────

-- 1. when a postcard was first opened
alter table public.publications add column if not exists opened_at timestamptz;

-- 2. video replies: the video itself sits in the sender's own storage folder (owner/replies/code/…),
--    so only the sender can watch it. Replies are added by the helper, never directly by visitors.
create table if not exists public.postcard_replies (
  id          uuid primary key default gen_random_uuid(),
  code        text not null references public.publications (code) on delete cascade,
  owner       uuid not null references auth.users (id) on delete cascade,
  path        text not null,
  from_name   text not null default '' check (char_length(from_name) <= 60),
  note        text not null default '' check (char_length(note) <= 300),
  seen        boolean not null default false,
  created_at  timestamptz not null default now()
);
-- a reply is a video, or a voice recording for the camera-shy
alter table public.postcard_replies add column if not exists kind text not null default 'video' check (kind in ('video', 'audio'));
create index if not exists postcard_replies_owner on public.postcard_replies (owner, created_at desc);
create index if not exists postcard_replies_code on public.postcard_replies (code);
-- each uploaded file is one reply (so a reply sent twice is saved, and emailed, only once)
create unique index if not exists postcard_replies_path on public.postcard_replies (path);

alter table public.postcard_replies enable row level security;
revoke all on public.postcard_replies from anon, authenticated;
grant select, delete on public.postcard_replies to authenticated;
grant update (seen) on public.postcard_replies to authenticated;

drop policy if exists "replies: read own"   on public.postcard_replies;
drop policy if exists "replies: mark own"   on public.postcard_replies;
drop policy if exists "replies: delete own" on public.postcard_replies;
create policy "replies: read own"   on public.postcard_replies for select to authenticated using (owner = (select auth.uid()));
create policy "replies: mark own"   on public.postcard_replies for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "replies: delete own" on public.postcard_replies for delete to authenticated using (owner = (select auth.uid()));

-- 3a. the postcard behind a code: who sent it (and their email), who it's for, and the sender's choices
create or replace function public.postcard_info(c text)
returns table (owner uuid, email text, to_name text, from_name text, place text, notify boolean, replies boolean, opened_at timestamptz, reply_count int)
language sql stable security definer set search_path = '' as $$
  select pub.owner, u.email::text,
    coalesce(p.data->>'to', ''), coalesce(p.data->>'from', ''), coalesce(p.data->>'place', ''),
    coalesce(p.data->>'notify', 'true') <> 'false', coalesce(p.data->>'replies', 'true') <> 'false',
    pub.opened_at, (select count(*)::int from public.postcard_replies r where r.code = c)
  from public.publications pub
  join public.projects p on p.id = pub.project_id
  join auth.users u on u.id = pub.owner
  where pub.code = c and pub.live and p.kind = 'postcard'
$$;
revoke all on function public.postcard_info(text) from public, anon, authenticated;
grant execute on function public.postcard_info(text) to service_role;

-- 3b. mark it opened; true only the very first time
create or replace function public.postcard_mark_opened(c text)
returns boolean language sql volatile security definer set search_path = '' as $$
  with u as (update public.publications set opened_at = now() where code = c and live and opened_at is null returning 1)
  select exists (select 1 from u)
$$;
revoke all on function public.postcard_mark_opened(text) from public, anon, authenticated;
grant execute on function public.postcard_mark_opened(text) to service_role;
