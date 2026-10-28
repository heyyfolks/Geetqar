import { Instagram } from 'lucide-react'
import { SOCIAL } from '@/lib/site'

const CRAFT = [
  { n: 'i.', title: 'Writing', text: 'Lyrics in Hindi and English, written the way people actually talk. Hooks and verses that are easy to remember.', tags: ['Hindi', 'English', 'Hooks'] },
  { n: 'ii.', title: 'Singing', text: 'Soft R&B and soul vocals, with classical touches when the song calls for them.', tags: ['R&B', 'Soul', 'Classical'] },
  { n: 'iii.', title: 'Producing', text: 'Drill and lo-fi beats and slow sensual grooves, all built around the voice.', tags: ['Drill', 'Lo-fi', 'Slow jams'] },
  { n: 'iv.', title: 'Mix & Master', text: 'Clean low end, vocals that sit properly in the mix, and a loud master that is not crushed. Release-ready files.', tags: ['Mixing', 'Mastering', 'Vocal tuning'] },
  { n: 'v.', title: 'Covers', text: 'Songs you already know, reworked in a new mood with a new arrangement.', tags: ['Reimagined', 'Acoustic', 'R&B'] },
  { n: 'vi.', title: 'Mixtapes', text: 'Full-length projects with a clear start, middle and end, made to be played in order.', tags: ['Projects', 'Concept', 'Sequencing'] },
]

export function Craft() {
  return (
    <section id="craft" className="gx-section" aria-labelledby="craft-title">
      <div className="gx-wrap">
        <p className="gx-kicker">04 / What I make</p>
        <h2 id="craft-title" className="gx-h2">Made start to finish <em>by one artist.</em></h2>
        <p className="gx-lede">Lyrics, vocals, production, mixing and mastering are all done by the same person, so each song sounds like one idea.</p>
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
  { n: '02', title: 'Write it, sing it', text: 'A hook, verses or a full song in Hindi or English, with a guide vocal or the final take.' },
  { n: '03', title: 'Custom cover or mixtape', text: 'A reimagined cover, or a whole project built around your idea.' },
  { n: '04', title: 'Beat + production', text: 'Drill, lo-fi or R&B production tailored to your voice.' },
]

export function Work() {
  return (
    <section id="work" className="gx-section gx-work" aria-labelledby="work-title">
      <div className="gx-wrap gx-work-grid">
        <div>
          <p className="gx-kicker">05 / Work with me</p>
          <h2 id="work-title" className="gx-h2">Need help <em>finishing a song?</em></h2>
          <p className="gx-lede">For artists, singers and anyone with an unfinished idea. Tell me what you are making and how it should feel. A direct message on Instagram is the fastest way to reach me.</p>
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
