import { NextResponse } from 'next/server'
import { adminOnly } from '@/lib/admin-auth'
import { buildEntriesFresh } from '@/lib/catalog'
import { getConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await adminOnly(request)
  if ('error' in auth) return auth.error
  const [{ entries, sync }, config, log] = await Promise.all([
    buildEntriesFresh(),
    getConfig(true),
    auth.db.from('admin_log').select('id,at,source,summary,target').order('id', { ascending: false }).limit(60),
  ])
  return NextResponse.json({
    sync,
    config,
    log: log.data || [],
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    songs: entries.map((e) => ({
      id: e.track.id,
      slug: e.track.slug,
      origin: e.origin,
      hidden: e.hidden,
      isNew: e.isNew,
      name: e.track.name,
      kind: e.track.kind,
      moods: e.track.moods,
      published: e.track.published,
      views: e.track.views,
      pinned: Boolean(e.track.pinned),
      sort_order: e.override?.sort_order ?? null,
      description: e.track.description,
      lyrics: e.track.lyricsText || '',
      credits: e.track.credits || '',
      links: e.track.links || {},
      art_style: e.track.artStyle ?? null,
      edited: e.override ? Object.entries(e.override).filter(([k, v]) => !['video_id', 'manual', 'updated_at', 'links'].includes(k) && v !== null && v !== false && !(Array.isArray(v) && !v.length)).map(([k]) => k) : [],
      auto: e.auto,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
