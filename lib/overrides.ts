import { adminDb } from './db'
import type { TrackKind } from './site'

export const KINDS: TrackKind[] = ['Single', 'Official Audio', 'Music Video', 'Lyric Video', 'Cover', 'Mashup']
export const KIND_LABEL: Record<TrackKind, string> = { Single: 'Original', 'Official Audio': 'Official Audio', 'Music Video': 'Music Video', 'Lyric Video': 'Lyric Video', Cover: 'Cover', Mashup: 'Mashup' }

export type Override = {
  video_id: string
  manual: boolean
  hidden: boolean | null
  pinned: boolean
  sort_order: number | null
  name: string | null
  kind: TrackKind | null
  moods: string[] | null
  lyrics: string | null
  description: string | null
  published: string | null
  title: string | null
  credits: string | null
  links: { spotify?: string; apple?: string; other?: string }
  art_style: number | null
  updated_at?: string
}

/** Fields the admin may change. `null` clears a field so the automatic value is used again. */
export type OverridePatch = Partial<Omit<Override, 'video_id' | 'manual' | 'updated_at'>>

const text = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.replace(/\u0000/g, '').trim().slice(0, max) : null)
const https = (v: unknown): string | undefined => (typeof v === 'string' && /^https:\/\/\S+$/i.test(v.trim()) ? v.trim().slice(0, 300) : undefined)

export function isVideoId(v: unknown): v is string {
  return typeof v === 'string' && /^[\w-]{11}$/.test(v)
}

/** Extracts a video id from a YouTube link or a bare id. */
export function parseVideoId(input: string): string | null {
  const s = input.trim()
  if (isVideoId(s)) return s
  try {
    const u = new URL(s)
    if (u.hostname.endsWith('youtu.be')) return isVideoId(u.pathname.slice(1, 12)) ? u.pathname.slice(1, 12) : null
    const v = u.searchParams.get('v')
    if (isVideoId(v)) return v
    const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export function sanitizePatch(input: unknown, validMoods: string[]): OverridePatch | null {
  if (!input || typeof input !== 'object') return null
  const v = input as Record<string, unknown>
  const out: OverridePatch = {}
  if ('hidden' in v) out.hidden = v.hidden === null ? null : Boolean(v.hidden)
  if ('pinned' in v) out.pinned = Boolean(v.pinned)
  if ('sort_order' in v) out.sort_order = v.sort_order === null || v.sort_order === '' ? null : Number.isFinite(Number(v.sort_order)) ? Math.max(0, Math.min(9999, Math.round(Number(v.sort_order)))) : null
  if ('name' in v) out.name = text(v.name, 80)
  if ('title' in v) out.title = text(v.title, 160)
  if ('kind' in v) out.kind = v.kind === null || v.kind === '' ? null : KINDS.includes(v.kind as TrackKind) ? (v.kind as TrackKind) : null
  if ('moods' in v) out.moods = v.moods === null ? null : Array.isArray(v.moods) ? Array.from(new Set(v.moods.filter((m): m is string => typeof m === 'string' && validMoods.includes(m)))).slice(0, 6) : null
  if ('lyrics' in v) out.lyrics = text(v.lyrics, 20000)
  if ('description' in v) out.description = text(v.description, 1500)
  if ('credits' in v) out.credits = text(v.credits, 600)
  if ('published' in v) out.published = typeof v.published === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.published) && !Number.isNaN(Date.parse(v.published)) ? v.published : null
  if ('art_style' in v) out.art_style = v.art_style === null || v.art_style === '' ? null : Number.isInteger(Number(v.art_style)) ? Math.max(0, Math.min(20, Number(v.art_style))) : null
  if ('links' in v && v.links && typeof v.links === 'object') {
    const l = v.links as Record<string, unknown>
    const links: Override['links'] = {}
    for (const k of ['spotify', 'apple', 'other'] as const) { const u = https(l[k]); if (u) links[k] = u }
    out.links = links
  }
  return out
}

export async function getOverrides(fresh = false): Promise<Map<string, Override>> {
  const map = new Map<string, Override>()
  const db = adminDb(!fresh)
  if (!db) return map
  try {
    const { data } = await db.from('track_overrides').select('*')
    for (const row of (data || []) as Override[]) map.set(row.video_id, { ...row, links: row.links || {} })
  } catch {}
  return map
}

/** Lyrics text -> the lines used by the lyric cards (no blank lines, no duplicates). */
export function lyricLines(textValue: string): string[] {
  const out: string[] = []
  for (const raw of textValue.replace(/\r/g, '').split('\n')) {
    const line = raw.replace(/\s+/g, ' ').trim().slice(0, 160)
    if (line && !out.includes(line)) out.push(line)
    if (out.length >= 200) break
  }
  return out
}
