'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Mail, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export type CommunityUser = { id:string; email:string; handle:string }

function toHandle(email:string){
  const local=email.split('@')[0]||'listener'
  return local.replace(/[^a-zA-Z0-9._-]/g,'').slice(0,24) || 'listener'
}

export function useCommunityUser(){
  const supabase=createSupabaseBrowserClient()
  const [user,setUser]=useState<CommunityUser|null>(null)
  useEffect(()=>{
    supabase.auth.getUser().then((result: { data: { user: { id: string; email?: string | null } | null } })=>{
      const email=result.data.user?.email
      if(email)setUser({id:result.data.user!.id,email,handle:toHandle(email)})
    })
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
      const email=session?.user?.email
      setUser(email?{id:session!.user.id,email,handle:toHandle(email)}:null)
    })
    return()=>data.subscription.unsubscribe()
  },[supabase])
  return user
}

export function EmailGate({open,onClose,onReady}:{open:boolean;onClose:()=>void;onReady:(user:CommunityUser)=>void}){
  const supabase=createSupabaseBrowserClient()
  const [email,setEmail]=useState('');const [token,setToken]=useState('');const [step,setStep]=useState<'email'|'code'>('email');const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{if(open){setEmail('');setToken('');setStep('email');setError('');setBusy(false)}},[open])
  if(!open)return null
  const send=async()=>{const value=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){setError('Enter a valid email address.');return}setBusy(true);setError('');const {error:e}=await supabase.auth.signInWithOtp({email:value,options:{shouldCreateUser:true}});if(e)setError(e.message);else setStep('code');setBusy(false)}
  const verify=async()=>{const value=email.trim().toLowerCase();const code=token.trim();if(!/^\d{6}$/.test(code)){setError('Enter the 6-digit code from your email.');return}setBusy(true);setError('');const {data,error:e}=await supabase.auth.verifyOtp({email:value,token:code,type:'email'});if(e||!data.user){setError(e?.message||'Verification failed.');setBusy(false);return}await supabase.from('profiles').upsert({id:data.user.id,email:value},{onConflict:'id'});onReady({id:data.user.id,email:value,handle:toHandle(value)});setBusy(false);onClose()}
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-md" onClick={onClose}><div className="glass w-full max-w-md p-7 md:p-9" onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between"><div><div className="text-[9px] tracking-[.35em] text-gold">GEETQAR / COMMUNITY ID</div><h3 className="mt-3 text-2xl font-semibold">One email. One identity.</h3></div><button onClick={onClose} className="text-white/35 hover:text-white"><X size={18}/></button></div><p className="mt-4 text-sm leading-6 text-white/45">Verify your email once. After that you can chat, vote and recommend without entering a username again.</p>{step==='email'?<><label className="mt-7 block text-[9px] tracking-[.25em] text-white/35">EMAIL ADDRESS<input autoFocus value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} type="email" placeholder="you@example.com" className="mt-2 w-full border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-gold"/></label><button onClick={send} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 border border-gold/40 px-5 py-3 text-[10px] tracking-[.25em] text-gold hover:bg-gold hover:text-black disabled:opacity-30">{busy?<Loader2 size={15} className="animate-spin"/>:<Mail size={15}/>} SEND CODE</button></>:<><div className="mt-7 flex items-center gap-2 text-xs text-gold"><Check size={14}/> Code sent to {email}</div><label className="mt-5 block text-[9px] tracking-[.25em] text-white/35">6-DIGIT CODE<input autoFocus value={token} onChange={e=>setToken(e.target.value.replace(/\D/g,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&verify()} inputMode="numeric" placeholder="123456" className="mt-2 w-full border border-white/10 bg-transparent p-3 text-center text-xl tracking-[.45em] outline-none focus:border-gold"/></label><button onClick={verify} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 border border-gold/40 px-5 py-3 text-[10px] tracking-[.25em] text-gold hover:bg-gold hover:text-black disabled:opacity-30">{busy?<Loader2 size={15} className="animate-spin"/>:<Check size={15}/>} VERIFY & ENTER</button><button onClick={()=>setStep('email')} className="mt-4 w-full text-[9px] tracking-[.2em] text-white/30 hover:text-white">USE A DIFFERENT EMAIL</button></>}{error&&<p role="alert" className="mt-4 text-xs text-red-300">{error}</p>}</div></div>
}
