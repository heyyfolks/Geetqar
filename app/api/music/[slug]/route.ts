import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Music storage is not configured.' }, { status: 503 })

  const { slug } = await params
  // Compare slugs and filenames using the same normalized form. This handles
  // velvet-play, velvet_play, Velvet Play, and UUID-prefixed uploaded files.
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalizedSlug || normalizedSlug.length > 100) return NextResponse.json({ error: 'Invalid track.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const candidates: string[] = []
  const addFiles = (files: Array<{ name: string }>, prefix: string) => {
    for (const file of files || []) {
      if (file.name && /\.(wav|flac)$/i.test(file.name)) {
        candidates.push(prefix ? `${prefix}/${file.name}` : file.name)
      }
    }
  }

  const primary = await db.storage.from(BUCKET).list('masters', {
    limit: 1000,
    sortBy: { column: 'name', order: 'desc' },
  })
  if (!primary.error) addFiles(primary.data || [], 'masters')

  // Fallback for older uploads that may have been placed at the bucket root.
  if (candidates.length === 0) {
    const root = await db.storage.from(BUCKET).list('', { limit: 1000 })
    if (!root.error) addFiles(root.data || [], '')
  }

  const matchingPath = candidates.find(path => {
    const name = path.split('/').pop()?.toLowerCase() || ''
    const normalizedName = name.replace(/[^a-z0-9]/g, '')
    return normalizedName.includes(normalizedSlug)
  })

  if (!matchingPath) {
    return NextResponse.json(
      { error: 'Master not uploaded.', track: slug },
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
