import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://geetqar.vercel.app'
  let songs: { slug: string }[] = []
  try {
    const response = await fetch(`${base}/api/songs`, { cache: 'no-store' })
    if (response.ok) songs = (await response.json()).songs || []
  } catch {}
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/archive`, changeFrequency: 'weekly', priority: .6 },
    ...songs.map((song) => ({ url: `${base}/world/${song.slug}`, changeFrequency: 'monthly' as const, priority: .8 })),
  ]
}
