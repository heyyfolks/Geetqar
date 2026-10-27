export const SOCIAL = {
  instagram: 'https://www.instagram.com/geetqar/',
  youtube: 'https://www.youtube.com/@geetqar',
} as const

export const NAV = [
  { href: '#music', label: 'MUSIC' },
  { href: '#craft', label: 'THE CRAFT' },
  { href: '#work', label: 'WORK WITH ME' },
  { href: '#room', label: 'LIVE ROOM' },
] as const

export type TrackKind = 'Official Audio' | 'Music Video' | 'Lyric Video' | 'Cover' | 'Mashup' | 'Single'

/** One upload from the YouTube channel, cleaned up for display. */
export type Track = {
  id: string
  /** original YouTube title */
  title: string
  /** cleaned display name (hashtags, "| Geetqar", "(Official Audio)" removed) */
  name: string
  kind: TrackKind
  published: string
  views: number
  description: string
}
