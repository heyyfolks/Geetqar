'use client'

import { useEffect, useState } from 'react'
import { SiteNav } from '@/components/site/nav'
import { Hero, Marquee } from '@/components/site/hero'
import { MusicExperience } from '@/components/site/music-experience'
import { Craft, Work } from '@/components/site/craft'
import { LiveRoom } from '@/components/site/live-room'
import { SiteFooter } from '@/components/site/footer'
import type { Track } from '@/lib/site'

export function HomeClient({ initialTracks }: { initialTracks: Track[] }) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [loading, setLoading] = useState(initialTracks.length === 0)
  const [titles, setTitles] = useState<string[]>([])

  // Keep the catalogue fresh without a reload: on mount, every 3 minutes, and when the tab regains focus.
  useEffect(() => {
    let alive = true
    const refresh = () =>
      fetch('/api/catalog')
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => { if (alive && Array.isArray(data?.tracks) && data.tracks.length) setTracks(data.tracks) })
        .catch(() => {})
        .finally(() => { if (alive) setLoading(false) })
    void refresh()
    const timer = window.setInterval(refresh, 180000)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  // Live Room still votes on the mastered catalogue stored in Supabase.
  useEffect(() => {
    fetch('/api/songs', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { songs: [] }))
      .then((data) => setTitles((data.songs || []).map((song: { title: string }) => song.title)))
      .catch(() => {})
  }, [])

  return (
    <main>
      <SiteNav />
      <Hero latest={tracks[0]} />
      <Marquee />
      <MusicExperience tracks={tracks} loading={loading} />
      <Craft />
      <Work />
      <LiveRoom titles={titles} />
      <SiteFooter />
    </main>
  )
}
