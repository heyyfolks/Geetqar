import { HomeClient } from '@/components/site/home-client'
import { getCatalog } from '@/lib/catalog'

// The page is rebuilt in the background at most every 5 minutes, and the client refreshes the list on top of that.
export const revalidate = 300

export default async function Home() {
  const tracks = await getCatalog()
  const playlist = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: 'GEETQAR',
    url: 'https://geetqar.vercel.app',
    numTracks: tracks.length,
    byArtist: { '@type': 'MusicGroup', name: 'GEETQAR' },
    track: tracks.map((t) => ({
      '@type': 'MusicRecording',
      name: t.name,
      url: `https://www.youtube.com/watch?v=${t.id}`,
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
