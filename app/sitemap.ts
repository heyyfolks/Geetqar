import type { MetadataRoute } from 'next'
import { getCatalog } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tracks = await getCatalog()
  const latest = tracks.map((t) => t.published).filter(Boolean).sort().pop()
  return [
    { url: SITE_URL, lastModified: latest ? new Date(latest) : new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
    ...tracks.map((track) => ({
      url: `${SITE_URL}/songs/${track.slug}`,
      lastModified: track.published ? new Date(track.published) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
