'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, LockKeyhole, Radio, Sparkles } from 'lucide-react'
import { EmailGate, useCommunityUser } from '@/components/email-gate'

type Song = { id: string; title: string; slug: string; description?: string; coverUrl?: string }

export default function Archive() {
  const [songs, setSongs] = useState<Song[]>([])
  const [gate, setGate] = useState(false)
  const user = useCommunityUser()

  useEffect(() => { fetch('/api/songs', { cache: 'no-store' }).then((r) => r.json()).then((d) => setSongs(d.songs || [])).catch(() => {}) }, [])

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-12 md:py-12">
        <header className="flex items-center justify-between"><a href="/" className="inline-flex items-center gap-2 text-[9px] tracking-[.3em] text-white/45 hover:text-white"><ArrowLeft size={14} /> GEETQAR</a><span className="text-[8px] tracking-[.35em] text-gold">CLASSIFIED / ARCHIVE</span></header>
        <section className="py-24 md:py-32"><p className="text-[9px] tracking-[.45em] text-gold">GEETQAR / PRIVATE ARCHIVE</p><h1 className="mt-5 max-w-4xl text-6xl font-semibold tracking-[-.05em] md:text-8xl">Not everything<br />is public.</h1><p className="mt-7 max-w-xl text-sm leading-7 text-white/40">A quieter room for unfinished ideas, experiments and future signals. Your listener identity unlocks the door — the archive only reveals what actually exists.</p><button onClick={() => setGate(true)} className="mt-9 inline-flex items-center gap-3 border border-gold/30 px-6 py-3.5 text-[9px] tracking-[.28em] text-gold hover:border-gold/70">{user ? <Radio size={14} /> : <LockKeyhole size={14} />} {user ? 'ENTER ARCHIVE' : 'REQUEST ACCESS'}</button></section>

        <section className="border-t border-white/10 pt-10"><div className="flex items-center gap-3"><Sparkles size={16} className="text-gold" /><p className="text-[9px] tracking-[.35em] text-white/30">PUBLIC SIGNALS / {songs.length}</p></div><div className="mt-7 grid gap-3 md:grid-cols-2">{songs.map((song) => <a key={song.id} href={`/world/${song.slug}`} className="group flex items-center gap-4 border border-white/10 p-4 transition hover:border-gold/40"><div className="h-14 w-14 shrink-0 overflow-hidden bg-[#111]">{song.coverUrl && <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />}</div><div><div className="text-sm text-white/75">{song.title}</div><div className="mt-1 text-xs text-white/25">OPEN SONG WORLD</div></div></a>)}</div></section>
      </div>
      <EmailGate open={gate && !user} onClose={() => setGate(false)} onReady={() => setGate(false)} />
    </main>
  )
}
