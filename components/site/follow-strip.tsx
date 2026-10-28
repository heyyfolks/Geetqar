import { Instagram, Youtube } from 'lucide-react'
import { SOCIAL, type Track } from '@/lib/site'

export function FollowStrip({ latest }: { latest?: Track }) {
  return (
    <section className="gx-follow" aria-labelledby="follow-title">
      <div className="gx-wrap gx-follow-in">
        <div>
          <p className="gx-kicker">Stay close</p>
          <h2 id="follow-title" className="gx-h2">Never miss <em>a drop.</em></h2>
          <p className="gx-lede">{latest ? <>Latest: <strong>{latest.name}</strong>. </> : null}New songs land on YouTube first. Subscribe so they show up in your feed, and follow on Instagram for clips and behind-the-scenes.</p>
        </div>
        <div className="gx-follow-btns">
          <a className="gx-btn gx-btn-solid" href={SOCIAL.subscribe} target="_blank" rel="noreferrer"><Youtube size={16} /> SUBSCRIBE ON YOUTUBE</a>
          <a className="gx-btn gx-btn-line" href={SOCIAL.instagram} target="_blank" rel="noreferrer"><Instagram size={16} /> FOLLOW ON INSTAGRAM</a>
        </div>
      </div>
    </section>
  )
}
