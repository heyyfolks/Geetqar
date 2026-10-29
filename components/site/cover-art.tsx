'use client'

import { useEffect, useRef } from 'react'

/**
 * Generative cover art. No upload, no API key.
 *  1. Pulls the YouTube thumbnail (best quality available), crops pillarbox bars from Shorts.
 *  2. Extracts a two-colour palette from it.
 *  3. Colour-grades it and layers procedural art chosen from the title's vibe
 *     (rain, night, love, city, default waves), seeded by the track id so it is stable.
 *  4. Prints the title on it. If the thumbnail can't load, the art stands on its own.
 */

type Props = {
  id: string
  name: string
  kind: string
  year: string
  /** internal canvas resolution (px). Use ~640 for the hero cover, ~200 for list thumbnails */
  size?: number
  /** draw GEETQAR / kind / title typography */
  label?: boolean
  /** artwork style override; 0 or undefined = chosen from the title */
  variant?: number
  onPalette?: (palette: [string, string]) => void
}

type Vibe = { re: RegExp; pal: [string, string, string]; mode: 'rain' | 'night' | 'love' | 'city' | 'waves' }

const VIBES: Vibe[] = [
  { re: /rain|monsoon|saiyaara|baarish|barsaat|saawan|sawan/i, pal: ['#2a7fb0', '#0a1a30', '#9be3ff'], mode: 'rain' },
  { re: /night|dream|stolen|raat|chand|moon|star|sapn|neend|stone|beat/i, pal: ['#6a4cff', '#0e0824', '#e6d6ff'], mode: 'night' },
  { re: /love|roop|dil|pyaar|ishq|teri|kami|sohn|mohabbat|sohneya|aaja/i, pal: ['#ff4f79', '#2b0a18', '#ffc7a8'], mode: 'love' },
  { re: /delhi|metro|city|road|jamna|sadak|mumbai|raga|paar/i, pal: ['#ffb454', '#14171f', '#6fe0ff'], mode: 'city' },
]
const DEFAULT_VIBE: Vibe = { re: /./, pal: ['#ff6a3d', '#2a0c18', '#ffb454'], mode: 'waves' }

function hash(s: string) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return h >>> 0
}
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const toRgb = (hex: string): [number, number, number] => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`
const mix = (a: string, b: string, t: number) => { const x = toRgb(a), y = toRgb(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t) }
const rgba = (hex: string, a: number) => { const [r, g, b] = toRgb(hex); return `rgba(${r},${g},${b},${a})` }

function load(src: string, cors: boolean) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function getThumb(id: string) {
  for (const quality of ['sddefault', 'hqdefault']) {
    const src = `https://i.ytimg.com/vi/${id}/${quality}.jpg`
    for (const cors of [true, false]) {
      const img = await load(src, cors)
      if (img && img.naturalWidth > 200) return { img, cors }
    }
  }
  return null
}

