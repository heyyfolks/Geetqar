import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Music storage is not configured.' }, { status: 503 })

  const { slug } = await params
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!safeSlug || safeSlug.length > 100) return NextResponse.json({ error: 'Invalid track.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Uploads created by the admin live under masters/<uuid>-<track-slug>.<ext>.
  // Search the folder directly, then fall back to a normal listing so playback
  // keeps working even if an older upload used a slightly different filename.
  const candidates = new Map<string, string>()
  const addFiles = (files: Array<{ name: string }>, prefix: string) => {
    for (const file of files || []) {
      if (file.name) candidates.set(`${prefix}/${file.name}`, file.name)
    }
  }

  const primary = await db.storage.from(BUCKET).list('masters', {
    limit: 1000,
    search: safeSlug,
    sortBy: { column: 'name', order: 'desc' },
  })

  if (!primary.error) addFiles(primary.data || [], 'masters')

  // Fallback for uploads made before the masters-folder convention was added.
  if (candidates.size === 0) {
    const root = await db.storage.from(BUCKET).list('', { limit: 1000, search: safeSlug })
    if (!root.error) addFiles(root.data || [], '')
  }

  const matchingPath = [...candidates.keys()].find(path => {
    const name = path.split('/').pop()?.toLowerCase() || ''
    return name.includes(safeSlug) && /\.(wav|flac)$/i.test(name)
  })

  if (!matchingPath) {
    return NextResponse.json(
      { error: 'Master not uploaded.', track: safeSlug },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const { data: signed, error: signError } = await db.storage.from(BUCKET).createSignedUrl(matchingPath, 60 * 60)
  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message || 'Could not create playback URL.' }, { status: 500 })
  }

  return NextResponse.json(
    { url: signed.signedUrl, expiresIn: 3600 },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
