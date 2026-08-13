import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'
const META_PATH = 'config/songs.json'

type Song = { id: string; title: string; slug: string; masterPath: string; coverPath?: string; youtube?: string; instagram?: string; createdAt: string; updatedAt: string }

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ songs: [] }, { headers: { 'Cache-Control': 'no-store' } })
  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data } = await db.storage.from(BUCKET).download(META_PATH)
  if (!data) return NextResponse.json({ songs: [] }, { headers: { 'Cache-Control': 'no-store' } })
  try {
    const parsed = JSON.parse(await data.text())
    const songs = Array.isArray(parsed?.songs) ? parsed.songs as Song[] : []
    const result = await Promise.all(songs.map(async song => {
      let coverUrl = ''
      if (song.coverPath) {
        const signed = await db.storage.from(BUCKET).createSignedUrl(song.coverPath, 60 * 60)
        coverUrl = signed.data?.signedUrl || ''
      }
      return { id: song.id, title: song.title, slug: song.slug, youtube: song.youtube || '', instagram: song.instagram || '', coverUrl }
    }))
    return NextResponse.json({ songs: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ songs: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
