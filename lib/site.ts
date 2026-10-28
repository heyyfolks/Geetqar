/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://geetqar.com) once a custom domain is attached. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://geetqar.vercel.app').replace(/\/$/, '')

/**
 * Uploads that should not appear on the site (matched against the YouTube title, case-insensitive).
 * Add a pattern here, or list video ids in the HIDDEN_VIDEOS env var (comma separated).
 */
export const HIDDEN_TITLES: RegExp[] = [/^\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\s*$/i, /black\s*suit/i]

export const SOCIAL = {
  instagram: 'https://www.instagram.com/geetqar/',
  youtube: 'https://www.youtube.com/@geetqar',
} as const

export const NAV = [
  { href: '#music', label: 'MUSIC' },
  { href: '#cards', label: 'LYRIC CARDS' },
  { href: '#craft', label: 'WHAT I MAKE' },
  { href: '#work', label: 'WORK WITH ME' },
  { href: '/about', label: 'ABOUT' },
] as const

export type TrackKind = 'Official Audio' | 'Music Video' | 'Lyric Video' | 'Cover' | 'Mashup' | 'Single'

/** One upload from the YouTube channel, cleaned up for display. */
export type Track = {
  id: string
  /** url slug for /songs/[slug] */
  slug: string
  /** original YouTube title */
  title: string
  /** cleaned display name (hashtags, "| Geetqar", "(Official Audio)" removed) */
  name: string
  kind: TrackKind
  published: string
  views: number
  description: string
  /** lyric lines parsed from the video description, if the artist pasted them there */
  lyrics: string[]
}
