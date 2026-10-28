import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/catalog'
import { INDEXNOW_KEY, SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

/**
 * Tells Bing, Yandex, DuckDuckGo and other IndexNow search engines about every public URL.
 * A daily Vercel cron (see vercel.json) calls this, so new songs get picked up without any work.
 */
export async function GET() {
  const tracks = await getCatalog()
  const urlList = [SITE_URL, `${SITE_URL}/songs`, `${SITE_URL}/about`, ...tracks.map((t) => `${SITE_URL}/songs/${t.slug}`)]
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ submitted: urlList.length, status: response.status })
  } catch (error) {
    return NextResponse.json({ submitted: 0, error: error instanceof Error ? error.message : 'failed' }, { status: 502 })
  }
}
