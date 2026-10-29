import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { adminDb } from './db'
import { getConfig } from './config'
import { autoMoods } from './moods'
import { getOverrides, lyricLines, type Override } from './overrides'
import { HIDDEN_TITLES, SITE_URL, type Track, type TrackKind } from './site'

/**
 * The YouTube channel is the single source of truth for the catalogue.
 * Upload a video -> it appears on the site within a few minutes. No admin work.
 * The channel is found from its @handle; set YOUTUBE_CHANNEL_ID in Vercel to pin it instead.
 * (UC-9-kyTW8ZkZNDHQJ6FgpwQ is YouTube's own generic "Music" channel, not GEETQAR's.)
 */
const HANDLE = process.env.YOUTUBE_HANDLE || 'geetqar'
const UA = `Mozilla/5.0 (compatible; GeetqarSite/1.0; +${SITE_URL})`

function decode(value: string) {
  return value
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
}

export function kindOf(raw: string, description = ''): TrackKind {
  const t = raw.toLowerCase()
  if (/official music video/.test(t)) return 'Music Video'
  if (/lyric/.test(t)) return 'Lyric Video'
  if (/official audio/.test(t)) return 'Official Audio'
  if (/original song by|(?:written|composed|produced|performed|music|lyrics)[^.\n]{0,48}?(?:by|:)\s*@?geetqar/i.test(description)) return 'Single'
  if (/cover|rendition/.test(t) || /\bcover\b|og artist|original song credits|non-commercial|^\s*singer\s*:|\n\s*singer\s*:/i.test(description)) return 'Cover'
  if (/mashup/.test(t)) return 'Mashup'
  return 'Single'
}

export function cleanTitle(raw: string): string {
  let t = raw.replace(/#[^\s#]+/g, ' ')
  t = t.split('|')[0]
  t = t.replace(/\((?:official|lyric|music|audio|video)[^)]*\)/gi, ' ')
  t = t.replace(/\s[–—-]\s*geetqar\b/gi, ' ').replace(/\bgeetqar\s*[–—-]\s*/gi, ' ')
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/^[\s\p{Extended_Pictographic}‍️.…'"“”-]+|[\s\p{Extended_Pictographic}‍️.…'"“”-]+$/gu, '')
  if (!t) t = raw.trim()
  if ((t.match(/"/g) || []).length % 2 === 1) t += '"'
  return t.length > 64 ? `${t.slice(0, 61).trimEnd()}…` : t
}

const LYRIC_STOP = /^(follow|credits?|©|instagram|youtube|stream|produced|written|composed|available|subscribe|song\s*:|artist\s*:|singer\s*:|language|genre|music\s*:|lyrics\s*\/|#+\s|if you)/i

/** Pulls lyric lines out of a description that has a "Lyrics:" block. Returns [] when there isn't one. */
export function parseLyrics(raw: string): string[] {
  const text = decode(raw).replace(/\r/g, '')
  const marker = text.search(/(?:song\s+)?lyrics\s*:[ \t]*\n/i)
  if (marker < 0) return []
  const after = text.slice(marker).replace(/^[^\n]*\n?/, '')
  const out: string[] = []
  for (const original of after.split('\n')) {
    const line = original.replace(/[*_`]/g, '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').replace(/\s+/g, ' ').trim()
    if (!line) continue
    if (LYRIC_STOP.test(line)) break
    if (line.length < 8 || line.length > 110 || /https?:|@/.test(line)) continue
    if (!out.includes(line)) out.push(line)
    if (out.length >= 48) break
  }
  return out.length >= 2 ? out : []
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

const HIDDEN_IDS = (process.env.HIDDEN_VIDEOS || '').split(',').map((v) => v.trim()).filter(Boolean)

function cleanDescription(raw: string) {
  return decode(raw)
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#[^\s#]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 700)
}

export async function resolveChannelId(): Promise<string | null> {
  if (process.env.YOUTUBE_CHANNEL_ID) return process.env.YOUTUBE_CHANNEL_ID
  try {
    const response = await fetch(`https://www.youtube.com/@${HANDLE}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const html = await response.text()
    return html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] || html.match(/channel_id=(UC[\w-]{22})/)?.[1] || html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] || null
  } catch {
    return null
  }
}

/** Last attempts to reach YouTube, shown by /api/catalog to make failures easy to diagnose. */
export const diag: string[] = []

type Raw = { id: string; title: string; description: string; published: string; views: number }

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

let freshSync = false

async function get(url: string, label: string, agent = UA): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': agent, 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1; SOCS=CAI' }, ...(freshSync ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }), signal: AbortSignal.timeout(9000) })
    diag.push(`${response.status} ${label}`)
    return response.ok ? await response.text() : null
  } catch (error) {
    diag.push(`error ${label}: ${error instanceof Error ? error.message : 'unknown'}`)
    return null
  }
}

