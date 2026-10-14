-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: publishing (run once, after supabase-setup.sql)
-- In Supabase: SQL Editor → New query → paste all of this → Run.
-- Safe to run again. The "drop … if exists" lines only replace
-- this file's own rules; no customer data is removed.
-- ─────────────────────────────────────────────────────────────

-- 1. A published project gets a short code; its link and QR code use that code
create table if not exists public.publications (
  code        text primary key check (code ~ '^[a-z0-9]{8}$'),
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  live        boolean not null default true,
  views       bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists publications_touch on public.publications;
create trigger publications_touch before update on public.publications
  for each row execute function public.touch_updated_at();

-- 2. Creators manage their own publications
alter table public.publications enable row level security;
grant select, insert, update, delete on public.publications to authenticated;
revoke all on public.publications from anon;

drop policy if exists "publications: read own"   on public.publications;
drop policy if exists "publications: add own"    on public.publications;
drop policy if exists "publications: change own" on public.publications;
drop policy if exists "publications: delete own" on public.publications;
create policy "publications: read own"   on public.publications for select to authenticated using (owner = (select auth.uid()));
create policy "publications: add own"    on public.publications for insert to authenticated
  with check (owner = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.owner = (select auth.uid())));
create policy "publications: change own" on public.publications for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "publications: delete own" on public.publications for delete to authenticated using (owner = (select auth.uid()));

-- 3. Visitors (no account) can open a live published project by its code, and nothing else
create or replace function public.published(c text)
returns table (kind text, title text, data jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.kind, p.title, p.data, p.updated_at
  from public.publications pub join public.projects p on p.id = pub.project_id
  where pub.code = c and pub.live
$$;
revoke all on function public.published(text) from public;
grant execute on function public.published(text) to anon, authenticated;

-- count a visit (only for live codes)
create or replace function public.count_view(c text)
returns void language sql volatile security definer set search_path = '' as $$
  update public.publications set views = views + 1 where code = c and live
$$;
revoke all on function public.count_view(text) from public;
grant execute on function public.count_view(text) to anon, authenticated;

-- 4. Pictures and recordings of a live published project can be read by visitors
create or replace function public.media_is_published(path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.publications pub
    where pub.live and pub.owner::text = split_part(path, '/', 1) and pub.project_id::text = split_part(path, '/', 2)
  )
$$;
revoke all on function public.media_is_published(text) from public;
grant execute on function public.media_is_published(text) to anon, authenticated;

drop policy if exists "media: read published" on storage.objects;
create policy "media: read published" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media' and public.media_is_published(name));
