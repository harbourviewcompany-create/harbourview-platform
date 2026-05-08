export function GlobalEditionNav({
  editions,
}: {
  editions: string[]
}) {
  return (
    <nav className="flex flex-wrap gap-3">
      {editions.map((edition) => (
        <div
          key={edition}
          className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-[#F5F1E8]/60 backdrop-blur-sm transition-all duration-700 hover:border-[#C6A55A]/35 hover:text-[#C6A55A]"
        >
          {edition} Edition
        </div>
      ))}
    </nav>
  )
}

export function RegionalIssueCover({
  region,
  title,
  framing,
}: {
  region: string
  title: string
  framing: string
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[#C6A55A]/18 bg-[linear-gradient(145deg,#05070A,#0B1A2F)] px-8 py-20 shadow-[0_45px_140px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_70%_10%,rgba(198,165,90,0.5),transparent_30%)]" />
      <div className="relative max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.38em] text-[#C6A55A]">
          {region} Edition
        </div>
        <h2 className="mt-8 text-6xl font-semibold leading-[0.9] text-[#F5F1E8] md:text-8xl">
          {title}
        </h2>
        <p className="mt-8 text-lg leading-8 text-[#F5F1E8]/68">
          {framing}
        </p>
      </div>
    </section>
  )
}

export function InternationalPathwaySpotlight({
  market,
  insight,
}: {
  market: string
  insight: string
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#081423]/60 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        International pathway spotlight
      </div>
      <div className="mt-5 text-3xl font-semibold text-[#F5F1E8]">
        {market}
      </div>
      <p className="mt-5 text-sm leading-7 text-[#F5F1E8]/65">
        {insight}
      </p>
    </div>
  )
}

export function CrossMarketSequence({
  entries,
}: {
  entries: string[]
}) {
  return (
    <section className="rounded-[2rem] border border-[#C6A55A]/15 bg-black/25 px-8 py-10">
      <div className="text-[10px] uppercase tracking-[0.34em] text-[#C6A55A]">
        Cross-market publication sequence
      </div>
      <div className="mt-8 space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry}
            className="flex items-start gap-5 rounded-2xl border border-white/10 px-5 py-5"
          >
            <div className="text-xs text-[#C6A55A]">0{index + 1}</div>
            <div className="text-sm leading-7 text-[#F5F1E8]/65">{entry}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
