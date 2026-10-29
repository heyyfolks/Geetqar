'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, MessageCircle, Share2, Shuffle } from 'lucide-react'
import { paintCover } from '@/components/site/cover-art'
import type { Track } from '@/lib/site'
import { useSite } from '@/components/site/site-context'

type Format = 'post' | 'story'
const SIZES: Record<Format, [number, number]> = { post: [1080, 1350], story: [1080, 1920] }
const FALLBACK_LINE = 'Type your own line below'
const MAX_PICKED = 4

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'geetqar' }

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/); const out: string[] = []; let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word } else line = test
  }
  if (line) out.push(line)
  return out
}

async function renderCard(canvas: HTMLCanvasElement, track: Track | null, lines: string[], format: Format, variant: number, thumb: boolean, cancelled: () => boolean) {
  const [W, H] = SIZES[format]
  const art = document.createElement('canvas')
  const id = track?.id || 'geetqar'
  const name = track?.name || 'GEETQAR'
  const palette = await paintCover(art, { id, name, kind: track?.kind || 'Single', year: track?.published.slice(0, 4) || '', size: 1080, label: false, variant, thumb }, cancelled)
  if (cancelled() || !palette) return
  try { await Promise.all([document.fonts.load('italic 300 60px "Fraunces"'), document.fonts.load('500 20px "DM Mono"'), document.fonts.load('20px "Tiro Devanagari Hindi"', 'गीतकार'), document.fonts.load('800 40px "Bricolage Grotesque"')]) } catch { /* fonts are optional */ }
  if (cancelled()) return

  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // background: the generated cover scaled to cover the card
  const scale = Math.max(W / art.width, H / art.height)
  ctx.drawImage(art, (W - art.width * scale) / 2, (H - art.height * scale) / 2, art.width * scale, art.height * scale)
  const dim = ctx.createLinearGradient(0, 0, 0, H)
  dim.addColorStop(0, 'rgba(8,3,6,.55)'); dim.addColorStop(0.45, 'rgba(8,3,6,.42)'); dim.addColorStop(1, 'rgba(8,3,6,.86)')
  ctx.fillStyle = dim; ctx.fillRect(0, 0, W, H)

  const pad = W * 0.09
  const accent = palette[0]
  const mono = (ctx as CanvasRenderingContext2D & { letterSpacing?: string })

  // header
  ctx.fillStyle = 'rgba(244,236,225,.9)'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'
  ctx.font = `500 ${W * 0.026}px "DM Mono", monospace`; mono.letterSpacing = `${W * 0.007}px`
  ctx.fillText('GEETQAR', pad, pad)
  mono.letterSpacing = '0px'
  ctx.font = `${W * 0.034}px "Tiro Devanagari Hindi", "Noto Sans Devanagari", serif`
  ctx.textAlign = 'right'; ctx.fillText('गीतकार', W - pad, pad - W * 0.008)
  ctx.textAlign = 'left'

  // quote, scaled to fit the safe area
  mono.letterSpacing = '0px'
  const maxH = H * (format === 'story' ? 0.5 : 0.52), maxW = W - pad * 2
  let size = W * 0.082, block: string[][] = []
  for (; size > W * 0.036; size -= 2) {
    ctx.font = `italic 300 ${size}px "Fraunces", Georgia, serif`
    block = lines.map((l) => wrapLines(ctx, l, maxW))
    const total = block.reduce((n, b) => n + b.length, 0) * size * 1.22 + (block.length - 1) * size * 0.5
    if (total <= maxH) break
  }
  const lineH = size * 1.22, gap = size * 0.5
  const total = block.reduce((n, b) => n + b.length, 0) * lineH + (block.length - 1) * gap
  let y = (H - total) / 2 + H * 0.02
  ctx.textBaseline = 'top'
  ctx.fillStyle = accent; ctx.font = `800 ${W * 0.2}px "Bricolage Grotesque", serif`
  ctx.globalAlpha = 0.9; ctx.fillText('“', pad - W * 0.01, y - W * 0.14); ctx.globalAlpha = 1
  ctx.fillStyle = '#f4ece1'; ctx.font = `italic 300 ${size}px "Fraunces", Georgia, serif`
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = W * 0.015
  for (const paragraph of block) { for (const line of paragraph) { ctx.fillText(line, pad, y); y += lineH } y += gap }
  ctx.shadowBlur = 0

  // footer
  const fy = H - pad
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = accent; ctx.fillRect(pad, fy - W * 0.115, W * 0.07, 3)
  ctx.fillStyle = '#f4ece1'; ctx.font = `800 ${W * 0.05}px "Bricolage Grotesque", system-ui, sans-serif`
  ctx.fillText(name.toUpperCase().slice(0, 28), pad, fy - W * 0.05)
  ctx.fillStyle = 'rgba(244,236,225,.62)'; ctx.font = `500 ${W * 0.022}px "DM Mono", monospace`; mono.letterSpacing = `${W * 0.004}px`
  ctx.fillText('GEETQAR.VERCEL.APP', pad, fy - W * 0.004)
  mono.letterSpacing = '0px'
}

