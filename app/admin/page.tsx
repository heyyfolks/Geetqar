'use client'

import { useState } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { supabase } from '@/lib/queue'

export default function Admin() {
  const [file, setFile] = useState<File | null>(null)
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const upload = async () => {
    if (!file || !secret || busy) return
    setBusy(true)
    setStatus('Preparing secure upload…')
    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-geetqar-admin-secret': secret },
        body: JSON.stringify({ fileName: file.name }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Could not create upload URL')

      setStatus('Uploading master…')
      const { error } = await supabase().storage.from('audio-masters').uploadToSignedUrl(payload.path, payload.token, file)
      if (error) throw error
      setStatus(`Uploaded securely: ${file.name}`)
      setFile(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return <main className="min-h-screen bg-black px-6 py-24 text-white md:px-12">
    <div className="mx-auto max-w-3xl">
      <div className="text-[10px] tracking-[.4em] text-gold">GEETQAR / PRIVATE CONTROL</div>
      <h1 className="mt-4 text-5xl font-bold">Artist Admin</h1>
      <p className="mt-4 text-sm leading-7 text-white/40">Private WAV/FLAC upload control. The master bucket stays private and is never exposed directly to visitors.</p>

      <section className="glass mt-10 p-7">
        <h2 className="text-xl font-semibold">Upload original master</h2>
        <p className="mt-2 text-xs text-white/35">WAV / FLAC · private storage · signed upload</p>
        <input className="mt-6 block w-full text-sm" type="file" accept="audio/wav,audio/x-wav,audio/flac,audio/x-flac" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file && <p className="mt-4 text-xs text-gold">Selected: {file.name}</p>}
        <input value={secret} onChange={e => setSecret(e.target.value)} type="password" placeholder="Admin secret" className="mt-5 w-full border border-white/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-gold" />
        <button onClick={upload} disabled={!file || !secret || busy} className="mt-6 inline-flex items-center gap-2 border border-gold/50 px-5 py-3 text-[10px] tracking-[.25em] text-gold disabled:opacity-30">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {busy ? 'UPLOADING' : 'UPLOAD MASTER'}
        </button>
        {status && <p className={`mt-5 text-xs ${status.toLowerCase().includes('failed') || status.toLowerCase().includes('unauthorized') ? 'text-red-300' : 'text-white/45'}`}>{status}</p>}
      </section>
    </div>
  </main>
}
