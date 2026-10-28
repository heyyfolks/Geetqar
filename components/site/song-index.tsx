import type { Track } from '@/lib/site'

/** Plain links to every song page: helps visitors, and gives search engines a clear path to each song. */
export function SongIndex({ tracks }: { tracks: Track[] }) {
  if (!tracks.length) return null
  return (
    <section id="songs" className="gx-section gx-songs" aria-labelledby="songs-title">
      <div className="gx-wrap">
        <h2 id="songs-title" className="gx-h3">All songs <a href="/songs" className="gx-more">See the full list →</a></h2>
        <ul className="gx-rel">
          {tracks.map((t) => (
            <li key={t.id}><a href={`/songs/${t.slug}`}><strong>{t.name}</strong><span>{t.kind}{t.published ? ` · ${t.published.slice(0, 4)}` : ''}</span></a></li>
          ))}
        </ul>
      </div>
    </section>
  )
}
