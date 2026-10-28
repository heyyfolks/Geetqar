import type { Metadata } from 'next'
import { PageShell } from '@/components/site/page-shell'
import { SITE_URL, SOCIAL } from '@/lib/site'

const title = 'About GEETQAR (गीतकार)'
const description = 'GEETQAR is an independent artist who writes, sings, produces, mixes and masters his own music: R&B, soul, drill, lo-fi, classical, covers and mixtapes.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, url: '/about', siteName: 'GEETQAR', type: 'profile' },
}

const FAQ = [
  { q: 'Who is GEETQAR?', a: 'GEETQAR (गीतकार) is an independent music artist. He writes the songs, sings them, produces them, and also mixes and masters them himself.' },
  { q: 'What does GEETQAR mean?', a: 'Geetkar (गीतकार) is the Hindi word for a songwriter or lyricist. GEETQAR is that word written the way he spells it as a stage name.' },
  { q: 'What kind of music does GEETQAR make?', a: 'R&B, soul, drill, lo-fi and classical, including slow and sensual tracks, plus covers and mixtapes. Songs mix Hindi and English.' },
  { q: 'Where can I listen to GEETQAR?', a: 'Every release is on the official YouTube channel and plays on the home page of this site. New uploads appear here automatically.' },
  { q: 'Does GEETQAR take mixing and mastering work?', a: 'Yes. Mixing and mastering, writing, vocals, production and custom covers are all available. The fastest way to reach him is a direct message on Instagram.' },
]

export default function About() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        url: `${SITE_URL}/about`,
        mainEntity: { '@type': 'MusicGroup', '@id': `${SITE_URL}/#artist`, name: 'GEETQAR', alternateName: ['गीतकार', 'Geetqar', 'Geetkar'], url: SITE_URL, sameAs: [SOCIAL.instagram, SOCIAL.youtube] },
      },
      { '@type': 'FAQPage', mainEntity: FAQ.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
    ],
  }
  return (
    <PageShell>
      <div className="gx-wrap gx-song gx-about">
        <p className="gx-crumbs"><a href="/">GEETQAR</a> / About</p>
        <p className="gx-kicker">About</p>
        <h1 className="gx-song-title">GEETQAR <span lang="hi">गीतकार</span></h1>
        <p className="gx-lede">An independent artist who writes, sings, produces, mixes and masters his own music, and also makes covers and mixtapes. Everything here comes straight from the official YouTube channel.</p>
        <div className="gx-cta-row">
          <a className="gx-btn gx-btn-solid" href="/#music">LISTEN</a>
          <a className="gx-btn gx-btn-line" href={SOCIAL.youtube} target="_blank" rel="noreferrer">YOUTUBE</a>
          <a className="gx-btn gx-btn-line" href={SOCIAL.instagram} target="_blank" rel="noreferrer">INSTAGRAM</a>
        </div>
        <section className="gx-song-block" aria-labelledby="faq-h">
          <h2 id="faq-h" className="gx-h3">Questions</h2>
          <dl className="gx-faq">
            {FAQ.map((item) => (
              <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>
            ))}
          </dl>
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  )
}
