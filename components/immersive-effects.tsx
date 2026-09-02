'use client'

import { useEffect, useRef } from 'react'

export function ImmersiveEffects() {
  const cursor = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLDivElement>(null)

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
    }

    const scroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const value = max > 0 ? window.scrollY / max : 0
      if (progress.current) progress.current.style.transform = `scaleX(${value})`
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mousemove', over)
    window.addEventListener('scroll', scroll, { passive: true })
    scroll()
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousemove', over)
      window.removeEventListener('scroll', scroll)
      document.body.classList.remove('cursor-focus')
    }
  }, [])

  return (
    <>
      <div ref={progress} className="scroll-progress" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={cursor} className="cursor-core" aria-hidden="true" />
      <div className="cursor-aura" aria-hidden="true" />
    </>
  )
}
