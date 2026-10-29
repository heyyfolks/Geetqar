import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = { title: 'Control room', robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="ad-root">{children}</div>
}
