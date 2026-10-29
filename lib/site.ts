/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://geetqar.com) once a custom domain is attached. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://geetqar.vercel.app').replace(/\/$/, '')

/**
 * Uploads that should not appear on the site (matched against the YouTube title, case-insensitive).
 * Add a pattern here, or list video ids in the HIDDEN_VIDEOS env var (comma separated).
 */
/** IndexNow key (public by design): the same text must exist at /<key>.txt. */
export const INDEXNOW_KEY = '785bcc6f7666f2179ab410a117577a08'

/** Default hide rule: uploads titled only with a date (e.g. "July 24, 2024") are hidden unless the artist un-hides them in the admin panel. */
export const HIDDEN_TITLES: RegExp[] = [/^\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\s*$/i, /black\s*suit/i]

export const SOCIAL = {
  instagram: 'https://www.instagram.com/geetqar/',
  youtube: 'https://www.youtube.com/@geetqar',
  /** Opens YouTube's "Subscribe?" confirmation straight away. */
  subscribe: 'https://www.youtube.com/@geetqar?sub_confirmation=1',
} as const

export const NAV = [
  { href: '#music', label: 'MUSIC' },
  { href: '#moods', label: 'MOODS' },
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
  /** lyric lines for the lyric cards: from the admin panel, or parsed from the video description */
  lyrics: string[]
  /** full lyrics text with stanza breaks, for the song page */
  lyricsText?: string
  /** mood keys, set in the admin panel or guessed from the title */
  moods: string[]
  pinned?: boolean
  credits?: string
  links?: { spotify?: string; apple?: string; other?: string }
  /** artwork style override (index), if the artist picked one */
  artStyle?: number
}

/** Public wording for a track kind: "Single" is shown as "Original". */
export const kindLabel = (kind: string): string => (kind === 'Single' ? 'Original' : kind)
