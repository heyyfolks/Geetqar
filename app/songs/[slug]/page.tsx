import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/site/page-shell'
import { ShareButton } from '@/components/site/share-button'
import { LiteYouTube } from '@/components/site/lite-youtube'
import { getCatalogForCache } from '@/lib/catalog'
import { getConfig } from '@/lib/config'
import { subscribeUrl } from '@/lib/site-config'
import { SITE_URL, type Track, kindLabel } from '@/lib/site'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getCatalogForCache()).map((track) => ({ slug: track.slug }))
}

function summary(track: Track) {
  const text = track.description.replace(/\s+/g, ' ').trim()
  const kind = track.kind === 'Cover' ? 'cover' : track.kind === 'Mashup' ? 'mashup' : 'song'
  const base = `${track.name} is a ${kind} by GEETQAR.`
  if (text.length > 40 && !/^(follow|subscribe)/i.test(text)) return `${base} ${text}`.slice(0, 158).trimEnd()
  return `${base} Watch the video${track.lyrics.length ? ', read the lyrics' : ''} and listen on the official GEETQAR site.`
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const track = (await getCatalogForCache()).find((t) => t.slug === slug)
  if (!track) return { title: 'Song not found', robots: { index: false } }
  const title = `${track.name} by GEETQAR${track.lyrics.length ? ' (Lyrics & Video)' : track.kind === 'Official Audio' ? ' (Official Audio)' : track.kind === 'Cover' ? ' (Cover)' : track.kind === 'Mashup' ? ' (Mashup)' : ' (Video)'}`
  const description = summary(track)
  const url = `/songs/${track.slug}`
  return {
    title: { absolute: `${title} | GEETQAR` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'GEETQAR', type: 'music.song', locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const formatDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '')

export default async function SongPage({ params }: Params) {
  const { slug } = await params
  const [tracks, config] = await Promise.all([getCatalogForCache(), getConfig()])
  const track = tracks.find((t) => t.slug === slug)
  if (!track) notFound()

  const url = `${SITE_URL}/songs/${track.slug}`
  const artist = { '@type': 'MusicGroup', '@id': `${SITE_URL}/#artist`, name: 'GEETQAR', url: SITE_URL }
  const original = track.kind !== 'Cover' && track.kind !== 'Mashup'
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MusicRecording',
        '@id': `${url}#song`,
        name: track.name,
        url,
        datePublished: track.published || undefined,
        byArtist: artist,
        sameAs: [`https://www.youtube.com/watch?v=${track.id}`, track.links?.spotify, track.links?.apple, track.links?.other].filter(Boolean),
        ...(original && track.lyrics.length
          ? { recordingOf: { '@type': 'MusicComposition', name: track.name, composer: artist, lyricist: artist, lyrics: { '@type': 'CreativeWork', text: track.lyricsText || track.lyrics.join('\n') } } }
          : {}),
      },
      {
        '@type': 'VideoObject',
        name: track.title,
        description: summary(track),
        thumbnailUrl: [`https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`],
        uploadDate: track.published || undefined,
        embedUrl: `https://www.youtube.com/embed/${track.id}`,
        contentUrl: `https://www.youtube.com/watch?v=${track.id}`,
        publisher: artist,
        interactionStatistic: { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: track.views },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GEETQAR', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: track.name, item: url },
        ],
      },
    ],
  }
  const related = tracks.filter((t) => t.id !== track.id).slice(0, 6)

  return (
    <PageShell>
      <div className="gx-wrap gx-song">
        <p className="gx-crumbs"><a href="/">GEETQAR</a> / <a href="/#music">Music</a> / {track.name}</p>
        <p className="gx-kicker">{kindLabel(track.kind)}{track.published ? ` · ${formatDate(track.published)}` : ''}</p>
        <h1 className="gx-song-title">{track.name}</h1>
        <p className="gx-song-by">by <strong>GEETQAR</strong></p>

        <LiteYouTube id={track.id} title={`${track.name} by GEETQAR`} />

        <div className="gx-cta-row">
          <a className="gx-btn gx-btn-solid" href={`https://www.youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer">WATCH ON YOUTUBE</a>
          <a className="gx-btn gx-btn-line" href={`/#music`}>PLAY IN THE PLAYER</a>
          <a className="gx-btn gx-btn-line" href={subscribeUrl(config.links.youtube)} target="_blank" rel="noreferrer">SUBSCRIBE</a>
          {track.links?.spotify && <a className="gx-btn gx-btn-line" href={track.links.spotify} target="_blank" rel="noreferrer">SPOTIFY</a>}
          {track.links?.apple && <a className="gx-btn gx-btn-line" href={track.links.apple} target="_blank" rel="noreferrer">APPLE MUSIC</a>}
          {track.links?.other && <a className="gx-btn gx-btn-line" href={track.links.other} target="_blank" rel="noreferrer">LISTEN ELSEWHERE</a>}
          <ShareButton path={`/songs/${track.slug}`} title={`${track.name} by GEETQAR`} />
        </div>

        {(track.lyricsText || track.lyrics.length > 0) && (
          <section className="gx-song-block" aria-labelledby="lyrics-h">
            <h2 id="lyrics-h" className="gx-h3">{track.name} lyrics</h2>
            <p className="gx-lyrics" lang="hi">{track.lyricsText || track.lyrics.join('\n')}</p>
            <p className="gx-song-note">Lyrics written by GEETQAR. <a href="/#cards">Turn a line into a poster</a>.</p>
          </section>
        )}

        {track.credits && (
          <section className="gx-song-block" aria-labelledby="credits-h">
            <h2 id="credits-h" className="gx-h3">Credits</h2>
            <p className="gx-song-desc">{track.credits}</p>
          </section>
        )}

        {track.description && (
          <section className="gx-song-block" aria-labelledby="about-h">
            <h2 id="about-h" className="gx-h3">About this {track.kind === 'Cover' ? 'cover' : track.kind === 'Mashup' ? 'mashup' : 'song'}</h2>
            <p className="gx-song-desc">{track.description}</p>
          </section>
        )}

        <section className="gx-song-block" aria-labelledby="more-h">
          <h2 id="more-h" className="gx-h3">More from GEETQAR</h2>
          <ul className="gx-rel">
            {related.map((t) => (
              <li key={t.id}><a href={`/songs/${t.slug}`}><strong>{t.name}</strong><span>{kindLabel(t.kind)}</span></a></li>
            ))}
          </ul>
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
    </PageShell>
  )
}
