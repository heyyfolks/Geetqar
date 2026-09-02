'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Disc3, Pause, Play, Search, Share2, Volume2, VolumeX, X, Sparkles } from 'lucide-react'

type Song = {
  id: string; title: string; slug: string; description?: string; coverUrl?: string; featured?: boolean
  releaseDate?: string; genre?: string; mood?: string[]; lyrics?: string; credits?: Record<string,string>; duration?: number
  youtube?: string; instagram?: string
}

const MOODS = ['MIDNIGHT','DESIRE','HEARTBREAK','FLOAT','DARK','AFTER HOURS']

function formatTime(value:number){ if(!Number.isFinite(value)||value<0)return '0:00'; return `${Math.floor(value/60)}:${Math.floor(value%60).toString().padStart(2,'0')}` }

export function GeetqarMusicUniverse(){
  const [open,setOpen]=useState(false), [songs,setSongs]=useState<Song[]>([]), [index,setIndex]=useState(0), [mood,setMood]=useState('ALL')
  const [playing,setPlaying]=useState(false), [time,setTime]=useState(0), [duration,setDuration]=useState(0), [volume,setVolume]=useState(.85), [mode,setMode]=useState('PULSE')
  const [audioUrl,setAudioUrl]=useState(''), [cover,setCover]=useState(''), [loading,setLoading]=useState(false), [query,setQuery]=useState('')
  const audio=useRef<HTMLAudioElement|null>(null), analyser=useRef<AnalyserNode|null>(null), ctx=useRef<AudioContext|null>(null), source=useRef<MediaElementAudioSourceNode|null>(null), raf=useRef<number|null>(null)

  useEffect(()=>{fetch('/api/songs',{cache:'no-store'}).then(r=>r.json()).then(d=>setSongs(d.songs||[])).catch(()=>{})},[])
  const filtered=useMemo(()=>songs.filter(s=>{const okMood=mood==='ALL'||(s.mood||[]).map(x=>x.toUpperCase()).includes(mood);const okQuery=!query||s.title.toLowerCase().includes(query.toLowerCase());return okMood&&okQuery}),[songs,mood,query])
  const song=songs[index]

  useEffect(()=>{if(!song)return;setAudioUrl('');setCover(song.coverUrl||'');setPlaying(false);setTime(0);setDuration(0);setLoading(true);fetch(`/api/music/${encodeURIComponent(song.slug)}?t=${Date.now()}`,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Master unavailable');setAudioUrl(d.url||'');setCover(d.coverUrl||song.coverUrl||'')}).catch(()=>{}).finally(()=>setLoading(false));try{localStorage.setItem('geetqar:last-track',song.slug)}catch{}},[song?.slug])
  useEffect(()=>{if(audio.current)audio.current.volume=volume},[volume,audioUrl])
  useEffect(()=>()=>{if(raf.current)cancelAnimationFrame(raf.current);void ctx.current?.close()},[])

  function initAudio(){const el=audio.current;if(!el)return;if(!ctx.current)ctx.current=new AudioContext();if(ctx.current.state==='suspended')void ctx.current.resume();if(!source.current){source.current=ctx.current.createMediaElementSource(el);analyser.current=ctx.current.createAnalyser();analyser.current.fftSize=128;analyser.current.smoothingTimeConstant=.88;source.current.connect(analyser.current);analyser.current.connect(ctx.current.destination)}}
  function animate(){const a=analyser.current;if(!a)return;const data=new Uint8Array(a.frequencyBinCount);const tick=()=>{a.getByteFrequencyData(data);let sum=0;for(const n of data)sum+=n;document.documentElement.style.setProperty('--geetqar-energy',String(Math.min(1,sum/data.length/180)));raf.current=requestAnimationFrame(tick)};if(raf.current)cancelAnimationFrame(raf.current);tick()}
  async function toggle(){if(!audio.current||!audioUrl)return;initAudio();if(audio.current.paused){await audio.current.play();setPlaying(true);animate();window.dispatchEvent(new CustomEvent('geetqar:play',{detail:{element:audio.current,title:song?.title||''}}))}else{audio.current.pause();setPlaying(false);window.dispatchEvent(new CustomEvent('geetqar:pause',{detail:{element:audio.current}}))}}
  function choose(i:number){setIndex(i);setOpen(true)}
  function next(){if(!songs.length)return;setIndex(i=>(i+1)%songs.length)}
  function prev(){if(!songs.length)return;setIndex(i=>(i-1+songs.length)%songs.length)}

  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.tagName==='INPUT'||(e.target as HTMLElement)?.tagName==='TEXTAREA')return;if(e.code==='Space'){e.preventDefault();void toggle()}else if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();else if(e.key.toLowerCase()==='m')setVolume(v=>v?0:.85);else if(e.key==='Escape')setOpen(false);else if(e.key.toLowerCase()==='g')setMode(m=>m==='PULSE'?'ORBIT':m==='ORBIT'?'VOID':'PULSE')};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)})

  const progress=duration?time/duration*100:0
  return <>
    <button aria-label="Open GEETQAR music player" onClick={()=>setOpen(true)} className="geetqar-universe-trigger"><span className={playing?'geetqar-live-dot':''}/><Disc3 size={15}/><span>{playing?'LISTENING':'PLAY'}</span></button>
    <audio ref={audio} src={audioUrl||undefined} preload="metadata" onLoadedMetadata={e=>setDuration(e.currentTarget.duration||song?.duration||0)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{setPlaying(false);next()}} />
    {open&&<div className="geetqar-universe" role="dialog" aria-modal="true" aria-label="GEETQAR Music Universe">
      <div className={`geetqar-universe-bg mode-${mode.toLowerCase()}`}><span/><i/><b/></div>
      <header className="geetqar-universe-head"><button aria-label="Close player" onClick={()=>setOpen(false)}><X size={18}/></button><div><div className="geetqar-kicker">GEETQAR / MUSIC UNIVERSE</div><div className="geetqar-status">{playing?'SIGNAL ACTIVE':'SIGNAL READY'} · {mode}</div></div><button aria-label="Share current song" onClick={()=>navigator.clipboard?.writeText(`${location.origin}/world/${song?.slug||''}`)}><Share2 size={16}/></button></header>
      <div className="geetqar-universe-body">
        <aside className="geetqar-universe-library"><div className="geetqar-library-top"><div className="geetqar-kicker">FIND YOUR ROOM</div><div className="geetqar-search"><Search size={13}/><input aria-label="Search music" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the signal"/></div></div><div className="geetqar-moods">{['ALL',...MOODS].map(x=><button key={x} onClick={()=>setMood(x)} className={mood===x?'active':''}>{x}</button>)}</div><div className="geetqar-track-list">{filtered.map(s=>{const i=songs.findIndex(x=>x.id===s.id);return <button key={s.id} onClick={()=>choose(i)} className={i===index?'active':''}><span>{String(i+1).padStart(2,'0')}</span><strong>{s.title}</strong><small>{(s.mood||[]).join(' · ')||s.genre||'GEETQAR'}</small></button>})}</div></aside>
        <section className="geetqar-now"><div className="geetqar-art"><div className="geetqar-art-ring"/><div className="geetqar-art-inner">{cover?<img src={cover} alt={`${song?.title||'GEETQAR'} artwork`}/>:<div className="geetqar-placeholder"><Disc3 size={54}/></div>}<div className="geetqar-art-pulse"/></div></div><div className="geetqar-now-copy"><div className="geetqar-kicker">{loading?'CONNECTING MASTER':'NOW ENTERING'}</div><h2>{song?.title||'No signal yet'}</h2><p>{song?.description||'Add a track from the private control room and it becomes part of the GEETQAR universe.'}</p><div className="geetqar-controls"><button aria-label="Previous track" onClick={prev}><ChevronLeft/></button><button className="primary" aria-label={playing?'Pause':'Play'} onClick={()=>void toggle()} disabled={!audioUrl}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><button aria-label="Next track" onClick={next}><ChevronRight/></button></div><div className="geetqar-progress"><span>{formatTime(time)}</span><input aria-label="Track progress" type="range" min="0" max={duration||1} step=".1" value={time} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value)}}/><span>{formatTime(duration)}</span></div><div className="geetqar-volume"><button aria-label="Mute" onClick={()=>setVolume(v=>v?0:.85)}>{volume?<Volume2 size={14}/>:<VolumeX size={14}/>}</button><input aria-label="Volume" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><div className="geetqar-modes">{['PULSE','ORBIT','VOID'].map(x=><button key={x} onClick={()=>setMode(x)} className={mode===x?'active':''}>{x}</button>)}</div></div></div></section>
        <aside className="geetqar-universe-info"><div className="geetqar-kicker">TRACK INTELLIGENCE</div><div className="geetqar-fact"><span>RELEASE</span><strong>{song?.releaseDate||'—'}</strong></div><div className="geetqar-fact"><span>GENRE</span><strong>{song?.genre||'—'}</strong></div><div className="geetqar-fact"><span>MOOD</span><strong>{(song?.mood||[]).join(' / ')||'—'}</strong></div><div className="geetqar-lyrics"><div className="geetqar-kicker">LYRICS</div><pre>{song?.lyrics||'Lyrics will appear here when added from Artist Admin.'}</pre></div><div className="geetqar-credits"><div className="geetqar-kicker">CREATION</div>{Object.entries(song?.credits||{}).map(([k,v])=><div key={k}><span>{k.toUpperCase()}</span><strong>{v}</strong></div>)}</div></aside>
      </div>
      <footer className="geetqar-universe-foot"><span>SPACE PLAY / ← → TRACK / M MUTE / G VISUAL / ESC CLOSE</span><span>{songs.length} SIGNALS</span></footer>
    </div>}
  </>
}