/** Square crop of the useful picture area (drops black pillarbox bars) + a 2-colour palette. */
function analyse(img: HTMLImageElement, cors: boolean) {
  const w = img.naturalWidth, h = img.naturalHeight
  let sx = 0, sw = w
  let palette: [string, string] | null = null
  if (cors) {
    try {
      const c = document.createElement('canvas'); c.width = 96; c.height = 72
      const x = c.getContext('2d', { willReadFrequently: true })!
      x.drawImage(img, 0, 0, 96, 72)
      const d = x.getImageData(0, 0, 96, 72).data
      const col = (px: number) => { let s = 0; for (let y = 0; y < 72; y++) { const i = (y * 96 + px) * 4; s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] } return s / 72 }
      let l = 0; while (l < 40 && col(l) < 14) l++
      let r = 95; while (r > 55 && col(r) < 14) r--
      if ((l > 6 || r < 89) && (r + 1 - l) / 96 > 0.2) { sx = (l / 96) * w; sw = ((r + 1 - l) / 96) * w }
      const side = Math.min(sw, h)
      const s = document.createElement('canvas'); s.width = 32; s.height = 32
      const sc = s.getContext('2d', { willReadFrequently: true })!
      sc.drawImage(img, sx + (sw - side) / 2, (h - side) / 2, side, side, 0, 0, 32, 32)
      const p = sc.getImageData(0, 0, 32, 32).data
      let best = -1, c1: [number, number, number] | null = null
      const px: Array<[number, number, number, number]> = []
      for (let i = 0; i < p.length; i += 4) {
        const mx = Math.max(p[i], p[i + 1], p[i + 2]), mn = Math.min(p[i], p[i + 1], p[i + 2])
        const sat = mx ? (mn === mx ? 0 : (mx - mn) / mx) : 0, v = mx / 255
        const wgt = sat * v * (v > 0.28 ? 1 : 0.2)
        px.push([p[i], p[i + 1], p[i + 2], wgt])
        if (wgt > best) { best = wgt; c1 = [p[i], p[i + 1], p[i + 2]] }
      }
      if (c1 && best > 0.12) {
        let far = 0, c2: [number, number, number] = c1
        for (const [r2, g2, b2, wgt] of px) {
          if (wgt < 0.08) continue
          const dist = Math.hypot(r2 - c1[0], g2 - c1[1], b2 - c1[2]) * (0.5 + wgt)
          if (dist > far) { far = dist; c2 = [r2, g2, b2] }
        }
        palette = [toHex(...c1), far > 40 ? toHex(...c2) : mix(toHex(...c1), '#1a0a14', 0.55)]
      }
    } catch { /* tainted canvas: fall back to the vibe palette */ }
  }
  const side = Math.min(sw, h)
  return { crop: { sx: sx + (sw - side) / 2, sy: (h - side) / 2, side }, palette }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word } else line = test
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S*$/, '')}…` }
  return lines
}

function proceduralArt(ctx: CanvasRenderingContext2D, S: number, mode: Vibe['mode'], r: () => number, a: string, b: string, acc: string) {
  ctx.globalCompositeOperation = 'screen'
  if (mode === 'rain') {
    for (let i = 0; i < 110; i++) {
      const x = r() * S * 1.3 - S * 0.15, y = r() * S, len = S * (0.05 + r() * 0.2)
      ctx.strokeStyle = rgba(acc, 0.08 + r() * 0.32); ctx.lineWidth = 1 + r() * S * 0.003
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.28, y + len); ctx.stroke()
    }
  } else if (mode === 'night') {
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = rgba(acc, 0.15 + r() * 0.7); ctx.beginPath(); ctx.arc(r() * S, r() * S, r() * S * 0.004 + 0.6, 0, Math.PI * 2); ctx.fill()
    }
    const mx = S * (0.55 + r() * 0.25), my = S * (0.2 + r() * 0.18), mr = S * (0.1 + r() * 0.06)
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3.2)
    g.addColorStop(0, rgba(acc, 0.9)); g.addColorStop(0.3, rgba(a, 0.35)); g.addColorStop(1, rgba(a, 0))
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, mr * 3.2, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = rgba(acc, 0.95); ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill()
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = rgba(acc, 0.16 + i * 0.06); ctx.lineWidth = S * 0.0035
      ctx.beginPath(); ctx.ellipse(mx, my, S * (0.28 + i * 0.12), S * (0.08 + i * 0.05), r() * Math.PI, 0, Math.PI * 2); ctx.stroke()
    }
  } else if (mode === 'love') {
    for (let i = 0; i < 9; i++) {
      const x = r() * S, y = r() * S, rad = S * (0.1 + r() * 0.24)
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, rgba(i % 2 ? acc : a, 0.34)); g.addColorStop(1, rgba(a, 0))
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = rgba(acc, 0.2); ctx.lineWidth = S * 0.0028; ctx.beginPath(); ctx.arc(x, y, rad * 0.62, 0, Math.PI * 2); ctx.stroke()
    }
  } else if (mode === 'city') {
    const hy = S * (0.5 + r() * 0.08)
    const g = ctx.createRadialGradient(S / 2, hy, 0, S / 2, hy, S * 0.4)
    g.addColorStop(0, rgba(acc, 0.8)); g.addColorStop(0.2, rgba(a, 0.4)); g.addColorStop(1, rgba(a, 0))
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
    ctx.strokeStyle = rgba(acc, 0.28); ctx.lineWidth = S * 0.0028
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(S / 2, hy); ctx.lineTo(S / 2 + i * S * 0.12, S); ctx.stroke() }
    for (let i = 1; i < 12; i++) { const y = hy + (S - hy) * Math.pow(i / 12, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke() }
  } else {
    for (let i = 0; i < 8; i++) {
      const base = S * (0.25 + i * 0.09), amp = S * (0.02 + r() * 0.07), freq = 1.2 + r() * 3.2, ph = r() * 6.28
      ctx.strokeStyle = rgba(i % 2 ? acc : a, 0.22 + r() * 0.3); ctx.lineWidth = S * (0.002 + r() * 0.004)
      ctx.beginPath()
      for (let x = 0; x <= S; x += 6) { const y = base + Math.sin((x / S) * Math.PI * 2 * freq + ph) * amp; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
      ctx.stroke()
    }
  }
  ctx.globalCompositeOperation = 'source-over'
}

export type PaintOptions = {
  id: string; name: string; kind: string; year: string
  size?: number; label?: boolean
  /** 0 = the track's own vibe; 1..4 pick a different procedural style and seed */
  variant?: number
  /** false = skip the YouTube thumbnail (pure generative art, never taints the canvas) */
  thumb?: boolean
}

const STYLE_ORDER: Vibe[] = [DEFAULT_VIBE, ...VIBES]

/** Paints a square cover onto `canvas`. Resolves with the [colour, colour] palette used, or null if cancelled. */
export async function paintCover(canvas: HTMLCanvasElement, opts: PaintOptions, cancelled: () => boolean = () => false): Promise<[string, string] | null> {
  const { id, name, kind, year, size: S = 640, label = true, variant = 0, thumb: useThumb = true } = opts
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const vibe = variant > 0 ? STYLE_ORDER[variant % STYLE_ORDER.length] : VIBES.find((v) => v.re.test(name)) || DEFAULT_VIBE
  const r = rng(hash(`${id}:${name}:${variant}`))

  const thumb = useThumb ? await getThumb(id) : null
  try { await document.fonts.ready } catch { /* ignore */ }
  if (cancelled()) return null

      const info = thumb ? analyse(thumb.img, thumb.cors) : null
      const [p1, p2] = info?.palette || [vibe.pal[0], mix(vibe.pal[1], vibe.pal[0], 0.2)]
      const acc = info?.palette ? mix(p1, '#ffffff', 0.55) : vibe.pal[2]

      // base
      const base = ctx.createLinearGradient(0, 0, S, S)
      base.addColorStop(0, mix(p1, '#0b0709', 0.25)); base.addColorStop(1, mix(p2, '#0b0709', 0.6))
      ctx.fillStyle = base; ctx.fillRect(0, 0, S, S)

      if (thumb && info) {
        ctx.filter = 'saturate(1.25) contrast(1.06)'
        ctx.globalAlpha = 0.92
        ctx.drawImage(thumb.img, info.crop.sx, info.crop.sy, info.crop.side, info.crop.side, 0, 0, S, S)
        ctx.filter = 'none'; ctx.globalAlpha = 1
        const grade = ctx.createLinearGradient(0, 0, S, S)
        grade.addColorStop(0, rgba(p1, 0.55)); grade.addColorStop(1, rgba(p2, 0.7))
        ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = grade; ctx.fillRect(0, 0, S, S)
        ctx.globalCompositeOperation = 'source-over'
      } else {
        ctx.globalCompositeOperation = 'screen'
        for (let i = 0; i < 4; i++) {
          const x = r() * S, y = r() * S, rad = S * (0.35 + r() * 0.35)
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
          g.addColorStop(0, rgba(i % 2 ? p2 : p1, 0.55)); g.addColorStop(1, rgba(p1, 0))
          ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      proceduralArt(ctx, S, vibe.mode, r, p1, p2, acc)

      // grain + vignette
      for (let i = 0; i < S * 4; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`; ctx.fillRect(r() * S, r() * S, 1.2, 1.2) }
      const vg = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.78)
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,2,4,0.62)')
      ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S)

      if (label) {
        const scrim = ctx.createLinearGradient(0, S * 0.5, 0, S)
        scrim.addColorStop(0, 'rgba(5,2,4,0)'); scrim.addColorStop(1, 'rgba(5,2,4,0.82)')
        ctx.fillStyle = scrim; ctx.fillRect(0, S * 0.5, S, S * 0.5)
        const pad = S * 0.06
        ctx.fillStyle = 'rgba(244,236,225,0.92)'; ctx.textBaseline = 'top'
        ctx.font = `500 ${S * 0.026}px "DM Mono", monospace`
        ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${S * 0.006}px`
        ctx.textAlign = 'left'; ctx.fillText('GEETQAR', pad, pad)
        ctx.textAlign = 'right'; ctx.fillText(`${kind.toUpperCase()}${year ? ` · ${year}` : ''}`, S - pad, pad)
        ctx.textAlign = 'left'
        ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px'
        const fs = S * 0.088
        ctx.font = `800 ${fs}px "Bricolage Grotesque", system-ui, sans-serif`
        const lines = wrap(ctx, name.toUpperCase(), S - pad * 2, 3)
        ctx.textBaseline = 'alphabetic'
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = S * 0.02
        lines.forEach((line, i) => ctx.fillText(line, pad, S - pad - (lines.length - 1 - i) * fs * 0.98))
        ctx.shadowBlur = 0
      }

      return [p1, p2]
}

export function CoverArt({ id, name, kind, year, size = 640, label = true, variant = 0, onPalette }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const paletteRef = useRef(onPalette)
  useEffect(() => { paletteRef.current = onPalette }, [onPalette])

  useEffect(() => {
    let cancelled = false
    const canvas = ref.current
    if (!canvas) return
    paintCover(canvas, { id, name, kind, year, size, label, variant }, () => cancelled).then((palette) => {
      if (palette && !cancelled) paletteRef.current?.(palette)
    })
    return () => { cancelled = true }
  }, [id, name, kind, year, size, label, variant])

  return <canvas ref={ref} role="img" aria-label={`${name} cover art`} style={{ display: 'block', width: '100%', height: '100%' }} />
}
