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

export function kindOf(raw: string): TrackKind {
  const t = raw.toLowerCase()
  if (/official music video/.test(t)) return 'Music Video'
  if (/lyric/.test(t)) return 'Lyric Video'
  if (/official audio/.test(t)) return 'Official Audio'
  if (/\bcover\b|rendition/.test(t)) return 'Cover'
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
  return t.length > 64 ? `${t.slice(0, 61).trimEnd()}…` : t
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
        return {
          id,
          title,
          name: cleanTitle(title),
          kind: kindOf(title),
          published: entry.match(/<published>([^<]+)<\/published>/)?.[1]?.slice(0, 10) || '',
          views: Number(entry.match(/<media:statistics views="(\d+)"/)?.[1] || 0),
          description: cleanDescription(entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || ''),
        }
      })
      .filter((track): track is Track => track !== null)
  } catch {
    return []
  }
}
