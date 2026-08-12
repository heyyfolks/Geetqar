'use client'
import { useEffect, useState } from 'react'
import { ChevronUp, MessageCircle, Send, Plus, Loader2 } from 'lucide-react'
import { supabase, voteForQueueItem } from '@/lib/queue'

type Item={id:string;track_id:string;username:string;votes:number;status:string}
type Chat={id:string;username:string;message:string;created_at:string}

export function Jukebox({tracks}:{tracks:string[]}){
  const [items,setItems]=useState<Item[]>([])
  const [name,setName]=useState('')
  const [message,setMessage]=useState('')
  const [chat,setChat]=useState<Chat[]>([])
  const [adding,setAdding]=useState<string|null>(null)
  const [sending,setSending]=useState(false)
  const [voting,setVoting]=useState<string|null>(null)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')

  useEffect(()=>{
    const db=supabase()
    const load=async()=>{
      const [{data:q,error:qError},{data:c,error:cError}]=await Promise.all([
        db.from('queue_items').select('*').in('status',['queued','playing']).order('votes',{ascending:false}).order('created_at',{ascending:true}),
        db.from('chat_messages').select('*').order('created_at',{ascending:true}).limit(100)
      ])
      if(qError) setError(qError.message); else setItems((q||[]) as Item[])
      if(!cError) setChat((c||[]) as Chat[]); else setError(cError.message)
    }
    load()
    const channel=db.channel('geetqar-live-room')
      .on('postgres_changes',{event:'*',schema:'public',table:'queue_items'},load)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},payload=>setChat(c=>[...c,payload.new as Chat].slice(-100)))
      .subscribe()
    return()=>{db.removeChannel(channel)}
  },[])

  const add=async(track:string)=>{
    const username=name.trim()
    if(username.length<2||username.length>24||adding)return
    setAdding(track);setError('');setNotice('')
    const {error:e}=await supabase().from('queue_items').insert({track_id:track,username,votes:0,status:'queued'})
    if(e?.code==='23505') setNotice(`${track} is already in the live queue.`)
    else if(e) setError(e.message)
    else setNotice(`${track} added to the queue.`)
    setAdding(null)
  }

  const vote=async(id:string)=>{
    if(voting)return
    setVoting(id);setError('')
    const voter=localStorage.getItem('geetqar-voter')||crypto.randomUUID()
    localStorage.setItem('geetqar-voter',voter)
    try{await voteForQueueItem(id,voter)}catch(e){setError(e instanceof Error?e.message:'Vote failed')}
    setVoting(null)
  }

  const send=async()=>{
    const username=name.trim();const text=message.trim()
    if(username.length<2||username.length>24||!text||text.length>500||sending)return
    setSending(true);setError('');setNotice('')
    const {error:e}=await supabase().from('chat_messages').insert({username,message:text})
    if(e)setError(e.message); else setMessage('')
    setSending(false)
  }

  return <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
    <div className="glass p-6">
      <div className="flex items-center justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">COMMUNITY JUKEBOX</span><h3 className="mt-2 text-2xl font-semibold">Vote the next sound.</h3></div><div className="rounded-full border border-gold/20 px-3 py-1 text-[9px] text-gold">LIVE</div></div>
      <input value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder="Choose a username first" className="mt-6 w-full border-b border-white/10 bg-transparent py-3 text-sm outline-none focus:border-gold" />
      <p className="mt-4 text-[10px] uppercase tracking-[.2em] text-white/25">Pick a song to put it in the community queue</p>
      <div className="mt-4 space-y-2">{tracks.map(t=><button key={t} onClick={()=>add(t)} disabled={name.trim().length<2||!!adding} className="group flex w-full items-center gap-3 border border-white/10 p-4 text-left transition hover:border-gold/60 hover:bg-white/[.03] disabled:cursor-not-allowed disabled:opacity-40"><span className="flex h-9 w-9 items-center justify-center border border-gold/20 text-gold"><Plus size={15}/></span><span className="flex-1"><span className="block text-sm font-medium">{t}</span><span className="block text-[9px] text-white/25">ADD TO LIVE QUEUE</span></span>{adding===t?<Loader2 size={15} className="animate-spin text-gold"/>:<span className="text-[9px] text-white/25 group-hover:text-gold">ADD</span>}</button>)}</div>
      {(notice||error)&&<div className={`mt-4 text-[10px] ${error?'text-red-300':'text-gold'}`}>{error||notice}</div>}
      <div className="mt-7 border-t border-white/10 pt-5"><div className="mb-3 flex items-center justify-between"><span className="text-[9px] tracking-[.3em] text-white/35">UP NEXT</span><span className="text-[9px] text-white/25">HIGHEST VOTES FIRST</span></div><div className="space-y-2">{items.map((i,index)=><div key={i.id} className="flex items-center gap-3 border border-white/10 p-3"><span className="w-5 text-center text-[10px] text-gold">{index+1}</span><div className="flex-1"><div className="text-sm">{i.track_id}</div><div className="text-[9px] text-white/30">added by {i.username}{i.status==='playing'?' · PLAYING':''}</div></div><button onClick={()=>vote(i.id)} disabled={voting===i.id||i.status!=='queued'} aria-label={`Upvote ${i.track_id}`} className="flex min-w-12 items-center justify-center gap-1 rounded border border-gold/20 px-2 py-1 text-gold transition hover:bg-gold hover:text-black disabled:opacity-40"><ChevronUp size={15}/>{i.votes}</button></div>)}{!items.length&&<p className="py-5 text-center text-xs text-white/25">Queue is empty. Add the first song.</p>}</div></div>
    </div>
    <div className="glass flex min-h-[460px] flex-col p-6"><div className="flex items-center gap-2 border-b border-white/10 pb-4"><MessageCircle size={16} className="text-gold"/><span className="text-[9px] tracking-[.35em]">LIVE DISCUSSION</span><span className="ml-auto text-[9px] text-white/25">REALTIME</span></div><div className="flex-1 space-y-3 overflow-auto py-5">{chat.map(c=><div key={c.id}><span className="text-xs text-gold">{c.username}</span><p className="break-words text-sm text-white/60">{c.message}</p></div>)}{!chat.length&&<p className="text-sm text-white/25">The room is quiet. Start the conversation.</p>}</div><div className="border-t border-white/10 pt-4"><div className="mb-2 text-[9px] text-white/25">POSTING AS <span className="text-gold">{name||'—'}</span></div><div className="flex gap-2"><input value={message} maxLength={500} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={name?'Say something about the music…':'Enter username above first…'} className="min-w-0 flex-1 rounded border border-white/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-gold"/><button onClick={send} disabled={sending||name.trim().length<2||!message.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-gold/30 text-gold transition hover:bg-gold hover:text-black disabled:opacity-30">{sending?<Loader2 size={17} className="animate-spin"/>:<Send size={17}/>}</button></div></div></div>
  </div>
}
