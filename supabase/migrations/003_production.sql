-- Production data model: tracks, discussions, private masters.
create table if not exists public.tracks(id uuid primary key default gen_random_uuid(),title text not null,slug text unique not null,cover_url text,master_path text,release_date date,created_at timestamptz not null default now());
create table if not exists public.discussions(id uuid primary key default gen_random_uuid(),track_id uuid references public.tracks(id) on delete set null,title text not null,body text not null,username text not null,created_at timestamptz not null default now());
alter table public.tracks enable row level security;
alter table public.discussions enable row level security;
create policy if not exists "tracks public read" on public.tracks for select using(true);
create policy if not exists "discussion public read" on public.discussions for select using(true);
create policy if not exists "discussion public insert" on public.discussions for insert with check(char_length(username) between 2 and 24 and char_length(body) between 1 and 4000);
insert into storage.buckets(id,name,public) values('audio-masters','audio-masters',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('covers','covers',true) on conflict(id) do nothing;
-- IMPORTANT: do not create a public SELECT policy on audio-masters. Server-side signed URLs only.
create policy if not exists "covers public read" on storage.objects for select using(bucket_id='covers');
-- Admin writes to audio-masters/covers should be performed with the Supabase service role from a server route after admin auth.
