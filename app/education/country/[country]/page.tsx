import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Education Brief | Harbourview Education',
  description: 'Jurisdiction education context from Harbourview. Non-promotional and not legal or regulatory advice.',
}

export default async function CountryEducationPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  const displayCountry = country.replace(/-/g, ' ')

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <section className="py-20">
        <div className="page-container max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Harbourview Education / Country Briefs</p>
          <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold/70 mb-4">Country brief pending review</p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl capitalize">
              {displayCountry}
            </h1>
            <p className="mt-6 text-base leading-8 text-white/60">
              Harbourview country education briefs are reviewed before publication. Jurisdiction context is treated as review-sensitive — conclusions that depend on specific regulatory authority interpretations, current permit conditions or recent legislative changes require qualified review before publication. This country brief is pending that review.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/40">
              Country-specific intelligence and market access pathway context may be available through Harbourview Intelligence or through a confidential intake request.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/intake"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-[#d6b76d]"
              >
                Request Country Intelligence
              </a>
              <a
                href="/intelligence"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy"
              >
                Explore Intelligence
              </a>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Education boundary</p>
            <p className="text-sm leading-7 text-white/50">
              Country education briefs are informational and comparative. They do not represent government endorsement, legal advice, official regulatory guidance, import clearance or confirmed market access. Jurisdiction-specific matters require qualified professional review.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
