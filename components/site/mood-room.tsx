'use client'

import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { MOODS, hourLabel, moodForHour, moodsOf, type MoodKey } from '@/lib/moods'
import type { Track } from '@/lib/site'

export type MoodEvent = { label: string; ids: string[]; play: string }

export function MoodRoom({ tracks }: { tracks: Track[] }) {
  const [mood, setMood] = useState<MoodKey>('night')
  const [clock, setClock] = useState('')
  const [touched, setTouched] = useState(false)

  // Start on the mood that fits the visitor's local time (after mount, so the server HTML stays identical).
  useEffect(() => {
    const now = new Date()
    setClock(hourLabel(now))
    setMood(moodForHour(now.getHours()))
  }, [])

  const groups = useMemo(() => {
    const map = new Map<MoodKey, Track[]>()
    for (const track of tracks) for (const key of moodsOf(track)) map.set(key, [...(map.get(key) || []), track])
    return map
  }, [tracks])

  const available = MOODS.filter((m) => (groups.get(m.key)?.length || 0) > 0)
  const active = available.find((m) => m.key === mood) || available[0]
  if (!active) return null
  const list = (groups.get(active.key) || []).slice(0, 8)

  const play = (id: string) => {
    const detail: MoodEvent = { label: active.label, ids: list.map((t) => t.id), play: id }
    window.dispatchEvent(new CustomEvent('gx:mood', { detail }))
  }

  return (
    <section id="moods" className="gx-section gx-moods" aria-labelledby="moods-title" style={{ '--c1': active.c1, '--c2': active.c2 } as React.CSSProperties}>
      <div className="gx-aura" aria-hidden="true" />
      <div className="gx-wrap" style={{ position: 'relative' }}>
        <p className="gx-kicker">02 / Moods</p>
        <h2 id="moods-title" className="gx-h2">{clock && !touched ? <>It is {clock}. <em>Pick a mood.</em></> : <>Pick a <em>mood.</em></>}</h2>
        <p className="gx-lede">Choose how you feel and the player lines up the songs that match. The list sorts itself, so every new upload finds its mood.</p>

        <div className="gx-chips gx-mood-chips" role="tablist" aria-label="Moods">
          {available.map((m) => (
            <button key={m.key} role="tab" aria-selected={m.key === active.key} className={`gx-chip ${m.key === active.key ? 'on' : ''}`} onClick={() => { setMood(m.key); setTouched(true) }}>
              {m.label} <span aria-hidden="true">· {groups.get(m.key)?.length}</span>
            </button>
          ))}
        </div>

        <div className="gx-mood-stage">
          <div>
            <p className="gx-mood-line" key={active.key}>{active.line}</p>
            <button className="gx-btn gx-btn-solid" onClick={() => play(list[0].id)}><Play size={14} fill="currentColor" /> PLAY THIS MOOD</button>
          </div>
          <ul className="gx-mood-list">
            {list.map((t, i) => (
              <li key={`${active.key}-${t.id}`} style={{ animationDelay: `${i * 60}ms` }}>
                <button onClick={() => play(t.id)} aria-label={`Play ${t.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${t.id}/mqdefault.jpg`} alt="" loading="lazy" width={96} height={54} />
                  <span><strong>{t.name}</strong><small>{t.kind}</small></span>
                  <Play size={16} fill="currentColor" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
