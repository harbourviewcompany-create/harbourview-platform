export function FeaturedIssueHero({
  issue,
  title,
  description,
}: {
  issue: string
  title: string
  description: string
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[#C6A55A]/20 bg-[linear-gradient(145deg,#05070A,#0B1A2F)] px-8 py-16 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_70%_20%,rgba(198,165,90,0.55),transparent_28%)]" />
      <div className="relative max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.34em] text-[#C6A55A]">
          Featured issue · {issue}
        </div>
        <h1 className="mt-6 text-5xl font-semibold leading-[0.95] text-[#F5F1E8] md:text-7xl">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[#F5F1E8]/68">
          {description}
        </p>
      </div>
    </section>
  )
}

export function MonthlySelectionCard({
  month,
  focus,
}: {
  month: string
  focus: string
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6 backdrop-blur-sm transition-all duration-700 hover:border-[#C6A55A]/30 hover:bg-[#0B1A2F]/50">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Curated monthly selection
      </div>
      <div className="mt-4 text-2xl font-semibold text-[#F5F1E8]">{month}</div>
      <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/65">{focus}</p>
    </div>
  )
}

export function ArchivedReleaseLibrary({
  releases,
}: {
  releases: string[]
}) {
  return (
    <div className="rounded-[2rem] border border-[#C6A55A]/15 bg-[#081423]/65 p-8">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">
        Archived release library
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {releases.map((release) => (
          <div
            key={release}
            className="rounded-2xl border border-white/10 px-4 py-4 text-sm text-[#F5F1E8]/65"
          >
            {release}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EditorialChapterNav({
  chapters,
}: {
  chapters: string[]
}) {
  return (
    <nav className="flex flex-wrap gap-3">
      {chapters.map((chapter, index) => (
        <div
          key={chapter}
          className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#F5F1E8]/55"
        >
          Chapter {index + 1} · {chapter}
        </div>
      ))}
    </nav>
  )
}
