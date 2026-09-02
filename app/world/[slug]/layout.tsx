import type { Metadata } from 'next'

type Song = {
  title: string
  slug: string
  description?: string
  coverUrl?: string
  releaseDate?: string
  genre?: string
  youtube?: string
  instagram?: string
}

const siteUrl = 'https://geetqar.vercel.app'

async function getSong(slug: string): Promise<Song | null> {
  try {
    const response = await fetch(`${siteUrl}/api/songs`, { next: { revalidate: 300 } })
    if (!response.ok) return null
    const data = await response.json()
    return (data.songs || []).find((song: Song) => song.slug === slug) || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const song = await getSong(slug)
  if (!song) return { title: 'Song World' }

  const description = song.description?.trim() || `Listen to ${song.title} by GEETQAR — original music from the official GEETQAR sound world.`
  const canonical = `${siteUrl}/world/${song.slug}`

  return {
    title: `${song.title} — GEETQAR`,
    description,
    keywords: [song.title, `${song.title} GEETQAR`, 'GEETQAR', 'GEETQAR music', 'GEETQAR songs', song.genre].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      title: `${song.title} — GEETQAR`,
      description,
      url: canonical,
      siteName: 'GEETQAR',
      type: 'website',
      ...(song.coverUrl ? { images: [{ url: song.coverUrl, alt: `${song.title} artwork by GEETQAR` }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${song.title} — GEETQAR`,
      description,
      ...(song.coverUrl ? { images: [song.coverUrl] } : {}),
    },
  }
}

export default async function SongWorldLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const song = await getSong(slug)
  const canonical = `${siteUrl}/world/${slug}`

  const structuredData = song ? {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.title,
    url: canonical,
    inLanguage: 'en',
    byArtist: { '@type': 'MusicGroup', name: 'GEETQAR', url: siteUrl },
    ...(song.releaseDate ? { datePublished: song.releaseDate } : {}),
    ...(song.genre ? { genre: song.genre } : {}),
    ...(song.youtube ? { sameAs: [song.youtube, ...(song.instagram ? [song.instagram] : [])] } : {}),
  } : null

  return <>{children}{structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}</>
}
