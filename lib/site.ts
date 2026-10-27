export const SOCIAL = {
  instagram: 'https://www.instagram.com/geetqar/',
  youtube: 'https://www.youtube.com/@geetqar',
} as const

export const NAV = [
  { href: '#music', label: 'MUSIC' },
  { href: '#watch', label: 'WATCH' },
  { href: '#craft', label: 'THE CRAFT' },
  { href: '#work', label: 'WORK WITH ME' },
  { href: '#room', label: 'LIVE ROOM' },
] as const

export type Song = {
  id: string
  title: string
  slug: string
  youtube?: string
  instagram?: string
  description?: string
  coverUrl?: string
  featured?: boolean
  releaseDate?: string
  genre?: string
  mood?: string[]
}

export type YTVideo = { id: string; title: string; published?: string }
