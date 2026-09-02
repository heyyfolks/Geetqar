import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,.12),transparent_28%)]" />
      <div className="relative max-w-2xl text-center">
        <p className="text-[9px] tracking-[.5em] text-gold">GEETQAR / 404 / FREQUENCY LOST</p>
        <h1 className="mt-7 text-[18vw] font-extrabold leading-[.75] tracking-[-.1em] md:text-[11rem]">LOST</h1>
        <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-white/35">You left the signal. Or maybe the signal left you.</p>
        <Link href="/" className="mt-9 inline-flex border border-gold/30 px-6 py-3 text-[9px] tracking-[.3em] text-gold hover:border-gold/70">RETURN TO THE SOUND</Link>
      </div>
    </main>
  )
}
