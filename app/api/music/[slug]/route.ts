import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Music storage is not configured.' }, { status: 503 })

  const { slug } = await params
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalizedSlug || normalizedSlug.length > 100) return NextResponse.json({ error: 'Invalid track.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const candidates: string[] = []
  const addFiles = (files: Array<{ name: string }>, prefix: string, extensions: RegExp) => {
    for (const file of files || []) {
      if (file.name && extensions.test(file.name)) candidates.push(prefix ? `${prefix}/${file.name}` : file.name)
    }
  }

  const primary = await db.storage.from(BUCKET).list('masters', { limit: 1000, sortBy: { column: 'name', order: 'desc' } })
  if (!primary.error) addFiles(primary.data || [], 'masters', /\.(wav|flac)$/i)
  if (candidates.length === 0) {
    const root = await db.storage.from(BUCKET).list('', { limit: 1000 })
    if (!root.error) addFiles(root.data || [], '', /\.(wav|flac)$/i)
  }

  const matchingPath = candidates.find(path => {
    const name = path.split('/').pop()?.toLowerCase() || ''
    return name.replace(/[^a-z0-9]/g, '').includes(normalizedSlug)
  })

  if (!matchingPath) return NextResponse.json({ error: 'Master not uploaded.', track: slug }, { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const { data: signed, error: signError } = await db.storage.from(BUCKET).createSignedUrl(matchingPath, 60 * 60)
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: signError?.message || 'Could not create playback URL.' }, { status: 500 })

  let coverUrl = ''
  const covers = await db.storage.from(BUCKET).list('covers', { limit: 1000, sortBy: { column: 'name', order: 'desc' } })
  if (!covers.error) {
    const cover = (covers.data || []).find(file => file.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedSlug) && /\.(jpg|jpeg|png|webp)$/i.test(file.name))
    if (cover) {
      const coverSigned = await db.storage.from(BUCKET).createSignedUrl(`covers/${cover.name}`, 60 * 60)
      coverUrl = coverSigned.data?.signedUrl || ''
    }
  }

  return NextResponse.json({ url: signed.signedUrl, coverUrl, expiresIn: 3600 }, { headers: { 'Cache-Control': 'no-store' } })
}
