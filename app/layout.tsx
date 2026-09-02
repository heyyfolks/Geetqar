import './globals.css'
import './geetqar-refinement.css'
import './geetqar-polish.css'
import type { Metadata } from 'next'

const icon = '/icon.svg?v=5'
const siteUrl = 'https://geetqar.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'GEETQAR — Music Beyond Sound', template: '%s — GEETQAR' },
  description: 'Enter the official GEETQAR music world — original songs, visuals, live listening and unreleased experiments.',
  applicationName: 'GEETQAR',
  creator: 'GEETQAR',
  publisher: 'GEETQAR',
  keywords: ['GEETQAR', 'Geetqar music', 'Geetqar artist', 'independent music', 'R&B', 'original music'],
  alternates: { canonical: siteUrl },
  icons: { icon, shortcut: icon, apple: icon },
  openGraph: { title: 'GEETQAR — Music Beyond Sound', description: 'Listen. See it move. Enter the GEETQAR world.', url: siteUrl, siteName: 'GEETQAR', type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: 'GEETQAR — Music Beyond Sound', description: 'The official GEETQAR music world.' },
  robots: { index: true, follow: true },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: 'GEETQAR',
  url: siteUrl,
  sameAs: ['https://www.instagram.com/geetqar/', 'https://www.youtube.com/@geetqar'],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="grain">{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>
}
