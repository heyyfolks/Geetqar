import { NextResponse } from 'next/server'
import { diag, getCatalog, resolveChannelId } from '@/lib/catalog'

export const revalidate = 300

export async function GET() {
  const [tracks, channelId] = await Promise.all([getCatalog(), resolveChannelId()])
  // An empty list means YouTube could not be reached: answer 503 so the empty result is not cached.
  if (!tracks.length && process.env.NEXT_PHASE !== 'phase-production-build') {
    return NextResponse.json({ channelId, tracks: [], feed: [...diag] }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json(
    { channelId, tracks, feed: [...diag], updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=86400' } },
  )
}
