import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ items: [] })
  if (q.length > 100) return NextResponse.json({ error: 'Search is too long.' }, { status: 400 })

  const key = process.env.YOUTUBE_API_KEY
  if (!key) return NextResponse.json({ error: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY in Vercel.' }, { status: 503 })

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', q)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '10')
  url.searchParams.set('safeSearch', 'moderate')
  url.searchParams.set('key', key)

  const response = await fetch(url, { next: { revalidate: 30 } })
  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'YouTube search failed.' }, { status: response.status })

  const items = (data.items || []).map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
  }))

  return NextResponse.json({ items })
}
