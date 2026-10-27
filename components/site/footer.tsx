import { NAV, SOCIAL } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="gx-foot">
      <div className="gx-wrap">
        <p className="gx-foot-big" aria-hidden="true">GEET<em>qar</em></p>
        <div className="gx-foot-row">
          <nav aria-label="Footer">{NAV.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
          <div>
            <a href={SOCIAL.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
            <a href={SOCIAL.youtube} target="_blank" rel="noreferrer">YOUTUBE ↗</a>
          </div>
          <span>© {new Date().getFullYear()} GEETQAR · गीतकार</span>
        </div>
      </div>
    </footer>
  )
}
