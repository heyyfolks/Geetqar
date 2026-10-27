import { NextResponse } from 'next/server'

// Resolves the channel from its @handle on the server (no API key needed), then reads the public RSS feed.
// Set YOUTUBE_CHANNEL_ID in Vercel to skip the handle lookup.
const HANDLE = process.env.YOUTUBE_HANDLE || 'geetqar'
const UA = 'Mozilla/5.0 (compatible; GeetqarSite/1.0; +https://geetqar.vercel.app)'

export const revalidate = 1800

function decode(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

async function resolveChannelId(): Promise<string | null> {
  if (process.env.YOUTUBE_CHANNEL_ID) return process.env.YOUTUBE_CHANNEL_ID
  const response = await fetch(`https://www.youtube.com/@${HANDLE}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, next: { revalidate: 86400 } })
  if (!response.ok) return null
  const html = await response.text()
  return html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] || html.match(/channel_id=(UC[\w-]{22})/)?.[1] || html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] || null
}

export async function GET() {
  const headers = { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400' }
  try {
    const channelId = await resolveChannelId()
    if (!channelId) return NextResponse.json({ videos: [] }, { headers })
    const feed = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: { 'User-Agent': UA }, next: { revalidate: 1800 } })
    if (!feed.ok) return NextResponse.json({ videos: [] }, { headers })
    const xml = await feed.text()
    const entries = xml.split('<entry>').slice(1, 13)
    const videos = entries
      .map((entry) => ({
        id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '',
        title: decode(entry.match(/<title>([^<]+)<\/title>/)?.[1] || ''),
        published: entry.match(/<published>([^<]+)<\/published>/)?.[1]?.slice(0, 10),
      }))
      .filter((video) => video.id && video.title)
    return NextResponse.json({ videos }, { headers })
  } catch {
    return NextResponse.json({ videos: [] }, { headers })
  }
}
