export function SeasonalOpeningStatement({
  season,
  statement,
}: {
  season: string
  statement: string
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[#C6A55A]/20 bg-[linear-gradient(145deg,#05070A,#0B1A2F)] px-8 py-16 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_50%_0%,rgba(198,165,90,0.45),transparent_32%)]" />
      <div className="relative max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.34em] text-[#C6A55A]">
          Seasonal opening statement · {season}
        </div>
        <p className="mt-8 text-3xl font-semibold leading-[1.15] text-[#F5F1E8] md:text-5xl">
          {statement}
        </p>
      </div>
    </section>
  )
}

export function CuratorEditorial({
  title,
  editorial,
}: {
  title: string
  editorial: string
}) {
  return (
    <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-black/25 px-8 py-12 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
          Curator editorial
        </div>
        <h2 className="mt-5 text-3xl font-semibold text-[#F5F1E8]">
          {title}
        </h2>
      </div>
      <div>
        <p className="text-base leading-8 text-[#F5F1E8]/68">
          {editorial}
        </p>
      </div>
    </section>
  )
}

export function AtmosphericChapterTransition({
  chapter,
}: {
  chapter: string
}) {
  return (
    <div className="relative py-16 text-center">
      <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C6A55A]/40 to-transparent" />
      <div className="relative inline-flex rounded-full border border-[#C6A55A]/25 bg-[#05070A]/80 px-6 py-3 text-[10px] uppercase tracking-[0.34em] text-[#C6A55A] backdrop-blur-sm">
        {chapter}
      </div>
    </div>
  )
}

export function ProfileFeatureSequence({
  heading,
  narrative,
}: {
  heading: string
  narrative: string
}) {
  return (
    <section className="rounded-[2rem] border border-[#C6A55A]/15 bg-[#081423]/60 px-8 py-12 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Profile feature sequence
      </div>
      <h3 className="mt-5 text-4xl font-semibold leading-tight text-[#F5F1E8]">
        {heading}
      </h3>
      <p className="mt-6 max-w-3xl text-base leading-8 text-[#F5F1E8]/68">
        {narrative}
      </p>
    </section>
  )
}
