'use client'

import { useEffect, useRef } from 'react'

export function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    let t = 0
    const pointer = { x: 0.5, y: 0.5, active: false }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = (event.clientX - rect.left) / rect.width
      pointer.y = (event.clientY - rect.top) / rect.height
      pointer.active = true
    }
    const onLeave = () => { pointer.active = false }

    const draw = () => {
      t += 0.008
      ctx.clearRect(0, 0, width, height)

      const px = (pointer.active ? pointer.x : 0.5) * width
      const py = (pointer.active ? pointer.y : 0.5) * height
      const base = Math.min(width, height)

      for (let ring = 0; ring < 13; ring++) {
        const phase = t * (0.7 + ring * 0.025) + ring * 0.55
        const radius = base * (0.035 + ring * 0.035)
        const wobble = Math.sin(phase) * base * 0.012
        const cx = width * 0.5 + Math.cos(phase * 0.7) * width * 0.07 + (px - width * 0.5) * 0.08
        const cy = height * 0.5 + Math.sin(phase * 0.9) * height * 0.09 + (py - height * 0.5) * 0.08

        ctx.beginPath()
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2
          const wave = Math.sin(a * 5 + phase * 2.1) * wobble + Math.cos(a * 3 - phase) * base * 0.004
          const x = cx + Math.cos(a) * (radius + wave)
          const y = cy + Math.sin(a) * (radius + wave) * 0.72
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(212,175,55,${0.035 + (13 - ring) * 0.004})`
        ctx.lineWidth = ring === 0 ? 1.6 : 0.7
        ctx.stroke()
      }

      const glow = ctx.createRadialGradient(px, py, 0, px, py, base * 0.34)
      glow.addColorStop(0, 'rgba(255,239,166,0.16)')
      glow.addColorStop(0.35, 'rgba(212,175,55,0.06)')
      glow.addColorStop(1, 'rgba(212,175,55,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="border-t border-white/10 px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] tracking-[.4em] text-gold">INTERLUDE / SIGNAL FIELD</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-6xl">Touch the frequency.</h2>
          </div>
          <span className="hidden text-[9px] tracking-[.3em] text-white/25 md:block">MOVE / LISTEN / DRIFT</span>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-[inset_0_0_80px_rgba(212,175,55,.035)]">
          <canvas ref={canvasRef} className="block h-[360px] w-full touch-none md:h-[500px]" aria-label="Interactive golden signal field" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-2 w-2 rounded-full bg-gold shadow-[0_0_28px_rgba(212,175,55,.9)]" />
              <p className="text-[9px] tracking-[.45em] text-white/35">GEETQAR / FREQUENCY 01</p>
              <p className="mt-3 max-w-xs text-xs leading-6 text-white/25">Move through the field. Let the interface breathe with you.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
