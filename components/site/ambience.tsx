'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, Volume2, VolumeX } from 'lucide-react'
import { hourLabel, moodForHour, type MoodDef } from '@/lib/moods'
import type { Track } from '@/lib/site'

type Ctx = {
  mood: MoodDef
  moods: MoodDef[]
  setMood: (key: string) => void
  enabled: boolean
  setEnabled: (on: boolean) => void
  sound: boolean
  setSound: (on: boolean) => void
  clock: string
}

const AmbienceContext = createContext<Ctx | null>(null)
export const useAmbience = () => useContext(AmbienceContext)

const lighten = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`
}
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const storage = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

/* ---------- ambient sound (generated in the browser, no files) ---------- */
class Soundscape {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private current: { gain: GainNode; stop: () => void } | null = null

  private noise(ctx: AudioContext) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true
    return src
  }

  play(effect: MoodDef['effect']) {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination)
    }
    const ctx = this.ctx, master = this.master!
    if (ctx.state === 'suspended') void ctx.resume()
    this.fadeOut()
    if (effect === 'sparks' || effect === 'none') return
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(master)
    const nodes: (AudioScheduledSourceNode)[] = []
    const lfo = (target: AudioParam, rate: number, depth: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); nodes.push(o)
    }
    const tone = (freq: number, level: number, type: OscillatorType = 'sine', filter = 1200) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain()
      o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = filter; g.gain.value = level
      o.connect(f); f.connect(g); g.connect(gain); o.start(); nodes.push(o)
    }
    if (effect === 'rain') {
      const n = this.noise(ctx), band = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain()
      band.type = 'bandpass'; band.frequency.value = 1400; band.Q.value = 0.4; hp.type = 'highpass'; hp.frequency.value = 400; g.gain.value = 0.22
      n.connect(band); band.connect(hp); hp.connect(g); g.connect(gain); n.start(); nodes.push(n)
      lfo(g.gain, 0.12, 0.05)
    } else if (effect === 'stars') {
      const n = this.noise(ctx), low = ctx.createBiquadFilter(), g = ctx.createGain()
      low.type = 'lowpass'; low.frequency.value = 260; g.gain.value = 0.2
      n.connect(low); low.connect(g); g.connect(gain); n.start(); nodes.push(n)
      lfo(g.gain, 0.07, 0.08); tone(110, 0.05); tone(164.8, 0.03)
    } else if (effect === 'dust') {
      tone(146.8, 0.07); tone(220, 0.05); tone(293.7, 0.03); tone(440, 0.012)
      lfo(gain.gain, 0.09, 0.15)
    } else {
      // petals / embers: a soft warm pad
      tone(220, 0.05, 'triangle', 900); tone(277.2, 0.04, 'triangle', 900); tone(329.6, 0.035, 'triangle', 900); tone(110, 0.05)
      lfo(gain.gain, 0.1, 0.12)
    }
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 1.6)
    this.current = { gain, stop: () => nodes.forEach((n) => { try { n.stop() } catch { /* already stopped */ } }) }
  }

  private fadeOut() {
    if (!this.ctx || !this.current) return
    const { gain, stop } = this.current
    gain.gain.cancelScheduledValues(this.ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.9)
    window.setTimeout(stop, 1000)
    this.current = null
  }

  stop() { this.fadeOut() }
}

/* ---------- particles ---------- */
type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; len?: number }

function seed(effect: MoodDef['effect'], w: number, h: number, count: number): P[] {
  return Array.from({ length: count }, () => {
    const r = Math.random()
    const p: P = { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, r: 1, a: 1, ph: Math.random() * 6.28 }
    if (effect === 'stars') { p.r = 0.4 + r * 1.3; p.vy = -2 - r * 4 }
    else if (effect === 'rain') { p.len = 12 + r * 20; p.vy = 520 + r * 380; p.vx = -90; p.r = 0.6 + r * 0.6 }
    else if (effect === 'petals') { p.r = 3 + r * 5; p.vy = 18 + r * 26; p.vx = 8 }
    else if (effect === 'embers') { p.r = 0.8 + r * 2.2; p.vy = -(22 + r * 50); p.vx = 6 }
    else if (effect === 'sparks') { p.len = 8 + r * 16; p.vy = -(120 + r * 220); p.r = 0.8 + r * 1.2; p.y = Math.random() * h * 1.2 }
    else if (effect === 'dust') { p.r = 1 + r * 3; p.vy = -(5 + r * 12); p.vx = 4 }
    return p
  })
}

function Particles({ mood, active }: { mood: MoodDef; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active || mood.effect === 'none') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0, h = 0, raf = 0, last = performance.now(), parts: P[] = []
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const density = mood.effect === 'rain' ? 9000 : mood.effect === 'stars' ? 11000 : 20000
      parts = seed(mood.effect, w, h, Math.min(w < 640 ? 45 : 110, Math.round((w * h) / density)))
    }
    resize()
    window.addEventListener('resize', resize)
    const tint = lighten(mood.c1, 0.35)
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) { last = now; return }
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = mood.effect === 'embers' || mood.effect === 'sparks' || mood.effect === 'dust' ? 'lighter' : 'source-over'
      for (const p of parts) {
        p.ph += dt
        p.x += (p.vx + (mood.effect === 'petals' ? Math.sin(p.ph * 1.3) * 22 : mood.effect === 'dust' ? Math.sin(p.ph * 0.6) * 10 : 0)) * dt
        p.y += p.vy * dt
        if (p.y < -30) { p.y = h + 20; p.x = Math.random() * w }
        if (p.y > h + 30) { p.y = -30; p.x = Math.random() * w }
        if (p.x < -30) p.x = w + 20
        if (p.x > w + 30) p.x = -20
        if (mood.effect === 'stars') {
          ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.55 * Math.abs(Math.sin(p.ph * 0.8))})`
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill()
        } else if (mood.effect === 'rain') {
          ctx.strokeStyle = 'rgba(170,205,255,.28)'; ctx.lineWidth = p.r
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (p.vx / p.vy) * (p.len || 14), p.y - (p.len || 14)); ctx.stroke()
        } else if (mood.effect === 'petals') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph); ctx.fillStyle = rgba(mood.c1, 0.32)
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283); ctx.fill(); ctx.restore()
        } else if (mood.effect === 'embers') {
          const flick = 0.5 + 0.5 * Math.sin(p.ph * 4)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
          g.addColorStop(0, rgba('#ffb066', 0.55 * flick)); g.addColorStop(1, 'rgba(255,106,61,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill()
        } else if (mood.effect === 'sparks') {
          ctx.strokeStyle = rgba(tint, 0.5); ctx.lineWidth = p.r
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + (p.len || 10)); ctx.stroke()
        } else if (mood.effect === 'dust') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
          g.addColorStop(0, rgba('#ffd27a', 0.4)); g.addColorStop(1, 'rgba(255,180,84,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill()
        }
      }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h) }
  }, [mood.effect, mood.c1, active])
  return <canvas ref={ref} className="gx-amb-canvas" aria-hidden="true" key={mood.key} />
}

