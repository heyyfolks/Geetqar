export default function Loading() {
  return (
    <main className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto mb-6 h-px w-32 overflow-hidden bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-gold" />
        </div>
        <p className="text-[10px] tracking-[.55em] text-white/50">GEETQAR</p>
        <p className="mt-3 text-[9px] tracking-[.3em] text-white/20">LOADING THE SIGNAL</p>
      </div>
    </main>
  )
}
