export default function SubmitGeneticsProgramPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10">
        <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">
          Submit Genetics Program
        </div>

        <h1 className="mt-4 text-4xl font-semibold">
          Present selected genetics opportunities to qualified international operators.
        </h1>

        <p className="mt-6 text-sm text-gray-300">
          Harbourview reviews all submissions before publishing profiles or drops. Public and private fields are reviewed separately to protect sensitive information.
        </p>

        <form className="mt-10 grid gap-6">
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Breeder / company / lab" />
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Country or region" />
          <input className="rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Email" />

          <select className="rounded-xl border border-white/10 bg-black/30 p-4">
            <option>Program type</option>
            <option>Breeder profile</option>
            <option>Seed company</option>
            <option>Tissue-culture lab</option>
            <option>Licensing opportunity</option>
          </select>

          <textarea className="min-h-[160px] rounded-xl border border-white/10 bg-black/30 p-4" placeholder="Describe your genetics program, current drops or collaboration opportunities." />

          <textarea className="min-h-[120px] rounded-xl border border-white/10 bg-black/30 p-4" placeholder="What information should remain private?" />

          <button className="rounded-full border border-[#C6A55A] px-5 py-4 text-sm text-[#C6A55A]">
            Submit Genetics Program
          </button>
        </form>
      </div>
    </main>
  )
}
