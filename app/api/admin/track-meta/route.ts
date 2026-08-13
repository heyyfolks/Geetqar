import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'Music'
const META_PATH = 'config/track-links.json'

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.GEETQAR_ADMIN_EMAIL?.trim().toLowerCase()
  if (!url || !anonKey || !serviceKey || !adminEmail) return null
  return { url, anonKey, serviceKey, adminEmail }
}

async function requireAdmin(req: Request) {
  const cfg = clients()
  if (!cfg) return { error: NextResponse.json({ error: 'Admin storage is not configured.' }, { status: 503 }) }
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const authClient = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } })
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !user || user.email?.toLowerCase() !== cfg.adminEmail) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }
  return { cfg }
}

export async function GET() {
  const cfg = clients()
  if (!cfg) return NextResponse.json({ tracks: {} }, { status: 200 })
  const db = createClient(cfg.url, cfg.serviceKey, { auth: { persistSession: false } })
  const { data, error } = await db.storage.from(BUCKET).download(META_PATH)
  if (error || !data) return NextResponse.json({ tracks: {} }, { headers: { 'Cache-Control': 'no-store' } })
  try {
    const json = JSON.parse(await data.text())
    return NextResponse.json(json, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ tracks: {} }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const body = await req.json().catch(() => null)
  const track = typeof body?.track === 'string' ? body.track.trim() : ''
  const youtube = typeof body?.youtube === 'string' ? body.youtube.trim() : ''
  const instagram = typeof body?.instagram === 'string' ? body.instagram.trim() : ''
  if (!track) return NextResponse.json({ error: 'Track is required.' }, { status: 400 })
  for (const [label, value] of [['YouTube', youtube], ['Instagram', instagram]] as const) {
    if (value && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|instagram\.com)\//i.test(value)) return NextResponse.json({ error: `${label} link must be a valid YouTube or Instagram URL.` }, { status: 400 })
  }

  const db = createClient(auth.cfg.url, auth.cfg.serviceKey, { auth: { persistSession: false } })
  let tracks: Record<string, { youtube?: string; instagram?: string }> = {}
  const existing = await db.storage.from(BUCKET).download(META_PATH)
  if (existing.data) {
    try { tracks = JSON.parse(await existing.data.text()).tracks || {} } catch { tracks = {} }
  }
  tracks[track] = { youtube, instagram }
  const payload = Buffer.from(JSON.stringify({ tracks }, null, 2), 'utf8')
  const { error } = await db.storage.from(BUCKET).upload(META_PATH, payload, { contentType: 'application/json', upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, track })
}
