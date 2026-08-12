# GEETQAR

Premium cinematic music universe for Geetqar — writer, composer and producer.

## Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + Framer Motion
- Supabase for realtime community features and queue state
- Sanity planned as the content/admin CMS

## Architecture
The public site is intentionally separated from privileged music operations. Original WAV/FLAC masters must never be exposed through GitHub or the public client. Production uploads should go from an authenticated admin surface to private object storage using signed upload URLs; playback uses short-lived signed URLs.

The community queue uses Postgres transactions/RPCs rather than client-side vote increments. A composite primary key `(queue_id, voter_id)` makes a voter idempotent, while `claim_next_queue_item()` locks the next highest-voted item with `FOR UPDATE SKIP LOCKED`.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add Supabase credentials.
4. `npm run dev`

## Next production modules
- Sanity schemas for site settings, tracks, pinned topics and discussion posts.
- Supabase Auth for the Geetqar-only admin surface.
- Private audio bucket for original WAV/FLAC masters.
- Realtime subscriptions for queue/chat/forum updates.
- Rate limiting + moderation for public community input.
