'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Instagram, Youtube, Play, ExternalLink, MessageCircle, X, LibraryBig, Sparkles, Radio, Disc3 } from 'lucide-react'
import { AudioVisualizer } from '@/components/audio-visualizer'
import { MusicPlayer } from '@/components/music-player'
import { Jukebox } from '@/components/jukebox'
import { Recommendations } from '@/components/recommendations'
import { GeetqarLab } from '@/components/geetqar-lab'
import { useCallback, useEffect, useState } from 'react'

type Song = {
  id: string
  title: string
  slug: string
  youtube?: string
  instagram?: string
  description?: string
  coverUrl?: string
  featured?: boolean
}

const abstractVideo = 'https://www.pexels.com/download/video/35313299/'

export default function Home() {
  const [selected, setSelected] = useState<Song | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [catalogue, setCatalogue] = useState(false)

  useEffect(() => {
    fetch('/api/songs', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { songs: [] }))
      .then((d) => {
        const list = d.songs || []
        setSongs(list)
        setCovers(Object.fromEntries(list.filter((s: Song) => s.coverUrl).map((s: Song) => [s.id, s.coverUrl!])))
      })
      .catch(() => {})
  }, [])

  const handleCover = useCallback((id: string, url: string) => {
    if (url) setCovers((p) => (p[id] === url ? p : { ...p, [id]: url }))
  }, [])

  const featured = songs.filter((s) => s.featured)
  const tracks = songs.map((s) => s.title)

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-black">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />

      <nav className="fixed top-0 z-40 flex w-full items-center justify-between px-5 py-5 md:px-12 md:py-6">
        <a href="#top" className="text-sm font-extrabold tracking-[.5em]">GEET<span className="gold-text">QAR</span></a>
        <div className="hidden gap-8 text-[10px] tracking-[.28em] text-white/55 md:flex">
          <a href="#music">THE SOUNDS</a>
          <a href="#jukebox">LIVE ROOM</a>
          <a href="#recommend">REQUEST LINE</a>
          <a href="#arena">ARENA</a>
        </div>
        <div className="flex gap-2">
          <a className="jelly-icon" href="https://www.instagram.com/geetqar/" target="_blank" rel="noreferrer"><Instagram size={15} /></a>
          <a className="jelly-icon" href="https://www.youtube.com/@geetqar" target="_blank" rel="noreferrer"><Youtube size={15} /></a>
        </div>
      </nav>

      <button onClick={() => setCatalogue(true)} className="catalogue-tab jelly-button fixed right-0 top-1/2 z-40 -translate-y-1/2 px-3 py-5 text-[9px] tracking-[.3em] text-gold [writing-mode:vertical-rl]">
        <LibraryBig size={15} className="mb-2" /> CATALOGUE
      </button>

      <section className="relative flex min-h-screen items-center px-5 pb-14 pt-28 md:px-12 md:pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(212,175,55,.17),transparent_27%),radial-gradient(circle_at_20%_78%,rgba(168,85,247,.09),transparent_23%)]" />
        <div className="relative grid w-full max-w-7xl gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <p className="mb-5 text-[9px] font-semibold tracking-[.5em] text-gold md:text-[10px]">WRITER · COMPOSER · PRODUCER</p>
            <h1 className="text-[19vw] font-extrabold leading-[.76] tracking-[-.09em] md:text-[11vw]">GEET<span className="gold-text">QAR</span></h1>
            <p className="mt-9 max-w-xl text-sm leading-7 text-white/45 md:text-base">A private little universe of sound, memory, texture and late-night ideas.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#music" className="jelly-button inline-flex items-center gap-3 px-6 py-3.5 text-[10px] font-semibold tracking-[.28em] text-black"><Play size={13} fill="currentColor" /> ENTER THE SOUND</a>
              <button onClick={() => setCatalogue(true)} className="jelly-button jelly-button-dark inline-flex items-center gap-3 px-6 py-3.5 text-[10px] font-semibold tracking-[.28em] text-white/70"><LibraryBig size={13} /> OPEN ARCHIVE</button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .94, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .2, duration: 1 }} className="hero-media jelly-card relative overflow-hidden">
            <video className="absolute inset-0 h-full w-full object-cover opacity-65 mix-blend-screen" src={abstractVideo} autoPlay muted loop playsInline preload="metadata" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,245,190,.22),transparent_18%),linear-gradient(135deg,rgba(0,0,0,.3),rgba(0,0,0,.8))]" />
            <div className="sound-sculpture" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
            <div className="relative flex h-full min-h-[390px] flex-col justify-between p-6 md:p-8">
              <div className="flex items-center justify-between text-[9px] tracking-[.3em] text-white/55"><span className="inline-flex items-center gap-2"><span className="live-dot h-1.5 w-1.5 rounded-full bg-gold" /> LIVE FREQUENCY</span><span>01 / 01</span></div>
              <div>
                <div className="mb-5 flex items-center gap-2 text-gold"><Radio size={16} /><span className="text-[9px] tracking-[.35em]">AUDIO / VISUAL STUDY</span></div>
                <h2 className="max-w-sm text-3xl font-semibold leading-tight md:text-5xl">Sound should have a shape.</h2>
                <p className="mt-4 max-w-sm text-xs leading-6 text-white/45">Abstract light, moving texture and low-frequency energy — no faces, no noise, just atmosphere.</p>
              </div>
            </div>
          </motion.div>
        </div>
        <ArrowDown className="absolute bottom-7 left-1/2 animate-bounce text-gold/60" size={18} />
      </section>

      <section className="px-5 pb-10 md:px-12">
        <div className="bento-grid mx-auto max-w-7xl">
          <div className="jelly-card bento-tall flex flex-col justify-between p-6 md:p-8">
            <div className="flex items-center justify-between"><Disc3 className="text-gold" size={19} /><span className="text-[9px] tracking-[.3em] text-white/30">AUDIO ARCHIVE</span></div>
            <div><p className="text-6xl font-extrabold tracking-[-.07em]">{String(songs.length).padStart(2, '0')}</p><p className="mt-2 text-[9px] tracking-[.3em] text-white/35">TRACKS IN CATALOGUE</p></div>
          </div>
          <div className="jelly-card bento-wide overflow-hidden p-6 md:p-8">
            <div className="flex h-full items-end justify-between gap-6">
              <div><Sparkles className="mb-5 text-gold" size={18} /><h3 className="text-2xl font-semibold md:text-3xl">Liquid notes.</h3><p className="mt-3 max-w-md text-xs leading-6 text-white/40">The interface moves like sound — soft edges, glass, glow and tiny physical reactions.</p></div>
              <div className="mini-wave" aria-hidden="true">{Array.from({ length: 15 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 70}ms` }} />)}</div>
            </div>
          </div>
          <div className="jelly-card flex items-center justify-between p-6 md:p-8"><div><span className="text-[9px] tracking-[.3em] text-gold">CURATED</span><p className="mt-2 text-xl font-semibold">{featured.length} featured</p></div><span className="text-4xl text-white/10">✦</span></div>
        </div>
      </section>

      <GeetqarLab />

      <section id="music" className="border-t border-white/10 px-5 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] tracking-[.4em] text-gold">01 / THE SOUNDS</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 className="text-4xl font-semibold md:text-6xl">Only what I choose.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/40">The featured listening room. Every track here is hand-picked from the full catalogue.</p></div><span className="text-[9px] tracking-[.3em] text-white/25">{featured.length} / {songs.length} SELECTED</span></div>
          <div className="mt-10 grid gap-5">{featured.map((song, i) => (
            <motion.div key={song.id} whileHover={{ y: -4 }} className="jelly-card cursor-pointer p-5 md:p-7" onClick={() => setSelected(song)}>
              <div className="mb-5 flex items-center gap-4">
                <div className="artwork-shell h-14 w-14 shrink-0 overflow-hidden">{covers[song.id] ? <img src={covers[song.id]} alt={`${song.title} artwork`} className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-xs text-gold">{String(i + 1).padStart(2, '0')}</div>}</div>
                <div className="flex-1"><h3 className="font-semibold">{song.title}</h3>{song.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{song.description}</p>}</div>
                <ExternalLink size={15} className="text-white/25" />
              </div>
              <MusicPlayer title={song.title} onCover={(url) => handleCover(song.id, url)} />
            </motion.div>
          ))}
          {featured.length === 0 && <div className="jelly-card p-10 text-center"><p className="text-sm text-white/35">The listening room is being curated.</p><button onClick={() => setCatalogue(true)} className="jelly-button jelly-button-dark mt-5 px-5 py-3 text-[10px] tracking-[.25em] text-gold">OPEN CATALOGUE</button></div>}
          </div>
          <div className="mt-10 jelly-card p-4 md:p-6"><AudioVisualizer /></div>
        </div>
      </section>

      <section id="jukebox" className="border-t border-white/10 px-5 py-24 md:px-12">
        <div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">02 / LIVE ROOM</p><h2 className="mt-3 text-4xl font-semibold md:text-6xl">The room decides.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/40">Vote, recommend, talk. A live corner of the GEETQAR universe.</p><div className="mt-10 jelly-card p-3 md:p-6"><Jukebox tracks={tracks} /></div></div>
      </section>

      <section id="recommend" className="border-t border-white/10 px-5 py-24 md:px-12">
        <div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">03 / THE REQUEST LINE</p><h2 className="mt-3 text-4xl font-semibold md:text-6xl">Leave a trace.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">Recommend a catalogue track, point to the part that matters, and leave your reason.</p><div className="mt-10 jelly-card p-3 md:p-6"><Recommendations /></div></div>
      </section>

      <section id="arena" className="border-t border-white/10 px-5 py-24 md:px-12">
        <div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">04 / DISCUSSION ARENA</p><div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="jelly-card p-7 md:p-10"><span className="text-[9px] tracking-[.35em] text-gold">PINNED BY GEETQAR</span><h2 className="mt-6 text-3xl font-semibold md:text-5xl">What does a song become after it becomes yours?</h2><p className="mt-6 text-sm leading-7 text-white/45">Share your POV, review a track, or start a conversation around the music.</p><a href="#jukebox" className="jelly-button jelly-button-dark mt-8 inline-flex items-center gap-2 px-5 py-3 text-[10px] tracking-[.25em]"><MessageCircle size={13} /> ENTER THE ARENA</a></div><div className="jelly-card flex min-h-64 flex-col justify-between p-7"><div><span className="text-[9px] tracking-[.35em] text-white/35">PRIVATE ARCHIVE</span><h3 className="mt-4 text-2xl">Original masters.</h3></div><p className="text-xs leading-6 text-white/40">Uncompressed WAV/FLAC files stay behind private signed URLs.</p></div></div></div>
      </section>

      <footer className="border-t border-white/10 px-5 py-16 md:px-12"><div className="mx-auto flex max-w-7xl justify-between"><div><p className="text-3xl font-bold">GEETQAR</p><p className="mt-3 text-xs text-white/30">Music beyond sound.</p></div><div className="flex gap-3 text-white/45"><a className="jelly-icon" href="https://www.instagram.com/geetqar/" target="_blank" rel="noreferrer"><Instagram size={18} /></a><a className="jelly-icon" href="https://www.youtube.com/@geetqar" target="_blank" rel="noreferrer"><Youtube size={18} /></a></div></div></footer>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md" onClick={() => setSelected(null)}><div className="jelly-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 md:p-10" onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">GEETQAR / TRACK</span><h2 className="mt-3 text-3xl font-bold md:text-5xl">{selected.title}</h2>{selected.description && <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">{selected.description}</p>}</div><button className="jelly-icon" onClick={() => setSelected(null)}><X /></button></div>{covers[selected.id] && <div className="artwork-large mt-6"><img src={covers[selected.id]} alt={`${selected.title} artwork`} className="max-h-[58vh] w-full object-contain" /></div>}<div className="mt-7"><MusicPlayer title={selected.title} onCover={(url) => handleCover(selected.id, url)} /></div><div className="mt-6 flex flex-wrap gap-3">{selected.youtube && <a href={selected.youtube} target="_blank" rel="noreferrer" className="jelly-button jelly-button-dark inline-flex items-center gap-2 px-4 py-3 text-[10px] tracking-[.2em] text-red-300"><Youtube size={14} /> YOUTUBE</a>}{selected.instagram && <a href={selected.instagram} target="_blank" rel="noreferrer" className="jelly-button jelly-button-dark inline-flex items-center gap-2 px-4 py-3 text-[10px] tracking-[.2em] text-pink-300"><Instagram size={14} /> INSTAGRAM</a>}</div></div></div>}

      {catalogue && <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" onClick={() => setCatalogue(false)}><aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#080808]/95 p-5 md:p-8" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">GEETQAR / ARCHIVE</span><h2 className="mt-2 text-3xl font-bold">Catalogue</h2><p className="mt-2 text-xs text-white/35">{songs.length} tracks · complete archive</p></div><button className="jelly-icon" onClick={() => setCatalogue(false)}><X /></button></div><div className="mt-8 space-y-2">{songs.map((s, i) => <button key={s.id} onClick={() => { setSelected(s); setCatalogue(false) }} className="jelly-row flex w-full items-center gap-3 p-3 text-left"><div className="artwork-shell h-14 w-14 shrink-0 overflow-hidden">{covers[s.id] ? <img src={covers[s.id]} className="h-full w-full object-contain bg-black/30" alt="" /> : <div className="flex h-full items-center justify-center text-xs text-gold">{String(i + 1).padStart(2, '0')}</div>}</div><div className="min-w-0 flex-1"><div className="truncate text-sm">{s.title}</div><div className="mt-1 text-[9px] text-white/30">{s.featured ? 'FEATURED · THE SOUNDS' : 'CATALOGUE'}</div></div><Play size={13} className="text-gold" /></button>)}</div></aside></div>}
    </main>
  )
}
