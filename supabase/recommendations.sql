create table if not exists public.song_recommendations (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text not null,
  channel text not null,
  thumbnail text,
  username text not null check (char_length(username) between 2 and 24),
  comment text not null check (char_length(comment) between 1 and 1000),
  start_seconds integer not null default 0 check (start_seconds between 0 and 3600),
  end_seconds integer not null default 0 check (end_seconds between 0 and 3600),
  created_at timestamptz not null default now()
);

alter table public.song_recommendations enable row level security;

drop policy if exists "recommendations readable" on public.song_recommendations;
drop policy if exists "recommendations insert" on public.song_recommendations;

create policy "recommendations readable"
on public.song_recommendations
for select to anon, authenticated
using (true);

create policy "recommendations insert"
on public.song_recommendations
for insert to anon, authenticated
with check (
  char_length(username) between 2 and 24
  and char_length(comment) between 1 and 1000
  and start_seconds between 0 and 3600
  and end_seconds between 0 and 3600
);

do $$
begin
  alter publication supabase_realtime add table public.song_recommendations;
exception when duplicate_object then
  null;
end $$;

create index if not exists song_recommendations_created_at_idx on public.song_recommendations(created_at desc);
