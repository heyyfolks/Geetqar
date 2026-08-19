'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Mail, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export type CommunityUser = { id: string; email: string; handle: string }

function toHandle(email: string) {
  const local = email.split('@')[0] || 'listener'
  return local.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24) || 'listener'
}

export function useCommunityUser() {
  const supabase = createSupabaseBrowserClient()
  const [user, setUser] = useState<CommunityUser | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const email = data.user?.email
      setUser(email ? { id: data.user!.id, email, handle: toHandle(email) } : null)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const email = session?.user?.email
      setUser(email ? { id: session!.user.id, email, handle: toHandle(email) } : null)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  return user
}

export function EmailGate({
  open,
  onClose,
  onReady,
}: {
  open: boolean
  onClose: () => void
  onReady: (user: CommunityUser) => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setEmail('')
      setSent(false)
      setError('')
      setBusy(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email
      if (email) {
        const communityUser = { id: session!.user.id, email, handle: toHandle(email) }
        onReady(communityUser)
        onClose()
      }
    })
    return () => data.subscription.unsubscribe()
  }, [open, onClose, onReady, supabase])

  if (!open) return null

  const send = async () => {
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address.')
      return
    }

    setBusy(true)
    setError('')

    const redirectTo = `${window.location.origin}/`
    const { error: e } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    })

    if (e) {
      setError(e.message)
    } else {
      setSent(true)
    }
    setBusy(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="glass w-full max-w-md p-7 md:p-9" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] tracking-[.35em] text-gold">GEETQAR / COMMUNITY ID</div>
            <h3 className="mt-3 text-2xl font-semibold">One email. One identity.</h3>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/45">
          Enter your email once. We&apos;ll send you a secure sign-in link. After you open it,
          you can chat, vote and recommend without entering a username again.
        </p>

        {!sent ? (
          <>
            <label className="mt-7 block text-[9px] tracking-[.25em] text-white/35">
              EMAIL ADDRESS
              <input
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full border border-white/10 bg-transparent p-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <button
              onClick={send}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-gold/40 px-5 py-3 text-[10px] tracking-[.25em] text-gold disabled:opacity-30"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              SEND SIGN-IN LINK
            </button>
          </>
        ) : (
          <div className="mt-7 border border-gold/20 bg-gold/5 p-5">
            <Check size={18} className="text-gold" />
            <div className="mt-3 text-sm text-white">Check your email</div>
            <p className="mt-2 text-xs leading-5 text-white/45">
              We sent a secure sign-in link to <span className="text-white/75">{email}</span>.
              Open the link in the same browser to enter the Live Room.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-[9px] tracking-[.2em] text-gold"
            >
              USE ANOTHER EMAIL
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
      </div>
    </div>
  )
}
