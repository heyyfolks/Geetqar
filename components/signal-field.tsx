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
    let energy = 0
    let targetEnergy = 0
    let analyser: AnalyserNode | null = null
    let audioContext: AudioContext | null = null
    const frequency = new Uint8Array(128)
    const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()
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

    const connectAudio = async (audio: HTMLAudioElement) => {
      try {
        audioContext ||= new AudioContext()
        if (audioContext.state === 'suspended') await audioContext.resume()
        const existing = sourceMap.get(audio)
        const source = existing || audioContext.createMediaElementSource(audio)
        sourceMap.set(audio, source)
        analyser?.disconnect()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.82
        source.connect(analyser)
        analyser.connect(audioContext.destination)
      } catch {
        analyser = null
      }
    }

    const onPlay = (event: Event) => {
      const detail = (event as CustomEvent<{ element?: HTMLAudioElement }>).detail
      if (detail?.element) void connectAudio(detail.element)
    }
    const onPause = () => { targetEnergy = 0 }

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

      if (analyser) {
        analyser.getByteFrequencyData(frequency)
        let sum = 0
        for (let i = 0; i < frequency.length; i++) sum += frequency[i]
        targetEnergy = Math.min(1, sum / frequency.length / 150)
      }
      energy += (targetEnergy - energy) * 0.12
      const audioBoost = energy * Math.min(width, height) * 0.07

      const px = (pointer.active ? pointer.x : 0.5) * width
      const py = (pointer.active ? pointer.y : 0.5) * height
      const base = Math.min(width, height)

      for (let ring = 0; ring < 13; ring++) {
        const phase = t * (0.7 + ring * 0.025) + ring * 0.55
        const radius = base * (0.035 + ring * 0.035) + audioBoost * (1 - ring / 18)
        const wobble = Math.sin(phase) * base * 0.012 + audioBoost * 0.12
        const cx = width * 0.5 + Math.cos(phase * 0.7) * width * 0.07 + (px - width * 0.5) * 0.08
        const cy = height * 0.5 + Math.sin(phase * 0.9) * height * 0.09 + (py - height * 0.5) * 0.08

        ctx.beginPath()
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2
          const band = frequency[Math.min(127, Math.floor((i / 160) * 128))] / 255
          const wave = Math.sin(a * 5 + phase * 2.1) * wobble + Math.cos(a * 3 - phase) * base * 0.004 + band * audioBoost * 0.22
          const x = cx + Math.cos(a) * (radius + wave)
          const y = cy + Math.sin(a) * (radius + wave) * 0.72
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(212,175,55,${0.035 + (13 - ring) * 0.004 + energy * 0.035})`
        ctx.lineWidth = ring === 0 ? 1.6 + energy * 1.4 : 0.7 + energy * 0.35
        ctx.stroke()
      }

      const glowRadius = base * (0.34 + energy * 0.2)
      const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius)
      glow.addColorStop(0, `rgba(255,239,166,${0.16 + energy * 0.18})`)
      glow.addColorStop(0.35, `rgba(212,175,55,${0.06 + energy * 0.08})`)
      glow.addColorStop(1, 'rgba(212,175,55,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('geetqar:play', onPlay)
    window.addEventListener('geetqar:pause', onPause)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('geetqar:play', onPlay)
      window.removeEventListener('geetqar:pause', onPause)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      analyser?.disconnect()
      if (audioContext) void audioContext.close()
    }
  }, [])

  return (
    <section className="signal-section border-t border-white/10 px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] tracking-[.4em] text-gold">INTERLUDE / SIGNAL FIELD</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-6xl">Touch the frequency.</h2>
          </div>
          <span className="hidden text-[9px] tracking-[.3em] text-white/25 md:block">MOVE / LISTEN / DRIFT</span>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-[inset_0_0_80px_rgba(212,175,55,.035)]">
          <canvas ref={canvasRef} className="block h-[360px] w-full touch-none md:h-[500px]" aria-label="Interactive golden signal field that responds to music" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-2 w-2 rounded-full bg-gold shadow-[0_0_28px_rgba(212,175,55,.9)]" />
              <p className="text-[9px] tracking-[.45em] text-white/35">GEETQAR / FREQUENCY 01</p>
              <p className="mt-3 max-w-xs text-xs leading-6 text-white/25">Play a track, then move through the field. The signal responds to the sound.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
