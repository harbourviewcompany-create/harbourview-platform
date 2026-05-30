import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glossary Term | Harbourview Education',
  description: 'Professional terminology definition from Harbourview Education. Orientation-level only.',
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params
  const displayTerm = term.replace(/-/g, ' ')

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <section className="py-20">
        <div className="page-container max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Harbourview Education / Glossary</p>
          <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold/70 mb-4">Term pending definition review</p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl capitalize">
              {displayTerm}
            </h1>
            <p className="mt-6 text-base leading-8 text-white/60">
              Harbourview glossary definitions are reviewed before publication to ensure accuracy, appropriate scope and claim discipline. This term has been assigned a route but its definition has not yet been cleared for public access. Definitions for controlled terminology may be available through the education request intake.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/education/request"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-[#d6b76d]"
              >
                Request Definition
              </Link>
              <Link
                href="/education/glossary"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy"
              >
                Return to Glossary
              </Link>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Education boundary</p>
            <p className="text-sm leading-7 text-white/50">
              Harbourview glossary definitions are orientation-level only. They do not constitute legal advice, regulatory guidance, QP opinion or authoritative interpretation of any regulation, standard or treaty obligation.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}