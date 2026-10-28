import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GEETQAR',
    short_name: 'GEETQAR',
    description: 'Official site of GEETQAR (गीतकार): songs, lyrics and videos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0709',
    theme_color: '#0b0709',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
