create table if not exists public.queue_items (
 id uuid primary key default gen_random_uuid(),
 track_id text not null,
 username text not null check (char_length(username) between 2 and 24),
 votes integer not null default 0,
 status text not null default 'queued' check (status in ('queued','playing','played')),
 created_at timestamptz not null default now(),
 started_at timestamptz
);
create table if not exists public.queue_votes (
 queue_id uuid references public.queue_items(id) on delete cascade,
 voter_id text not null,
 created_at timestamptz not null default now(),
 primary key(queue_id,voter_id)
);
alter table public.queue_items enable row level security;
alter table public.queue_votes enable row level security;
create policy "queue is readable" on public.queue_items for select using (true);
create policy "queue can be inserted" on public.queue_items for insert with check (true);
create policy "votes are readable" on public.queue_votes for select using (true);
create or replace function public.vote_queue_item(p_queue_id uuid,p_voter_id text)
returns public.queue_items language plpgsql security definer as $$
declare item public.queue_items;
begin
 insert into public.queue_votes(queue_id,voter_id) values(p_queue_id,p_voter_id) on conflict do nothing;
 if found then update public.queue_items set votes=votes+1 where id=p_queue_id and status='queued' returning * into item; else select * into item from public.queue_items where id=p_queue_id; end if;
 return item;
end; $$;
create or replace function public.claim_next_queue_item()
returns public.queue_items language plpgsql security definer as $$
declare item public.queue_items;
begin
 select * into item from public.queue_items where status='queued' order by votes desc,created_at asc for update skip locked limit 1;
 if item.id is null then return null; end if;
 update public.queue_items set status='playing',started_at=now() where id=item.id returning * into item;
 return item;
end; $$;