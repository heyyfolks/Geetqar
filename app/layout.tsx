import './globals.css'
import type { Metadata, Viewport } from 'next'
import { GlobalAudioDock } from '@/components/global-audio-dock'
import { getConfig } from '@/lib/config'
import { SITE_URL } from '@/lib/site'

const icon = '/icon.svg?v=7'
const siteUrl = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getConfig()
  const keywords = seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title, template: '%s | GEETQAR' },
    description: seo.description,
    applicationName: 'GEETQAR',
    authors: [{ name: 'GEETQAR', url: siteUrl }],
    creator: 'GEETQAR',
    category: 'music',
    keywords,
    alternates: { canonical: '/' },
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: { title: seo.title, description: seo.description, url: '/', siteName: 'GEETQAR', type: 'website', locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined, other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  }
}

export const viewport: Viewport = { themeColor: '#0b0709', colorScheme: 'dark' }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { links, seo } = await getConfig()
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
        sameAs: [links.instagram, links.youtube, links.spotify, links.apple, links.unitedmasters].filter(Boolean),
      },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'GEETQAR', url: siteUrl, description: seo.description, publisher: { '@id': `${siteUrl}/#artist` }, inLanguage: ['en', 'hi'] },
    ],
  }
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
