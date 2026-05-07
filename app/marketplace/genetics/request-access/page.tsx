const fieldClass = 'rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C6A55A]/60'
const labelClass = 'text-xs uppercase tracking-[0.24em] text-[#C6A55A]'

export default function RequestGeneticsAccessPage() {
  return (
    <main className="min-h-screen bg-[#05070A] px-6 py-20 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8">
            <div className={labelClass}>Private access request</div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Request reviewed access to a genetics opportunity.
            </h1>
            <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
              Harbourview reviews each inquiry before any genetics holder, contact detail, pricing information or sensitive material is disclosed. The purpose is to understand commercial fit, seriousness and the relevant market pathway before any introduction is considered.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#F5F1E8]/65">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">1. Submit interest</div>
                <p className="mt-1 text-xs leading-5">Provide operator context, target market and intended use.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">2. Harbourview review</div>
                <p className="mt-1 text-xs leading-5">We assess fit before sharing any inquiry externally.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">3. Controlled introduction</div>
                <p className="mt-1 text-xs leading-5">Only appropriate requests are routed for further discussion.</p>
              </div>
            </div>
          </aside>

          <form className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="border-b border-white/10 pb-8">
              <div className={labelClass}>Applicant</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input className={fieldClass} placeholder="Name" />
                <input className={fieldClass} placeholder="Company" />
                <input className={fieldClass} placeholder="Country" />
                <input className={fieldClass} placeholder="Email" />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Commercial context</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select className={fieldClass}>
                  <option>Operator type</option>
                  <option>Licensed producer</option>
                  <option>Importer / distributor</option>
                  <option>Tissue-culture lab</option>
                  <option>Research organization</option>
                  <option>Brand / commercialization partner</option>
                </select>
                <select className={fieldClass}>
                  <option>Licence status</option>
                  <option>Licensed</option>
                  <option>Licence pending</option>
                  <option>Research / institutional status</option>
                  <option>Exploratory only</option>
                </select>
                <input className={fieldClass} placeholder="Target market" />
                <input className={fieldClass} placeholder="Timeline or intended review window" />
              </div>
            </div>

            <div className="py-8">
              <div className={labelClass}>Request detail</div>
              <div className="mt-5 grid gap-4">
                <input className={fieldClass} placeholder="Profile or drop of interest" />
                <textarea className={`${fieldClass} min-h-[180px]`} placeholder="Describe the genetics access request, intended use, scale and relevant commercial pathway." />
                <textarea className={`${fieldClass} min-h-[120px]`} placeholder="Confidentiality notes or information Harbourview should not share without approval." />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#C6A55A]/8 p-5 text-xs leading-6 text-[#F5F1E8]/65">
              Submitting this request does not create a direct introduction. Harbourview reviews the request first and controls whether any inquiry, identity or context is shared with a genetics holder.
            </div>

            <button className="mt-8 rounded-full bg-[#C6A55A] px-6 py-4 text-sm font-semibold text-[#0B1A2F]">
              Submit for Harbourview Review
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
