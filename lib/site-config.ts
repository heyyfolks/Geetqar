import { DEFAULT_MOODS, EFFECTS, type Effect, type MoodDef } from './moods'

export type CraftItem = { title: string; text: string; tags: string[] }
export type Service = { title: string; text: string }
export type Faq = { q: string; a: string }

export type SiteConfig = {
  hero: { roles: string[]; tagline: string }
  craft: { heading: string; lede: string; items: CraftItem[] }
  work: { heading: string; lede: string; ctaLabel: string; services: Service[] }
  about: { intro: string; faq: Faq[] }
  links: { instagram: string; youtube: string; spotify: string; apple: string; unitedmasters: string; email: string }
  seo: { title: string; description: string; keywords: string }
  sections: { moods: boolean; cards: boolean; craft: boolean; work: boolean; follow: boolean; songs: boolean }
  announcement: { enabled: boolean; text: string; url: string }
  drop: { enabled: boolean; title: string; date: string; url: string }
  ambience: { enabled: boolean }
  moods: MoodDef[]
}

export type ConfigKey = keyof SiteConfig
export const CONFIG_KEYS: ConfigKey[] = ['hero', 'craft', 'work', 'about', 'links', 'seo', 'sections', 'announcement', 'drop', 'ambience', 'moods']

export const DEFAULT_CONFIG: SiteConfig = {
  hero: {
    roles: ['SONGWRITER', 'VOCALIST', 'PRODUCER', 'MIX + MASTER'],
    tagline: 'R&B, soul, drill, lo-fi and classical, in Hindi and English. Written, sung, produced and mastered by one artist. New songs appear here as soon as they go live on YouTube.',
  },
  craft: {
    heading: 'Made start to finish *by one artist.*',
    lede: 'Lyrics, vocals, production, mixing and mastering are all done by the same person, so each song sounds like one idea.',
    items: [
      { title: 'Writing', text: 'Lyrics in Hindi and English, written the way people actually talk. Hooks and verses that are easy to remember.', tags: ['Hindi', 'English', 'Hooks'] },
      { title: 'Singing', text: 'Soft R&B and soul vocals, with classical touches when the song calls for them.', tags: ['R&B', 'Soul', 'Classical'] },
      { title: 'Producing', text: 'Drill and lo-fi beats and slow sensual grooves, all built around the voice.', tags: ['Drill', 'Lo-fi', 'Slow jams'] },
      { title: 'Mix & Master', text: 'Clean low end, vocals that sit properly in the mix, and a loud master that is not crushed. Release-ready files.', tags: ['Mixing', 'Mastering', 'Vocal tuning'] },
      { title: 'Covers', text: 'Songs you already know, reworked in a new mood with a new arrangement.', tags: ['Reimagined', 'Acoustic', 'R&B'] },
      { title: 'Mixtapes', text: 'Full-length projects with a clear start, middle and end, made to be played in order.', tags: ['Projects', 'Concept', 'Sequencing'] },
    ],
  },
  work: {
    heading: 'Need help *finishing a song?*',
    lede: 'For artists, singers and anyone with an unfinished idea. Tell me what you are making and how it should feel. A direct message on Instagram is the fastest way to reach me.',
    ctaLabel: 'DM ON INSTAGRAM',
    services: [
      { title: 'Mix & master your track', text: 'Send your stems or a rough mix. Get back a balanced, loud, release-ready master.' },
      { title: 'Write it, sing it', text: 'A hook, verses or a full song in Hindi or English, with a guide vocal or the final take.' },
      { title: 'Custom cover or mixtape', text: 'A reimagined cover, or a whole project built around your idea.' },
      { title: 'Beat + production', text: 'Drill, lo-fi or R&B production tailored to your voice.' },
    ],
  },
  about: {
    intro: 'An independent artist who writes, sings, produces, mixes and masters his own music, and also makes covers and mixtapes. Everything here comes straight from the official YouTube channel.',
    faq: [
      { q: 'Who is GEETQAR?', a: 'GEETQAR (गीतकार) is an independent music artist. He writes the songs, sings them, produces them, and also mixes and masters them himself.' },
      { q: 'What does GEETQAR mean?', a: 'Geetkar (गीतकार) is the Hindi word for a songwriter or lyricist. GEETQAR is that word written the way he spells it as a stage name.' },
      { q: 'What kind of music does GEETQAR make?', a: 'R&B, soul, drill, lo-fi and classical, including slow and sensual tracks, plus covers and mixtapes. Songs mix Hindi and English.' },
      { q: 'Where can I listen to GEETQAR?', a: 'Every release is on the official YouTube channel and plays on the home page of this site. New uploads appear here automatically.' },
      { q: 'Does GEETQAR take mixing and mastering work?', a: 'Yes. Mixing and mastering, writing, vocals, production and custom covers are all available. The fastest way to reach him is a direct message on Instagram.' },
    ],
  },
  links: { instagram: 'https://www.instagram.com/geetqar/', youtube: 'https://www.youtube.com/@geetqar', spotify: '', apple: '', unitedmasters: '', email: '' },
  seo: {
    title: 'GEETQAR (गीतकार) | Official Site: Songs, Lyrics & Videos',
    description: 'Official website of GEETQAR (गीतकार), an independent artist who writes, sings, produces, mixes and masters his own R&B, soul, drill, lo-fi and classical music. Listen, watch videos and read lyrics.',
    keywords: 'GEETQAR, Geetqar, गीतकार, Geetqar songs, Geetqar lyrics, Hindi R&B, lo-fi, drill, soul, independent artist, songwriter, music producer, mix and master, covers, mixtape',
  },
  sections: { moods: true, cards: true, craft: true, work: true, follow: true, songs: true },
  announcement: { enabled: false, text: '', url: '' },
  drop: { enabled: false, title: '', date: '', url: '' },
  ambience: { enabled: true },
  moods: DEFAULT_MOODS,
}

