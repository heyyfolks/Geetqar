'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Moon, Play, Sparkles } from 'lucide-react'
import { useParams } from 'next/navigation'

type Song = { id: string; title: string; slug: string; description?: string; coverUrl?: string; featured?: boolean }

const moodCopy: Record<string, { title: string; sub: string }> = {
  '2-17-am': { title: '2:17 AM', sub: 'For the hour when everything gets quieter.' },
  'darker': { title: 'DARKER', sub: 'Low light. Heavy air. No need to explain.' },
  'floating': { title: 'FLOATING', sub: 'Soft edges. Weightless thoughts.' },
  'lose-yourself': { title: 'LOSE YOURSELF', sub: 'Press play. Stop checking the time.' },
}

export default function MoodWorld() {
  const { mood } = useParams<{ mood: string }>()
  const [songs, setSongs] = useState<Song[]>([])
  useEffect(() => { fetch('/api/songs', { cache: 'no-store' }).then((r) => r.json()).then((d) => setSongs(d.songs || [])).catch(() => {}) }, [])

  const data = moodCopy[mood] || { title: 'THE SIGNAL', sub: 'A GEETQAR listening state.' }
  const ranked = useMemo(() => {
    const terms: Record<string, string[]> = {
      '2-17-am': ['night', 'late', 'dream', 'love', 'alone', '2'],
      darker: ['dark', 'sad', 'lost', 'night', 'pain'],
      floating: ['float', 'dream', 'soft', 'air', 'wave'],
      'lose-yourself': ['play', 'dance', 'feel', 'fire', 'love'],
    }
    const words = terms[mood] || []
    return [...songs].sort((a, b) => {
      const score = (s: Song) => words.reduce((n, w) => n + (`${s.title} ${s.description || ''}`.toLowerCase().includes(w) ? 1 : 0), 0) + (s.featured ? .25 : 0)
      return score(b) - score(a)
    })
  }, [songs, mood])

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,.11),transparent_30%),radial-gradient(circle_at_15%_80%,rgba(80,50,160,.08),transparent_25%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-8 md:px-12 md:py-12">
        <header className="flex items-center justify-between"><a href="/" className="inline-flex items-center gap-2 text-[9px] tracking-[.3em] text-white/45 hover:text-white"><ArrowLeft size={14} /> GEETQAR</a><span className="text-[8px] tracking-[.35em] text-gold">MOOD SIGNAL</span></header>
        <section className="py-24 md:py-32">
          <p className="text-[9px] tracking-[.45em] text-gold">LISTENER STATE / {mood?.toUpperCase()}</p>
          <h1 className="mt-5 max-w-4xl text-[18vw] font-extrabold leading-[.78] tracking-[-.08em] md:text-[10vw]">{data.title}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/40">{data.sub}</p>
        </section>

        <section className="border-t border-white/10 pt-10">
          <div className="flex items-center justify-between"><div><p className="text-[9px] tracking-[.35em] text-white/30">RECOMMENDED SIGNALS</p><p className="mt-2 text-xs text-white/25">Built from your selected mood — not a generic playlist.</p></div><Sparkles size={17} className="text-gold" /></div>
          <div className="mt-7 grid gap-3">{ranked.map((song, i) => (
            <a key={song.id} href={`/world/${song.slug}`} className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 border border-white/10 bg-white/[.02] p-4 transition hover:border-gold/40 hover:bg-gold/[.035] md:grid-cols-[64px_1fr_180px_auto]">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden bg-[#111] text-[9px] text-white/20 md:h-16 md:w-16">{song.coverUrl ? <img src={song.coverUrl} alt="" className="h-full w-full object-cover" /> : <Moon size={15} />}</div>
              <div><div className="text-sm text-white/80">{song.title}</div><div className="mt-1 line-clamp-1 text-xs text-white/25">{song.description || 'GEETQAR signal'}</div></div>
              <div className="hidden text-right text-[8px] tracking-[.2em] text-white/20 md:block">SIGNAL {String(i + 1).padStart(2, '0')}</div>
              <div className="flex items-center gap-2 text-[8px] tracking-[.2em] text-gold/60 group-hover:text-gold"><Play size={12} fill="currentColor" /> ENTER</div>
            </a>
          ))}</div>
        </section>

        <a href="/archive" className="mt-14 inline-flex items-center gap-2 text-[9px] tracking-[.3em] text-white/35 hover:text-gold">GO DEEPER / ARCHIVE <ArrowUpRight size={13} /></a>
      </div>
    </main>
  )
}
