'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2 } from 'lucide-react'

function trackSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function MusicPlayer({title='VELVET PLAY',src,onCover}:{title?:string;src?:string;onCover?:(url:string)=>void}){
  const ref=useRef<HTMLAudioElement>(null)
  const coverRef=useRef(onCover)
  const [playing,setPlaying]=useState(false)
  const [progress,setProgress]=useState(0)
  const [audioSrc,setAudioSrc]=useState(src || '')
  const [loading,setLoading]=useState(!src)
  const [error,setError]=useState('')

  useEffect(()=>{coverRef.current=onCover},[onCover])

  useEffect(()=>{
    let active=true
    if(src){ setAudioSrc(src); setLoading(false); setError(''); return }
    setLoading(true)
    setError('')
    fetch(`/api/music/${encodeURIComponent(trackSlug(title))}?t=${Date.now()}`, { cache: 'no-store' })
      .then(async r=>{
        const data=await r.json().catch(()=>({}))
        if(!r.ok) throw new Error(data.error || 'Master unavailable')
        if(active && data.coverUrl && coverRef.current) coverRef.current(data.coverUrl)
        return data.url as string
      })
      .then(url=>{if(!url) throw new Error('Playback URL missing'); if(active) setAudioSrc(url)})
      .catch(e=>{if(active){setAudioSrc('');setError(e instanceof Error?e.message:'Master unavailable')}})
      .finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[title,src])

  useEffect(()=>{
    const a=ref.current
    if(!a)return
    const tick=()=>setProgress(a.duration?(a.currentTime/a.duration)*100:0)
    const ended=()=>setPlaying(false)
    const failed=()=>{
      setPlaying(false)
      const mediaError=a.error
      const detail=mediaError?.message || (mediaError?.code===4?'The audio format or source is not supported.':'Audio could not be loaded.')
      setError(detail)
    }
    a.addEventListener('timeupdate',tick)
    a.addEventListener('ended',ended)
    a.addEventListener('error',failed)
    return()=>{a.removeEventListener('timeupdate',tick);a.removeEventListener('ended',ended);a.removeEventListener('error',failed)}
  },[audioSrc])

  const toggle=async()=>{
    const a=ref.current
    if(!a||!audioSrc)return
    if(playing){a.pause();setPlaying(false)}
    else{try{setError('');await a.play();setPlaying(true)}catch(e){setPlaying(false);setError(e instanceof Error?e.message:'Audio could not be played in this browser.')}}
  }

  const connected=Boolean(audioSrc)
  return <div className="glass p-5 md:p-7" onClick={e=>e.stopPropagation()}>
    <audio ref={ref} src={audioSrc || undefined} preload="metadata" crossOrigin="anonymous" />
    <div className="flex items-center gap-4">
      <button onClick={toggle} disabled={!connected||loading} aria-label={connected?(playing?'Pause':'Play'):'Audio not connected'} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-black disabled:cursor-not-allowed disabled:opacity-40">{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}</button>
      <div className="min-w-0 flex-1"><div className="text-[9px] tracking-[.35em] text-gold">{loading?'CONNECTING MASTER…':playing?'NOW PLAYING':connected?'READY':'MASTER NOT CONNECTED'}</div><div className="mt-1 truncate font-semibold">{title}</div><div className="mt-3 h-px bg-white/10"><div className="h-full bg-gold transition-all" style={{width:`${progress}%`}}/></div></div>
      <Volume2 size={16} className="text-white/30"/>
    </div>
    {!connected&&!loading&&<p className="mt-3 text-[10px] text-red-300/80">{error || 'Original master is not uploaded yet.'}</p>}
  </div>
}
