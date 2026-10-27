import './globals.css'
import type { Metadata, Viewport } from 'next'
import { GlobalAudioDock } from '@/components/global-audio-dock'

const icon = '/icon.svg?v=7'
const siteUrl = 'https://geetqar.vercel.app'
const title = 'GEETQAR | Songwriter, Singer & Producer'
const description = 'GEETQAR (गीतकार) writes, sings, produces, mixes and masters original Hinglish R&B, soul, drill and lo-fi. Listen, watch, and work with him.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | GEETQAR' },
  description,
  applicationName: 'GEETQAR',
  authors: [{ name: 'GEETQAR', url: siteUrl }],
  creator: 'GEETQAR',
  category: 'music',
  keywords: ['GEETQAR', 'Geetqar', 'Hinglish R&B', 'independent artist', 'songwriter', 'music producer', 'mix and master', 'covers', 'mixtape', 'lo-fi', 'drill', 'soul'],
  alternates: { canonical: siteUrl },
  icons: { icon, shortcut: icon, apple: icon },
  openGraph: { title, description, url: siteUrl, siteName: 'GEETQAR', type: 'website', locale: 'en_IN' },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
}

export const viewport: Viewport = { themeColor: '#0b0709', colorScheme: 'dark' }

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MusicGroup',
      '@id': `${siteUrl}/#artist`,
      name: 'GEETQAR',
      alternateName: 'गीतकार',
      url: siteUrl,
      genre: ['R&B', 'Soul', 'Drill', 'Lo-fi', 'Hindi'],
      sameAs: ['https://www.instagram.com/geetqar/', 'https://www.youtube.com/@geetqar'],
    },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'GEETQAR', url: siteUrl, description, publisher: { '@id': `${siteUrl}/#artist` }, inLanguage: ['en', 'hi'] },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Manrope:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Tiro+Devanagari+Hindi&display=swap"
        />
      </head>
      <body>
        {children}
        <GlobalAudioDock />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  )
}
