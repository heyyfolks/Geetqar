'use client'

import { useEffect, useState } from 'react'
import { Instagram, Menu, X, Youtube } from 'lucide-react'
import { NAV, SOCIAL } from '@/lib/site'

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`gx-nav ${scrolled || open ? 'is-scrolled' : ''}`}>
        <div className="gx-wrap gx-nav-in">
          <a href="#top" className="gx-logo" aria-label="GEETQAR home" onClick={() => setOpen(false)}>GEET<i>qar</i></a>
          <nav className="gx-links" aria-label="Primary">
            {NAV.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a className="jelly-icon" href={SOCIAL.instagram} target="_blank" rel="noreferrer" aria-label="GEETQAR on Instagram"><Instagram size={16} /></a>
            <a className="jelly-icon" href={SOCIAL.youtube} target="_blank" rel="noreferrer" aria-label="GEETQAR on YouTube"><Youtube size={16} /></a>
            <button className="jelly-icon gx-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="gx-menu" role="dialog" aria-label="Menu">
          {NAV.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label.charAt(0) + item.label.slice(1).toLowerCase()}</a>)}
        </div>
      )}
    </>
  )
}
