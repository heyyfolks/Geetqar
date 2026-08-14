-- GEETQAR LIVE ROOM: one verified user = one active song vote + catalogue recommendations.
create table if not exists public.live_room_votes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  song_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_room_votes_song_idx on public.live_room_votes(song_id);

create table if not exists public.live_room_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  username text not null check (char_length(username) between 2 and 80),
  song_id text not null,
  song_title text not null check (char_length(song_title) between 1 and 160),
  purpose text not null check (char_length(purpose) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists live_room_recommendations_created_idx on public.live_room_recommendations(created_at desc);

alter table public.live_room_votes enable row level security;
alter table public.live_room_recommendations enable row level security;

drop policy if exists "live votes readable" on public.live_room_votes;
drop policy if exists "live votes own insert" on public.live_room_votes;
drop policy if exists "live votes own update" on public.live_room_votes;
drop policy if exists "live votes own delete" on public.live_room_votes;
drop policy if exists "live recommendations readable" on public.live_room_recommendations;
drop policy if exists "live recommendations own insert" on public.live_room_recommendations;

create policy "live votes readable" on public.live_room_votes for select to anon, authenticated using (true);
create policy "live votes own insert" on public.live_room_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "live votes own update" on public.live_room_votes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "live votes own delete" on public.live_room_votes for delete to authenticated using (auth.uid() = user_id);

create policy "live recommendations readable" on public.live_room_recommendations for select to anon, authenticated using (true);
create policy "live recommendations own insert" on public.live_room_recommendations for insert to authenticated with check (auth.uid() = user_id and lower(email) = lower(auth.jwt()->>'email'));

create or replace function public.touch_live_vote_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists live_room_votes_touch on public.live_room_votes;
create trigger live_room_votes_touch before update on public.live_room_votes for each row execute function public.touch_live_vote_updated_at();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_votes') then
    alter publication supabase_realtime add table public.live_room_votes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_recommendations') then
    alter publication supabase_realtime add table public.live_room_recommendations;
  end if;
end $$;
