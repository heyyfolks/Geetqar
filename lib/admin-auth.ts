import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from './supabase-server'
import { adminDb } from './db'

/** Resolves to the service client when the request comes from the signed-in admin, otherwise to an error response. */
export async function adminOnly(request: Request, opts: { write?: boolean } = {}): Promise<{ db: SupabaseClient } | { error: NextResponse }> {
  const { user } = await requireAdmin()
  if (!user) return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) }
  if (opts.write) {
    // block cross-site requests: the browser sends Origin on every POST
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host && new URL(origin).host !== host) return { error: NextResponse.json({ error: 'Blocked.' }, { status: 403 }) }
  }
  const db = adminDb()
  if (!db) return { error: NextResponse.json({ error: 'The database is not configured (SUPABASE_SERVICE_ROLE_KEY is missing).' }, { status: 503 }) }
  return { db }
}
