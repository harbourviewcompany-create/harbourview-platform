export function GeneticsMasthead({
  issue,
  season,
}: {
  issue: string
  season: string
}) {
  return (
    <header className="relative overflow-hidden rounded-[2.5rem] border border-[#C6A55A]/20 bg-[linear-gradient(145deg,#05070A,#0B1A2F)] px-8 py-14 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_50%_10%,rgba(198,165,90,0.55),transparent_30%)]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.38em] text-[#C6A55A]">
            Harbourview Genetics Publication
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.92] text-[#F5F1E8] md:text-7xl">
            Issue {issue}
          </h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 px-6 py-5 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
            Seasonal edition
          </div>
          <div className="mt-3 text-xl font-semibold text-[#F5F1E8]">
            {season}
          </div>
        </div>
      </div>
    </header>
  )
}

export function PublicationMetadataBar({
  region,
  release,
  curator,
}: {
  region: string
  release: string
  curator: string
}) {
  return (
    <div className="flex flex-wrap gap-3 rounded-full border border-white/10 bg-[#081423]/70 px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-[#F5F1E8]/58 backdrop-blur-sm">
      <span>{region}</span>
      <span>•</span>
      <span>{release}</span>
      <span>•</span>
      <span>{curator}</span>
    </div>
  )
}

export function CuratorSignature({
  name,
  title,
}: {
  name: string
  title: string
}) {
  return (
    <div className="rounded-[2rem] border border-[#C6A55A]/15 bg-black/25 px-7 py-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Curator signature
      </div>
      <div className="mt-5 text-2xl font-semibold italic text-[#F5F1E8]">
        {name}
      </div>
      <div className="mt-2 text-sm text-[#F5F1E8]/55">{title}</div>
    </div>
  )
}

export function SeasonalIssueCover({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[#C6A55A]/20 bg-[linear-gradient(145deg,#05070A,#0B1A2F)] px-8 py-24 text-center shadow-[0_45px_140px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_50%_0%,rgba(198,165,90,0.5),transparent_35%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.38em] text-[#C6A55A]">
          Harbourview Genetics
        </div>
        <h2 className="mt-8 text-6xl font-semibold leading-[0.9] text-[#F5F1E8] md:text-8xl">
          {title}
        </h2>
        <p className="mt-8 text-lg leading-8 text-[#F5F1E8]/68">
          {subtitle}
        </p>
      </div>
    </section>
  )
}

export function ArchivalContinuityPanel({
  entries,
}: {
  entries: string[]
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#081423]/60 px-8 py-10">
      <div className="text-[10px] uppercase tracking-[0.34em] text-[#C6A55A]">
        Publication continuity archive
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <div
            key={entry}
            className="rounded-2xl border border-white/10 px-5 py-4 text-sm text-[#F5F1E8]/65"
          >
            {entry}
          </div>
        ))}
      </div>
    </section>
  )
}
