import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { gold: '#D4AF37', platinum: '#E5E4E2', ink: '#000000' }, fontFamily: { display: ['var(--font-display)'], sans: ['var(--font-sans)'] }, boxShadow: { gold: '0 0 40px rgba(212,175,55,.16)' } } },
  plugins: [],
}
export default config