/** 1. Official Data API (set YOUTUBE_API_KEY in Vercel: free, 10,000 requests a day). Most reliable. */
async function fromApi(channelId: string): Promise<Raw[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  const list = await get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${channelId.replace(/^UC/, 'UU')}&key=${key}`, 'api')
  if (!list) return []
  try {
    const items = (JSON.parse(list).items || []) as { snippet: { title: string; description: string; publishedAt: string; resourceId: { videoId: string } } }[]
    const ids = items.map((item) => item.snippet.resourceId.videoId)
    const stats = await get(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${key}`, 'api-stats')
    const views = new Map<string, number>()
    if (stats) for (const v of JSON.parse(stats).items || []) views.set(v.id, Number(v.statistics?.viewCount || 0))
    return items
      .filter((item) => item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
      .map((item) => ({ id: item.snippet.resourceId.videoId, title: item.snippet.title, description: item.snippet.description || '', published: (item.snippet.publishedAt || '').slice(0, 10), views: views.get(item.snippet.resourceId.videoId) || 0 }))
  } catch {
    return []
  }
}

/** 2. The channel RSS feed. */
async function fromFeed(channelId: string): Promise<Raw[]> {
  for (const [url, label, agent] of [
    [`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, 'feed', UA],
    [`https://www.youtube.com/feeds/videos.xml?playlist_id=${channelId.replace(/^UC/, 'UU')}`, 'feed-playlist', BROWSER],
  ]) {
    const xml = await get(url, label, agent)
    if (!xml || !xml.includes('<entry>')) continue
    return xml.split('<entry>').slice(1).flatMap((entry): Raw[] => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
      const title = decode(entry.match(/<title>([^<]+)<\/title>/)?.[1] || '')
      if (!id || !title) return []
      return [{
        id,
        title,
        description: decode(entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || ''),
        published: entry.match(/<published>([^<]+)<\/published>/)?.[1]?.slice(0, 10) || '',
        views: Number(entry.match(/<media:statistics views="(\d+)"/)?.[1] || 0),
      }]
    })
  }
  return []
}

/** 3. Last resort: read the public channel page. It has titles, ids and view counts but no descriptions or exact dates. */
async function fromChannelPage(): Promise<Raw[]> {
  const html = await get(`https://www.youtube.com/@${HANDLE}/videos`, 'channel-page', BROWSER)
  const json = html?.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)?.[1]
  diag.push(`page ${html ? html.length : 0} bytes, data ${json ? json.length : 'missing'}, consent ${html?.includes('consent.youtube.com') ? 'yes' : 'no'}, lockups ${(json?.match(/LOCKUP_CONTENT_TYPE_VIDEO/g) || []).length}, videoRenderers ${(json?.match(/"videoRenderer"/g) || []).length}`)
  if (!json) return []
  const out: Raw[] = []
  const seen = new Set<string>()
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(walk)
    const n = node as Record<string, any>
    // classic layout (videoRenderer) and the newer one (lockupViewModel)
    const id = n.videoId || (n.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' ? n.contentId : undefined)
    const title = n.title?.runs?.[0]?.text || n.title?.simpleText || n.metadata?.lockupMetadataViewModel?.title?.content
    if (typeof id === 'string' && /^[\w-]{11}$/.test(id) && typeof title === 'string' && !seen.has(id)) {
      seen.add(id)
      let views = Number(String(n.viewCountText?.simpleText || '').replace(/[^\d]/g, '')) || 0
      if (!views) {
        const rows = JSON.stringify(n.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || '')
        const match = rows.match(/"content":"([\d.,]+)([KM]?) views?"/i)
        if (match) views = Math.round(parseFloat(match[1].replace(/,/g, '')) * (match[2].toUpperCase() === 'M' ? 1e6 : match[2].toUpperCase() === 'K' ? 1e3 : 1))
      }
      out.push({ id, title, description: '', published: '', views })
    }
    Object.values(n).forEach(walk)
  }
  try { walk(JSON.parse(json)) } catch {}
  return out
}

