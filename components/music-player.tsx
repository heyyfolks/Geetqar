'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

function trackSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function MusicPlayer({
  title = 'VELVET PLAY',
  src,
  onCover,
}: {
  title?: string
  src?: string
  onCover?: (url: string) => void
}) {
  const ref = useRef<HTMLAudioElement>(null)
  const coverRef = useRef(onCover)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [audioSrc, setAudioSrc] = useState(src || '')
  const [loading, setLoading] = useState(!src)
  const [error, setError] = useState('')

  useEffect(() => { coverRef.current = onCover }, [onCover])

  useEffect(() => {
    let active = true
    if (src) {
      setAudioSrc(src)
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')
    fetch(`/api/music/${encodeURIComponent(trackSlug(title))}?t=${Date.now()}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Master unavailable')
        if (active && data.coverUrl && coverRef.current) coverRef.current(data.coverUrl)
        return data.url as string
      })
      .then((url) => {
        if (!url) throw new Error('Playback URL missing')
        if (active) setAudioSrc(url)
      })
      .catch((cause) => {
        if (active) {
          setAudioSrc('')
          setError(cause instanceof Error ? cause.message : 'Master unavailable')
        }
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [title, src])

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    audio.volume = volume
  }, [volume, audioSrc])

  useEffect(() => {
    const audio = ref.current
    if (!audio) return

    const onTime = () => {
      setCurrentTime(audio.currentTime || 0)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onEnded = () => { setPlaying(false); setProgress(100) }
    const onFailed = () => {
      setPlaying(false)
      const mediaError = audio.error
      setError(mediaError?.message || (mediaError?.code === 4 ? 'This audio format is not supported.' : 'Audio could not be loaded.'))
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onFailed)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onFailed)
    }
  }, [audioSrc])

  useEffect(() => {
    const stopOthers = (event: Event) => {
      const source = event as CustomEvent<{ element?: HTMLAudioElement }>
      if (source.detail?.element !== ref.current && ref.current && !ref.current.paused) {
        ref.current.pause()
        setPlaying(false)
      }
    }
    window.addEventListener('geetqar:play', stopOthers)
    return () => window.removeEventListener('geetqar:play', stopOthers)
  }, [])

  const toggle = async () => {
    const audio = ref.current
    if (!audio || !audioSrc) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      setError('')
      window.dispatchEvent(new CustomEvent('geetqar:play', { detail: { element: audio } }))
      await audio.play()
      setPlaying(true)
    } catch (cause) {
      setPlaying(false)
      setError(cause instanceof Error ? cause.message : 'Audio could not be played in this browser.')
    }
  }

  const seek = (value: number) => {
    const audio = ref.current
    if (!audio || !Number.isFinite(audio.duration)) return
    const next = Math.min(100, Math.max(0, value))
    audio.currentTime = (next / 100) * audio.duration
    setProgress(next)
  }

  const connected = Boolean(audioSrc)
  const muted = volume === 0

  return (
    <div className="glass p-4 md:p-5" onClick={(event) => event.stopPropagation()}>
      <audio ref={ref} src={audioSrc || undefined} preload="metadata" crossOrigin="anonymous" />

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggle}
          disabled={!connected || loading}
          aria-label={connected ? (playing ? `Pause ${title}` : `Play ${title}`) : 'Audio not connected'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate text-[9px] tracking-[.3em] text-gold">
              {loading ? 'CONNECTING MASTER…' : playing ? 'NOW PLAYING' : connected ? 'READY TO PLAY' : 'MASTER NOT CONNECTED'}
            </div>
            <div className="shrink-0 text-[9px] tabular-nums text-white/30">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="mt-1 truncate font-semibold">{title}</div>
          <input
            aria-label={`Seek ${title}`}
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            disabled={!connected || loading}
            onChange={(event) => seek(Number(event.target.value))}
            style={{ '--seek-progress': `${progress}%` } as React.CSSProperties}
            className="music-seek mt-3 w-full"
          />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setVolume(muted ? 0.85 : 0)}
            disabled={!connected}
            aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
            className="text-white/35 transition hover:text-gold disabled:opacity-30"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            aria-label={`Volume for ${title}`}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="music-volume w-20"
          />
        </div>
      </div>

      {!connected && !loading && (
        <p className="mt-3 text-[10px] text-red-300/75">{error || 'Original master is not uploaded yet.'}</p>
      )}
    </div>
  )
}
