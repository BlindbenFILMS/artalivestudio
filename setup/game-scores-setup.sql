-- ─────────────────────────────────────────────────────────────
-- ART ALIVE: TOP SCORES for the games (the snowman game at artalivestudio.com/snowglobe/snowman.html is the first)
-- Run once. Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
--
-- What it does: everyone who plays a game from the same link shares one list of top scores (a "board").
-- A player types a name; the list keeps that name, their best score, and a random number that stands for
-- their device (so playing again raises their own score instead of adding them twice). Nothing else is kept:
-- no email, no IP address. Anyone who has the link can see the names and scores, so first names or nicknames are best.
--
-- Until this has been run, the game still works: it keeps each player's scores on their own device only.
--
-- To take a name off the list: Supabase → Table Editor → game_scores → tick the row → Delete.
-- To empty a list and start again:   delete from public.game_scores where board = 'snowman';
-- ─────────────────────────────────────────────────────────────

create table if not exists public.game_scores (
  id          bigint generated always as identity primary key,
  board       text not null check (board ~ '^[a-z0-9-]{1,40}$'),          -- which list: 'snowman', or the name after ?board= in the link
  player      text not null check (player ~ '^[a-z0-9]{12,32}$'),        -- a random number kept on the player's own device
  name        text not null check (char_length(name) between 1 and 12),
  score       int  not null check (score between 0 and 20000),           -- their best
  rounds      int  not null default 1,                                    -- how many rounds they have sent in
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),                     -- when they reached their best (of two equal scores, the earlier is listed first)
  unique (board, player)
);
create index if not exists game_scores_top on public.game_scores (board, score desc, updated_at);

-- nobody reads or writes the table directly: players save through score_save and read through score_top
alter table public.game_scores enable row level security;
revoke all on public.game_scores from anon, authenticated;

-- 1. the top of a board: places, names and scores (and, for the player who asks, their own place)
create or replace function public.score_top(b text, p text default null, k int default 10)
returns jsonb language sql stable security definer set search_path = '' as $$
  with r as (
    select s.player, s.name, s.score, s.updated_at, (rank() over (order by s.score desc))::int as place
    from public.game_scores s where s.board = b
  )
  select jsonb_build_object(
    'top', coalesce((select jsonb_agg(jsonb_build_object('place', t.place, 'name', t.name, 'score', t.score) order by t.score desc, t.updated_at)
                     from (select * from r order by r.score desc, r.updated_at limit greatest(1, least(coalesce(k, 10), 50))) t), '[]'::jsonb),
    'players', (select count(*) from r),
    'me', (select jsonb_build_object('place', r.place, 'name', r.name, 'score', r.score) from r where p is not null and r.player = p limit 1))
$$;
revoke all on function public.score_top(text, text, int) from public;
grant execute on function public.score_top(text, text, int) to anon, authenticated;

-- 2. save a score: the player's name and their best score so far. Gives back the board as score_top does (nothing, if it was refused).
create or replace function public.score_save(b text, p text, n text, s int, k int default 10)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare nm text; plain text;
begin
  if b is null or p is null or s is null or b !~ '^[a-z0-9-]{1,40}$' or p !~ '^[a-z0-9]{12,32}$' or s < 0 or s > 20000 then return null; end if;
  -- the name: no symbols, single spaces, at most 12 characters, never empty
  nm := regexp_replace(coalesce(n, ''), '[[:cntrl:]<>&"/\\{}()\[\]#%^*+=|~`;:,?!@$_]', '', 'g');
  nm := btrim(left(btrim(regexp_replace(nm, '[[:space:]]+', ' ', 'g')), 12));
  if nm = '' then nm := 'Player'; end if;
  -- a short list of rude words is not shown: the name becomes "Player". (They are kept here only as fingerprints.
  -- To add a word, run:  select md5('word');  and add the answer to the list.)
  plain := translate(lower(nm), '013457', 'oieast');
  if exists (select 1 from unnest(regexp_split_to_array(plain, '[^a-z]+') || regexp_replace(plain, '[^a-z]', '', 'g')) w where md5(w) = any (array[
    'e705c4d685bf03258eb5ba0dc767905b', 'b187f5e6c83d64d9bd7c6fc602e9b132', '0b9a54438fba2dc0d39be8f7c6c71a58', 'b0d7afc8ffd4ec4150ce9bba29f20969',
    '316928e0d260556eaccb6627f2ed657b', 'bbf4cf5c9c38f3b3c0ff13f0216cd275', 'd091fccc62e2d24ab101dbe01ce844f6', '9268d0b2d17670598c70045b0c7abf38',
    'b52b073595ccb35eaebb87178227b779', 'e62a73b624eabdc6b7be5aa724b48400', 'ee2a23af409b352d8f1819405bc770b2', 'c592eff5625d551b0c5be656377ff871',
    'cb205edee16b24366c871cf55e781346', '7243603c2d7491b050877299c6893cdd', '99754106633f94d350db34d548d6091a', 'aac0a9daa4185875786c9ed154f0dece',
    '8561b0da13f41d736812e2f12b078a40', '69b4d5ce9d769080675275b66a82fdb7', '0ade91adf264e00acca80a876187c429', 'ed568ded728bf4d1c56ab349fa4823c3',
    '9271d6eecedd55fcfa6143a33029d496', 'c35312fb3a7e05b7a44db2326bd29040', 'c02b7d24a066adb747fdeb12deb21bfa', 'e903d4d92fb20751a15a02e1558cb116',
    'e42b93ccb6b3bd31c255f4907c97e6a2', '89e55d4f580dd044088b9a003110b37a', '52fb9dccfeae3a4f88b5f9399de183e6', 'acc6f2779b808637d04c71e3d8360eeb',
    'c29b0f2822df70edc474f6f47d3c0dc3', 'adbf67b0c537a89e68b347a574c0b809', '1d123b3c5603b87fd84e1a48ba0bed6c', '3c3662bcb661d6de679c636744c66b62',
    '1223b8c30a347321299611f873b449ad', 'f8d1e57447a2556bcb47ad5706d02882', 'fe325cf304ee9155d513be1044bf064b', '46d0cb1bff872c6b47284a3de08cf04f',
    '32e09232d75641f6dbdf2552b3e3319b', '8332189037ebe7b280743783345c6f5c', '3e12ec4d994fefe424c88687d738a874', 'd15b0ff178b085c809d334f5c5850eab'
  ])) then nm := 'Player'; end if;
  -- a new player: a board takes at most 3,000 new players a day and 30,000 in all, so it cannot be flooded
  if not exists (select 1 from public.game_scores where board = b and player = p) then
    if (select count(*) from public.game_scores where board = b and created_at > now() - interval '1 day') >= 3000
       or (select count(*) from public.game_scores where board = b) >= 30000 then return null; end if;
  end if;
  insert into public.game_scores (board, player, name, score) values (b, p, nm, s)
  on conflict (board, player) do update
    set name = excluded.name, score = greatest(public.game_scores.score, excluded.score), rounds = public.game_scores.rounds + 1,
        updated_at = case when excluded.score > public.game_scores.score then now() else public.game_scores.updated_at end;
  return public.score_top(b, p, k);
end $$;
revoke all on function public.score_save(text, text, text, int, int) from public;
grant execute on function public.score_save(text, text, text, int, int) to anon, authenticated;

-- tell the site's connection to the database about the two new functions straight away
notify pgrst, 'reload schema';
