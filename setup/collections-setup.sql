-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: collections ("50 images, 1 QR code") and link previews
-- Run once, after supabase-setup.sql and publish-setup.sql.
-- In Supabase: SQL Editor → New query → paste all of this → Run.
-- Safe to run again. The "drop … if exists" lines only replace
-- this file's own rules; no customer data is removed.
-- ─────────────────────────────────────────────────────────────

-- 1. A collection: up to 50 published pieces behind one QR code.
--    items holds, for each piece, its project and a tiny picture "fingerprint"
--    the camera uses to tell the pieces apart.
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null default 'My collection' check (char_length(title) <= 120),
  code        text unique check (code ~ '^[a-z0-9]{8}$'),
  live        boolean not null default false,
  views       bigint not null default 0,
  items       jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists collections_touch on public.collections;
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

alter table public.collections enable row level security;
grant select, insert, update, delete on public.collections to authenticated;
revoke all on public.collections from anon;

drop policy if exists "collections: read own"   on public.collections;
drop policy if exists "collections: add own"    on public.collections;
drop policy if exists "collections: change own" on public.collections;
drop policy if exists "collections: delete own" on public.collections;
create policy "collections: read own"   on public.collections for select to authenticated using (owner = (select auth.uid()));
create policy "collections: add own"    on public.collections for insert to authenticated with check (owner = (select auth.uid()));
create policy "collections: change own" on public.collections for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "collections: delete own" on public.collections for delete to authenticated using (owner = (select auth.uid()));

-- 2. Visitors open a live collection by its code: its name and its live pieces
create or replace function public.published_collection(c text)
returns table (title text, items jsonb)
language sql stable security definer set search_path = '' as $$
  select col.title, coalesce((
    select jsonb_agg(jsonb_build_object('code', pub.code, 'title', p.title, 'kind', p.kind, 'fp', e.it -> 'fp', 'aspect', e.it -> 'aspect') order by e.ord)
    from jsonb_array_elements(col.items) with ordinality as e(it, ord)
    join public.projects p on p.id::text = e.it ->> 'project_id' and p.owner = col.owner
    join public.publications pub on pub.project_id = p.id and pub.live
  ), '[]'::jsonb)
  from public.collections col
  where col.code = c and col.live
$$;
revoke all on function public.published_collection(text) from public;
grant execute on function public.published_collection(text) to anon, authenticated;

create or replace function public.count_collection_view(c text)
returns void language sql volatile security definer set search_path = '' as $$
  update public.collections set views = views + 1 where code = c and live
$$;
revoke all on function public.count_collection_view(text) from public;
grant execute on function public.count_collection_view(text) to anon, authenticated;

-- 3. Link previews (the picture and title shown when a link is sent in a text)
create or replace function public.share_card(c text)
returns table (title text, artist text, thumb text)
language sql stable security definer set search_path = '' as $$
  select p.title, coalesce(p.data ->> 'artist', ''), p.thumb
  from public.publications pub join public.projects p on p.id = pub.project_id
  where pub.code = c and pub.live
$$;
revoke all on function public.share_card(text) from public;
grant execute on function public.share_card(text) to anon, authenticated;

create or replace function public.collection_card(c text)
returns table (title text, pieces int, thumb text)
language sql stable security definer set search_path = '' as $$
  select col.title, jsonb_array_length(col.items),
    (select p.thumb from jsonb_array_elements(col.items) with ordinality as e(it, ord)
       join public.projects p on p.id::text = e.it ->> 'project_id' and p.owner = col.owner
       join public.publications pub on pub.project_id = p.id and pub.live
     where p.thumb is not null order by e.ord limit 1)
  from public.collections col
  where col.code = c and col.live
$$;
revoke all on function public.collection_card(text) from public;
grant execute on function public.collection_card(text) to anon, authenticated;
