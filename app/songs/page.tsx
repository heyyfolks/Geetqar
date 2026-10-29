import type { Metadata } from 'next'
import { PageShell } from '@/components/site/page-shell'
import { getCatalogForCache } from '@/lib/catalog'
import { SITE_URL, kindLabel } from '@/lib/site'

export const revalidate = 300

const title = 'GEETQAR songs, lyrics and videos'
const description = 'Every GEETQAR song in one place: originals, covers and mashups, with videos and lyrics. Updated automatically from the official YouTube channel.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/songs' },
  openGraph: { title, description, url: '/songs', siteName: 'GEETQAR', type: 'website' },
}

export default async function Songs() {
  const tracks = await getCatalogForCache()
  const originals = tracks.filter((t) => t.kind !== 'Cover' && t.kind !== 'Mashup')
  const covers = tracks.filter((t) => t.kind === 'Cover' || t.kind === 'Mashup')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${SITE_URL}/songs`,
    mainEntity: { '@type': 'ItemList', itemListElement: tracks.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/songs/${t.slug}`, name: t.name })) },
  }
  const block = (heading: string, list: typeof tracks) => list.length > 0 && (
    <section className="gx-song-block">
      <h2 className="gx-h3">{heading}</h2>
      <ul className="gx-rel">
        {list.map((t) => <li key={t.id}><a href={`/songs/${t.slug}`}><strong>{t.name}</strong><span>{kindLabel(t.kind)}{t.published ? ` · ${t.published.slice(0, 4)}` : ''}</span></a></li>)}
      </ul>
    </section>
  )
  return (
    <PageShell>
      <div className="gx-wrap gx-song">
        <p className="gx-crumbs"><a href="/">GEETQAR</a> / Songs</p>
        <p className="gx-kicker">Catalogue</p>
        <h1 className="gx-song-title">GEETQAR songs</h1>
        <p className="gx-lede">Originals, covers and mashups by GEETQAR, with video and lyrics where available. New uploads appear here automatically.</p>
        {block('Originals', originals)}
        {block('Covers and mashups', covers)}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  )
}
