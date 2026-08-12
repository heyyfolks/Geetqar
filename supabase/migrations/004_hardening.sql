-- Production hardening for the community jukebox.
-- Prevents race-condition duplicates and prevents anonymous users from advancing playback.

create unique index if not exists queue_one_active_track
on public.queue_items(track_id)
where status in ('queued','playing');

-- Only the voting RPC should mutate votes.
revoke execute on function public.claim_next_queue_item() from public;
revoke execute on function public.claim_next_queue_item() from anon;
revoke execute on function public.claim_next_queue_item() from authenticated;

-- Tighten the security-definer functions so they do not inherit an unsafe search_path.
alter function public.vote_queue_item(uuid,text) set search_path = public;
alter function public.claim_next_queue_item() set search_path = public;

-- Allow realtime subscribers to receive queue changes without exposing write access.
do $$ begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='queue_items'
  ) then
    alter publication supabase_realtime add table public.queue_items;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
