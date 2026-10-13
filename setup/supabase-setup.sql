-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: one-time database setup
-- In Supabase: SQL Editor → New query → paste all of this → Run.
-- Safe to run again: it skips anything that already exists.
-- ─────────────────────────────────────────────────────────────

-- 1. Projects: one row per animation or game a customer saves
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('studio', 'game')),
  title       text not null default 'Untitled' check (char_length(title) <= 120),
  folder      text not null default '' check (char_length(folder) <= 60),
  data        jsonb not null default '{}'::jsonb,
  thumb       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_owner_updated on public.projects (owner, updated_at desc);

-- keep updated_at current on every change
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- 2. Each customer sees and changes only their own projects
alter table public.projects enable row level security;
grant select, insert, update, delete on public.projects to authenticated;
revoke all on public.projects from anon;

drop policy if exists "projects: read own"   on public.projects;
drop policy if exists "projects: add own"    on public.projects;
drop policy if exists "projects: change own" on public.projects;
drop policy if exists "projects: delete own" on public.projects;
create policy "projects: read own"   on public.projects for select to authenticated using (owner = (select auth.uid()));
create policy "projects: add own"    on public.projects for insert to authenticated with check (owner = (select auth.uid()));
create policy "projects: change own" on public.projects for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "projects: delete own" on public.projects for delete to authenticated using (owner = (select auth.uid()));

-- 3. Files (pictures, recordings, thumbnails): a private bucket, one folder per customer
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "media: read own"   on storage.objects;
drop policy if exists "media: add own"    on storage.objects;
drop policy if exists "media: change own" on storage.objects;
drop policy if exists "media: delete own" on storage.objects;
create policy "media: read own"   on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: add own"    on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: change own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