export function AmbienceProvider({ moods, defaultEnabled, tracks, children }: { moods: MoodDef[]; defaultEnabled: boolean; tracks: Track[]; children: React.ReactNode }) {
  const keys = useMemo(() => moods.map((m) => m.key), [moods])
  const [moodKey, setMoodKey] = useState<string>(keys.includes('night') ? 'night' : keys[0])
  const [enabled, setEnabledState] = useState(defaultEnabled)
  const [sound, setSoundState] = useState(false)
  const [clock, setClock] = useState('')
  const soundRef = useRef<Soundscape | null>(null)
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const mood = moods.find((m) => m.key === moodKey) || moods[0]

  // first visit: pick the mood that fits the visitor's local time; remember an explicit "off"
  useEffect(() => {
    const now = new Date()
    setClock(hourLabel(now))
    setMoodKey(moodForHour(now.getHours(), keys))
    const saved = storage.get('gx-ambience')
    if (saved === 'off') setEnabledState(false)
    else if (saved === 'on') setEnabledState(true)
  }, [keys])

  const setMood = useCallback((key: string) => { if (keys.includes(key)) setMoodKey(key) }, [keys])
  const setEnabled = useCallback((on: boolean) => { setEnabledState(on); storage.set('gx-ambience', on ? 'on' : 'off'); if (!on) setSoundState(false) }, [])
  const setSound = useCallback((on: boolean) => setSoundState(on), [])

  // a song starts -> the whole site takes on that song's mood, and the ambient sound steps aside
  useEffect(() => {
    const onTrack = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id
      const t = tracksRef.current.find((x) => x.id === id)
      const key = t?.moods.find((m) => keys.includes(m))
      if (key) setMoodKey(key)
      setSoundState(false)
    }
    window.addEventListener('gx:track', onTrack)
    return () => window.removeEventListener('gx:track', onTrack)
  }, [keys])

  // theme: recolour the whole site (the accent colour, glow and background wash)
  useEffect(() => {
    const root = document.documentElement
    if (!enabled || !mood) {
      ;['--ember', '--ember-soft', '--wine', '--amb1', '--amb2'].forEach((p) => root.style.removeProperty(p))
      return
    }
    root.style.setProperty('--ember', mood.c1)
    root.style.setProperty('--ember-soft', lighten(mood.c1, 0.3))
    root.style.setProperty('--wine', mood.c2)
    root.style.setProperty('--amb1', mood.c1)
    root.style.setProperty('--amb2', mood.c2)
  }, [enabled, mood])

  // sound
  useEffect(() => {
    if (!soundRef.current) soundRef.current = new Soundscape()
    if (sound && enabled && mood) soundRef.current.play(mood.effect)
    else soundRef.current.stop()
  }, [sound, enabled, mood])
  useEffect(() => () => soundRef.current?.stop(), [])

  const value = useMemo<Ctx>(() => ({ mood, moods, setMood, enabled, setEnabled, sound, setSound, clock }), [mood, moods, setMood, enabled, setEnabled, sound, setSound, clock])

  return (
    <AmbienceContext.Provider value={value}>
      {enabled && <div className="gx-amb-bg" aria-hidden="true" />}
      {children}
      {mood && <Particles mood={mood} active={enabled} />}
      <AmbiencePill />
    </AmbienceContext.Provider>
  )
}

function AmbiencePill() {
  const ctx = useAmbience()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!ctx) return null
  const { mood, moods, setMood, enabled, setEnabled, sound, setSound } = ctx
  return (
    <div className="gx-amb-pill">
      {open && (
        <div className="gx-amb-panel" role="dialog" aria-label="Site ambience">
          <p className="gx-amb-title">AMBIENCE</p>
          <ul>
            {moods.map((m) => (
              <li key={m.key}>
                <button className={enabled && m.key === mood.key ? 'on' : ''} onClick={() => { setEnabled(true); setMood(m.key) }}>
                  <i style={{ background: m.c1 }} /> {m.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="gx-amb-row">
            <button onClick={() => setSound(!sound)} disabled={!enabled} aria-pressed={sound}>{sound ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound {sound ? 'on' : 'off'}</button>
            <button onClick={() => setEnabled(!enabled)} aria-pressed={!enabled}>{enabled ? 'Turn off' : 'Turn on'}</button>
          </div>
        </div>
      )}
      <button className="gx-amb-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Site ambience: ${enabled ? mood.label : 'off'}. Change`}>
        <Sparkles size={14} /> <span>{enabled ? mood.label : 'Ambience off'}</span>
      </button>
    </div>
  )
}
