'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Youtube } from 'lucide-react'
import type { Track } from '@/lib/site'
import { subscribeUrl } from '@/lib/site-config'
import { useSite } from '@/components/site/site-context'

function DropChip() {
  const { drop } = useSite()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  if (!drop.enabled || !drop.date || now === null) return null
  const ms = Date.parse(drop.date) - now
  if (!(ms > 0)) return null
  const d = Math.floor(ms / 864e5), hr = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4)
  const body = <><span className="gx-dot" /> NEXT DROP {drop.title && <strong>{drop.title}</strong>} IN {d > 0 ? `${d}D ` : ''}{hr}H {m}M{drop.url ? ' ↗' : ''}</>
  return drop.url ? <a className="gx-latest" href={drop.url} target="_blank" rel="noreferrer">{body}</a> : <span className="gx-latest">{body}</span>
}

export function Hero({ latest }: { latest?: Track }) {
  const { hero, links, announcement } = useSite()
  return (
    <section id="top" className="gx-hero" aria-labelledby="hero-title">
      <div className="gx-wrap gx-hero-grid">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
          <div className="gx-roles" aria-label="What GEETQAR does">{hero.roles.map((role) => <span key={role}>{role}</span>)}</div>
          <h1 id="hero-title" className="gx-word">GEET<em>qar</em></h1>
          <p className="gx-deva" lang="hi">गीतकार</p>
          <p className="gx-tag">{hero.tagline}</p>
          <div className="gx-cta-row">
            <a className="gx-btn gx-btn-solid" href="#music"><Play size={14} fill="currentColor" /> LISTEN NOW</a>
            <a className="gx-btn gx-btn-line" href={subscribeUrl(links.youtube)} target="_blank" rel="noreferrer"><Youtube size={15} /> SUBSCRIBE ON YOUTUBE</a>
          </div>
          {announcement.enabled && announcement.text && (
            announcement.url
              ? <a className="gx-latest" href={announcement.url} target="_blank" rel="noreferrer"><span className="gx-dot" /> {announcement.text} ↗</a>
              : <span className="gx-latest"><span className="gx-dot" /> {announcement.text}</span>
          )}
          <DropChip />
          {latest && (
            <a className="gx-latest" href="#music"><span className="gx-dot" /> OUT NOW <strong>{latest.name}</strong> ↗</a>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.92, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }} aria-hidden="true">
          <div className="gx-vinyl-wrap">
            <div className="gx-vinyl"><div className="gx-label"><div><strong lang="hi">गीतकार</strong><small>GEETQAR · SIDE A</small></div></div></div>
            <div className="gx-arm" />
          </div>
          <div className="gx-eq">{Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i * 83) % 900}ms`, animationDuration: `${0.8 + ((i * 37) % 70) / 100}s` }} />)}</div>
        </motion.div>
      </div>
    </section>
  )
}

const WORDS = ['Songwriter', 'Vocals', 'Producer', 'Mix & Master', 'Covers', 'Mixtapes', 'R&B', 'Soul', 'Drill', 'Lo-fi', 'Classical', 'Sensual']

export function Marquee() {
  const row = [...WORDS, ...WORDS]
  return (
    <div className="gx-marquee" aria-hidden="true">
      <div className="gx-marquee-track">
        {row.map((word, i) => <span key={i}>{word}</span>)}
        {row.map((word, i) => <span key={`b${i}`}>{word}</span>)}
      </div>
    </div>
  )
}
