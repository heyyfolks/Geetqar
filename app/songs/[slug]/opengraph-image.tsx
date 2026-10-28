import { ImageResponse } from 'next/og'
import { getCatalog } from '@/lib/catalog'

export const alt = 'GEETQAR song'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

function hue(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const track = (await getCatalog()).find((t) => t.slug === slug)
  // the default OG font has no Devanagari glyphs, so keep Latin characters only
  const name = (track?.name || 'GEETQAR').replace(/[^ -ɏ‐-‧]/g, '').trim() || 'GEETQAR'
  const h = track ? hue(track.id) : 340
  const fontSize = name.length > 34 ? 70 : name.length > 20 ? 92 : 120
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: `linear-gradient(135deg,#0b0709 0%,hsl(${h},55%,16%) 50%,hsl(${(h + 40) % 360},70%,38%) 100%)`, color: '#f4ece1' }}>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 8, color: '#ffb454' }}>{track ? track.kind.toUpperCase() : 'GEETQAR'}</div>
        <div style={{ display: 'flex', fontSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3 }}>{name}</div>
        <div style={{ display: 'flex', fontSize: 40, color: 'rgba(244,236,225,.85)' }}>GEET<span style={{ color: '#ff6a3d' }}>QAR</span><span style={{ marginLeft: 20, fontSize: 26, color: 'rgba(244,236,225,.6)', alignSelf: 'center' }}>Official</span></div>
      </div>
    ),
    size,
  )
}
