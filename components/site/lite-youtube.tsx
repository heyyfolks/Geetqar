'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

/** Shows the thumbnail first and only loads the YouTube player after a click (keeps the page fast). */
export function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false)
  return (
    <div className="gx-lite">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`Play ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="gx-lite-play"><Play size={26} fill="currentColor" /></span>
        </button>
      )}
    </div>
  )
}
