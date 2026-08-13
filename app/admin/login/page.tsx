'use client'

import { FormEvent, useState } from 'react'
import { Loader2, LockKeyhole, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AdminLogin() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError('Invalid admin credentials.'); setBusy(false); return }
    router.replace('/admin')
    router.refresh()
  }

  return <main className="min-h-screen bg-black px-6 py-24 text-white md:px-12">
    <div className="mx-auto max-w-md">
      <div className="text-[10px] tracking-[.4em] text-gold">GEETQAR / PRIVATE ACCESS</div>
      <h1 className="mt-5 text-5xl font-bold">Admin</h1>
      <p className="mt-4 text-sm leading-7 text-white/40">Private artist controls. Sign in with the Supabase account authorised for Geetqar.</p>
      <form onSubmit={submit} className="glass mt-10 space-y-4 p-7">
        <label className="block text-xs text-white/45">EMAIL<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-2 w-full border border-white/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-gold" /></label>
        <label className="block text-xs text-white/45">PASSWORD<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full border border-white/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-gold" /></label>
        <button disabled={busy} className="inline-flex items-center gap-2 border border-gold/50 px-5 py-3 text-[10px] tracking-[.25em] text-gold disabled:opacity-40">{busy ? <Loader2 size={14} className="animate-spin"/> : <LogIn size={14}/>} {busy ? 'AUTHENTICATING' : 'ENTER CONTROL ROOM'}</button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>
      <div className="mt-5 flex items-center gap-2 text-[10px] tracking-[.18em] text-white/25"><LockKeyhole size={12}/> AUTHENTICATED ACCESS ONLY</div>
    </div>
  </main>
}
