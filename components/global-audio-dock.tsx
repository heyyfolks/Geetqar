'use client'

import { Pause, Play, Volume2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type PlayerDetail = { element: HTMLAudioElement; title: string }

export function GlobalAudioDock() {
  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onPlay = (event: Event) => {
      const detail = (event as CustomEvent<PlayerDetail>).detail
      if (!detail?.element) return
      setPlayer(detail)
      setPlaying(true)
    }
    const onPause = (event: Event) => {
      const detail = (event as CustomEvent<PlayerDetail>).detail
      if (detail?.element && player?.element !== detail.element) return
      setPlaying(false)
    }
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ element: HTMLAudioElement; progress: number }>).detail
      if (detail?.element && player?.element === detail.element) setProgress(detail.progress)
    }
    const onEnd = (event: Event) => {
      const detail = (event as CustomEvent<{ element: HTMLAudioElement }>).detail
      if (detail?.element === player?.element) setPlaying(false)
    }

    window.addEventListener('geetqar:play', onPlay)
    window.addEventListener('geetqar:pause', onPause)
    window.addEventListener('geetqar:progress', onProgress)
    window.addEventListener('geetqar:ended', onEnd)
    return () => {
      window.removeEventListener('geetqar:play', onPlay)
      window.removeEventListener('geetqar:pause', onPause)
      window.removeEventListener('geetqar:progress', onProgress)
      window.removeEventListener('geetqar:ended', onEnd)
    }
  }, [player?.element])

  if (!player) return null

  const toggle = async () => {
    try {
      if (player.element.paused) {
        await player.element.play()
        setPlaying(true)
      } else {
        player.element.pause()
        setPlaying(false)
      }
    } catch {
      setPlaying(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2">
      <div className="global-audio-dock relative overflow-hidden rounded-2xl border border-white/10 bg-[#080808]/90 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" style={{ transform: `scaleX(${progress / 100})`, transformOrigin: 'left' }} />
        <div className="flex items-center gap-3">
          <button onClick={toggle} aria-label={playing ? 'Pause current track' : 'Play current track'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-black">
            {playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[8px] tracking-[.3em] text-gold"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold"/> NOW PLAYING</div>
            <div className="mt-1 truncate text-sm font-medium">{player.title}</div>
          </div>
          <Volume2 size={15} className="hidden text-white/30 sm:block" />
          <button onClick={() => { player.element.pause(); setPlayer(null); setPlaying(false) }} aria-label="Close player" className="flex h-8 w-8 items-center justify-center rounded-full text-white/35 hover:text-white"><X size={15} /></button>
        </div>
      </div>
    </div>
  )
}
