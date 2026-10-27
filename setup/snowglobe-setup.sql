-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: snow globes ("Make your own" at artalivestudio.com/snowglobe)
-- Run once, after postcard-setup.sql. Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
-- It lets a project be a snow globe. Snow globes publish like other pieces (a link and a QR code)
-- and count towards the creator's plan, like animations and games.
-- ─────────────────────────────────────────────────────────────
alter table public.projects drop constraint if exists projects_kind_check;
alter table public.projects add constraint projects_kind_check check (kind in ('studio', 'game', 'postcard', 'snowglobe'));
