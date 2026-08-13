-- GEETQAR community identity, site editor, and contact inbox.
-- Run this migration in Supabase SQL Editor before using the new community/admin sections.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'GEETQAR',
  hero_eyebrow text not null default 'WRITER · COMPOSER · PRODUCER',
  hero_title text not null default 'GEETQAR',
  hero_description text not null default 'Music made in the spaces between thought, desire and memory.',
  footer_tagline text not null default 'Music beyond sound.',
  contact_email text not null default 'paradisepr998@gmail.com',
  instagram_url text not null default 'https://www.instagram.com/geetqar/',
  youtube_url text not null default 'https://www.youtube.com/@geetqar',
  updated_at timestamptz not null default now()
);

insert into public.site_settings(id) values(1) on conflict(id) do nothing;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 5 and 320),
  subject text not null check (char_length(subject) between 1 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

-- Profiles: users can read/update only their own identity record.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile own read') then
    create policy "profile own read" on public.profiles for select to authenticated using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile own insert') then
    create policy "profile own insert" on public.profiles for insert to authenticated with check (auth.uid() = id and email = auth.jwt()->>'email');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile own update') then
    create policy "profile own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Public site settings are readable; writes stay server-side through the admin service key.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_settings' and policyname='site settings public read') then
    create policy "site settings public read" on public.site_settings for select using (true);
  end if;
end $$;

-- Contact messages can only be created by verified/authenticated users and are never publicly readable.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='contact authenticated insert') then
    create policy "contact authenticated insert" on public.contact_messages for insert to authenticated
      with check (auth.uid() = user_id and lower(email) = lower(auth.jwt()->>'email'));
  end if;
end $$;

-- Link community records to authenticated users while keeping old rows usable.
alter table public.chat_messages add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.chat_messages add column if not exists email text;
alter table public.queue_items add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.queue_items add column if not exists email text;
alter table public.queue_votes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.song_recommendations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.song_recommendations add column if not exists email text;

-- Prevent new anonymous chat/queue/recommendation activity. Existing anonymous rows remain as history.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chat_messages' and policyname='chat authenticated insert') then
    create policy "chat authenticated insert" on public.chat_messages for insert to authenticated
      with check (auth.uid() = user_id and lower(email) = lower(auth.jwt()->>'email'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='queue_items' and policyname='queue authenticated insert') then
    create policy "queue authenticated insert" on public.queue_items for insert to authenticated
      with check (auth.uid() = user_id and lower(email) = lower(auth.jwt()->>'email'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='queue_votes' and policyname='votes authenticated insert') then
    create policy "votes authenticated insert" on public.queue_votes for insert to authenticated
      with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='song_recommendations' and policyname='recommendations authenticated insert') then
    create policy "recommendations authenticated insert" on public.song_recommendations for insert to authenticated
      with check (auth.uid() = user_id and lower(email) = lower(auth.jwt()->>'email'));
  end if;
end $$;

create or replace function public.touch_profile_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_profile_updated_at();

-- Realtime remains enabled for the existing live-room tables.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='contact_messages') then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end $$;
