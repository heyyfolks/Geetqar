import { HomeClient } from '@/components/site/home-client'
import { getCatalog } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'

// The page is rebuilt in the background at most every 5 minutes, and the client refreshes the list on top of that.
export const revalidate = 300

export default async function Home() {
  const tracks = await getCatalog()
  const playlist = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: 'GEETQAR',
    url: SITE_URL,
    numTracks: tracks.length,
    byArtist: { '@type': 'MusicGroup', name: 'GEETQAR' },
    track: tracks.map((t) => ({
      '@type': 'MusicRecording',
      name: t.name,
      url: `${SITE_URL}/songs/${t.slug}`,
      datePublished: t.published,
      byArtist: { '@type': 'MusicGroup', name: 'GEETQAR' },
    })),
  }
  return (
    <>
      <HomeClient initialTracks={tracks} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(playlist) }} />
    </>
  )
}
