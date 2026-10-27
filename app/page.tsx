'use client'

import { useEffect, useState } from 'react'
import { SiteNav } from '@/components/site/nav'
import { Hero, Marquee } from '@/components/site/hero'
import { Tracks } from '@/components/site/tracks'
import { Videos } from '@/components/site/videos'
import { Craft, Work } from '@/components/site/craft'
import { LiveRoom } from '@/components/site/live-room'
import { SiteFooter } from '@/components/site/footer'
import type { Song, YTVideo } from '@/lib/site'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [songsLoading, setSongsLoading] = useState(true)
  const [videos, setVideos] = useState<YTVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(true)

  useEffect(() => {
    fetch('/api/songs', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { songs: [] }))
      .then((data) => setSongs(data.songs || []))
      .catch(() => setSongs([]))
      .finally(() => setSongsLoading(false))

    fetch('/api/youtube/latest')
      .then((response) => (response.ok ? response.json() : { videos: [] }))
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setVideosLoading(false))
  }, [])

  const latest = songs.find((song) => song.featured) || songs[0]

  return (
    <main>
      <SiteNav />
      <Hero latest={latest} />
      <Marquee />
      <Tracks songs={songs} loading={songsLoading} />
      <Videos videos={videos} loading={videosLoading} />
      <Craft />
      <Work />
      <LiveRoom titles={songs.map((song) => song.title)} />
      <SiteFooter />
    </main>
  )
}
