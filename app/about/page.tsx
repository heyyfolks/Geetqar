import type { Metadata } from 'next'
import { PageShell } from '@/components/site/page-shell'
import { getConfig } from '@/lib/config'
import { SITE_URL } from '@/lib/site'

const title = 'About GEETQAR (गीतकार)'
const description = 'GEETQAR is an independent artist who writes, sings, produces, mixes and masters his own music: R&B, soul, drill, lo-fi, classical, covers and mixtapes.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, url: '/about', siteName: 'GEETQAR', type: 'profile' },
}

export const revalidate = 300

export default async function About() {
  const { about, links } = await getConfig()
  const FAQ = about.faq
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        url: `${SITE_URL}/about`,
        mainEntity: { '@type': 'MusicGroup', '@id': `${SITE_URL}/#artist`, name: 'GEETQAR', alternateName: ['गीतकार', 'Geetqar', 'Geetkar'], url: SITE_URL, sameAs: [links.instagram, links.youtube, links.spotify, links.apple, links.unitedmasters].filter(Boolean) },
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
        <p className="gx-lede">{about.intro}</p>
        <div className="gx-cta-row">
          <a className="gx-btn gx-btn-solid" href="/#music">LISTEN</a>
          <a className="gx-btn gx-btn-line" href={links.youtube} target="_blank" rel="noreferrer">YOUTUBE</a>
          <a className="gx-btn gx-btn-line" href={links.instagram} target="_blank" rel="noreferrer">INSTAGRAM</a>
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
