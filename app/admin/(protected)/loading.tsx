export default function AdminLoading() {
  return (
    <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading admin workspace">
      <div className="h-7 w-64 max-w-[70vw] animate-pulse rounded bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl border border-white/6 bg-white/[0.025]" />)}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-white/6 bg-white/[0.02]" />
    </section>
  )
}
