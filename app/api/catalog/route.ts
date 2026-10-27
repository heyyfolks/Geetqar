import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/catalog'

export const revalidate = 300

export async function GET() {
  const tracks = await getCatalog()
  return NextResponse.json(
    { tracks, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=86400' } },
  )
}
