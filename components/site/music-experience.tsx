'use client'

import { kindLabel } from '@/lib/site'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Disc3, Film, Maximize2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X, Youtube } from 'lucide-react'
import { CoverArt } from '@/components/site/cover-art'
import { ShareButton } from '@/components/site/share-button'
import type { Track } from '@/lib/site'
import { useSite } from '@/components/site/site-context'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void } }

let ytPromise: Promise<any> | null = null
function loadYT(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject()
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT) }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'; s.async = true
      document.head.appendChild(s)
    })
  }
  return ytPromise
}

const fmtTime = (v: number) => (!Number.isFinite(v) || v < 0 ? '0:00' : `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`)
const fmtViews = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n))
const fmtDate = (d: string) => { const t = new Date(d); return Number.isNaN(+t) ? '' : t.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }
const isNew = (d: string) => { const t = +new Date(d); return Number.isFinite(t) && Date.now() - t < 14 * 864e5 }
const ORIGINAL: Track['kind'][] = ['Single', 'Official Audio', 'Music Video', 'Lyric Video']

type Filter = 'all' | 'originals' | 'covers'
type MoodQueue = { label: string; ids: string[] }

export function MusicExperience({ tracks, loading }: { tracks: Track[]; loading: boolean }) {
  const { links } = useSite()
  const [filter, setFilter] = useState<Filter>('all')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(85)
  const [muted, setMuted] = useState(false)
  const [mode, setMode] = useState<'art' | 'video'>('art')
  const [full, setFull] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [loop, setLoop] = useState(false)
  const [pal, setPal] = useState<[string, string]>(['#ff6a3d', '#8a2146'])
  const [note, setNote] = useState<{ text: string; id: string } | null>(null)
  const [inView, setInView] = useState(true)
  const [mood, setMood] = useState<MoodQueue | null>(null)

  const playerRef = useRef<any>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)
  const initRef = useRef(false)
  const pendingRef = useRef<{ id: string; play: boolean } | null>(null)

  const visible = useMemo(() => {
    if (mood) return mood.ids.map((id) => tracks.find((t) => t.id === id)).filter((t): t is Track => Boolean(t))
    return tracks.filter((t) => (filter === 'all' ? true : filter === 'originals' ? ORIGINAL.includes(t.kind) : !ORIGINAL.includes(t.kind)))
  }, [tracks, filter, mood])
  const current = tracks.find((t) => t.id === currentId) || null

  // latest values for callbacks that outlive a render (YouTube events, media keys)
  const live = useRef({ visible, currentId, shuffle, loop, volume, muted })
  live.current = { visible, currentId, shuffle, loop, volume, muted }

  const announce = useCallback((title: string) => {
    window.dispatchEvent(new CustomEvent('geetqar:play', { detail: { element: null, title } }))
  }, [])

  const stepRef = useRef<(dir: 1 | -1) => void>(() => {})
  const selectRef = useRef<(id: string, play?: boolean) => void>(() => {})

  const initPlayer = useCallback(async () => {
    if (initRef.current) return
    initRef.current = true
    try {
      const YT = await loadYT()
      if (!targetRef.current) { initRef.current = false; return }
      playerRef.current = new YT.Player(targetRef.current, {
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, iv_load_policy: 3, origin: window.location.origin },
        events: {
          onReady: (e: any) => {
            readyRef.current = true
            e.target.setVolume(live.current.volume)
            if (live.current.muted) e.target.mute()
            const pending = pendingRef.current; pendingRef.current = null
            if (pending) pending.play ? e.target.loadVideoById(pending.id) : e.target.cueVideoById(pending.id)
          },
          onStateChange: (e: any) => {
            const s = e.data
            setPlaying(s === 1 || s === 3)
            if (s === 1 || s === 5) { const d = e.target.getDuration?.(); if (d > 0) setDuration(d) }
            if (s === 0) {
              if (live.current.loop) { e.target.seekTo(0, true); e.target.playVideo() } else stepRef.current(1)
            }
          },
          onError: (e: any) => {
            const id = live.current.currentId || ''
            setPlaying(false)
            setNote({ id, text: e.data === 101 || e.data === 150 ? 'YouTube does not allow this video to play outside youtube.com.' : 'This video is unavailable right now.' })
            window.setTimeout(() => stepRef.current(1), 2200)
          },
        },
      })
    } catch { initRef.current = false }
  }, [])

  const select = useCallback((id: string, play = true) => {
    window.dispatchEvent(new CustomEvent('gx:track', { detail: { id } }))
    setCurrentId(id); setNote(null); setTime(0); setDuration(0)
    const t = tracks.find((x) => x.id === id)
    const p = playerRef.current
    if (p && readyRef.current) {
      if (play) { announce(t?.name || ''); p.loadVideoById(id) } else p.cueVideoById(id)
    } else {
      pendingRef.current = { id, play }
      if (play) announce(t?.name || '')
      void initPlayer()
    }
  }, [tracks, announce, initPlayer])

  selectRef.current = select

  // The Moods section sends a queue here: show only that mood's songs, start playing, and scroll to the player.
  useEffect(() => {
    const onMood = (event: Event) => {
      const detail = (event as CustomEvent<{ label: string; ids: string[]; play: string }>).detail
      if (!detail?.ids?.length) return
      setMood({ label: detail.label, ids: detail.ids })
      selectRef.current(detail.play, true)
      document.getElementById('music')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('gx:mood', onMood)
    return () => window.removeEventListener('gx:mood', onMood)
  }, [])

  const step = useCallback((dir: 1 | -1) => {
    const { visible: list, currentId: cid, shuffle: sh } = live.current
    if (!list.length) return
    const i = list.findIndex((t) => t.id === cid)
    let next: Track
    if (sh && list.length > 1) { do { next = list[Math.floor(Math.random() * list.length)] } while (next.id === cid) }
    else next = list[(i + dir + list.length) % list.length] || list[0]
    select(next.id, true)
  }, [select])
  stepRef.current = step

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!live.current.currentId) { const first = live.current.visible[0]; if (first) select(first.id, true); return }
    if (!p || !readyRef.current) { pendingRef.current = { id: live.current.currentId, play: true }; void initPlayer(); return }
    const st = p.getPlayerState()
    if (st === 1 || st === 3) p.pauseVideo()
    else { announce(current?.name || ''); p.playVideo() }
  }, [select, initPlayer, announce, current])

  const prev = useCallback(() => {
    const p = playerRef.current
    if (p && readyRef.current && p.getCurrentTime() > 3) { p.seekTo(0, true); setTime(0) } else step(-1)
  }, [step])

  const seek = (pct: number) => {
    const p = playerRef.current
    if (!p || !readyRef.current || !duration) return
    const to = (pct / 100) * duration; p.seekTo(to, true); setTime(to)
  }

  // Load the YouTube player on the visitor's first interaction (not on page load), so the page stays fast
  // but the first tap on Play still works immediately (needed on iOS).
  useEffect(() => {
    if (!tracks.length) return
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
    const go = () => { events.forEach((e) => window.removeEventListener(e, go)); void initPlayer() }
    events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }))
    return () => events.forEach((e) => window.removeEventListener(e, go))
  }, [tracks.length, initPlayer])

  // progress polling
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      const p = playerRef.current
      if (!p || !readyRef.current) return
      const ct = p.getCurrentTime?.(), d = p.getDuration?.()
      if (Number.isFinite(ct)) setTime(ct)
      if (Number.isFinite(d) && d > 0) setDuration(d)
    }, 250)
    return () => window.clearInterval(t)
  }, [playing])

  // volume
  useEffect(() => {
    const p = playerRef.current
    if (!p || !readyRef.current) return
    p.setVolume(volume); muted ? p.mute() : p.unMute()
  }, [volume, muted])

  // other audio on the site (old master players) pauses this one
  useEffect(() => {
    const onOther = (e: Event) => {
      const d = (e as CustomEvent<{ element?: HTMLAudioElement | null }>).detail
      if (d?.element) playerRef.current?.pauseVideo?.()
    }
    window.addEventListener('geetqar:play', onOther)
    return () => window.removeEventListener('geetqar:play', onOther)
  }, [])

  // is the stage on screen? (drives the floating mini player)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [tracks.length > 0])

  // fullscreen: lock page scroll
  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [full])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape' && full) { setFull(false); return }
      const active = full || (inView && document.activeElement === document.body)
      if (!active || !live.current.currentId) return
      if (e.code === 'Space') { e.preventDefault(); toggle() }
      else if (e.key === 'ArrowRight') { const p = playerRef.current; if (p && readyRef.current) p.seekTo(p.getCurrentTime() + 5, true) }
      else if (e.key === 'ArrowLeft') { const p = playerRef.current; if (p && readyRef.current) p.seekTo(Math.max(0, p.getCurrentTime() - 5), true) }
      else if (e.key.toLowerCase() === 'n') step(1)
      else if (e.key.toLowerCase() === 'p') prev()
      else if (e.key.toLowerCase() === 'f') setFull((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full, inView, toggle, step, prev])

  // lock-screen / headset controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name, artist: 'GEETQAR', album: kindLabel(current.kind),
      artwork: [{ src: `https://i.ytimg.com/vi/${current.id}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }],
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    navigator.mediaSession.setActionHandler('play', toggle)
    navigator.mediaSession.setActionHandler('pause', toggle)
    navigator.mediaSession.setActionHandler('nexttrack', () => step(1))
    navigator.mediaSession.setActionHandler('previoustrack', prev)
  }, [current, playing, toggle, step, prev])

  // let the ambience pill step above the mini player
  const dockShown = Boolean(current) && !inView && !full
  useEffect(() => {
    document.body.classList.toggle('has-dock', dockShown)
    return () => document.body.classList.remove('has-dock')
  }, [dockShown])

  // 3D tilt on the cover
  const tilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`)
    e.currentTarget.style.setProperty('--ry', `${(x * 11).toFixed(2)}deg`)
  }
  const untilt = (e: React.PointerEvent<HTMLDivElement>) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg') }

  const pct = duration ? (time / duration) * 100 : 0
  const year = current ? current.published.slice(0, 4) : ''
  const showCurrent = current || tracks[0] || null

  return (
    <>
      <section id="music" className={`gx-section gx-music ${full ? 'is-full' : ''}`} aria-labelledby="music-title" style={{ '--c1': pal[0], '--c2': pal[1] } as React.CSSProperties}>
        <div className="gx-aura" aria-hidden="true" />
        <button className="jelly-icon gx-fs-close" onClick={() => setFull(false)} aria-label="Close fullscreen player"><X size={18} /></button>
        <div className="gx-wrap" style={{ position: 'relative' }}>
          <div className="gx-head">
            <p className="gx-kicker">01 / Music</p>
            <h2 id="music-title" className="gx-h2">Listen <em>here.</em></h2>
            <p className="gx-lede">Straight from the GEETQAR YouTube channel. New uploads show up here automatically, each with its own generated artwork.</p>
          </div>

          {loading && !tracks.length ? (
            <div className="gx-deck"><div className="gx-skel" style={{ aspectRatio: '1', maxWidth: 520 }} /><div style={{ display: 'grid', gap: 12 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="gx-skel" style={{ aspectRatio: '12/1.5' }} />)}</div></div>
          ) : !tracks.length ? (
            <div className="gx-empty">
              <p>The catalogue could not be reached just now. The full library is always on YouTube.</p>
              <a className="gx-btn gx-btn-solid" href={links.youtube} target="_blank" rel="noreferrer"><Youtube size={15} /> OPEN YOUTUBE</a>
            </div>
          ) : (
            <div className="gx-deck">
              <div className="gx-now" ref={stageRef}>
                <div className={`gx-cover-wrap ${playing ? 'is-playing' : ''}`} onPointerMove={tilt} onPointerLeave={untilt}>
                  <div className={`gx-cover-frame ${mode === 'video' ? 'mode-video' : ''}`}>
                    <div className="gx-cover-dim">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {showCurrent && (
                          <motion.div key={showCurrent.id} className="gx-cover-layer" initial={{ opacity: 0, scale: 1.08, filter: 'blur(14px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}>
                            <CoverArt id={showCurrent.id} name={showCurrent.name} variant={showCurrent.artStyle} kind={showCurrent.kind} year={showCurrent.published.slice(0, 4)} size={720} onPalette={showCurrent.id === (current?.id || tracks[0]?.id) ? setPal : undefined} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="gx-video-layer"><div ref={targetRef} /></div>
                    {!current && (
                      <button className="gx-cover-play" onClick={() => select(tracks[0].id, true)} aria-label="Play the latest track"><Play size={34} fill="currentColor" /></button>
                    )}
                  </div>
                </div>

                <div className="gx-meta">
                  <div className="gx-sub">{showCurrent ? `${kindLabel(showCurrent.kind)} · ${fmtDate(showCurrent.published)}${showCurrent.views ? ` · ${fmtViews(showCurrent.views)} views` : ''}` : ''}{showCurrent && isNew(showCurrent.published) && <em>NEW</em>}</div>
                  <h3 className="gx-title">{showCurrent?.name}</h3>
                  <div className={`gx-bars ${playing ? 'on' : ''}`} aria-hidden="true">{Array.from({ length: 36 }).map((_, i) => <i key={i} style={{ animationDelay: `${(i * 67) % 800}ms`, animationDuration: `${0.7 + ((i * 29) % 60) / 100}s` }} />)}</div>
                  {showCurrent && <div className="gx-share"><ShareButton path={`/songs/${showCurrent.slug}`} title={`${showCurrent.name} by GEETQAR`} className="gx-chip" /> <a className="gx-chip" href={`/songs/${showCurrent.slug}`}>SONG PAGE</a></div>}
                  {note && <p className="gx-note">{note.text} <a href={`https://youtu.be/${note.id}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></p>}
                </div>

                <div className="gx-seekrow">
                  <span>{fmtTime(time)}</span>
                  <input type="range" className="music-seek" min={0} max={100} step={0.1} value={pct} onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" style={{ '--seek-progress': `${pct}%` } as React.CSSProperties} disabled={!current} />
                  <span>{fmtTime(duration)}</span>
                </div>

                <div className="gx-ctrls">
                  <button className={`gx-ctrl ${shuffle ? 'on' : ''}`} onClick={() => setShuffle((v) => !v)} aria-pressed={shuffle} aria-label="Shuffle"><Shuffle size={17} /></button>
                  <button className="gx-ctrl" onClick={prev} aria-label="Previous track"><SkipBack size={21} fill="currentColor" /></button>
                  <button className="gx-ctrl gx-ctrl-main" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}</button>
                  <button className="gx-ctrl" onClick={() => step(1)} aria-label="Next track"><SkipForward size={21} fill="currentColor" /></button>
                  <button className={`gx-ctrl ${loop ? 'on' : ''}`} onClick={() => setLoop((v) => !v)} aria-pressed={loop} aria-label="Repeat this track"><Repeat size={17} /></button>
                </div>

                <div className="gx-tools">
                  <div className="gx-vol">
                    <button className="gx-ctrl" onClick={() => setMuted((v) => !v)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
                    <input type="range" className="music-volume" min={0} max={100} value={muted ? 0 : volume} onChange={(e) => { setMuted(false); setVolume(Number(e.target.value)) }} aria-label="Volume" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`gx-pill ${mode === 'video' ? 'on' : ''}`} onClick={() => setMode((m) => (m === 'art' ? 'video' : 'art'))} aria-pressed={mode === 'video'}>{mode === 'video' ? <Disc3 size={14} /> : <Film size={14} />} {mode === 'video' ? 'ARTWORK' : 'VIDEO'}</button>
                    <button className="gx-pill" onClick={() => setFull(true)}><Maximize2 size={14} /> FULLSCREEN</button>
                  </div>
                </div>

                {current?.description && <p className="gx-desc">{current.description}</p>}
              </div>

              <aside className="gx-queue" aria-label="Track list">
                <div className="gx-chips" role="tablist">
                  {mood && <button className="gx-chip on" onClick={() => setMood(null)} aria-label={`Clear ${mood.label} mood`}>Mood: {mood.label} ✕</button>}
                  {([['all', 'All'], ['originals', 'Originals'], ['covers', 'Covers & mashups']] as const).map(([key, text]) => (
                    <button key={key} role="tab" aria-selected={!mood && filter === key} className={`gx-chip ${!mood && filter === key ? 'on' : ''}`} onClick={() => { setMood(null); setFilter(key) }}>{text}</button>
                  ))}
                  <span className="gx-count">{visible.length} TRACKS</span>
                </div>
                <ol className="gx-qlist">
                  {visible.map((t) => {
                    const active = t.id === currentId
                    return (
                      <li key={t.id}>
                        <button className={`gx-q ${active ? 'is-active' : ''}`} onClick={() => (active ? toggle() : select(t.id, true))} aria-label={`${active && playing ? 'Pause' : 'Play'} ${t.name}`}>
                          <span className="gx-q-cover"><CoverArt id={t.id} name={t.name} kind={t.kind} year={t.published.slice(0, 4)} size={200} label={false} /></span>
                          <span className="gx-q-meta">
                            <strong>{t.name}</strong>
                            <small>{kindLabel(t.kind)} · {fmtDate(t.published)}{t.views ? ` · ${fmtViews(t.views)}` : ''}{isNew(t.published) && <em>NEW</em>}</small>
                          </span>
                          <span className="gx-q-state" aria-hidden="true">
                            {active && playing ? <span className="gx-mini-eq"><i /><i /><i /></span> : <Play size={15} fill="currentColor" />}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
                <p className="gx-sync">Synced live from <a href={links.youtube} target="_blank" rel="noreferrer">youtube.com/@geetqar</a> · updates every few minutes</p>
              </aside>
            </div>
          )}
        </div>
      </section>

      {current && !inView && !full && (
        <div className="gx-dock" role="region" aria-label="Mini player">
          <div className="gx-dock-progress" style={{ transform: `scaleX(${pct / 100})` }} />
          <a href="#music" className="gx-dock-cover"><img src={`https://i.ytimg.com/vi/${current.id}/default.jpg`} alt="" /></a>
          <a href="#music" className="gx-dock-meta"><strong>{current.name}</strong><small>GEETQAR · {kindLabel(current.kind)}</small></a>
          <button className="gx-ctrl" onClick={() => step(-1)} aria-label="Previous"><SkipBack size={17} fill="currentColor" /></button>
          <button className="gx-ctrl gx-ctrl-main gx-ctrl-sm" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
          <button className="gx-ctrl" onClick={() => step(1)} aria-label="Next"><SkipForward size={17} fill="currentColor" /></button>
        </div>
      )}
    </>
  )
}
