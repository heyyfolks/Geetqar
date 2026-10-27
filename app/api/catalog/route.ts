import { NextResponse } from 'next/server'
import { getCatalog, resolveChannelId } from '@/lib/catalog'

export const revalidate = 300

export async function GET() {
  const [tracks, channelId] = await Promise.all([getCatalog(), resolveChannelId()])
  return NextResponse.json(
    { channelId, tracks, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=86400' } },
  )
}
