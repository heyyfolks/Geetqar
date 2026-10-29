'use client'

import { useEffect, useState } from 'react'
import { SiteNav } from '@/components/site/nav'
import { Hero, Marquee } from '@/components/site/hero'
import { MusicExperience } from '@/components/site/music-experience'
import { MoodRoom } from '@/components/site/mood-room'
import { LyricCards } from '@/components/site/lyric-cards'
import { Craft, Work } from '@/components/site/craft'
import { FollowStrip } from '@/components/site/follow-strip'
import { SongIndex } from '@/components/site/song-index'
import { SiteFooter } from '@/components/site/footer'
import { SiteProvider } from '@/components/site/site-context'
import { AmbienceProvider } from '@/components/site/ambience'
import { navItems, type SiteConfig } from '@/lib/site-config'
import type { Track } from '@/lib/site'

export function HomeClient({ initialTracks, config }: { initialTracks: Track[]; config: SiteConfig }) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [loading, setLoading] = useState(initialTracks.length === 0)

  // Keep the catalogue fresh without a reload: on mount, every 3 minutes, and when the tab regains focus.
  useEffect(() => {
    let alive = true
    const refresh = () =>
      fetch('/api/catalog')
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => { if (alive && Array.isArray(data?.tracks) && data.tracks.length) setTracks(data.tracks.map((t: Track) => ({ ...t, moods: Array.isArray(t.moods) ? t.moods : [], lyrics: Array.isArray(t.lyrics) ? t.lyrics : [] }))) })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false) })
    void refresh()
    const timer = window.setInterval(refresh, 180000)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const s = config.sections
  return (
    <SiteProvider config={config}>
      <AmbienceProvider moods={config.moods} defaultEnabled={config.ambience.enabled} tracks={tracks}>
        <main>
          <SiteNav />
          <Hero latest={tracks[0]} />
          <Marquee />
          <MusicExperience tracks={tracks} loading={loading} />
          {s.moods && <MoodRoom tracks={tracks} />}
          {s.cards && <LyricCards tracks={tracks} />}
          {s.craft && <Craft />}
          {s.work && <Work />}
          {s.follow && <FollowStrip latest={tracks[0]} links={config.links} />}
          {s.songs && <SongIndex tracks={tracks} />}
          <SiteFooter links={config.links} items={navItems(s)} />
        </main>
      </AmbienceProvider>
    </SiteProvider>
  )
}
