import type { Track } from './site'

export type Effect = 'stars' | 'rain' | 'petals' | 'embers' | 'sparks' | 'dust' | 'none'
export const EFFECTS: Effect[] = ['stars', 'rain', 'petals', 'embers', 'sparks', 'dust', 'none']

export type MoodDef = { key: string; label: string; line: string; c1: string; c2: string; effect: Effect }

export const DEFAULT_MOODS: MoodDef[] = [
  { key: 'night', label: 'Late night', line: 'Lights off. Headphones on.', c1: '#6a78ff', c2: '#1d1148', effect: 'stars' },
  { key: 'heartbreak', label: 'Heartbreak', line: 'For when it still hurts.', c1: '#4aa8ff', c2: '#102a52', effect: 'rain' },
  { key: 'love', label: 'Love', line: 'Say it softly.', c1: '#ff5c8a', c2: '#6b1030', effect: 'petals' },
  { key: 'sensual', label: 'Slow & sensual', line: 'Low light. Slow tempo.', c1: '#ff6a3d', c2: '#8a2146', effect: 'embers' },
  { key: 'energy', label: 'Energy', line: 'Turn it up.', c1: '#ffc83d', c2: '#8a2a00', effect: 'sparks' },
  { key: 'sacred', label: 'Classical & devotional', line: 'Old sounds, new voice.', c1: '#ffb454', c2: '#5a2f0a', effect: 'dust' },
]

/**
 * First-guess moods from the title. Only strong keywords are used on purpose; the artist fixes the rest in the admin panel,
 * and whatever is set there always wins over this guess.
 */
const RULES: [RegExp, string][] = [
  [/velvet|sensual|slow jam|intimate/, 'sensual'],
  [/roopmalli|yahin hoon|\blove\b|pyaar|ishq|mohabbat/, 'love'],
  [/saiyaara|alvida|dardeh?|judai|bewafa|broken|\bmiss\b|stolen/, 'heartbreak'],
  [/delhi metro|\bdark\b|cosmos|night|raat|finding|lo-?fi|\bloop\b|dream|rain/, 'night'],
  [/pehli likhai|maharaja|\brap\b|drill|popfused|medley|hindustan|bharat/, 'energy'],
  [/shiv|shakti|bhajan|devotional|mantra|\braga\b|classical/, 'sacred'],
]

export function autoMoods(track: Pick<Track, 'title' | 'name'>, validKeys: string[]): string[] {
  const text = `${track.title} ${track.name}`.toLowerCase()
  const found = new Set<string>()
  for (const [pattern, key] of RULES) if (validKeys.includes(key) && pattern.test(text)) found.add(key)
  if (found.size) return Array.from(found)
  return validKeys.length ? [validKeys.includes('night') ? 'night' : validKeys[0]] : []
}

/** The mood that suits the visitor's local hour. */
export function moodForHour(hour: number, validKeys: string[]): string {
  const want = hour >= 22 || hour < 5 ? 'night' : hour < 11 ? 'sacred' : hour < 17 ? 'energy' : 'love'
  return validKeys.includes(want) ? want : validKeys[0]
}

export function hourLabel(date: Date): string {
  return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
}
