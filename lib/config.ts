import { cache } from 'react'
import { adminDb } from './db'
import { CONFIG_KEYS, DEFAULT_CONFIG, sanitizeConfig, type ConfigKey, type SiteConfig } from './site-config'

/** The `moods` config is stored as an array; the other keys are objects. */
function merge<K extends ConfigKey>(key: K, stored: unknown): SiteConfig[K] {
  const base = DEFAULT_CONFIG[key]
  if (stored === undefined || stored === null) return base
  const clean = sanitizeConfig(key, stored, base)
  return clean ?? base
}

export const getConfig = cache(async (fresh = false): Promise<SiteConfig> => {
  const out: SiteConfig = { ...DEFAULT_CONFIG }
  const db = adminDb(!fresh)
  if (!db) return out
  try {
    const { data } = await db.from('site_config').select('key,value').in('key', CONFIG_KEYS)
    for (const row of data || []) {
      const key = row.key as ConfigKey
      ;(out as Record<string, unknown>)[key] = merge(key, row.value)
    }
  } catch {}
  return out
})

