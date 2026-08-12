import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'GEETQAR — Music Beyond Sound', description: 'Official music universe of Geetqar.' }

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body className="grain">{children}</body></html> }