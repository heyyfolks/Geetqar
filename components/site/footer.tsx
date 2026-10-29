import type { NavItem, SiteConfig } from '@/lib/site-config'

export function SiteFooter({ links, items }: { links: SiteConfig['links']; items: NavItem[] }) {
  const abs = (href: string) => href
  const extra: [string, string][] = [['SPOTIFY', links.spotify], ['APPLE MUSIC', links.apple], ['UNITEDMASTERS', links.unitedmasters]]
  return (
    <footer className="gx-foot">
      <div className="gx-wrap">
        <p className="gx-foot-big" aria-hidden="true">GEET<em>qar</em></p>
        <div className="gx-foot-row">
          <nav aria-label="Footer">{items.map((item) => <a key={item.href} href={abs(item.href)}>{item.label}</a>)}</nav>
          <div>
            <a href={links.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
            <a href={links.youtube} target="_blank" rel="noreferrer">YOUTUBE ↗</a>
            {extra.filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}
          </div>
          <span>© {new Date().getFullYear()} GEETQAR · गीतकार</span>
        </div>
      </div>
    </footer>
  )
}