export type SyncInfo = { source: 'api' | 'feed' | 'page' | 'none'; liveCount: number; savedCount: number; manualCount: number; hasApiKey: boolean; feed: string[]; at: string }

/** Reads YouTube: the Data API (if a key is set), then the RSS feed, then the public channel page. */
async function fetchLive(channelId: string): Promise<{ raws: Raw[]; source: SyncInfo['source'] }> {
  diag.length = 0
  let raws = await fromApi(channelId)
  if (raws.length) return { raws, source: 'api' }
  raws = await fromFeed(channelId)
  if (raws.length) return { raws, source: 'feed' }
  raws = await fromChannelPage()
  return { raws, source: raws.length ? 'page' : 'none' }
}

/** The last good copy of the channel, so a song never disappears because YouTube blocked one request. */
async function loadSnapshot(db: SupabaseClient | null): Promise<Raw[]> {
  if (!db) return []
  try {
    const { data } = await db.from('site_config').select('value').eq('key', 'catalog_snapshot').maybeSingle()
    const raws = (data?.value as { raws?: Raw[] } | undefined)?.raws
    return Array.isArray(raws) ? raws.filter((r) => r && typeof r.id === 'string' && typeof r.title === 'string') : []
  } catch {
    return []
  }
}

async function saveSnapshot(db: SupabaseClient | null, raws: Raw[], previous: Raw[]) {
  if (!db) return
  const sig = (list: Raw[]) => list.map((r) => `${r.id}|${r.title}|${r.description.length}|${r.published}`).join('\n')
  if (sig(raws) === sig(previous)) return
  try { await db.from('site_config').upsert({ key: 'catalog_snapshot', value: { raws: raws.slice(0, 120) }, updated_at: new Date().toISOString() }) } catch {}
}

export type AdminEntry = {
  track: Track
  hidden: boolean
  origin: 'youtube' | 'saved' | 'manual'
  isNew: boolean
  override: Override | null
  auto: { name: string; kind: TrackKind; moods: string[]; published: string; lyricsCount: number; description: string }
}

const defaultHidden = (title: string) => HIDDEN_TITLES.some((pattern) => pattern.test(title))

function slugBase(title: string, id: string) {
  return slugify(cleanTitle(title)) || id.toLowerCase()
}

