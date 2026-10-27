import type { Track, TrackKind } from './site'

/**
 * The YouTube channel is the single source of truth for the catalogue.
 * Upload a video -> it appears on the site within a few minutes. No admin work.
 * The channel is found from its @handle; set YOUTUBE_CHANNEL_ID in Vercel to pin it instead.
 * (UC-9-kyTW8ZkZNDHQJ6FgpwQ is YouTube's own generic "Music" channel, not GEETQAR's.)
 */
const HANDLE = process.env.YOUTUBE_HANDLE || 'geetqar'
const UA = 'Mozilla/5.0 (compatible; GeetqarSite/1.0; +https://geetqar.vercel.app)'

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

export async function getCatalog(): Promise<Track[]> {
  try {
    const channelId = await resolveChannelId()
    if (!channelId) return []
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return []
    const xml = await response.text()
    return xml
      .split('<entry>')
      .slice(1)
      .map((entry): Track | null => {
        const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
        const title = decode(entry.match(/<title>([^<]+)<\/title>/)?.[1] || '')
        if (!id || !title) return null
        const rawDescription = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || ''
        const kind = kindOf(title, decode(rawDescription))
        return {
          id,
          title,
          name: cleanTitle(title),
          kind,
          published: entry.match(/<published>([^<]+)<\/published>/)?.[1]?.slice(0, 10) || '',
          views: Number(entry.match(/<media:statistics views="(\d+)"/)?.[1] || 0),
          description: cleanDescription(rawDescription),
          // only the artist's own songs: covers and mashups are other people's lyrics
          lyrics: kind === 'Cover' || kind === 'Mashup' ? [] : parseLyrics(rawDescription),
        }
      })
      .filter((track): track is Track => track !== null)
  } catch {
    return []
  }
}
