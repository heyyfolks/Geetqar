import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GEETQAR Music — Original Songs',
  description: 'Listen to original songs by GEETQAR. Explore each release through its own music world, artwork and official links.',
  alternates: { canonical: 'https://geetqar.vercel.app/music' },
}

type Song = { id: string; title: string; slug: string; description?: string; releaseDate?: string; genre?: string; coverUrl?: string; youtube?: string }

async function getSongs(): Promise<Song[]> {
  try {
    const response = await fetch('https://geetqar.vercel.app/api/songs', { next: { revalidate: 300 } })
    if (!response.ok) return []
    const data = await response.json()
    return data.songs || []
  } catch {
    return []
  }
}

export default async function MusicPage() {
  const songs = await getSongs()
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: 'GEETQAR Original Songs',
    url: 'https://geetqar.vercel.app/music',
    numTracks: songs.length,
    byArtist: { '@type': 'MusicGroup', name: 'GEETQAR', url: 'https://geetqar.vercel.app' },
    track: songs.map((song) => ({
      '@type': 'MusicRecording',
      name: song.title,
      url: `https://geetqar.vercel.app/world/${song.slug}`,
      byArtist: { '@type': 'MusicGroup', name: 'GEETQAR' },
      ...(song.releaseDate ? { datePublished: song.releaseDate } : {}),
      ...(song.genre ? { genre: song.genre } : {}),
    })),
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-12 md:py-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <a href="/" className="text-sm font-extrabold tracking-[.5em]">GEET<span className="gold-text">QAR</span></a>
          <a href="/" className="text-[9px] tracking-[.3em] text-white/40 hover:text-white">BACK TO WORLD</a>
        </header>
        <section className="py-24 md:py-32">
          <p className="text-[10px] tracking-[.45em] text-gold">GEETQAR / ORIGINAL MUSIC</p>
          <h1 className="mt-5 max-w-5xl text-6xl font-semibold tracking-[-.06em] md:text-9xl">The songs.<br />No filler.</h1>
          <p className="mt-8 max-w-2xl text-sm leading-7 text-white/40">The official GEETQAR catalogue: original songs, artwork and individual listening worlds. Open a track to hear it and explore the world around it.</p>
        </section>

        <section aria-labelledby="catalogue-title" className="border-t border-white/10 py-12 md:py-16">
          <div className="flex items-end justify-between gap-6"><div><p className="text-[9px] tracking-[.35em] text-gold">CATALOGUE</p><h2 id="catalogue-title" className="mt-2 text-3xl font-semibold md:text-5xl">Original releases</h2></div><span className="text-[9px] tracking-[.25em] text-white/25">{songs.length} {songs.length === 1 ? 'TRACK' : 'TRACKS'}</span></div>
          {songs.length ? (
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {songs.map((song, index) => (
                <a key={song.id} href={`/world/${song.slug}`} className="group grid gap-5 py-7 transition md:grid-cols-[80px_1fr_auto] md:items-center">
                  <span className="text-[10px] tracking-[.25em] text-white/20">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-2xl font-medium transition group-hover:text-gold md:text-4xl">{song.title}</h3>
                    <p className="mt-2 max-w-2xl text-xs leading-6 text-white/30">{song.description || 'An original GEETQAR recording.'}</p>
                    <div className="mt-3 flex gap-4 text-[8px] tracking-[.25em] text-white/20"><span>{song.genre || 'ORIGINAL'}</span>{song.releaseDate && <span>{song.releaseDate}</span>}</div>
                  </div>
                  <span className="text-[9px] tracking-[.25em] text-gold">ENTER WORLD →</span>
                </a>
              ))}
            </div>
          ) : <div className="mt-10 border border-white/10 p-12 text-center text-sm text-white/30">The catalogue is being updated. Check back for the next release.</div>}
        </section>
      </div>
    </main>
  )
}
