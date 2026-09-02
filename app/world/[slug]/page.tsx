'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, Play, Pause, Share2, Volume2 } from 'lucide-react'
import { useParams } from 'next/navigation'

type Song = { id: string; title: string; slug: string; description?: string; youtube?: string; instagram?: string; coverUrl?: string; featured?: boolean }

type TrackData = { url: string; coverUrl: string }

export default function SongWorld() {
  const { slug } = useParams<{ slug: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [energy, setEnergy] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/songs', { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/music/${slug}`, { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([list, track]) => {
      const found = (list.songs || []).find((item: Song) => item.slug === slug)
      setSong(found || null)
      const data = track as TrackData
      if (data.url) setAudioUrl(data.url)
      setCoverUrl(data.coverUrl || found?.coverUrl || '')
      try { localStorage.setItem('geetqar:last-world', slug) } catch {}
    }).catch(() => {})
  }, [slug])

  const setupAnalyser = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      contextRef.current ||= new AudioContext()
      const context = contextRef.current
      if (context.state === 'suspended') await context.resume()
      if (!sourceRef.current) {
        sourceRef.current = context.createMediaElementSource(audio)
        analyserRef.current = context.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.84
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(context.destination)
      }
    } catch {}
  }

  const startVisuals = () => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      let total = 0
      for (let i = 0; i < data.length; i++) total += data[i]
      setEnergy(Math.min(1, total / data.length / 170))
      rafRef.current = requestAnimationFrame(tick)
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    tick()
  }

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    analyserRef.current?.disconnect()
    sourceRef.current?.disconnect()
    void contextRef.current?.close()
  }, [])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    await setupAnalyser()
    if (audio.paused) {
      await audio.play()
      setPlaying(true)
      startVisuals()
      window.dispatchEvent(new CustomEvent('geetqar:play', { detail: { element: audio, title: song?.title || '' } }))
    } else {
      audio.pause()
      setPlaying(false)
      setEnergy(0)
      window.dispatchEvent(new CustomEvent('geetqar:pause'))
    }
  }

  const palette = useMemo(() => ({
    glow: Math.round(12 + energy * 32),
    scale: 1 + energy * 0.035,
    rotation: energy * 3,
  }), [energy])

  if (!song) return <main className="min-h-screen bg-black px-6 py-32 text-white"><div className="mx-auto max-w-3xl"><p className="text-[10px] tracking-[.4em] text-gold">GEETQAR / SIGNAL LOST</p><h1 className="mt-5 text-5xl font-semibold">This world hasn&apos;t arrived yet.</h1><a href="/" className="mt-8 inline-flex items-center gap-2 text-xs tracking-[.2em] text-gold"><ArrowLeft size={14} /> BACK TO GEETQAR</a></div></main>

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white" style={{ '--signal-energy': energy } as React.CSSProperties}>
      <div className="pointer-events-none fixed inset-0" style={{ background: `radial-gradient(circle at 50% 45%, rgba(212,175,55,${palette.glow / 1000}), transparent 32%), radial-gradient(circle at 75% 25%, rgba(100,70,180,${energy * .12}), transparent 28%)` }} />
      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-6 md:px-12 md:py-10">
        <header className="flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-[9px] tracking-[.3em] text-white/45 hover:text-white"><ArrowLeft size={14} /> GEETQAR</a>
          <span className="text-[8px] tracking-[.35em] text-gold">PRIVATE SIGNAL / {song.slug.toUpperCase()}</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[.85fr_1.15fr]">
          <div className="order-2 lg:order-1">
            <p className="text-[9px] tracking-[.4em] text-gold">SONG WORLD / 01</p>
            <h1 className="mt-5 text-[15vw] font-extrabold leading-[.8] tracking-[-.08em] md:text-[9vw]">{song.title}</h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-white/40">{song.description || 'A GEETQAR signal. Press play and let the environment move with it.'}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={toggle} disabled={!audioUrl} className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-[10px] font-semibold tracking-[.25em] text-black disabled:opacity-30">
                {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />} {playing ? 'PAUSE WORLD' : 'ENTER THE TRACK'}
              </button>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3.5 text-[10px] tracking-[.2em] text-white/60 hover:border-gold/40 hover:text-white"><Share2 size={13} /> SHARE</button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/10 py-4">
              <div><p className="text-[8px] tracking-[.25em] text-white/25">SIGNAL</p><p className="mt-2 text-xs text-white/65">{Math.round(energy * 100)}%</p></div>
              <div><p className="text-[8px] tracking-[.25em] text-white/25">TIME</p><p className="mt-2 text-xs text-white/65">{Math.floor(progress / 60).toString().padStart(2, '0')}:{Math.floor(progress % 60).toString().padStart(2, '0')}</p></div>
              <div><p className="text-[8px] tracking-[.25em] text-white/25">DURATION</p><p className="mt-2 text-xs text-white/65">{duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '—'}</p></div>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-[9px] tracking-[.2em] text-white/30">
              {song.youtube && <a href={song.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-gold">YOUTUBE <ExternalLink size={11} /></a>}
              {song.instagram && <a href={song.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-gold">INSTAGRAM <ExternalLink size={11} /></a>}
            </div>
          </div>

          <div className="order-1 flex items-center justify-center lg:order-2">
            <div className="relative aspect-square w-[min(78vw,620px)]" style={{ transform: `scale(${palette.scale}) rotate(${palette.rotation}deg)` }}>
              <div className="absolute inset-[9%] rounded-full border border-gold/30" style={{ boxShadow: `0 0 ${70 + energy * 120}px rgba(212,175,55,${.1 + energy * .28})` }} />
              <div className="absolute inset-[17%] rounded-[28%] border border-white/10 bg-white/[.025] p-4 backdrop-blur-sm">
                <div className="h-full w-full overflow-hidden rounded-[22%] bg-[#0a0a0a]">
                  {coverUrl ? <img src={coverUrl} alt={`${song.title} artwork`} className="h-full w-full object-cover opacity-80" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,.18),transparent_30%),linear-gradient(135deg,#111,#030303)]" />}
                </div>
              </div>
              <div className="absolute inset-[4%] rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-black/70 backdrop-blur-xl">
                <Volume2 size={20} className={playing ? 'animate-pulse text-gold' : 'text-white/35'} />
              </div>
            </div>
          </div>
        </section>

        <div className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gold transition-[width]" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} /></div>
        <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)} onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)} onEnded={() => { setPlaying(false); setEnergy(0) }} />
      </div>
    </main>
  )
}
