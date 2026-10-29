import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client with the service role. Returns null when the env vars are missing (previews, local).
 * `cached: true` is for public pages: results are kept for a few minutes and cleared the moment the admin saves a change
 * (tag "gq"). The default is always fresh, for the admin panel.
 */
export function adminDb(cached = false): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, cached ? { ...init, next: { revalidate: 300, tags: ['gq'] } } : { ...init, cache: 'no-store' }),
    },
  })
}
