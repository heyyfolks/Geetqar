import './globals.css'
import type { Metadata } from 'next'

const icon = '/icon.svg?v=4'

export const metadata: Metadata = {
  title: 'GEETQAR — Music Beyond Sound',
  description: 'The official music universe of Geetqar — originals, community listening, recommendations and conversations.',
  metadataBase: new URL('https://geetqar.vercel.app'),
  icons: { icon, shortcut: icon, apple: icon },
  openGraph: {
    title: 'GEETQAR — Music Beyond Sound',
    description: 'Listen. Discover. Participate.',
    url: 'https://geetqar.vercel.app',
    siteName: 'GEETQAR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEETQAR — Music Beyond Sound',
    description: 'The official music universe of Geetqar.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="grain">{children}</body></html>
}
