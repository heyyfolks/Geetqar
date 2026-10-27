'use client'

import { useState } from 'react'
import { Play, Youtube } from 'lucide-react'
import { SOCIAL, type YTVideo } from '@/lib/site'

export function Videos({ videos, loading }: { videos: YTVideo[]; loading: boolean }) {
  const [playing, setPlaying] = useState<string | null>(null)

  return (
    <section id="watch" className="gx-section" aria-labelledby="watch-title" style={{ background: 'var(--ink-2)' }}>
      <div className="gx-wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p className="gx-kicker">02 / Watch</p>
            <h2 id="watch-title" className="gx-h2">Straight off <em>the channel.</em></h2>
          </div>
          <a className="gx-btn gx-btn-line" href={SOCIAL.youtube} target="_blank" rel="noreferrer"><Youtube size={15} /> SUBSCRIBE</a>
        </div>

        {loading ? (
          <div className="gx-videos">{[0, 1, 2].map((i) => <div key={i} className="gx-skel" />)}</div>
        ) : videos.length === 0 ? (
          <div className="gx-empty">
            <p>Videos live on the channel. One tap and you are there.</p>
            <a className="gx-btn gx-btn-solid" href={SOCIAL.youtube} target="_blank" rel="noreferrer"><Youtube size={15} /> GO TO YOUTUBE</a>
          </div>
        ) : (
          <div className="gx-videos">
            {videos.slice(0, 6).map((video) => {
              const active = playing === video.id
              return (
                <button key={video.id} className={`gx-video ${active ? 'is-playing' : ''}`} onClick={() => setPlaying(video.id)} aria-label={`Play ${video.title}`}>
                  {active ? (
                    <iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                  ) : (
                    <>
                      <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" />
                      <span className="gx-video-play"><Play size={22} fill="currentColor" /></span>
                      <span className="gx-video-cap">{video.title}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
