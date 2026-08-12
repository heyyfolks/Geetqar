create table if not exists public.chat_messages(id uuid primary key default gen_random_uuid(),username text not null check(char_length(username) between 2 and 24),message text not null check(char_length(message) between 1 and 500),created_at timestamptz not null default now());
alter table public.chat_messages enable row level security;
create policy "chat readable" on public.chat_messages for select using(true);
create policy "chat insert" on public.chat_messages for insert with check(true);
alter publication supabase_realtime add table public.queue_items;
alter publication supabase_realtime add table public.chat_messages;