/* ---------- validation: the same rules apply to the admin forms and to the AI assistant ---------- */

const str = (v: unknown, max: number, fallback = ''): string => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : fallback)
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
const url = (v: unknown): string => {
  const s = str(v, 300)
  return /^https:\/\/[^\s]+$/i.test(s) ? s : ''
}
const color = (v: unknown, fallback: string): string => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toLowerCase() : fallback)
const list = <T,>(v: unknown, max: number, map: (item: unknown) => T | null): T[] => (Array.isArray(v) ? v.slice(0, max).map(map).filter((x): x is T => x !== null) : [])

export function slugKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'mood'
}

/** Returns a cleaned value for one config key, or null if the input is not usable. Missing fields keep their current value. */
export function sanitizeConfig<K extends ConfigKey>(key: K, input: unknown, current: SiteConfig[K]): SiteConfig[K] | null {
  if (input === null || typeof input !== 'object') return null
  const v = input as Record<string, unknown>
  const cur = current as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (key) {
    case 'hero': {
      const roles = 'roles' in v ? list(v.roles, 6, (x) => str(x, 24) || null) : cur.roles
      return { roles: roles.length ? roles : cur.roles, tagline: 'tagline' in v ? str(v.tagline, 400, cur.tagline) : cur.tagline } as SiteConfig[K]
    }
    case 'craft': {
      const items = 'items' in v ? list(v.items, 9, (x): CraftItem | null => {
        const o = (x || {}) as Record<string, unknown>
        const title = str(o.title, 40)
        return title ? { title, text: str(o.text, 280), tags: list(o.tags, 5, (t) => str(t, 20) || null) } : null
      }) : cur.items
      return { heading: 'heading' in v ? str(v.heading, 120, cur.heading) : cur.heading, lede: 'lede' in v ? str(v.lede, 400, cur.lede) : cur.lede, items } as SiteConfig[K]
    }
    case 'work': {
      const services = 'services' in v ? list(v.services, 8, (x): Service | null => {
        const o = (x || {}) as Record<string, unknown>
        const title = str(o.title, 60)
        return title ? { title, text: str(o.text, 240) } : null
      }) : cur.services
      return { heading: 'heading' in v ? str(v.heading, 120, cur.heading) : cur.heading, lede: 'lede' in v ? str(v.lede, 400, cur.lede) : cur.lede, ctaLabel: 'ctaLabel' in v ? str(v.ctaLabel, 30, cur.ctaLabel) : cur.ctaLabel, services } as SiteConfig[K]
    }
    case 'about': {
      const faq = 'faq' in v ? list(v.faq, 12, (x): Faq | null => {
        const o = (x || {}) as Record<string, unknown>
        const q = str(o.q, 140), a = str(o.a, 600)
        return q && a ? { q, a } : null
      }) : cur.faq
      return { intro: 'intro' in v ? str(v.intro, 700, cur.intro) : cur.intro, faq } as SiteConfig[K]
    }
    case 'links': {
      const email = 'email' in v ? str(v.email, 120) : cur.email
      const out: Record<string, string> = {}
      for (const k of ['instagram', 'youtube', 'spotify', 'apple', 'unitedmasters']) out[k] = k in v ? url(v[k]) : cur[k]
      if (!out.instagram) out.instagram = cur.instagram
      if (!out.youtube) out.youtube = cur.youtube
      out.email = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : cur.email
      return out as SiteConfig[K]
    }
    case 'seo':
      return { title: 'title' in v ? str(v.title, 90, cur.title) : cur.title, description: 'description' in v ? str(v.description, 200, cur.description) : cur.description, keywords: 'keywords' in v ? str(v.keywords, 400, cur.keywords) : cur.keywords } as SiteConfig[K]
    case 'sections': {
      const out: Record<string, boolean> = {}
      for (const k of ['moods', 'cards', 'craft', 'work', 'follow', 'songs']) out[k] = bool(v[k], cur[k])
      return out as SiteConfig[K]
    }
    case 'announcement':
      return { enabled: bool(v.enabled, cur.enabled), text: 'text' in v ? str(v.text, 160) : cur.text, url: 'url' in v ? url(v.url) : cur.url } as SiteConfig[K]
    case 'drop': {
      const date = 'date' in v ? str(v.date, 40) : cur.date
      return { enabled: bool(v.enabled, cur.enabled), title: 'title' in v ? str(v.title, 80) : cur.title, date: Number.isNaN(Date.parse(date)) ? '' : date, url: 'url' in v ? url(v.url) : cur.url } as SiteConfig[K]
    }
    case 'ambience':
      return { enabled: bool(v.enabled, cur.enabled) } as SiteConfig[K]
    case 'moods': {
      const arr = Array.isArray(input) ? input : Array.isArray(v.moods) ? v.moods : null
      if (!arr) return null
      const seen = new Set<string>()
      const moods = list(arr, 12, (x): MoodDef | null => {
        const o = (x || {}) as Record<string, unknown>
        const label = str(o.label, 28)
        if (!label) return null
        let key = typeof o.key === 'string' && /^[a-z0-9-]{2,24}$/.test(o.key) ? o.key : slugKey(label)
        while (seen.has(key)) key = `${key.slice(0, 20)}-${seen.size}`
        seen.add(key)
        return { key, label, line: str(o.line, 60), c1: color(o.c1, '#ff6a3d'), c2: color(o.c2, '#8a2146'), effect: EFFECTS.includes(o.effect as Effect) ? (o.effect as Effect) : 'none' }
      })
      return (moods.length ? moods : null) as SiteConfig[K] | null
    }
  }
  return null
}

/** "Made *by one artist.*": text between asterisks is shown in the italic accent style. */
export function splitEm(text: string): { text: string; em: boolean }[] {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part) => (part.startsWith('*') && part.endsWith('*') ? { text: part.slice(1, -1), em: true } : { text: part, em: false }))
}

export function subscribeUrl(youtube: string): string {
  return `${youtube}${youtube.includes('?') ? '&' : '?'}sub_confirmation=1`
}

export type NavItem = { href: string; label: string }

/** Navigation links for sections that are switched on. */
export function navItems(sections: SiteConfig['sections']): NavItem[] {
  const all: [boolean, NavItem][] = [
    [true, { href: '#music', label: 'MUSIC' }],
    [sections.moods, { href: '#moods', label: 'MOODS' }],
    [sections.cards, { href: '#cards', label: 'LYRIC CARDS' }],
    [sections.craft, { href: '#craft', label: 'WHAT I MAKE' }],
    [sections.work, { href: '#work', label: 'WORK WITH ME' }],
    [true, { href: '/about', label: 'ABOUT' }],
  ]
  return all.filter(([on]) => on).map(([, item]) => item)
}
