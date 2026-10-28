'use client'

import { motion } from 'framer-motion'
import { Play, Youtube } from 'lucide-react'
import { SOCIAL, type Track } from '@/lib/site'

const ROLES = ['SONGWRITER', 'VOCALIST', 'PRODUCER', 'MIX + MASTER']

export function Hero({ latest }: { latest?: Track }) {
  return (
    <section id="top" className="gx-hero" aria-labelledby="hero-title">
      <div className="gx-wrap gx-hero-grid">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
          <div className="gx-roles" aria-label="What GEETQAR does">{ROLES.map((role) => <span key={role}>{role}</span>)}</div>
          <h1 id="hero-title" className="gx-word">GEET<em>qar</em></h1>
          <p className="gx-deva" lang="hi">गीतकार</p>
          <p className="gx-tag">R&amp;B, soul, drill, lo-fi and classical, in Hindi and English. Written, sung, produced and mastered by one artist. New songs appear here as soon as they go live on YouTube.</p>
          <div className="gx-cta-row">
            <a className="gx-btn gx-btn-solid" href="#music"><Play size={14} fill="currentColor" /> LISTEN NOW</a>
            <a className="gx-btn gx-btn-line" href={SOCIAL.youtube} target="_blank" rel="noreferrer"><Youtube size={15} /> YOUTUBE CHANNEL</a>
          </div>
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
