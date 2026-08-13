import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-[10px] tracking-[.55em] text-gold">GEETQAR / SIGNAL LOST</p>
        <h1 className="mt-6 text-7xl font-black tracking-[-.06em] md:text-9xl">404</h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-white/40">This frequency does not exist. Go back to the main signal.</p>
        <Link href="/" className="mt-9 inline-flex border border-gold/40 px-6 py-3 text-[10px] tracking-[.3em] text-gold transition hover:bg-gold hover:text-black">RETURN TO GEETQAR</Link>
      </div>
    </main>
  )
}
