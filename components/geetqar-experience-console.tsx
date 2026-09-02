'use client'

import { useEffect, useMemo, useState } from 'react'
import { Compass, Headphones, Moon, Sparkles, X, ArrowUpRight } from 'lucide-react'

type Song = { id: string; title: string; slug: string; description?: string; featured?: boolean; coverUrl?: string }

const moods = [
  { key: '2:17 AM', label: '2:17 AM', hint: 'late-night / intimate', icon: Moon },
  { key: 'DARKER', label: 'DARKER', hint: 'low light / heavy air', icon: Sparkles },
  { key: 'FLOATING', label: 'FLOATING', hint: 'soft edges / weightless', icon: Compass },
  { key: 'LOSE YOURSELF', label: 'LOSE YOURSELF', hint: 'press play / disappear', icon: Headphones },
]

export function GeetqarExperienceConsole() {
  const [open, setOpen] = useState(false)
  const [songs, setSongs] = useState<Song[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/songs', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : { songs: [] })
      .then((d) => setSongs(Array.isArray(d.songs) ? d.songs : []))
      .catch(() => setSongs([]))
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return songs.slice(0, 4)
    return songs.filter((s) => `${s.title} ${s.description || ''}`.toLowerCase().includes(q)).slice(0, 5)
  }, [songs, query])

  const remember = (slug: string) => {
    try { localStorage.setItem('geetqar:last-world', slug) } catch {}
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open GEETQAR experience console"
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-gold/30 bg-black/70 px-4 py-3 text-[9px] tracking-[.25em] text-white/75 shadow-2xl backdrop-blur-xl transition hover:border-gold/70 hover:text-white"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        ENTER THE SIGNAL
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-4 backdrop-blur-xl md:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#080808]/95 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-white/10 p-6 md:p-8">
              <div>
                <p className="text-[9px] tracking-[.4em] text-gold">GEETQAR / LISTENER CONSOLE</p>
                <h2 className="mt-3 text-2xl font-semibold md:text-4xl">What do you want to feel?</h2>
                <p className="mt-2 text-xs text-white/35">Choose a mood. The world will take you somewhere.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close console" className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid gap-3 p-6 md:grid-cols-2 md:p-8">
              {moods.map(({ key, label, hint, icon: Icon }) => (
                <a key={key} href={`/mood/${encodeURIComponent(key.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`} onClick={() => setOpen(false)} className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-gold/40 hover:bg-gold/[.04]">
                  <Icon size={17} className="text-gold" />
                  <div className="mt-5 text-sm tracking-[.12em] text-white">{label}</div>
                  <div className="mt-2 text-xs text-white/30">{hint}</div>
                  <div className="mt-5 text-[8px] tracking-[.25em] text-gold/60 transition group-hover:text-gold">OPEN MOOD ↗</div>
                </a>
              ))}
            </div>

            <div className="border-t border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[9px] tracking-[.35em] text-white/30">FIND A SIGNAL</p>
                <a href="/archive" onClick={() => setOpen(false)} className="text-[8px] tracking-[.25em] text-gold">ARCHIVE ↗</a>
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="type a feeling, title, memory..." className="mt-3 w-full border-b border-white/10 bg-transparent py-3 text-sm outline-none placeholder:text-white/20 focus:border-gold/50" />
              <div className="mt-3 grid gap-2">
                {matches.map((song) => (
                  <a key={song.id} href={`/world/${song.slug}`} onClick={() => remember(song.slug)} className="flex items-center justify-between border border-white/5 px-3 py-3 text-xs text-white/60 transition hover:border-gold/30 hover:text-white">
                    <span>{song.title}</span><ArrowUpRight size={13} className="text-gold/60" />
                  </a>
                ))}
                {!matches.length && <div className="py-3 text-xs text-white/25">No signal found.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
