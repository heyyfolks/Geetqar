import { NextResponse } from 'next/server'
import { adminOnly } from '@/lib/admin-auth'
import { applyChanges } from '@/lib/admin-apply'
import { parseVideoId } from '@/lib/overrides'

export const dynamic = 'force-dynamic'

/** Adds a YouTube video by link or id, even when the automatic sync cannot see it. */
export async function POST(request: Request) {
  const auth = await adminOnly(request, { write: true })
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => null)
  const id = parseVideoId(String(body?.url || ''))
  if (!id) return NextResponse.json({ error: 'That does not look like a YouTube link or video id.' }, { status: 400 })

  let title = typeof body?.title === 'string' ? body.title.trim().slice(0, 160) : ''
  let published = ''
  if (!title) {
    // best effort: ask YouTube for the title; the artist can type it if this is blocked
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { signal: AbortSignal.timeout(6000), cache: 'no-store' })
      if (response.ok) title = String((await response.json()).title || '').slice(0, 160)
    } catch {}
  }
  if (!title) return NextResponse.json({ error: 'Could not read the title from YouTube. Type the song title and add it again.', needTitle: true }, { status: 422 })

  const { data: existing } = await auth.db.from('track_overrides').select('video_id').eq('video_id', id).maybeSingle()
  const row = { video_id: id, manual: true, title, name: title, updated_at: new Date().toISOString(), published: published || null }
  const { error } = existing
    ? await auth.db.from('track_overrides').update({ manual: true, title, hidden: false }).eq('video_id', id)
    : await auth.db.from('track_overrides').insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await applyChanges(auth.db, [{ target: 'track', id, set: { hidden: false }, label: title }], 'manual')
  return NextResponse.json({ ok: true, id, title })
}
