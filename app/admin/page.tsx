'use client'

import { useEffect, useState } from 'react'
import { Loader2, LogOut, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UserResponse } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function Admin() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then((result: UserResponse) => {
      if (!active) return
      setEmail(result.data.user?.email || '')
    })
    return () => { active = false }
  }, [supabase])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  async function upload() {
    if (!file || busy) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { router.replace('/admin/login'); return }
    setBusy(true); setStatus('Preparing secure upload…')
    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fileName: file.name }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Could not create upload URL')
      setStatus('Uploading master…')
      const { error } = await supabase.storage.from('Music').uploadToSignedUrl(payload.path, payload.token, file)
      if (error) throw error
      setStatus(`Uploaded securely: ${file.name}`); setFile(null)
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Upload failed') }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-black px-6 py-24 text-white md:px-12">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-6">
        <div><div className="text-[10px] tracking-[.4em] text-gold">GEETQAR / PRIVATE CONTROL</div><h1 className="mt-4 text-5xl font-bold">Artist Admin</h1><p className="mt-4 text-sm leading-7 text-white/40">Authenticated artist controls. Master audio stays in private storage.</p></div>
        <button onClick={logout} className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-[10px] tracking-[.2em] text-white/50 hover:border-gold/40 hover:text-gold"><LogOut size={13}/> LOG OUT</button>
      </div>
      {email && <p className="mt-5 text-xs text-white/25">SIGNED IN AS {email}</p>}
      <section className="glass mt-10 p-7">
        <h2 className="text-xl font-semibold">Upload original master</h2><p className="mt-2 text-xs text-white/35">WAV / FLAC · private storage · authenticated signed upload</p>
        <input className="mt-6 block w-full text-sm" type="file" accept="audio/wav,audio/x-wav,audio/flac,audio/x-flac" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file && <p className="mt-4 text-xs text-gold">Selected: {file.name}</p>}
        <button onClick={upload} disabled={!file || busy} className="mt-6 inline-flex items-center gap-2 border border-gold/50 px-5 py-3 text-[10px] tracking-[.25em] text-gold disabled:opacity-30">{busy ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>} {busy ? 'UPLOADING' : 'UPLOAD MASTER'}</button>
        {status && <p className={`mt-5 text-xs ${/failed|unauthorized|error/i.test(status) ? 'text-red-300' : 'text-white/45'}`}>{status}</p>}
      </section>
    </div>
  </main>
}
