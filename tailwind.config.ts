import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // `gold` is kept as the accent key so older components (jukebox, admin, world pages) pick up the new palette.
        gold: '#ff6a3d',
        ember: '#ff6a3d',
        wine: '#8a2146',
        amber: '#ffb454',
        cream: '#f4ece1',
        platinum: '#f4ece1',
        ink: '#0b0709',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: { gold: '0 0 40px rgba(255,106,61,.18)' },
    },
  },
  plugins: [],
}
export default config
