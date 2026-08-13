import { NextRequest, NextResponse } from 'next/server'

function getVideoId(value: string) {
  try {
    const u = new URL(value.trim())
    if (u.hostname === 'youtu.be' || u.hostname.endsWith('.youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || null
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || null
    }
  } catch {}
  return null
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('url') || ''
  const id = getVideoId(input)
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 })

  const canonical = `https://www.youtube.com/watch?v=${id}`
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`, { next: { revalidate: 3600 } })
    if (!response.ok) return NextResponse.json({ error: 'That YouTube video could not be found.' }, { status: 404 })
    const data = await response.json()
    return NextResponse.json({
      id,
      title: data.title || 'YouTube video',
      channel: data.author_name || 'YouTube',
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: canonical,
    })
  } catch {
    return NextResponse.json({ error: 'YouTube is temporarily unavailable.' }, { status: 502 })
  }
}
