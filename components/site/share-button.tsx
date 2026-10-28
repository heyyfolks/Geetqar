'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

/** Native share sheet on phones (WhatsApp, Instagram, ...), copy-link everywhere else. */
export function ShareButton({ path, title, className = 'gx-btn gx-btn-line' }: { path: string; title: string; className?: string }) {
  const [done, setDone] = useState(false)
  const share = async () => {
    const url = new URL(path, window.location.origin).toString()
    try {
      if (navigator.share) { await navigator.share({ title, url }); return }
      await navigator.clipboard.writeText(url)
      setDone(true)
      window.setTimeout(() => setDone(false), 2200)
    } catch {}
  }
  return <button type="button" className={className} onClick={share}>{done ? <><Check size={15} /> LINK COPIED</> : <><Share2 size={15} /> SHARE</>}</button>
}
