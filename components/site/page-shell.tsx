import { Instagram, Youtube } from 'lucide-react'
import { NAV, SOCIAL } from '@/lib/site'
import { SiteFooter } from '@/components/site/footer'

const abs = (href: string) => (href.startsWith('#') ? `/${href}` : href)

/** Header + footer for inner pages (song pages, About). The home page has its own scrolling nav. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="gx-nav is-scrolled">
        <div className="gx-wrap gx-nav-in">
          <a href="/" className="gx-logo" aria-label="GEETQAR home">GEET<i>qar</i></a>
          <nav className="gx-links gx-sublinks" aria-label="Primary">
            {NAV.map((item) => <a key={item.href} href={abs(item.href)}>{item.label}</a>)}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a className="jelly-icon" href={SOCIAL.instagram} target="_blank" rel="noreferrer" aria-label="GEETQAR on Instagram"><Instagram size={16} /></a>
            <a className="jelly-icon" href={SOCIAL.youtube} target="_blank" rel="noreferrer" aria-label="GEETQAR on YouTube"><Youtube size={16} /></a>
          </div>
        </div>
      </header>
      <main className="gx-page">{children}</main>
      <SiteFooter />
    </>
  )
}
