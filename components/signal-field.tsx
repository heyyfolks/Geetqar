'use client'

import { useEffect, useRef, useState } from 'react'

const modes = ['PULSE', 'ORBIT', 'VOID'] as const
type Mode = (typeof modes)[number]

export function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('PULSE')
  const [signal, setSignal] = useState(0)
  const [active, setActive] = useState(false)

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
    let bass = 0
    let mids = 0
    let highs = 0
    let targetEnergy = 0
    let analyser: AnalyserNode | null = null
    let audioContext: AudioContext | null = null
    let connectedAudio: HTMLAudioElement | null = null
    const frequency = new Uint8Array(128)
    const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()
    const pointer = { x: 0.5, y: 0.5, active: false, down: false }
    const bursts: Array<{ x: number; y: number; born: number }> = []

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
        analyser.smoothingTimeConstant = 0.78
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        connectedAudio = audio
        setActive(true)
      } catch {
        analyser = null
        setActive(false)
      }
    }

    const onPlay = (event: Event) => {
      const detail = (event as CustomEvent<{ element?: HTMLAudioElement }>).detail
      if (detail?.element) void connectAudio(detail.element)
    }
    const onPause = () => {
      targetEnergy = 0
      setActive(false)
    }
    const onEnded = () => {
      targetEnergy = 0
      setActive(false)
    }

    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
      pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
      pointer.active = true
      return { x: pointer.x * width, y: pointer.y * height }
    }
    const onMove = (event: PointerEvent) => { locate(event) }
    const onDown = (event: PointerEvent) => {
      const point = locate(event)
      pointer.down = true
      bursts.push({ ...point, born: performance.now() })
      if (bursts.length > 12) bursts.shift()
    }
    const onUp = () => { pointer.down = false }
    const onLeave = () => { pointer.active = false; pointer.down = false }

    const draw = (now: number) => {
      t += 0.008
      ctx.clearRect(0, 0, width, height)

      if (analyser) {
        analyser.getByteFrequencyData(frequency)
        let sum = 0
        let low = 0
        let mid = 0
        let high = 0
        for (let i = 0; i < frequency.length; i++) {
          const value = frequency[i]
          sum += value
          if (i < 20) low += value
          else if (i < 68) mid += value
          else high += value
        }
        targetEnergy = Math.min(1, sum / frequency.length / 145)
        bass += ((low / 20 / 255) - bass) * 0.18
        mids += ((mid / 48 / 255) - mids) * 0.14
        highs += ((high / 60 / 255) - highs) * 0.12
      } else {
        bass *= 0.97
        mids *= 0.97
        highs *= 0.97
      }
      energy += (targetEnergy - energy) * 0.1
      const base = Math.min(width, height)
      const px = (pointer.active ? pointer.x : 0.5) * width
      const py = (pointer.active ? pointer.y : 0.5) * height
      const pulse = bass * base * 0.18
      const orbit = Math.sin(t * 1.8) * width * 0.05 + mids * width * 0.12

      const bg = ctx.createRadialGradient(px, py, 0, px, py, base * (0.45 + energy * 0.3))
      bg.addColorStop(0, `rgba(255,239,166,${0.035 + highs * 0.06})`)
      bg.addColorStop(0.38, `rgba(212,175,55,${0.018 + energy * 0.04})`)
      bg.addColorStop(1, 'rgba(212,175,55,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      for (let ring = 0; ring < 15; ring++) {
        const phase = t * (0.55 + ring * 0.018) + ring * 0.46
        let radius = base * (0.028 + ring * 0.032)
        if (mode === 'PULSE') radius += pulse * (1 - ring / 18)
        if (mode === 'ORBIT') radius += orbit * (0.18 + ring / 80)
        if (mode === 'VOID') radius += Math.sin(phase * 1.4) * base * 0.018 + highs * base * 0.08

        const cx = width * 0.5 + Math.cos(phase * 0.73) * width * 0.07 + (px - width * 0.5) * 0.09
        const cy = height * 0.5 + Math.sin(phase * 0.91) * height * 0.08 + (py - height * 0.5) * 0.09
        const wobble = base * (0.004 + energy * 0.018) * (1 + ring * 0.025)

        ctx.beginPath()
        for (let i = 0; i <= 180; i++) {
          const a = (i / 180) * Math.PI * 2
          const band = frequency[Math.min(127, Math.floor((i / 180) * 128))] / 255
          const wave = Math.sin(a * 5 + phase * 2.2) * wobble + Math.cos(a * 3 - phase) * base * 0.003 + band * pulse * 0.2
          const x = cx + Math.cos(a) * (radius + wave)
          const y = cy + Math.sin(a) * (radius + wave) * (mode === 'ORBIT' ? 0.84 : 0.72)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(212,175,55,${0.028 + (15 - ring) * 0.003 + energy * 0.04})`
        ctx.lineWidth = ring === 0 ? 1.5 + bass * 2.5 : 0.65 + highs * 0.5
        ctx.stroke()
      }

      const particleCount = 70
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 17.371
        const angle = seed + t * (0.08 + (i % 5) * 0.015)
        const distance = base * (0.06 + ((i * 29) % 100) / 100 * 0.43) + pulse * ((i % 7) / 7)
        const x = width * 0.5 + Math.cos(angle) * distance + (px - width * 0.5) * 0.04
        const y = height * 0.5 + Math.sin(angle) * distance * 0.58 + (py - height * 0.5) * 0.04
        const size = 0.5 + highs * 1.8 + ((i * 13) % 4) * 0.18
        ctx.fillStyle = `rgba(255,239,166,${0.08 + energy * 0.18})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const burst = bursts[i]
        const age = (now - burst.born) / 1000
        if (age > 1.4) { bursts.splice(i, 1); continue }
        const radius = age * base * (0.35 + energy * 0.25)
        ctx.beginPath()
        ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,239,166,${Math.max(0, 0.28 - age * 0.2)})`
        ctx.lineWidth = 1 + (1 - age) * 2
        ctx.stroke()
      }

      if (pointer.active) {
        ctx.beginPath()
        ctx.arc(px, py, 3 + energy * 7 + (pointer.down ? 4 : 0), 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,239,166,.85)'
        ctx.shadowBlur = 20 + energy * 30
        ctx.shadowColor = 'rgba(212,175,55,.8)'
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (connectedAudio && !connectedAudio.paused) setSignal(Math.round(energy * 100))
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('geetqar:play', onPlay)
    window.addEventListener('geetqar:pause', onPause)
    window.addEventListener('geetqar:ended', onEnded)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('geetqar:play', onPlay)
      window.removeEventListener('geetqar:pause', onPause)
      window.removeEventListener('geetqar:ended', onEnded)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      analyser?.disconnect()
      if (audioContext) void audioContext.close()
    }
  }, [mode])

  return (
    <section className="signal-section border-t border-white/10 px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] tracking-[.4em] text-gold">INTERLUDE / THE GEETQAR SIGNAL</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.03em] md:text-6xl">The website listens.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">Your cursor becomes an instrument. Bass pushes the field, mids bend the orbit, highs wake the particles.</p>
          </div>
          <div className="flex items-center gap-2">
            {modes.map((item) => <button key={item} onClick={() => setMode(item)} aria-pressed={mode === item} className={`border px-3 py-2 text-[9px] tracking-[.2em] transition ${mode === item ? 'border-gold/60 bg-gold/10 text-gold' : 'border-white/10 text-white/30 hover:border-white/25 hover:text-white/60'}`}>{item}</button>)}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050505] shadow-[inset_0_0_120px_rgba(212,175,55,.045)]">
          <canvas ref={canvasRef} className="block h-[390px] w-full touch-none md:h-[560px]" aria-label="The GEETQAR Signal, an interactive audio reactive visual field" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`mx-auto mb-4 h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_32px_rgba(212,175,55,.9)] ${active ? 'animate-pulse' : ''}`} />
              <p className="text-[9px] tracking-[.5em] text-white/40">SIGNAL {active ? 'LIVE' : 'STANDBY'} / {String(signal).padStart(2, '0')}</p>
              <p className="mt-3 max-w-sm text-xs leading-6 text-white/25">Play any GEETQAR track. Move. Click. Let the sound change the room.</p>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-5 right-5 flex justify-between text-[8px] tracking-[.25em] text-white/20">
            <span>MOVE = SHAPE</span><span>CLICK = IMPACT</span><span>SOUND = SIGNAL</span>
          </div>
        </div>
      </div>
    </section>
  )
}
