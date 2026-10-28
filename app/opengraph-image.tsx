import { ImageResponse } from 'next/og'

export const alt = 'GEETQAR, songwriter, singer and producer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg,#0b0709 0%,#2a0f1c 55%,#8a2146 100%)', color: '#f4ece1' }}>
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8, color: '#ff9066' }}>OFFICIAL SITE</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 210, fontWeight: 800, lineHeight: 1, letterSpacing: -6 }}>
            GEET<span style={{ color: '#ff6a3d' }}>QAR</span>
          </div>
          <div style={{ display: 'flex', fontSize: 38, marginTop: 24, color: 'rgba(244,236,225,.8)' }}>Songwriter · Singer · Producer · Mix &amp; Master</div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: 'rgba(244,236,225,.6)' }}>Songs, lyrics and videos</div>
      </div>
    ),
    size,
  )
}
