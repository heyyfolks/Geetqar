create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  username text not null check(char_length(username) between 2 and 24),
  message text not null check(char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chat_messages' and policyname='chat readable') then
    create policy "chat readable" on public.chat_messages for select to anon, authenticated using(true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chat insert') then
    create policy "chat insert" on public.chat_messages for insert to anon, authenticated
      with check(char_length(username) between 2 and 24 and char_length(message) between 1 and 500);
  end if;
end $$;

-- Realtime is idempotent: only add a table when it is not already published.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='queue_items') then
    alter publication supabase_realtime add table public.queue_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
