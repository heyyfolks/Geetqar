-- GEETQAR ADMIN SECURITY
-- 1) Replace YOUR_ADMIN_EMAIL below with the same email you will put in Vercel as GEETQAR_ADMIN_EMAIL.
-- 2) Run this whole file once in Supabase SQL Editor.
-- 3) Never put the service-role key in browser code.

create or replace function public.is_geetqar_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_geetqar_admin() from public;
grant execute on function public.is_geetqar_admin() to authenticated;

-- Promote exactly one Supabase Auth user to the private admin role.
-- Replace the email before running this statement.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = lower('YOUR_ADMIN_EMAIL');

-- Private master audio: only the authenticated admin can access/write it.
insert into storage.buckets (id, name, public)
values ('audio-masters', 'audio-masters', false)
on conflict (id) do update set public = false;

drop policy if exists "geetqar_admin_master_select" on storage.objects;
drop policy if exists "geetqar_admin_master_insert" on storage.objects;
drop policy if exists "geetqar_admin_master_update" on storage.objects;
drop policy if exists "geetqar_admin_master_delete" on storage.objects;

create policy "geetqar_admin_master_select"
on storage.objects for select to authenticated
using (bucket_id = 'audio-masters' and public.is_geetqar_admin());

create policy "geetqar_admin_master_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'audio-masters' and public.is_geetqar_admin());

create policy "geetqar_admin_master_update"
on storage.objects for update to authenticated
using (bucket_id = 'audio-masters' and public.is_geetqar_admin())
with check (bucket_id = 'audio-masters' and public.is_geetqar_admin());

create policy "geetqar_admin_master_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'audio-masters' and public.is_geetqar_admin());

-- Apply an admin-only ALL policy to existing content tables without assuming
-- their exact migration state. Public read/write policies remain untouched.
do $$
declare
  t text;
  tables text[] := array['tracks','music_tracks','chat_messages','jukebox_queue','queue_items','song_recommendations','trending_topics','forum_posts'];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists geetqar_admin_all on public.%I', t);
      execute format('alter table public.%I enable row level security', t);
      execute format('create policy geetqar_admin_all on public.%I for all to authenticated using (public.is_geetqar_admin()) with check (public.is_geetqar_admin())', t);
    end if;
  end loop;
end $$;

-- Verification:
-- select email, raw_app_meta_data from auth.users where lower(email)=lower('YOUR_ADMIN_EMAIL');
