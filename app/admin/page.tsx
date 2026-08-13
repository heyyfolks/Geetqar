'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, LogOut, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UserResponse } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const tracks = ['VELVET PLAY', 'STOLEN FROM THE DREAMS']

export default function Admin() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [file, setFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverTrack, setCoverTrack] = useState(tracks[0])
  const [status, setStatus] = useState('')
  const [coverStatus, setCoverStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then((result: UserResponse) => {
      if (!active) return
      setEmail(result.data.user?.email || '')
    })
    return () => { active = false }
  }, [supabase])

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { router.replace('/admin/login'); return null }
    return session
  }

  async function upload() {
    if (!file || busy) return
    const session = await getSession()
    if (!session) return
    setBusy(true); setStatus('Preparing secure upload…')
    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fileName: file.name, kind: 'master' }),
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

  async function uploadCover() {
    if (!coverFile || coverBusy) return
    const session = await getSession()
    if (!session) return
    setCoverBusy(true); setCoverStatus('Preparing secure cover upload…')
    try {
      const slug = coverTrack.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fileName: coverFile.name, kind: 'cover', trackSlug: slug }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Could not create cover upload URL')
      setCoverStatus('Uploading cover…')
      const { error } = await supabase.storage.from('Music').uploadToSignedUrl(payload.path, payload.token, coverFile)
      if (error) throw error
      setCoverStatus(`Cover uploaded for ${coverTrack}.`); setCoverFile(null)
    } catch (e) { setCoverStatus(e instanceof Error ? e.message : 'Cover upload failed') }
    finally { setCoverBusy(false) }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return <main className="min-h-screen bg-black px-6 py-24 text-white md:px-12">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-6">
        <div><div className="text-[10px] tracking-[.4em] text-gold">GEETQAR / PRIVATE CONTROL</div><h1 className="mt-4 text-5xl font-bold">Artist Admin</h1><p className="mt-4 text-sm leading-7 text-white/40">Authenticated artist controls. Master audio and artwork stay in private storage.</p></div>
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

      <section className="glass mt-6 p-7">
        <div className="flex items-center gap-3"><ImagePlus size={18} className="text-gold"/><h2 className="text-xl font-semibold">Upload track artwork</h2></div>
        <p className="mt-2 text-xs text-white/35">JPG / PNG / WEBP · this becomes the artwork shown beside the track</p>
        <label className="mt-6 block text-[10px] tracking-[.25em] text-white/40">TRACK</label>
        <select value={coverTrack} onChange={e => setCoverTrack(e.target.value)} className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold/40">
          {tracks.map(track => <option key={track} value={track}>{track}</option>)}
        </select>
        <input className="mt-5 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
        {coverFile && <p className="mt-4 text-xs text-gold">Selected: {coverFile.name}</p>}
        <button onClick={uploadCover} disabled={!coverFile || coverBusy} className="mt-6 inline-flex items-center gap-2 border border-gold/50 px-5 py-3 text-[10px] tracking-[.25em] text-gold disabled:opacity-30">{coverBusy ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>} {coverBusy ? 'UPLOADING' : 'UPLOAD ARTWORK'}</button>
        {coverStatus && <p className={`mt-5 text-xs ${/failed|unauthorized|error/i.test(coverStatus) ? 'text-red-300' : 'text-white/45'}`}>{coverStatus}</p>}
      </section>
    </div>
  </main>
}
