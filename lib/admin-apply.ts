import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CONFIG_KEYS, sanitizeConfig, type ConfigKey, type SiteConfig } from './site-config'
import { getConfig } from './config'
import { isVideoId, sanitizePatch, type Override } from './overrides'

/** Every write to the site goes through these change objects: the admin forms and the AI assistant use the same ones. */
export type Change =
  | { target: 'track'; id: string; set: Record<string, unknown>; label?: string }
  | { target: 'track_reset'; id: string; label?: string }
  | { target: 'track_remove'; id: string; label?: string }
  | { target: 'config'; key: ConfigKey; value: unknown; label?: string }

export type ApplyResult = { ok: boolean; summary: string; error?: string }

const clip = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function summarize(change: Change, patchKeys: string[] = []): string {
  if (change.target === 'config') return `Settings: ${change.label || change.key}`
  const name = clip(change.label || change.id, 40)
  if (change.target === 'track_reset') return `${name}: reset to automatic`
  if (change.target === 'track_remove') return `${name}: removed`
  return `${name}: ${patchKeys.join(', ') || 'updated'}`
}

async function log(db: SupabaseClient, source: string, summary: string, target: string, before: unknown, after: unknown) {
  try { await db.from('admin_log').insert({ source, summary, target, before: before ?? null, after: after ?? null }) } catch {}
}

export function revalidateSite() {
  try { revalidateTag('gq') } catch {}
  try { revalidatePath('/', 'layout') } catch {}
  try { revalidatePath('/api/catalog') } catch {}
  try { revalidatePath('/sitemap.xml') } catch {}
}

export async function applyChanges(db: SupabaseClient, changes: Change[], source: 'manual' | 'ai'): Promise<ApplyResult[]> {
  const config = await getConfig(true)
  const validMoods = config.moods.map((m) => m.key)
  const results: ApplyResult[] = []

  for (const change of changes.slice(0, 40)) {
    try {
      if (change.target === 'config') {
        if (!CONFIG_KEYS.includes(change.key)) { results.push({ ok: false, summary: `Unknown setting ${String(change.key)}`, error: 'unknown key' }); continue }
        const current = config[change.key]
        const clean = sanitizeConfig(change.key, change.value, current as never)
        if (clean === null) { results.push({ ok: false, summary: summarize(change), error: 'invalid value' }); continue }
        const { data: old } = await db.from('site_config').select('value').eq('key', change.key).maybeSingle()
        const { error } = await db.from('site_config').upsert({ key: change.key, value: clean as unknown, updated_at: new Date().toISOString() })
        if (error) throw error
        await log(db, source, summarize(change), `config:${change.key}`, old?.value ?? null, clean)
        results.push({ ok: true, summary: summarize(change) })
        continue
      }

      if (!isVideoId(change.id)) { results.push({ ok: false, summary: 'Invalid video', error: 'bad id' }); continue }
      const { data: oldRow } = await db.from('track_overrides').select('*').eq('video_id', change.id).maybeSingle()

      if (change.target === 'track_reset') {
        if (oldRow && !oldRow.manual) {
          const { error } = await db.from('track_overrides').delete().eq('video_id', change.id)
          if (error) throw error
          await log(db, source, summarize(change), `track:${change.id}`, oldRow, null)
        }
        results.push({ ok: true, summary: summarize(change) })
        continue
      }
      if (change.target === 'track_remove') {
        if (oldRow?.manual) {
          const { error } = await db.from('track_overrides').delete().eq('video_id', change.id)
          if (error) throw error
          await log(db, source, summarize(change), `track:${change.id}`, oldRow, null)
          results.push({ ok: true, summary: summarize(change) })
        } else results.push({ ok: false, summary: summarize(change), error: 'only songs added by hand can be removed; hide the song instead' })
        continue
      }

      const patch = sanitizePatch(change.set, validMoods)
      if (!patch || !Object.keys(patch).length) { results.push({ ok: false, summary: summarize(change), error: 'nothing to change' }); continue }
      const row: Record<string, unknown> = { ...(oldRow || { video_id: change.id, manual: false, links: {} }), ...patch, updated_at: new Date().toISOString() }
      // a hand-added song always needs a title
      if (oldRow?.manual && !row.title && !row.name) row.title = 'Untitled'
      const { error } = await db.from('track_overrides').upsert(row)
      if (error) throw error
      await log(db, source, summarize(change, Object.keys(patch)), `track:${change.id}`, oldRow ?? null, row)
      results.push({ ok: true, summary: summarize(change, Object.keys(patch)) })
    } catch (error) {
      results.push({ ok: false, summary: summarize(change), error: error instanceof Error ? error.message : 'failed' })
    }
  }
  if (results.some((r) => r.ok)) revalidateSite()
  return results
}

export async function undoLog(db: SupabaseClient, id: number): Promise<ApplyResult> {
  const { data: entry } = await db.from('admin_log').select('*').eq('id', id).maybeSingle()
  if (!entry) return { ok: false, summary: 'Entry not found', error: 'not found' }
  const [kind, key] = String(entry.target).split(':')
  try {
    if (kind === 'track') {
      if (entry.before) { const { error } = await db.from('track_overrides').upsert(entry.before as Override); if (error) throw error }
      else { const { error } = await db.from('track_overrides').delete().eq('video_id', key); if (error) throw error }
    } else if (kind === 'config') {
      if (entry.before !== null && entry.before !== undefined) { const { error } = await db.from('site_config').upsert({ key, value: entry.before, updated_at: new Date().toISOString() }); if (error) throw error }
      else { const { error } = await db.from('site_config').delete().eq('key', key); if (error) throw error }
    } else return { ok: false, summary: 'Cannot undo', error: 'unknown target' }
    await log(db, 'undo', `Undid: ${entry.summary}`, entry.target, entry.after, entry.before)
    revalidateSite()
    return { ok: true, summary: `Undid: ${entry.summary}` }
  } catch (error) {
    return { ok: false, summary: 'Undo failed', error: error instanceof Error ? error.message : 'failed' }
  }
}

export type { SiteConfig }
