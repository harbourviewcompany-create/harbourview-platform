export default function RequestGeneticsAccessPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10">
        <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">
          Request Genetics Access
        </div>

        <h1 className="mt-4 text-4xl font-semibold">
          Controlled inquiry process for qualified operators and partners.
        </h1>

        <p className="mt-6 text-sm text-gray-300">
          Harbourview reviews requests before sharing introductions, sensitive materials or direct contact details with genetics holders.
        </p>

        <form className="mt-10 grid gap-6">
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Name" />
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Company" />
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Country" />
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Email" />

          <select className="rounded-xl border border-white/10 bg-black/30 p-4">
            <option>Operator type</option>
            <option>Licensed producer</option>
            <option>Importer</option>
            <option>Distributor</option>
            <option>Tissue-culture lab</option>
            <option>Research organization</option>
          </select>

          <textarea className="min-h-[160px] rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Describe your request, target market and intended use." />

          <button className="rounded-full border border-[#C6A55A] px-5 py-4 text-sm text-[#C6A55A]">
            Submit Request
          </button>
        </form>
      </div>
    </main>
  )
}
