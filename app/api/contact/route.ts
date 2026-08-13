import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Please verify your email first.' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!name || !subject || !message) return NextResponse.json({ error: 'Name, subject and message are required.' }, { status: 400 })
  if (name.length > 80 || subject.length > 160 || message.length > 4000) return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  const db = serviceClient()
  if (!db) return NextResponse.json({ error: 'Contact inbox is not configured.' }, { status: 503 })
  const { error } = await db.from('contact_messages').insert({ user_id: user.id, name, email: user.email, subject, message })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
