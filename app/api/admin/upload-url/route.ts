import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const secret = process.env.GEETQAR_ADMIN_SECRET
  if (!secret || req.headers.get('x-geetqar-admin-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const fileName = body?.fileName
  if (typeof fileName !== 'string' || !/^.+\.(wav|flac)$/i.test(fileName)) {
    return NextResponse.json({ error: 'Only WAV/FLAC files are allowed.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Storage is not configured on Vercel.' }, { status: 503 })
  }

  const db = createClient(url, key, { auth: { persistSession: false } })
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `masters/${crypto.randomUUID()}-${safeName}`
  const { data, error } = await db.storage.from('audio-masters').createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ path, token: data.token })
}
