'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Dices, Headphones, Radio, Sparkles, Archive, ArrowUpRight } from 'lucide-react'

const rooms = [
  { label: 'LISTEN', title: 'Start with a sound.', copy: 'Jump straight into the catalogue and let the room disappear.', href: '#music', icon: Headphones },
  { label: 'DISCOVER', title: 'Follow the trail.', copy: 'Find community picks, unexpected connections and songs worth passing on.', href: '#recommend', icon: Sparkles },
  { label: 'PARTICIPATE', title: 'Leave something behind.', copy: 'Recommend a song, vote, write a thought. The audience shapes the room.', href: '#jukebox', icon: Radio },
  { label: 'ARCHIVE', title: 'See what stays.', copy: 'A living record of releases, fragments and the things that almost became songs.', href: '#arena', icon: Archive },
]

export function GeetqarLab() {
  const [index, setIndex] = useState(0)
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()))
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  const active = rooms[index]
  const Icon = active.icon

  return (
    <section className="relative overflow-hidden border-y border-white/10 px-6 py-24 md:px-12 md:py-32">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="text-[10px] tracking-[.45em] text-gold">A SMALL UNIVERSE / {time || '--:--'}</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-8xl">There is more than one way in.</h2>
          </div>
          <button onClick={() => setIndex((index + 1) % rooms.length)} className="hidden shrink-0 items-center gap-2 border border-white/15 px-4 py-3 text-[10px] tracking-[.2em] transition hover:border-[#D4AF37] hover:text-[#D4AF37] md:flex">
            <Dices size={14} /> CHANGE THE ROOM
          </button>
        </div>

        <div className="mt-14 grid gap-3 md:grid-cols-4">
          {rooms.map((room, i) => {
            const RoomIcon = room.icon
            return (
              <button key={room.label} onClick={() => setIndex(i)} className={`group text-left p-5 transition-all ${i === index ? 'glass' : 'border border-white/8 hover:border-white/20'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] tracking-[.28em] ${i === index ? 'text-[#D4AF37]' : 'text-white/35'}`}>{room.label}</span>
                  <RoomIcon size={15} className={i === index ? 'text-[#D4AF37]' : 'text-white/25'} />
                </div>
                <p className="mt-12 text-lg font-medium">{room.title}</p>
              </button>
            )
          })}
        </div>

        <motion.div key={index} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="glass mt-3 grid min-h-[300px] items-end gap-8 p-7 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/5"><Icon size={21} className="text-[#D4AF37]" /></div>
            <p className="text-[10px] tracking-[.4em] text-white/35">YOU CHOSE / {active.label}</p>
            <h3 className="mt-3 text-4xl font-semibold md:text-6xl">{active.title}</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">{active.copy}</p>
          </div>
          <a href={active.href} className="inline-flex items-center gap-2 border border-[#D4AF37]/40 px-6 py-4 text-[10px] tracking-[.25em] text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">ENTER <ArrowUpRight size={14} /></a>
        </motion.div>

        <button onClick={() => setIndex((index + 1) % rooms.length)} className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 py-4 text-[10px] tracking-[.25em] text-white/45 hover:text-white md:hidden"><Dices size={14}/> CHANGE THE ROOM</button>
      </div>
    </section>
  )
}