async function makeEntries(fresh: boolean): Promise<{ entries: AdminEntry[]; sync: SyncInfo }> {
  freshSync = fresh
  const db = adminDb(!fresh)
  const [config, overrides] = await Promise.all([getConfig(fresh), getOverrides(fresh)])
  const validMoods = config.moods.map((m) => m.key)

  let live: Raw[] = []
  let source: SyncInfo['source'] = 'none'
  try {
    const channelId = await resolveChannelId()
    if (channelId) ({ raws: live, source } = await fetchLive(channelId))
  } catch {}

  const snapshot = await loadSnapshot(db)
  const byId = new Map<string, Raw & { saved?: boolean }>()
  for (const raw of live) byId.set(raw.id, raw)
  for (const old of snapshot) {
    const now = byId.get(old.id)
    if (!now) byId.set(old.id, { ...old, saved: true })
    else byId.set(old.id, { ...now, description: now.description || old.description, published: now.published || old.published, views: now.views || old.views })
  }
  if (live.length) await saveSnapshot(db, Array.from(byId.values()).map(({ id, title, description, published, views }) => ({ id, title, description, published, views })), snapshot)

  // videos the artist added by hand
  let manualCount = 0
  for (const ov of overrides.values()) {
    if (ov.manual && !byId.has(ov.video_id)) {
      manualCount++
      byId.set(ov.video_id, { id: ov.video_id, title: ov.title || ov.name || 'Untitled', description: '', published: ov.published || '', views: 0, saved: false })
    }
  }

  const used = new Set<string>()
  const entries: AdminEntry[] = []
  for (const raw of byId.values()) {
    const ov = overrides.get(raw.id) || null
    const title = raw.title
    const autoKind = kindOf(title, raw.description)
    const autoName = cleanTitle(title)
    const kind = ov?.kind || autoKind
    const autoLines = autoKind === 'Cover' || autoKind === 'Mashup' ? [] : parseLyrics(raw.description)
    const lyricsText = ov?.lyrics ? ov.lyrics : autoLines.join('\n')
    const lines = ov?.lyrics ? lyricLines(ov.lyrics) : kind === 'Cover' || kind === 'Mashup' ? [] : autoLines
    const published = ov?.published || raw.published
    const track0 = { title, name: ov?.name || autoName }
    const autoMood = autoMoods({ title, name: autoName }, validMoods)
    const moods = ov?.moods ? ov.moods.filter((m) => validMoods.includes(m)) : autoMood
    let slug = slugBase(title, raw.id)
    if (used.has(slug)) slug = `${slug}-${raw.id.toLowerCase().slice(0, 5)}`
    used.add(slug)
    const links = ov?.links && Object.keys(ov.links).length ? ov.links : undefined
    const track: Track = {
      id: raw.id,
      slug,
      title,
      name: track0.name,
      kind,
      published,
      views: raw.views,
      description: ov?.description ?? cleanDescription(raw.description),
      lyrics: lines,
      lyricsText: lyricsText || undefined,
      moods,
      pinned: ov?.pinned || undefined,
      credits: ov?.credits || undefined,
      links,
      artStyle: ov?.art_style ?? undefined,
    }
    entries.push({
      track,
      hidden: ov?.hidden ?? defaultHidden(title),
      origin: ov?.manual && !live.some((l) => l.id === raw.id) ? 'manual' : raw.saved ? 'saved' : 'youtube',
      isNew: Boolean(published) && Date.now() - +new Date(published) < 14 * 864e5,
      override: ov,
      auto: { name: autoName, kind: autoKind, moods: autoMood, published: raw.published, lyricsCount: autoLines.length, description: cleanDescription(raw.description) },
    })
  }

  // order: pinned (by position), then hand-ordered, then the automatic order with hand-added songs first
  const rank = (e: AdminEntry) => (e.track.pinned ? 0 : e.override?.sort_order != null ? 1 : 2)
  const index = new Map(entries.map((e, i) => [e.track.id, i]))
  entries.sort((a, b) => {
    const ra = rank(a), rb = rank(b)
    if (ra !== rb) return ra - rb
    if (ra < 2) return (a.override?.sort_order ?? 9999) - (b.override?.sort_order ?? 9999) || index.get(a.track.id)! - index.get(b.track.id)!
    const ma = a.origin === 'manual' ? 0 : 1, mb = b.origin === 'manual' ? 0 : 1
    return ma - mb || index.get(a.track.id)! - index.get(b.track.id)!
  })

  return {
    entries,
    sync: { source, liveCount: live.length, savedCount: entries.filter((e) => e.origin === 'saved').length, manualCount, hasApiKey: Boolean(process.env.YOUTUBE_API_KEY), feed: [...diag], at: new Date().toISOString() },
  }
}

export const buildEntries = cache(() => makeEntries(false))
/** For the admin panel: reads everything fresh (no caches). */
export const buildEntriesFresh = () => makeEntries(true)

/** The public catalogue: everything that is not hidden. */
export async function getCatalog(): Promise<Track[]> {
  try {
    const { entries } = await buildEntries()
    return entries.filter((e) => !e.hidden).map((e) => e.track)
  } catch {
    return []
  }
}

/**
 * For cached (ISR) pages: an empty result means YouTube could not be reached, so throw instead of caching an empty page.
 * Next.js then keeps serving the last good version and tries again. (During the build an empty catalogue is allowed.)
 */
export async function getCatalogForCache(): Promise<Track[]> {
  const tracks = await getCatalog()
  if (!tracks.length && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') throw new Error('YouTube catalogue unavailable')
  return tracks
}
