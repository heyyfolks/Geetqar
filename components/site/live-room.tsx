'use client'

import { Jukebox } from '@/components/jukebox'
import { Recommendations } from '@/components/recommendations'

export function LiveRoom({ titles }: { titles: string[] }) {
  return (
    <section id="room" className="gx-section" aria-labelledby="room-title" style={{ background: 'var(--ink-2)' }}>
      <div className="gx-wrap">
        <p className="gx-kicker">05 / Live room</p>
        <h2 id="room-title" className="gx-h2">Vote. Talk. <em>Request.</em></h2>
        <p className="gx-lede">Verify your email once to vote on what plays next, chat with other listeners, and recommend a track.</p>
        <div className="glass" style={{ marginTop: 40, padding: 'clamp(12px, 3vw, 28px)' }}><Jukebox tracks={titles} /></div>
        <div className="glass" style={{ marginTop: 20, padding: 'clamp(12px, 3vw, 28px)' }}><Recommendations /></div>
      </div>
    </section>
  )
}
