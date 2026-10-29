import { Instagram, Youtube } from 'lucide-react'
import { subscribeUrl, type SiteConfig } from '@/lib/site-config'
import type { Track } from '@/lib/site'

export function FollowStrip({ latest, links }: { latest?: Track; links: SiteConfig['links'] }) {
  return (
    <section className="gx-follow" aria-labelledby="follow-title">
      <div className="gx-wrap gx-follow-in">
        <div>
          <p className="gx-kicker">Stay close</p>
          <h2 id="follow-title" className="gx-h2">Never miss <em>a drop.</em></h2>
          <p className="gx-lede">{latest ? <>Latest: <strong>{latest.name}</strong>. </> : null}New songs land on YouTube first. Subscribe so they show up in your feed, and follow on Instagram for clips and behind-the-scenes.</p>
        </div>
        <div className="gx-follow-btns">
          <a className="gx-btn gx-btn-solid" href={subscribeUrl(links.youtube)} target="_blank" rel="noreferrer"><Youtube size={16} /> SUBSCRIBE ON YOUTUBE</a>
          <a className="gx-btn gx-btn-line" href={links.instagram} target="_blank" rel="noreferrer"><Instagram size={16} /> FOLLOW ON INSTAGRAM</a>
        </div>
      </div>
    </section>
  )
}
