import { Instagram } from 'lucide-react'
import { SOCIAL } from '@/lib/site'

const CRAFT = [
  { n: 'i.', title: 'Writing', text: 'Lyrics that sound like a real late-night text, not a poem for an exam. Hinglish first, always honest.', tags: ['Hinglish', 'Hooks', 'Verses'] },
  { n: 'ii.', title: 'Singing', text: 'Soft R&B runs, soul, and the occasional classical turn when the song asks for it.', tags: ['R&B', 'Soul', 'Classical'] },
  { n: 'iii.', title: 'Producing', text: 'Drill drums, lo-fi warmth, slow sensual grooves. Beats built around the voice, not on top of it.', tags: ['Drill', 'Lo-fi', 'Slow jams'] },
  { n: 'iv.', title: 'Mix & Master', text: 'Clean low end, vocals that sit right, loud without being crushed. Release-ready files.', tags: ['Mixing', 'Mastering', 'Vocal tuning'] },
  { n: 'v.', title: 'Covers', text: 'Songs you already love, rebuilt in a different mood. Same lyrics, new late-night skin.', tags: ['Reimagined', 'Acoustic', 'R&B flips'] },
  { n: 'vi.', title: 'Mixtapes', text: 'Full-length projects with a start, a middle and an end. Made to be played in order.', tags: ['Projects', 'Concept', 'Sequencing'] },
]

export function Craft() {
  return (
    <section id="craft" className="gx-section" aria-labelledby="craft-title">
      <div className="gx-wrap">
        <p className="gx-kicker">03 / The craft</p>
        <h2 id="craft-title" className="gx-h2">One person. <em>Whole record.</em></h2>
        <p className="gx-lede">From the first line in the notes app to the final master, everything is made in-house. That is why it all sounds like it belongs together.</p>
        <div className="gx-craft">
          {CRAFT.map((item) => (
            <article key={item.title} className="gx-card">
              <span className="n">{item.n}</span>
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

const SERVICES = [
  { n: '01', title: 'Mix & master your track', text: 'Send your stems or a rough mix. Get back a balanced, loud, release-ready master.' },
  { n: '02', title: 'Write it, sing it', text: 'Hook, verses or a full song in Hinglish, with a guide vocal or the final take.' },
  { n: '03', title: 'Custom cover or mixtape', text: 'A reimagined cover, or a whole project built around your idea.' },
  { n: '04', title: 'Beat + production', text: 'Drill, lo-fi or R&B production tailored to your voice.' },
]

export function Work() {
  return (
    <section id="work" className="gx-section gx-work" aria-labelledby="work-title">
      <div className="gx-wrap gx-work-grid">
        <div>
          <p className="gx-kicker">04 / Work with me</p>
          <h2 id="work-title" className="gx-h2">Got a song <em>that needs a finish?</em></h2>
          <p className="gx-lede">Artists, singers, and anyone with a half-finished idea. Tell me what you are making and what you want it to feel like. DM is the fastest way.</p>
          <div className="gx-cta-row">
            <a className="gx-btn gx-btn-solid" href={SOCIAL.instagram} target="_blank" rel="noreferrer"><Instagram size={15} /> DM ON INSTAGRAM</a>
          </div>
        </div>
        <ul className="gx-svc">
          {SERVICES.map((service) => (
            <li key={service.n}>
              <b>{service.n}</b>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
