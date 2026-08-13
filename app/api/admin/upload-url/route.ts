import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.GEETQAR_ADMIN_EMAIL?.trim().toLowerCase()
  if (!url || !anonKey || !serviceKey || !adminEmail) return NextResponse.json({ error: 'Admin storage is not configured.' }, { status: 503 })

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user || user.email?.toLowerCase() !== adminEmail) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const fileName = body?.fileName
  const kind = body?.kind === 'cover' ? 'cover' : 'master'
  const trackSlug = typeof body?.trackSlug === 'string' ? body.trackSlug.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : ''

  if (typeof fileName !== 'string' || fileName.length > 180) return NextResponse.json({ error: 'Filename is invalid or too long.' }, { status: 400 })
  if (kind === 'master' && !/\.(wav|flac)$/i.test(fileName)) return NextResponse.json({ error: 'Only WAV/FLAC files are allowed.' }, { status: 400 })
  if (kind === 'cover' && !/\.(jpg|jpeg|png|webp)$/i.test(fileName)) return NextResponse.json({ error: 'Cover must be JPG, PNG or WEBP.' }, { status: 400 })
  if (kind === 'cover' && !trackSlug) return NextResponse.json({ error: 'Select a track for this cover.' }, { status: 400 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = kind === 'cover' ? `covers/${trackSlug}-${crypto.randomUUID()}-${safeName}` : `masters/${crypto.randomUUID()}-${safeName}`
  const { data, error } = await db.storage.from('Music').createSignedUploadUrl(path)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ path, token: data.token })
}