export function LyricCards({ tracks }: { tracks: Track[] }) {
  const { links } = useSite()
  // tracks with lyrics first, so the first card people see is a real lyric
  const ordered = useMemo(() => [...tracks].sort((a, b) => Number(b.lyrics.length > 0) - Number(a.lyrics.length > 0)), [tracks])
  const [trackId, setTrackId] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [format, setFormat] = useState<Format>('post')
  const [variant, setVariant] = useState(0)
  const [safe, setSafe] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const track = ordered.find((t) => t.id === trackId) || ordered[0] || null

  // default selection when the track changes
  useEffect(() => {
    setPicked(track?.lyrics.slice(0, 2) || []); setCustom(''); setVariant(0); setSafe(false); setError('')
  }, [track?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const lines = useMemo(() => {
    const typed = custom.trim()
    if (typed) return [typed]
    if (picked.length) return picked
    return [FALLBACK_LINE]
  }, [custom, picked])
  const linesKey = lines.join('\n')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const timer = window.setTimeout(() => { void renderCard(canvas, track, lines, format, variant, !safe, () => cancelled) }, 150)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [track?.id, linesKey, format, variant, safe]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (line: string) => {
    setCustom('')
    setPicked((current) => current.includes(line) ? current.filter((l) => l !== line) : current.length >= MAX_PICKED ? [...current.slice(1), line] : [...current, line])
  }

  const toBlob = () => new Promise<Blob | null>((resolve) => {
    const canvas = canvasRef.current
    if (!canvas) return resolve(null)
    try { canvas.toBlob((b) => resolve(b), 'image/png') } catch { resolve(null) }
  })

  const fileName = `geetqar-${slug(track?.name || '')}.png`

  const exportCard = async (mode: 'download' | 'share') => {
    setBusy(true); setError('')
    const blob = await toBlob()
    setBusy(false)
    if (!blob) {
      // the thumbnail made the canvas unexportable on this browser: redraw with pure generative art
      setSafe(true); setError('Switched to art-only so it can be saved. Tap again.')
      return
    }
    const file = new File([blob], fileName, { type: 'image/png' })
    if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'GEETQAR', text: track ? `${track.name} · GEETQAR` : 'GEETQAR' }); return } catch { /* cancelled */ }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`“${lines[0]}”\n— GEETQAR${track ? ` · ${track.name}` : ''}\n${track ? `https://youtu.be/${track.id}` : 'https://geetqar.vercel.app'}`)}`

  return (
    <section id="cards" className="gx-section gx-cards" aria-labelledby="cards-title" style={{ background: 'var(--ink-2)' }}>
      <div className="gx-wrap">
        <p className="gx-kicker">03 / Lyric cards</p>
        <h2 id="cards-title" className="gx-h2">Turn a lyric <em>into a poster.</em></h2>
        <p className="gx-lede">Pick a track, choose the lines you like, and save a poster for your story or feed. It is made on your device and nothing is uploaded. New songs are added automatically.</p>

        <div className="gx-studio">
          <div className="gx-studio-preview">
            <div className="gx-card-frame" style={{ aspectRatio: format === 'story' ? '9 / 16' : '4 / 5' }}>
              <canvas ref={canvasRef} role="img" aria-label="Lyric card preview" />
            </div>
          </div>

          <div className="gx-studio-controls">
            <div>
              <h3 className="gx-step"><b>1</b> Pick a track</h3>
              <div className="gx-trackchips" role="listbox" aria-label="Track">
                {ordered.slice(0, 15).map((t) => (
                  <button key={t.id} role="option" aria-selected={t.id === track?.id} className={`gx-chip ${t.id === track?.id ? 'on' : ''}`} onClick={() => setTrackId(t.id)}>{t.name}</button>
                ))}
                {!ordered.length && <span className="gx-hint">Tracks load from the channel, one moment.</span>}
              </div>
            </div>

            <div>
              <h3 className="gx-step"><b>2</b> Choose the lines <span>{track?.lyrics.length ? `up to ${MAX_PICKED}` : ''}</span></h3>
              {track?.lyrics.length ? (
                <ul className="gx-lines">
                  {track.lyrics.map((line) => {
                    const on = !custom.trim() && picked.includes(line)
                    return (
                      <li key={line}><button className={`gx-line ${on ? 'on' : ''}`} onClick={() => toggle(line)} aria-pressed={on}><span className="gx-tick">{on && <Check size={12} strokeWidth={3} />}</span>{line}</button></li>
                    )
                  })}
                </ul>
              ) : (
                <p className="gx-hint">The lyrics for this track have not been added yet. Write your own line below, or pick a track that has lyrics.</p>
              )}
              <label className="gx-field">
                <span>{track?.lyrics.length ? 'Or write your own line' : 'Your line'}</span>
                <textarea className="gx-input" rows={2} maxLength={140} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Type something that hits…" />
              </label>
            </div>

            <div>
              <h3 className="gx-step"><b>3</b> Style it</h3>
              <div className="gx-style-row">
                <div className="gx-seg" role="group" aria-label="Format">
                  <button className={format === 'post' ? 'on' : ''} onClick={() => setFormat('post')}>Post 4:5</button>
                  <button className={format === 'story' ? 'on' : ''} onClick={() => setFormat('story')}>Story 9:16</button>
                </div>
                <button className="gx-pill" onClick={() => setVariant((v) => v + 1)}><Shuffle size={14} /> SHUFFLE LOOK</button>
              </div>
            </div>

            <div className="gx-cta-row" style={{ marginTop: 6 }}>
              <button className="gx-btn gx-btn-solid" disabled={busy} onClick={() => exportCard('download')}><Download size={15} /> SAVE IMAGE</button>
              <button className="gx-btn gx-btn-line" disabled={busy} onClick={() => exportCard('share')}><Share2 size={15} /> SHARE</button>
              <a className="gx-btn gx-btn-line" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WHATSAPP</a>
            </div>
            {error && <p className="gx-note" role="status">{error}</p>}
            <p className="gx-hint">Tag <a href={links.instagram} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>@geetqar</a> when you post it.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
