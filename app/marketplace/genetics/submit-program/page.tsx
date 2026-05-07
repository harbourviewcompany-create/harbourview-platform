const fieldClass = 'rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C6A55A]/60'
const labelClass = 'text-xs uppercase tracking-[0.24em] text-[#C6A55A]'

export default function SubmitGeneticsProgramPage() {
  return (
    <main className="min-h-screen bg-[#05070A] px-6 py-20 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8">
            <div className={labelClass}>Program onboarding</div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Present a genetics program through Harbourview.
            </h1>
            <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
              Harbourview Genetics is designed for selected breeders, seed companies and tissue-culture groups seeking controlled international visibility without exposing sensitive information publicly.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#F5F1E8]/65">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Selective review</div>
                <p className="mt-1 text-xs leading-5">Programs are reviewed before publication or promotion.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Public and private separation</div>
                <p className="mt-1 text-xs leading-5">Sensitive breeding information and direct contacts remain controlled.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Commercial positioning</div>
                <p className="mt-1 text-xs leading-5">Profiles are framed as curated commercial opportunities, not public directories.</p>
              </div>
            </div>
          </aside>

          <form className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="border-b border-white/10 pb-8">
              <div className={labelClass}>Program identity</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input className={fieldClass} placeholder="Breeder / company / laboratory" />
                <input className={fieldClass} placeholder="Country or region" />
                <input className={fieldClass} placeholder="Email" />
                <input className={fieldClass} placeholder="Website or portfolio link" />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Program structure</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select className={fieldClass}>
                  <option>Program type</option>
                  <option>Breeder profile</option>
                  <option>Seed company</option>
                  <option>Tissue-culture laboratory</option>
                  <option>Licensing opportunity</option>
                  <option>Research collaboration</option>
                </select>
                <input className={fieldClass} placeholder="Target markets" />
              </div>
              <div className="mt-4 grid gap-4">
                <textarea className={`${fieldClass} min-h-[180px]`} placeholder="Describe the genetics program, current drops, collaboration opportunities or commercial positioning." />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Disclosure preferences</div>
              <div className="mt-5 grid gap-4">
                <textarea className={`${fieldClass} min-h-[140px]`} placeholder="What information can be shown publicly?" />
                <textarea className={`${fieldClass} min-h-[140px]`} placeholder="What information must remain private or controlled through Harbourview?" />
              </div>
            </div>

            <div className="py-8">
              <div className={labelClass}>Commercial context</div>
              <div className="mt-5 grid gap-4">
                <textarea className={`${fieldClass} min-h-[160px]`} placeholder="Describe target operators, desired partnerships, licensing goals or market-access objectives." />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#C6A55A]/8 p-5 text-xs leading-6 text-[#F5F1E8]/65">
              Submission does not guarantee publication or introduction. Harbourview reviews all materials before any profile, drop or commercial pathway discussion is made public.
            </div>

            <button className="mt-8 rounded-full bg-[#C6A55A] px-6 py-4 text-sm font-semibold text-[#0B1A2F]">
              Submit Program for Review
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
