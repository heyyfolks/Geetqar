'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Instagram, Youtube, Play, ExternalLink, MessageCircle, X, LibraryBig, Sparkles, Radio, Disc3, Waves, Volume2 } from 'lucide-react'
import { AudioVisualizer } from '@/components/audio-visualizer'
import { MusicPlayer } from '@/components/music-player'
import { GlobalAudioDock } from '@/components/global-audio-dock'
import { Jukebox } from '@/components/jukebox'
import { Recommendations } from '@/components/recommendations'
import { GeetqarLab } from '@/components/geetqar-lab'
import { ImmersiveEffects } from '@/components/immersive-effects'
import { SignalField } from '@/components/signal-field'
import { useCallback, useEffect, useState } from 'react'

type Song = { id: string; title: string; slug: string; youtube?: string; instagram?: string; description?: string; coverUrl?: string; featured?: boolean }

const visualVideos = [
  'https://www.pexels.com/download/video/35313299/',
  'https://www.pexels.com/download/video/3129595/',
  'https://www.pexels.com/download/video/857195/'
]

const visualImages = [
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1524650359799-842906ca1c06?auto=format&fit=crop&w=1400&q=85'
]

export default function Home() {
  const [selected, setSelected] = useState<Song | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [covers, setCovers] = useState<Record<string, string>>({})
  const [catalogue, setCatalogue] = useState(false)

  useEffect(() => {
    fetch('/api/songs', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : { songs: [] })
      .then((data) => {
        const list = data.songs || []
        setSongs(list)
        setCovers(Object.fromEntries(list.filter((song: Song) => song.coverUrl).map((song: Song) => [song.id, song.coverUrl!])))
      })
      .catch(() => setSongs([]))
  }, [])

  const handleCover = useCallback((id: string, url: string) => {
    if (url) setCovers((current) => current[id] === url ? current : { ...current, [id]: url })
  }, [])

  const featured = songs.filter((song) => song.featured)
  const tracks = songs.map((song) => song.title)
  const latest = featured[0] || songs[0]

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-black text-white">
      <ImmersiveEffects />
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <div className="ambient-orb ambient-orb-three" />

      <nav aria-label="Primary navigation" className="fixed top-0 z-40 w-full px-5 py-5 md:px-12 md:py-6">
        <div className="flex items-center justify-between">
          <a href="#top" aria-label="GEETQAR home" className="text-sm font-extrabold tracking-[.5em]">GEET<span className="gold-text">QAR</span></a>
          <div className="hidden items-center gap-8 text-[10px] tracking-[.28em] text-white/55 md:flex">
            <a href="#visuals">VISUALS</a><a href="#music">SOUNDS</a><a href="#jukebox">LIVE</a><a href="#arena">ARENA</a>
          </div>
          <div className="flex gap-2">
            <a aria-label="GEETQAR on Instagram" data-cursor className="jelly-icon" href="https://www.instagram.com/geetqar/" target="_blank" rel="noreferrer"><Instagram size={15} /></a>
            <a aria-label="GEETQAR on YouTube" data-cursor className="jelly-icon" href="https://www.youtube.com/@geetqar" target="_blank" rel="noreferrer"><Youtube size={15} /></a>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden no-scrollbar">
          <a href="#visuals" className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[8px] tracking-[.22em] text-white/55">VISUALS</a>
          <a href="#music" className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[8px] tracking-[.22em] text-white/55">SOUNDS</a>
          <a href="#jukebox" className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[8px] tracking-[.22em] text-white/55">LIVE</a>
          <a href="#arena" className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[8px] tracking-[.22em] text-white/55">ARENA</a>
        </div>
      </nav>

      <button aria-label="Open GEETQAR catalogue" data-cursor onClick={() => setCatalogue(true)} className="catalogue-tab jelly-button fixed right-0 top-1/2 z-40 -translate-y-1/2 px-3 py-5 text-[9px] tracking-[.3em] text-gold [writing-mode:vertical-rl]"><LibraryBig size={15} className="mb-2" /> CATALOGUE</button>

      <section aria-labelledby="hero-title" className="relative flex min-h-screen items-center px-5 pb-16 pt-32 md:px-12 md:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(212,175,55,.18),transparent_25%),radial-gradient(circle_at_18%_70%,rgba(115,80,255,.11),transparent_24%)]" />
        <div className="relative mx-auto grid w-full max-w-[1500px] gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, x: -35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="relative z-10">
            <p className="mb-5 text-[9px] font-semibold tracking-[.5em] text-gold">MUSIC / VISUAL / MOTION</p>
            <h1 id="hero-title" className="hero-title text-[20vw] font-extrabold leading-[.74] tracking-[-.1em] md:text-[11vw]">GEET<span className="gold-text">QAR</span></h1>
            <p className="mt-8 max-w-lg text-sm leading-7 text-white/45 md:text-base">Enter the world of GEETQAR — where sound becomes image, motion, texture and memory.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a data-cursor href="#music" className="jelly-button inline-flex items-center gap-3 px-6 py-3.5 text-[10px] font-semibold tracking-[.28em] text-black"><Play size={13} fill="currentColor" /> ENTER THE SOUND</a>
              <a data-cursor href="#visuals" className="jelly-button jelly-button-dark inline-flex items-center gap-3 px-6 py-3.5 text-[10px] font-semibold tracking-[.28em] text-white/75"><Waves size={14} /> ENTER THE VISUALS</a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-[9px] tracking-[.2em] text-white/25">
              <span>{songs.length || '—'} TRACKS IN ARCHIVE</span><span className="h-1 w-1 rounded-full bg-gold/60" /><span>ORIGINAL MUSIC</span>
            </div>
            {latest && <a href="#music" className="mt-6 inline-flex max-w-sm items-center gap-3 rounded-full border border-white/10 bg-white/[.025] px-4 py-2 text-[9px] tracking-[.16em] text-white/40"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> LATEST SIGNAL · <span className="text-white/70">{latest.title}</span></a>}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15, duration: 1 }} className="relative min-h-[520px]">
            <div className="absolute right-[8%] top-[5%] h-[58%] w-[58%] rotate-3 overflow-hidden rounded-[34px] border border-white/15 shadow-2xl shadow-black/70"><video className="h-full w-full object-cover" src={visualVideos[0]} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_35%,rgba(255,220,100,.2),transparent_25%),linear-gradient(145deg,transparent,rgba(0,0,0,.75))]" /></div>
            <div className="absolute bottom-[3%] left-[2%] z-10 h-[55%] w-[57%] -rotate-6 overflow-hidden rounded-[38px] border border-white/15 bg-black shadow-2xl shadow-black/80"><img src={visualImages[0]} alt="Abstract GEETQAR music texture" className="h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(212,175,55,.18),rgba(0,0,0,.75))]" /></div>
            <div className="absolute bottom-[17%] right-[1%] z-20 flex h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-black/55 backdrop-blur-xl"><div className="sound-sculpture scale-75"><span /><span /><span /><span /><span /><span /><span /></div></div>
            <div className="absolute left-[34%] top-[18%] z-30 flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/[.04] backdrop-blur-md"><Disc3 size={34} className="animate-spin-slow text-gold" /><span className="absolute text-[7px] tracking-[.3em] text-white/50">SOUND</span></div>
          </motion.div>
        </div>
        <a href="#visuals" aria-label="Scroll to visual world" className="absolute bottom-7 left-1/2 -translate-x-1/2"><ArrowDown className="animate-bounce text-gold/60" size={18} /></a>
      </section>

      <section id="visuals" aria-labelledby="visuals-title" className="border-t border-white/10 px-5 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[10px] tracking-[.4em] text-gold">01 / MUSIC VISUAL WORLD</p><h2 id="visuals-title" className="mt-3 text-5xl font-semibold tracking-[-.04em] md:text-7xl">Hear it. See it move.</h2></div><div className="flex items-center gap-3 text-[9px] tracking-[.28em] text-white/35"><Volume2 size={14} className="text-gold" /> ABSTRACT ONLY · NO PORTRAITS</div></div>
          <div className="mt-12 grid auto-rows-[220px] gap-4 md:grid-cols-4 md:auto-rows-[260px]">
            <motion.div whileHover={{ scale: 1.015 }} className="relative overflow-hidden rounded-[28px] border border-white/10 md:col-span-2 md:row-span-2"><video className="h-full w-full object-cover" src={visualVideos[1]} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /><div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,.12),transparent_45%,rgba(0,0,0,.8))]" /><div className="absolute bottom-5 left-5 flex items-center gap-3 text-[9px] tracking-[.35em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> AUDIO MOTION</div></motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="relative overflow-hidden rounded-[28px] border border-white/10"><img src={visualImages[1]} alt="GEETQAR music atmosphere" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-black/35" /></motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="relative overflow-hidden rounded-[28px] border border-white/10"><img src={visualImages[2]} alt="Abstract GEETQAR sound texture" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-[radial-gradient(circle,transparent,rgba(0,0,0,.72))]" /></motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="relative overflow-hidden rounded-[28px] border border-white/10"><video className="h-full w-full object-cover" src={visualVideos[2]} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /><div className="absolute inset-0 bg-black/35" /></motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="relative overflow-hidden rounded-[28px] border border-white/10"><img src={visualImages[3]} alt="Abstract studio texture for GEETQAR" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-black/35" /></motion.div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3"><div className="jelly-card p-6"><Sparkles className="mb-5 text-gold" size={18} /><p className="text-2xl font-semibold">Motion follows rhythm.</p><div className="mt-7 mini-wave">{Array.from({ length: 22 }).map((_, index) => <i key={index} style={{ animationDelay: `${index * 55}ms` }} />)}</div></div><div className="jelly-card p-6"><Radio className="mb-5 text-gold" size={18} /><p className="text-2xl font-semibold">Light behaves like sound.</p><p className="mt-3 text-xs leading-6 text-white/40">Visual layers, distortion, grain and frequency-inspired movement.</p></div><div className="jelly-card p-6"><Disc3 className="mb-5 text-gold" size={18} /><p className="text-2xl font-semibold">Every track gets a world.</p><p className="mt-3 text-xs leading-6 text-white/40">Artwork, motion and interaction stay tied to the music.</p></div></div>
        </div>
      </section>

      <GeetqarLab />
      <SignalField />

      <section id="music" aria-labelledby="music-title" className="border-t border-white/10 px-5 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">02 / THE SOUNDS</p><div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 id="music-title" className="text-4xl font-semibold md:text-6xl">The music is the centre.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/40">Official tracks, original artwork and an immersive listening room. Press play and stay in the world.</p></div><span className="text-[9px] tracking-[.3em] text-white/25">{featured.length} / {songs.length} SELECTED</span></div>
          <div className="mt-10 grid gap-5">{featured.map((song, index) => <motion.div key={song.id} whileHover={{ y: -5 }} className="jelly-card cursor-pointer p-5 md:p-7" data-cursor onClick={() => setSelected(song)}><div className="mb-5 flex items-center gap-4"><div className="artwork-shell h-16 w-16 shrink-0 overflow-hidden">{covers[song.id] ? <img src={covers[song.id]} alt={`${song.title} artwork`} className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-xs text-gold">{String(index + 1).padStart(2, '0')}</div>}</div><div className="flex-1"><h3 className="text-lg font-semibold">{song.title}</h3>{song.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{song.description}</p>}</div><ExternalLink size={15} className="text-white/25" /></div><MusicPlayer title={song.title} onCover={(url) => handleCover(song.id, url)} /></motion.div>)}{featured.length === 0 && <div className="jelly-card p-10 text-center"><p className="text-sm text-white/35">The listening room is being curated.</p><button data-cursor onClick={() => setCatalogue(true)} className="jelly-button jelly-button-dark mt-5 px-5 py-3 text-[10px] tracking-[.25em] text-gold">OPEN CATALOGUE</button></div>}</div>
          <div className="mt-10 jelly-card p-4 md:p-6"><AudioVisualizer /></div>
        </div>
      </section>

      <section id="jukebox" aria-labelledby="live-title" className="border-t border-white/10 px-5 py-24 md:px-12"><div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">03 / LIVE ROOM</p><h2 id="live-title" className="mt-3 text-4xl font-semibold md:text-6xl">Let the room react.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/40">Vote, recommend, talk and shape what gets heard next.</p><div className="mt-10 jelly-card p-3 md:p-6"><Jukebox tracks={tracks} /></div></div></section>

      <section id="recommend" aria-labelledby="recommend-title" className="border-t border-white/10 px-5 py-24 md:px-12"><div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">04 / REQUEST LINE</p><h2 id="recommend-title" className="mt-3 text-4xl font-semibold md:text-6xl">Leave a trace.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">Recommend a catalogue track, point to the part that matters, and leave your reason.</p><div className="mt-10 jelly-card p-3 md:p-6"><Recommendations /></div></div></section>

      <section id="arena" aria-labelledby="arena-title" className="border-t border-white/10 px-5 py-24 md:px-12"><div className="mx-auto max-w-7xl"><p className="text-[10px] tracking-[.4em] text-gold">05 / DISCUSSION ARENA</p><div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="jelly-card p-7 md:p-10"><span className="text-[9px] tracking-[.35em] text-gold">PINNED BY GEETQAR</span><h2 id="arena-title" className="mt-6 text-3xl font-semibold md:text-5xl">What does a song become after it becomes yours?</h2><p className="mt-6 text-sm leading-7 text-white/45">Share your POV, review a track, or start a conversation around the music.</p><a data-cursor href="#jukebox" className="jelly-button jelly-button-dark mt-8 inline-flex items-center gap-2 px-5 py-3 text-[10px] tracking-[.25em]"><MessageCircle size={13} /> ENTER THE ARENA</a></div><div className="jelly-card flex min-h-64 flex-col justify-between p-7"><div><span className="text-[9px] tracking-[.35em] text-white/35">PRIVATE ARCHIVE</span><h3 className="mt-4 text-2xl">Original masters.</h3></div><p className="text-xs leading-6 text-white/40">Uncompressed WAV/FLAC files stay behind private signed URLs.</p></div></div></div></section>

      <footer className="border-t border-white/10 px-5 py-16 md:px-12"><div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between"><div><p className="text-3xl font-bold tracking-[-.04em]">GEETQAR</p><p className="mt-3 text-xs text-white/30">Music beyond sound.</p><div className="mt-5 flex flex-wrap gap-4 text-[9px] tracking-[.2em] text-white/25"><a href="#music">LISTEN</a><a href="#visuals">VISUAL WORLD</a><a href="#jukebox">LIVE ROOM</a><a href="#top">BACK TO TOP</a></div></div><div className="flex gap-3 text-white/45"><a aria-label="GEETQAR on Instagram" data-cursor className="jelly-icon" href="https://www.instagram.com/geetqar/" target="_blank" rel="noreferrer"><Instagram size={18} /></a><a aria-label="GEETQAR on YouTube" data-cursor className="jelly-icon" href="https://www.youtube.com/@geetqar" target="_blank" rel="noreferrer"><Youtube size={18} /></a></div></div></footer>

      {selected && <div role="dialog" aria-modal="true" aria-label={`${selected.title} track details`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-5 backdrop-blur-md" onClick={() => setSelected(null)}><div className="jelly-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 md:p-10" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">GEETQAR / TRACK</span><h2 className="mt-3 text-3xl font-bold md:text-5xl">{selected.title}</h2>{selected.description && <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">{selected.description}</p>}</div><button aria-label="Close track details" data-cursor className="jelly-icon" onClick={() => setSelected(null)}><X /></button></div>{covers[selected.id] && <div className="artwork-large mt-6"><img src={covers[selected.id]} alt={`${selected.title} artwork`} className="max-h-[58vh] w-full object-contain" /></div>}<div className="mt-7"><MusicPlayer title={selected.title} onCover={(url) => handleCover(selected.id, url)} /></div><div className="mt-6 flex flex-wrap gap-3">{selected.youtube && <a data-cursor href={selected.youtube} target="_blank" rel="noreferrer" className="jelly-button jelly-button-dark inline-flex items-center gap-2 px-4 py-3 text-[10px] tracking-[.2em] text-red-300"><Youtube size={14} /> YOUTUBE</a>}{selected.instagram && <a data-cursor href={selected.instagram} target="_blank" rel="noreferrer" className="jelly-button jelly-button-dark inline-flex items-center gap-2 px-4 py-3 text-[10px] tracking-[.2em] text-pink-300"><Instagram size={14} /> INSTAGRAM</a>}</div></div></div>}

      {catalogue && <div role="dialog" aria-modal="true" aria-label="GEETQAR catalogue" className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm" onClick={() => setCatalogue(false)}><aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#080808]/95 p-5 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">GEETQAR / ARCHIVE</span><h2 className="mt-2 text-3xl font-bold">Catalogue</h2><p className="mt-2 text-xs text-white/35">{songs.length} tracks · complete archive</p></div><button aria-label="Close catalogue" data-cursor className="jelly-icon" onClick={() => setCatalogue(false)}><X /></button></div><div className="mt-8 space-y-2">{songs.map((song, index) => <button data-cursor key={song.id} onClick={() => { setSelected(song); setCatalogue(false) }} className="jelly-row flex w-full items-center gap-3 p-3 text-left"><div className="artwork-shell h-14 w-14 shrink-0 overflow-hidden">{covers[song.id] ? <img src={covers[song.id]} className="h-full w-full object-contain bg-black/30" alt={`${song.title} artwork`} /> : <div className="flex h-full items-center justify-center text-xs text-gold">{String(index + 1).padStart(2, '0')}</div>}</div><div className="min-w-0 flex-1"><div className="truncate text-sm">{song.title}</div><div className="mt-1 text-[9px] text-white/30">{song.featured ? 'FEATURED · SOUNDS' : 'CATALOGUE'}</div></div><Play size={13} className="text-gold" /></button>)}</div></aside></div>}

      <GlobalAudioDock />
    </main>
  )
}
