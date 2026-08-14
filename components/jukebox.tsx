'use client'
import { useEffect, useState } from 'react'
import { ChevronUp, MessageCircle, Plus, Loader2, Mail, LogOut, CheckCircle2, Users, Radio, Sparkles, Heart, Flame, Moon, Send } from 'lucide-react'
import { supabase, voteForQueueItem } from '@/lib/queue'
import { CommunityUser, EmailGate, useCommunityUser } from '@/components/email-gate'

type Item={id:string;track_id:string;username:string;email?:string;votes:number;status:string}
type Chat={id:string;username:string;email?:string;message:string;created_at:string}

export function Jukebox({tracks}:{tracks:string[]}){
  const user=useCommunityUser()
  const [items,setItems]=useState<Item[]>([]); const [message,setMessage]=useState(''); const [chat,setChat]=useState<Chat[]>([])
  const [adding,setAdding]=useState<string|null>(null); const [sending,setSending]=useState(false); const [voting,setVoting]=useState<string|null>(null)
  const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [gate,setGate]=useState(false); const [listeners,setListeners]=useState(1)
  const [reaction,setReaction]=useState<string|null>(null); const [reactionCount,setReactionCount]=useState<Record<string,number>>({❤️:0,🔥:0,🌙:0})

  useEffect(()=>{
    const db=supabase()
    const load=async()=>{const [{data:q,error:qError},{data:c,error:cError}]=await Promise.all([db.from('queue_items').select('*').in('status',['queued','playing']).order('votes',{ascending:false}).order('created_at',{ascending:true}),db.from('chat_messages').select('*').order('created_at',{ascending:true}).limit(100)]);if(qError)setError(qError.message);else setItems((q||[]) as Item[]);if(cError)setError(cError.message);else setChat((c||[]) as Chat[])}
    load()
    const channel=db.channel('geetqar-live-room',{config:{presence:{key:Math.random().toString(36).slice(2)}}})
      .on('postgres_changes',{event:'*',schema:'public',table:'queue_items'},load)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},p=>setChat(c=>[...c,p.new as Chat].slice(-100)))
      .on('presence',{event:'sync'},()=>setListeners(Math.max(1,Object.keys(channel.presenceState()).length)))
      .subscribe(async status=>{if(status==='SUBSCRIBED'){await channel.track({online:true})}})
    return()=>{db.removeChannel(channel)}
  },[])

  const requireUser=()=>{if(!user){setGate(true);return false}return true}
  const add=async(track:string)=>{if(!requireUser()||adding)return;setAdding(track);setError('');setNotice('');const {error:e}=await supabase().from('queue_items').insert({track_id:track,username:user!.handle,email:user!.email,user_id:user!.id,votes:0,status:'queued'});if(e?.code==='23505')setNotice(`${track} is already in the live queue.`);else if(e)setError(e.message);else setNotice(`${track} added to the live room.`);setAdding(null)}
  const vote=async(id:string)=>{if(!requireUser()||voting)return;setVoting(id);setError('');try{await voteForQueueItem(id,user!.id)}catch(e){setError(e instanceof Error?e.message:'Vote failed')}setVoting(null)}
  const send=async()=>{if(!requireUser())return;const text=message.trim();if(!text||text.length>500||sending)return;setSending(true);setError('');const {error:e}=await supabase().from('chat_messages').insert({user_id:user!.id,email:user!.email,username:user!.handle,message:text});if(e)setError(e.message);else setMessage('');setSending(false)}
  const signOut=async()=>{await supabase().auth.signOut()}
  const react=(emoji:string)=>{if(!requireUser())return;setReaction(emoji);setReactionCount(c=>({...c,[emoji]:(c[emoji]||0)+1}));setTimeout(()=>setReaction(null),900)}
  const playing=items.find(i=>i.status==='playing')

  return <div className="space-y-5">
    <div className="glass overflow-hidden p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><div className="flex items-center gap-2 text-[9px] tracking-[.35em] text-gold"><Radio size={12}/> GEETQAR LIVE ROOM</div><h3 className="mt-3 text-3xl font-semibold md:text-4xl">The Jukebox.</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/40">You choose the next sound. Everyone in the room hears the conversation.</p></div>
        <div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-full border border-emerald-400/20 px-3 py-2 text-[9px] tracking-[.15em] text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300"/> ROOM OPEN</div><div className="flex items-center gap-2 text-[10px] text-white/35"><Users size={13}/>{listeners} listening</div></div>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="border border-gold/15 bg-black/30 p-5 md:p-6"><div className="flex items-center gap-2 text-[9px] tracking-[.3em] text-white/30"><Sparkles size={12} className="text-gold"/> ROOM PROMPT</div><p className="mt-4 text-xl leading-8 md:text-2xl">“What does a song become after it becomes yours?”</p><p className="mt-3 text-xs leading-6 text-white/35">Drop your answer in the live discussion. Keep it honest, weird or poetic.</p><div className="mt-5 flex flex-wrap gap-2">{[['❤️','Love'],['🔥','Feel it'],['🌙','Late night']].map(([e,label])=><button key={e} onClick={()=>react(e)} className="rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/50 transition hover:border-gold/40 hover:text-gold">{e} {label} {reactionCount[e]||0}</button>)}</div>{reaction&&<div className="mt-3 text-[10px] text-gold">{reaction} reaction sent to the room</div>}</div>
        <div className="border border-white/10 p-5 md:p-6"><div className="text-[9px] tracking-[.3em] text-white/30">NOW / PLAYING</div>{playing?<><div className="mt-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center border border-gold/20 text-gold"><Radio size={17}/></div><div><div className="text-sm font-medium">{playing.track_id}</div><div className="mt-1 text-[9px] text-emerald-300">LIVE IN THE ROOM</div></div></div><div className="mt-5 h-1 overflow-hidden bg-white/10"><div className="h-full w-2/5 bg-gold"/></div><div className="mt-2 flex justify-between text-[9px] text-white/25"><span>LIVE</span><span>LISTENING TOGETHER</span></div></>:<><p className="mt-4 text-lg text-white/50">Nothing playing yet.</p><p className="mt-2 text-xs leading-5 text-white/25">Vote for the next sound and start the room.</p></>}</div>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="glass p-6">
        <div className="flex items-center justify-between"><div><span className="text-[9px] tracking-[.35em] text-gold">COMMUNITY JUKEBOX</span><h3 className="mt-2 text-2xl font-semibold">Vote the next sound.</h3></div><div className="rounded-full border border-gold/20 px-3 py-1 text-[9px] text-gold">LIVE</div></div>
        {!user?<button onClick={()=>setGate(true)} className="mt-6 flex w-full items-center justify-center gap-2 border border-gold/30 px-4 py-4 text-[10px] tracking-[.22em] text-gold hover:bg-gold hover:text-black"><Mail size={14}/> VERIFY EMAIL TO JOIN</button>:<div className="mt-6 flex items-center justify-between border border-white/10 p-3"><div><div className="text-[9px] tracking-[.2em] text-white/30">VERIFIED LISTENER</div><div className="mt-1 text-xs text-gold">{user.email}</div></div><button onClick={signOut} className="text-white/25 hover:text-white" title="Sign out"><LogOut size={14}/></button></div>}
        <p className="mt-4 text-[10px] uppercase tracking-[.2em] text-white/25">One verified email controls your queue entries, votes and chat identity.</p>
        <div className="mt-4 space-y-2">{tracks.map(t=><button key={t} onClick={()=>add(t)} disabled={!user||!!adding} className="group flex w-full items-center gap-3 border border-white/10 p-4 text-left transition hover:border-gold/60 hover:bg-white/[.03] disabled:cursor-not-allowed disabled:opacity-40"><span className="flex h-9 w-9 items-center justify-center border border-gold/20 text-gold"><Plus size={15}/></span><span className="flex-1"><span className="block text-sm font-medium">{t}</span><span className="block text-[9px] text-white/25">ADD TO LIVE QUEUE</span></span>{adding===t?<Loader2 size={15} className="animate-spin text-gold"/>:<span className="text-[9px] text-white/25 group-hover:text-gold">ADD</span>}</button>)}</div>
        {(notice||error)&&<div className={`mt-4 text-[10px] ${error?'text-red-300':'text-gold'}`}>{error||notice}</div>}
        <div className="mt-7 border-t border-white/10 pt-5"><div className="mb-3 flex items-center justify-between"><span className="text-[9px] tracking-[.3em] text-white/35">UP NEXT</span><span className="text-[9px] text-white/25">HIGHEST VOTES FIRST</span></div><div className="space-y-2">{items.map((i,index)=><div key={i.id} className="flex items-center gap-3 border border-white/10 p-3"><span className="w-5 text-center text-[10px] text-gold">{index+1}</span><div className="flex-1"><div className="text-sm">{i.track_id}</div><div className="text-[9px] text-white/30">verified listener · {i.username}{i.status==='playing'?' · PLAYING':''}</div></div><button onClick={()=>vote(i.id)} disabled={!user||voting===i.id||i.status!=='queued'} aria-label={`Upvote ${i.track_id}`} className="flex min-w-12 items-center justify-center gap-1 rounded border border-gold/20 px-2 py-1 text-gold transition hover:bg-gold hover:text-black disabled:opacity-40"><ChevronUp size={15}/>{i.votes}</button></div>)}{!items.length&&<p className="py-5 text-center text-xs text-white/25">Queue is empty. Add the first song.</p>}</div></div>
      </div>
      <div className="glass flex min-h-[460px] flex-col p-6"><div className="flex items-center gap-2 border-b border-white/10 pb-4"><MessageCircle size={16} className="text-gold"/><span className="text-[9px] tracking-[.35em]">LIVE DISCUSSION</span><span className="ml-auto text-[9px] text-white/25">REALTIME</span></div><div className="flex-1 space-y-3 overflow-auto py-5">{chat.map(c=><div key={c.id}><span className="text-xs text-gold">{c.username}</span><p className="break-words text-sm text-white/60">{c.message}</p></div>)}{!chat.length&&<p className="text-sm text-white/25">The room is quiet. Start the conversation.</p>}</div><div className="border-t border-white/10 pt-4"><div className="mb-2 text-[9px] text-white/25">{user?<><span>POSTING AS </span><span className="text-gold">{user.email}</span></>:<span>VERIFY EMAIL TO START CHAT</span>}</div><div className="flex gap-2"><input value={message} maxLength={500} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={user?'Say something about the music…':'Verify your email first…'} className="min-w-0 flex-1 rounded border border-white/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-gold"/><button onClick={()=>user?send():setGate(true)} disabled={sending||!!user&&!message.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-gold/30 text-gold transition hover:bg-gold hover:text-black disabled:opacity-30">{sending?<Loader2 size={17} className="animate-spin"/>:<Send size={17}/>}</button></div></div></div>
      <EmailGate open={gate} onClose={()=>setGate(false)} onReady={(_u:CommunityUser)=>setNotice('Email verified. Welcome to the room.')}/>
    </div>
  </div>
}
