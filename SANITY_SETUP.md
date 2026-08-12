# Sanity setup

Create a Sanity project and dataset, then configure the Studio with `sanity/schema.ts` exports. The app reads `siteSettings`, `track`, and `pinnedTopic` documents through `lib/sanity.ts`.

Required public environment variables:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`

Keep Sanity write tokens server-side only. Do not put an editor token in `NEXT_PUBLIC_*` variables.

# Supabase setup

Run migrations in order:
1. `supabase/migrations/001_queue.sql`
2. `supabase/migrations/002_realtime_chat.sql`
3. `supabase/migrations/003_production.sql`

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `GEETQAR_ADMIN_SECRET` (temporary admin gate; replace with Supabase Auth before launch)

Never commit `.env.local` or service-role keys.
