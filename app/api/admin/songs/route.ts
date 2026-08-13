import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'
const META_PATH = 'config/songs.json'

type Song = {
  id: string
  title: string
  slug: string
  masterPath: string
  coverPath?: string
  youtube?: string
  instagram?: string
  createdAt: string
  updatedAt: string
}

type StorageClient = ReturnType<typeof createClient<any>>

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.GEETQAR_ADMIN_EMAIL?.trim().toLowerCase()
  if (!url || !anonKey || !serviceKey || !adminEmail) return null
  return { url, anonKey, serviceKey, adminEmail }
}

async function requireAdmin(req: Request) {
  const cfg = config()
  if (!cfg) return { error: NextResponse.json({ error: 'Admin storage is not configured.' }, { status: 503 }) }
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const authClient = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !user || user.email?.toLowerCase() !== cfg.adminEmail) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }
  return { cfg }
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

async function readSongs(db: StorageClient) {
  const { data } = await db.storage.from(BUCKET).download(META_PATH)
  if (!data) return [] as Song[]
  try {
    const parsed = JSON.parse(await data.text())
    return Array.isArray(parsed?.songs) ? parsed.songs as Song[] : []
  } catch { return [] as Song[] }
}

async function writeSongs(db: StorageClient, songs: Song[]) {
  const payload = Buffer.from(JSON.stringify({ songs }, null, 2), 'utf8')
  const { error } = await db.storage.from(BUCKET).upload(META_PATH, payload, { contentType: 'application/json', upsert: true })
  return error
}

async function withCoverUrls(db: StorageClient, songs: Song[]) {
  return Promise.all(songs.map(async song => {
    let coverUrl = ''
    if (song.coverPath) {
      const signed = await db.storage.from(BUCKET).createSignedUrl(song.coverPath, 60 * 60)
      coverUrl = signed.data?.signedUrl || ''
    }
    return { ...song, coverUrl, masterPath: undefined, coverPath: undefined }
  }))
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const db = createClient(auth.cfg.url, auth.cfg.serviceKey, { auth: { persistSession: false } })
  const songs = await readSongs(db)
  return NextResponse.json({ songs: await withCoverUrls(db, songs) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const body = await req.json().catch(() => null)
  const incoming = body?.song
  const id = typeof incoming?.id === 'string' && incoming.id.trim() ? incoming.id.trim() : crypto.randomUUID()
  const title = typeof incoming?.title === 'string' ? incoming.title.trim() : ''
  const masterPath = typeof incoming?.masterPath === 'string' ? incoming.masterPath.trim() : ''
  const coverPath = typeof incoming?.coverPath === 'string' ? incoming.coverPath.trim() : ''
  const youtube = typeof incoming?.youtube === 'string' ? incoming.youtube.trim() : ''
  const instagram = typeof incoming?.instagram === 'string' ? incoming.instagram.trim() : ''
  if (!title || title.length > 120) return NextResponse.json({ error: 'Song title is required.' }, { status: 400 })
  if (masterPath && !masterPath.startsWith('masters/')) return NextResponse.json({ error: 'Invalid master file.' }, { status: 400 })
  if (coverPath && !coverPath.startsWith('covers/')) return NextResponse.json({ error: 'Invalid artwork file.' }, { status: 400 })
  if (!/^$|https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtube)) return NextResponse.json({ error: 'YouTube link is invalid.' }, { status: 400 })
  if (!/^$|https:\/\/(www\.)?instagram\.com\//i.test(instagram)) return NextResponse.json({ error: 'Instagram link is invalid.' }, { status: 400 })

  const db = createClient(auth.cfg.url, auth.cfg.serviceKey, { auth: { persistSession: false } })
  const songs = await readSongs(db)
  const existingIndex = songs.findIndex(song => song.id === id)
  const existing = existingIndex >= 0 ? songs[existingIndex] : null
  const now = new Date().toISOString()
  const slug = slugify(title) || `song-${id.slice(0, 8)}`
  const duplicate = songs.some(song => song.id !== id && song.slug === slug)
  if (duplicate) return NextResponse.json({ error: 'A song with this title already exists.' }, { status: 409 })
  if (!existing && !masterPath) return NextResponse.json({ error: 'Upload the master audio first.' }, { status: 400 })

  const song: Song = {
    id,
    title,
    slug,
    masterPath: masterPath || existing?.masterPath || '',
    coverPath: coverPath || existing?.coverPath,
    youtube,
    instagram,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  if (existingIndex >= 0) songs[existingIndex] = song
  else songs.push(song)
  const writeError = await writeSongs(db, songs)
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })

  if (existing?.masterPath && masterPath && existing.masterPath !== masterPath) await db.storage.from(BUCKET).remove([existing.masterPath])
  if (existing?.coverPath && coverPath && existing.coverPath !== coverPath) await db.storage.from(BUCKET).remove([existing.coverPath])
  return NextResponse.json({ ok: true, song })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) return NextResponse.json({ error: 'Song id is required.' }, { status: 400 })
  const db = createClient(auth.cfg.url, auth.cfg.serviceKey, { auth: { persistSession: false } })
  const songs = await readSongs(db)
  const song = songs.find(item => item.id === id)
  if (!song) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })
  const remaining = songs.filter(item => item.id !== id)
  const writeError = await writeSongs(db, remaining)
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })
  const paths = [song.masterPath, song.coverPath].filter(Boolean) as string[]
  if (paths.length) await db.storage.from(BUCKET).remove(paths)
  return NextResponse.json({ ok: true })
}
