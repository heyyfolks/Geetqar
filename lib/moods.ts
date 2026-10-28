import type { Track } from './site'

export type MoodKey = 'night' | 'heartbreak' | 'love' | 'sensual' | 'energy' | 'sacred'

export type Mood = { key: MoodKey; label: string; line: string; c1: string; c2: string }

export const MOODS: Mood[] = [
  { key: 'night', label: 'Late night', line: 'Lights off. Headphones on.', c1: '#6a78ff', c2: '#1d1148' },
  { key: 'heartbreak', label: 'Heartbreak', line: 'For when it still hurts.', c1: '#4aa8ff', c2: '#102a52' },
  { key: 'love', label: 'Love', line: 'Say it softly.', c1: '#ff5c8a', c2: '#6b1030' },
  { key: 'sensual', label: 'Slow & sensual', line: 'Low light. Slow tempo.', c1: '#ff6a3d', c2: '#8a2146' },
  { key: 'energy', label: 'Energy', line: 'Turn it up.', c1: '#ffc83d', c2: '#8a2a00' },
  { key: 'sacred', label: 'Classical & devotional', line: 'Old sounds, new voice.', c1: '#ffb454', c2: '#5a2f0a' },
]

/**
 * Which moods a track belongs to. Rules read the title and description, so new uploads are placed automatically.
 * To pin a song to a mood, add a word from its title to a rule below.
 */
const RULES: [RegExp, MoodKey[]][] = [
  [/velvet|ang laga|pehle bhi|sensual|slow jam|intimate|animal/, ['sensual']],
  [/roopmalli|yahin hoon|love|pyaar|ishq|mohabbat|saiyaara|teri kami/, ['love']],
  [/saiyaara|alvida|dard|dardeh|judai|bewafa|stolen|broken|miss|alone/, ['heartbreak']],
  [/delhi metro|dark|cosmos|night|raat|finding|lo-?fi|loop|dream|rain/, ['night']],
  [/pehli likhai|maharaja|rap|drill|popfused|medley|hindustan|bharat|mashup|energy|hit/, ['energy']],
  [/shiv|shakti|sun saiba|raga|classical|bhajan|aarti|evolution|lata|devotional/, ['sacred']],
]

export function moodsOf(track: Pick<Track, 'title' | 'name' | 'description'>): MoodKey[] {
  const text = `${track.title} ${track.name} ${track.description.slice(0, 300)}`.toLowerCase()
  const found = new Set<MoodKey>()
  for (const [pattern, keys] of RULES) if (pattern.test(text)) keys.forEach((key) => found.add(key))
  return found.size ? Array.from(found) : ['night']
}

/** The mood that suits the visitor's local hour. */
export function moodForHour(hour: number): MoodKey {
  if (hour >= 22 || hour < 5) return 'night'
  if (hour < 11) return 'sacred'
  if (hour < 17) return 'energy'
  return 'love'
}

export function hourLabel(date: Date): string {
  return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
}
