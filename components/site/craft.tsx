'use client'

import { Instagram, Mail } from 'lucide-react'
import { splitEm } from '@/lib/site-config'
import { useSite } from '@/components/site/site-context'

const ROMAN = ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.']

function Heading({ text }: { text: string }) {
  return <>{splitEm(text).map((part, i) => (part.em ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>))}</>
}

export function Craft() {
  const { craft } = useSite()
  return (
    <section id="craft" className="gx-section" aria-labelledby="craft-title">
      <div className="gx-wrap">
        <p className="gx-kicker">04 / What I make</p>
        <h2 id="craft-title" className="gx-h2"><Heading text={craft.heading} /></h2>
        <p className="gx-lede">{craft.lede}</p>
        <div className="gx-craft">
          {craft.items.map((item, i) => (
            <article key={`${item.title}-${i}`} className="gx-card">
              <span className="n">{ROMAN[i] || `${i + 1}.`}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div className="tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Work() {
  const { work, links } = useSite()
  return (
    <section id="work" className="gx-section gx-work" aria-labelledby="work-title">
      <div className="gx-wrap gx-work-grid">
        <div>
          <p className="gx-kicker">05 / Work with me</p>
          <h2 id="work-title" className="gx-h2"><Heading text={work.heading} /></h2>
          <p className="gx-lede">{work.lede}</p>
          <div className="gx-cta-row">
            <a className="gx-btn gx-btn-solid" href={links.instagram} target="_blank" rel="noreferrer"><Instagram size={15} /> {work.ctaLabel}</a>
            {links.email && <a className="gx-btn gx-btn-line" href={`mailto:${links.email}`}><Mail size={15} /> EMAIL</a>}
          </div>
        </div>
        <ul className="gx-svc">
          {work.services.map((service, i) => (
            <li key={`${service.title}-${i}`}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
