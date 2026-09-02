import type { MetadataRoute } from 'next'

const base = 'https://geetqar.vercel.app'

type Song = { slug: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let songs: Song[] = []
  try {
    const response = await fetch(`${base}/api/songs`, { next: { revalidate: 300 } })
    if (response.ok) songs = (await response.json()).songs || []
  } catch {}

  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/music`, lastModified: now, changeFrequency: 'weekly', priority: .95 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: 'weekly', priority: .6 },
    ...songs.map((song) => ({ url: `${base}/world/${song.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: .9 })),
  ]
}
