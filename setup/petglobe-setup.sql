-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: pet snow globes (artalivestudio.com/petglobe)
-- Run once. Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
--
-- Anyone can make a pet snow globe and get a link to share, with no account.
--   • The pet's cutout picture goes in a public folder ("petglobes"); the photo itself never leaves their phone.
--   • The name, message and eye/nose spots go in the petglobes table.
--   • Only the petglobe helper (an Edge Function) can add globes, so it can limit how many one person makes.
--   • Visitors read a globe through petglobe_get(), which never shows the private columns.
--   • Links last a year. Someone who saves theirs to an account keeps it for good.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.petglobes (
  code        text primary key check (code ~ '^[a-z0-9]{8}$'),
  name        text not null default '',
  message     text not null default '',
  face        jsonb,                                   -- {"w":…,"h":…,"taps":[[x,y],[x,y],[x,y]]} or null
  img         text not null,                           -- file name in the petglobes folder
  created_at  timestamptz not null default now(),
  expires_at  timestamptz default (now() + interval '1 year'),   -- null = kept for good (saved to an account)
  owner       uuid references auth.users on delete set null,
  claim_hash  text,                                    -- proof the maker has, so they can save it to an account later
  ip_hash     text,                                    -- a scrambled fingerprint, only for "how many per hour"
  hidden      boolean not null default false
);
create index if not exists petglobes_ip_time on public.petglobes (ip_hash, created_at);
create index if not exists petglobes_owner on public.petglobes (owner);

-- reports: one per person per globe; three different people hide it
create table if not exists public.petglobe_reports (
  code       text not null references public.petglobes (code) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  primary key (code, ip_hash)
);

alter table public.petglobes enable row level security;
alter table public.petglobe_reports enable row level security;

-- nobody reads or writes the tables directly, except an account owner seeing and removing their own globes
drop policy if exists "petglobes: owner reads"   on public.petglobes;
drop policy if exists "petglobes: owner deletes" on public.petglobes;
create policy "petglobes: owner reads"   on public.petglobes for select to authenticated using (owner = (select auth.uid()));
create policy "petglobes: owner deletes" on public.petglobes for delete to authenticated using (owner = (select auth.uid()));

-- what a visitor's page reads: only the public parts, only while live
create or replace function public.petglobe_get(c text)
returns table (name text, message text, face jsonb, img text)
language sql stable security definer set search_path = public as $$
  select g.name, g.message, g.face, g.img from public.petglobes g
  where g.code = lower(c) and not g.hidden and (g.expires_at is null or g.expires_at > now());
$$;
revoke all on function public.petglobe_get(text) from public;
grant execute on function public.petglobe_get(text) to anon, authenticated;

-- the public folder for the cutouts (read by anyone; only the helper adds files)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('petglobes', 'petglobes', true, 1048576, array['image/webp', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/webp', 'image/png'];
