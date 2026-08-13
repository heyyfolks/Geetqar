import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'
const META_PATH = 'config/songs.json'

type Song = { id: string; title: string; slug: string; masterPath: string; coverPath?: string; youtube?: string; instagram?: string; createdAt: string; updatedAt: string }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Music storage is not configured.' }, { status: 503 })
  const { slug } = await params
  const normalized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!normalized || normalized.length > 100) return NextResponse.json({ error: 'Invalid track.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data } = await db.storage.from(BUCKET).download(META_PATH)
  if (!data) return NextResponse.json({ error: 'Master not uploaded.', track: slug }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  let songs: Song[] = []
  try {
    const parsed = JSON.parse(await data.text())
    songs = Array.isArray(parsed?.songs) ? parsed.songs : []
  } catch { songs = [] }
  const song = songs.find(item => item.slug === normalized)
  if (!song?.masterPath) return NextResponse.json({ error: 'Master not uploaded.', track: slug }, { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const { data: signed, error: signError } = await db.storage.from(BUCKET).createSignedUrl(song.masterPath, 60 * 60)
  if (signError || !signed?.signedUrl) return NextResponse.json({ error: signError?.message || 'Could not create playback URL.' }, { status: 500 })
  let coverUrl = ''
  if (song.coverPath) {
    const coverSigned = await db.storage.from(BUCKET).createSignedUrl(song.coverPath, 60 * 60)
    coverUrl = coverSigned.data?.signedUrl || ''
  }
  return NextResponse.json({ url: signed.signedUrl, coverUrl, expiresIn: 3600 }, { headers: { 'Cache-Control': 'no-store' } })
}
