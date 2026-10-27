'use client'

import { useState } from 'react'
import { Instagram, Pause, Play, Youtube } from 'lucide-react'
import { MusicPlayer } from '@/components/music-player'
import { SOCIAL, type Song } from '@/lib/site'

export function Tracks({ songs, loading }: { songs: Song[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [covers, setCovers] = useState<Record<string, string>>({})

  const ordered = [...songs].sort((a, b) => Number(b.featured) - Number(a.featured))

  return (
    <section id="music" className="gx-section" aria-labelledby="music-title">
      <div className="gx-wrap">
        <p className="gx-kicker">01 / Music</p>
        <h2 id="music-title" className="gx-h2">Pick one. <em>Run it back.</em></h2>
        <p className="gx-lede">Original tracks, straight from the source. Press play right here, no redirects, no ads.</p>

        {loading ? (
          <div className="gx-tracks" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="gx-skel" style={{ aspectRatio: '12/1.6', margin: '14px 0' }} />)}</div>
        ) : ordered.length === 0 ? (
          <div className="gx-empty">
            <p>New tracks are loading into the room. Till then, the full catalogue lives on YouTube.</p>
            <a className="gx-btn gx-btn-solid" href={SOCIAL.youtube} target="_blank" rel="noreferrer"><Youtube size={15} /> OPEN YOUTUBE</a>
          </div>
        ) : (
          <div className="gx-tracks">
            {ordered.map((song, index) => {
              const open = openId === song.id
              const cover = covers[song.id] || song.coverUrl
              return (
                <article key={song.id} className={`gx-track ${open ? 'is-open' : ''}`}>
                  <button className="gx-track-main" aria-expanded={open} onClick={() => setOpenId(open ? null : song.id)}>
                    <span className="gx-num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="gx-cover">{cover ? <img src={cover} alt={`${song.title} artwork`} loading="lazy" /> : song.title.charAt(0)}</span>
                    <span>
                      <span className="gx-t-title">{song.title}</span>
                      <span className="gx-t-meta">
                        {song.genre && <span>{song.genre}</span>}
                        {song.releaseDate && <span>{song.releaseDate.slice(0, 4)}</span>}
                        {song.featured && <span style={{ color: 'var(--ember)' }}>Featured</span>}
                      </span>
                    </span>
                    <span className="gx-playbtn" aria-hidden="true">{open ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</span>
                  </button>
                  {open && (
                    <div className="gx-track-body">
                      {song.description && <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>{song.description}</p>}
                      <MusicPlayer title={song.title} onCover={(url) => setCovers((current) => (current[song.id] === url ? current : { ...current, [song.id]: url }))} />
                      <div className="gx-track-links">
                        <a href={`/world/${song.slug}`}>OPEN FULL PAGE →</a>
                        {song.youtube && <a href={song.youtube} target="_blank" rel="noreferrer"><Youtube size={12} style={{ display: 'inline', marginRight: 6 }} />YOUTUBE</a>}
                        {song.instagram && <a href={song.instagram} target="_blank" rel="noreferrer"><Instagram size={12} style={{ display: 'inline', marginRight: 6 }} />INSTAGRAM</a>}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
