import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Music storage is not configured.' }, { status: 503 })

  const { slug } = await params
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!safeSlug || safeSlug.length > 100) return NextResponse.json({ error: 'Invalid track.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data, error } = await db.storage.from('Music').list('masters', { limit: 1000, sortBy: { column: 'name', order: 'desc' } })
  if (error) return NextResponse.json({ error: 'Could not read music library.' }, { status: 500 })

  const match = (data || []).find(file => {
    const name = file.name.toLowerCase()
    return name.endsWith(`-${safeSlug}.wav`) || name.endsWith(`-${safeSlug}.flac`) || name.endsWith(`${safeSlug}.wav`) || name.endsWith(`${safeSlug}.flac`)
  })
  if (!match) return NextResponse.json({ error: 'Master not uploaded.' }, { status: 404 })

  const path = `masters/${match.name}`
  const { data: signed, error: signError } = await db.storage.from('Music').createSignedUrl(path, 60 * 60)
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: 'Could not create playback URL.' }, { status: 500 })
  return NextResponse.json({ url: signed.signedUrl, expiresIn: 3600 }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
