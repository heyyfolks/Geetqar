import './globals.css'
import type { Metadata, Viewport } from 'next'
import { GlobalAudioDock } from '@/components/global-audio-dock'
import { SITE_URL, SOCIAL } from '@/lib/site'

const icon = '/icon.svg?v=7'
const siteUrl = SITE_URL
const title = 'GEETQAR (गीतकार) | Official Site: Songs, Lyrics & Videos'
const description = 'Official website of GEETQAR (गीतकार), an independent artist who writes, sings, produces, mixes and masters his own R&B, soul, drill, lo-fi and classical music. Listen, watch videos and read lyrics.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | GEETQAR' },
  description,
  applicationName: 'GEETQAR',
  authors: [{ name: 'GEETQAR', url: siteUrl }],
  creator: 'GEETQAR',
  category: 'music',
  keywords: ['GEETQAR', 'Geetqar', 'गीतकार', 'Geetqar songs', 'Geetqar lyrics', 'Hindi R&B', 'lo-fi', 'drill', 'soul', 'independent artist', 'songwriter', 'music producer', 'mix and master', 'covers', 'mixtape'],
  alternates: { canonical: '/' },
  icons: { icon, shortcut: icon, apple: icon },
  openGraph: { title, description, url: '/', siteName: 'GEETQAR', type: 'website', locale: 'en_IN' },
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
      alternateName: ['गीतकार', 'Geetqar'],
      url: siteUrl,
      genre: ['R&B', 'Soul', 'Drill', 'Lo-fi', 'Classical', 'Hindi'],
      sameAs: [SOCIAL.instagram, SOCIAL.youtube],
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
