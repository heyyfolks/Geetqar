import './globals.css'
import './geetqar-refinement.css'
import './geetqar-polish.css'
import './geetqar-universe.css'
import type { Metadata } from 'next'
import { GeetqarExperienceConsole } from '@/components/geetqar-experience-console'
import { GeetqarMusicUniverse } from '@/components/geetqar-music-universe'

const icon = '/icon.svg?v=6'
const siteUrl = 'https://geetqar.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'GEETQAR | Independent Music Artist, Original Songs & Visuals', template: '%s | GEETQAR' },
  description: 'Official GEETQAR music world — original songs, music videos, visual experiments, lyrics and immersive listening experiences.',
  applicationName: 'GEETQAR',
  authors: [{ name: 'GEETQAR', url: siteUrl }],
  creator: 'GEETQAR',
  publisher: 'GEETQAR',
  category: 'music',
  keywords: ['GEETQAR', 'Geetqar music', 'Geetqar artist', 'Geetqar songs', 'Geetqar music artist', 'independent music', 'original songs', 'music visuals', 'R&B music'],
  alternates: { canonical: siteUrl },
  icons: { icon, shortcut: icon, apple: icon },
  openGraph: {
    title: 'GEETQAR | Independent Music Artist, Original Songs & Visuals',
    description: 'Listen to original GEETQAR songs and enter the visual world behind the music.',
    url: siteUrl,
    siteName: 'GEETQAR',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEETQAR | Independent Music Artist',
    description: 'Original songs, visuals and immersive music experiences from GEETQAR.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MusicGroup',
      '@id': `${siteUrl}/#artist`,
      name: 'GEETQAR',
      url: siteUrl,
      genre: ['R&B', 'Independent Music'],
      sameAs: ['https://www.instagram.com/geetqar/', 'https://www.youtube.com/@geetqar'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'GEETQAR',
      url: siteUrl,
      description: 'Official GEETQAR music world — original songs, visuals and immersive listening experiences.',
      publisher: { '@id': `${siteUrl}/#artist` },
      inLanguage: 'en',
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="grain">{children}<GeetqarMusicUniverse /><GeetqarExperienceConsole /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>
}
