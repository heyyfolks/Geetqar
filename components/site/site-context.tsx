'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_CONFIG, type SiteConfig } from '@/lib/site-config'

const SiteContext = createContext<SiteConfig>(DEFAULT_CONFIG)

export function SiteProvider({ config, children }: { config: SiteConfig; children: React.ReactNode }) {
  return <SiteContext.Provider value={config}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)
