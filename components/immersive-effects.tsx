'use client'

import { useEffect, useRef, useState } from 'react'

const chapters = [
  { id: 'top', label: 'ENTRY' },
  { id: 'music', label: 'THE SOUNDS' },
  { id: 'jukebox', label: 'LIVE ROOM' },
  { id: 'recommend', label: 'REQUEST LINE' },
  { id: 'arena', label: 'ARENA' },
]

export function ImmersiveEffects() {
  const cursor = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLDivElement>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [chapter, setChapter] = useState('ENTRY')
  const [cursorMode, setCursorMode] = useState('MOVE')

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let frame = 0

    const move = (event: MouseEvent) => {
      x = event.clientX
      y = event.clientY
      document.documentElement.style.setProperty('--cursor-x', `${x}px`)
      document.documentElement.style.setProperty('--cursor-y', `${y}px`)
    }

    const tick = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      if (cursor.current) cursor.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      frame = requestAnimationFrame(tick)
    }

    const over = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const interactive = target?.closest('a,button,[data-cursor]')
      document.body.classList.toggle('cursor-focus', Boolean(interactive))
      if (!interactive) return setCursorMode('MOVE')
      if (target?.closest('button')) setCursorMode('SELECT')
      else if (target?.closest('[data-cursor]')?.closest('.jelly-card')) setCursorMode('EXPLORE')
      else setCursorMode('OPEN')
    }

    const scroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const value = max > 0 ? window.scrollY / max : 0
      if (progress.current) progress.current.style.transform = `scaleX(${value})`
      let active = chapters[0]
      for (const item of chapters) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.42) active = item
      }
      setChapter(active.label)
    }

    const key = (event: KeyboardEvent) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault()
        setCommandOpen(value => !value)
      }
      if (event.key === 'Escape') setCommandOpen(false)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mousemove', over)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('keydown', key)
    scroll()
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousemove', over)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('keydown', key)
      document.body.classList.remove('cursor-focus')
    }
  }, [])

  const jump = (id: string) => {
    setCommandOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div ref={progress} className="scroll-progress" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={cursor} className="cursor-core" aria-hidden="true" />
      <div className="cursor-aura" aria-hidden="true" />

      <div
        aria-hidden="true"
        style={{
          position: 'fixed', left: 18, bottom: 18, zIndex: 180, pointerEvents: 'none',
          fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '.22em',
          color: 'rgba(255,255,255,.38)', display: 'flex', gap: 10, alignItems: 'center',
        }}
        className="hidden md:flex"
      >
        <span style={{ color: 'rgba(212,175,55,.72)' }}>GEETQAR</span>
        <span>/</span>
        <span>{chapter}</span>
        <span style={{ opacity: .35 }}>·</span>
        <span style={{ opacity: .55 }}>{cursorMode}</span>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Open GEETQAR navigation"
        style={{
          position: 'fixed', right: 18, bottom: 18, zIndex: 180,
          width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,.1)',
          background: 'rgba(8,8,8,.62)', color: 'rgba(255,255,255,.45)', backdropFilter: 'blur(14px)',
          fontFamily: 'DM Mono, monospace', fontSize: 12, cursor: 'pointer',
        }}
        className="hidden md:block"
      >/</button>

      {commandOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="GEETQAR navigation"
          onClick={() => setCommandOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(18px)',
          }}
        >
          <div
            onClick={event => event.stopPropagation()}
            style={{
              width: 'min(560px, 100%)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 28,
              background: 'linear-gradient(145deg,rgba(24,24,24,.92),rgba(5,5,5,.96))',
              boxShadow: '0 30px 120px rgba(0,0,0,.65), inset 0 1px rgba(255,255,255,.08)',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ color: '#D4AF37', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '.32em' }}>GEETQAR / NAVIGATE</div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>Choose a room.</div>
              </div>
              <button type="button" onClick={() => setCommandOpen(false)} aria-label="Close navigation" style={{ border: 0, background: 'transparent', color: 'rgba(255,255,255,.45)', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {chapters.slice(1).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jump(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    padding: '16px 17px', borderRadius: 16, border: '1px solid rgba(255,255,255,.07)',
                    background: 'rgba(255,255,255,.025)', color: 'rgba(255,255,255,.76)', textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  <span><small style={{ color: '#D4AF37', marginRight: 14, fontFamily: 'DM Mono, monospace' }}>0{index + 1}</small>{item.label}</span>
                  <span style={{ color: 'rgba(255,255,255,.2)' }}>↗</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, color: 'rgba(255,255,255,.25)', fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '.2em' }}>PRESS ESC TO CLOSE · / TO TOGGLE</div>
          </div>
        </div>
      )}
    </>
  )
}
