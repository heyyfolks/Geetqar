import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const defaults = {
  brand_name: 'GEETQAR',
  hero_eyebrow: 'WRITER · COMPOSER · PRODUCER',
  hero_title: 'GEETQAR',
  hero_description: 'Music made in the spaces between thought, desire and memory.',
  footer_tagline: 'Music beyond sound.',
  contact_email: 'paradisepr998@gmail.com',
  instagram_url: 'https://www.instagram.com/geetqar/',
  youtube_url: 'https://www.youtube.com/@geetqar',
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  const db = adminClient()
  if (!db) return NextResponse.json(defaults)
  const { data, error } = await db.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error || !data) return NextResponse.json(defaults, { headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ ...defaults, ...data }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.GEETQAR_ADMIN_EMAIL?.trim().toLowerCase()
  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const db = adminClient()
  if (!db) return NextResponse.json({ error: 'Supabase service role is not configured.' }, { status: 503 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid settings.' }, { status: 400 })
  const clean = (value: unknown, fallback: string, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : fallback
  const values = {
    id: 1,
    brand_name: clean(body.brand_name, defaults.brand_name, 40),
    hero_eyebrow: clean(body.hero_eyebrow, defaults.hero_eyebrow, 100),
    hero_title: clean(body.hero_title, defaults.hero_title, 80),
    hero_description: clean(body.hero_description, defaults.hero_description, 300),
    footer_tagline: clean(body.footer_tagline, defaults.footer_tagline, 160),
    contact_email: clean(body.contact_email, defaults.contact_email, 320),
    instagram_url: clean(body.instagram_url, defaults.instagram_url, 500),
    youtube_url: clean(body.youtube_url, defaults.youtube_url, 500),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db.from('site_settings').upsert(values).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
