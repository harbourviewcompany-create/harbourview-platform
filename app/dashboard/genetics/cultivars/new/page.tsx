import { CreatePassportForm } from './CreatePassportForm'

export default function NewCultivarPassportPage() {
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Genetics workspace</p>
          <h1 className="mt-2 text-2xl font-semibold">Create Cultivar Passport</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Registers a new cultivar under your ownership. The passport starts private and moves to
            public only after admin claim review. No seed, clone, or material transfer is implied.
          </p>
        </div>

        <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
          <CreatePassportForm />
        </div>
      </section>
    </main>
  )
}
