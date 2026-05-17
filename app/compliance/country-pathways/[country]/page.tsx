import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getComplianceCountry } from '@/lib/compliance/countries'
import { maturityLabels } from '@/lib/compliance/safePublicCompliance'

const regionLabels: Record<string, string> = {
  europe: 'Europe',
  'north-america': 'North America',
  caribbean: 'Caribbean',
  'latin-america': 'Latin America',
  africa: 'Africa',
  'middle-east': 'Middle East',
  'asia-pacific': 'Asia-Pacific',
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params
  const c = getComplianceCountry(slug)

  if (!c) notFound()

  return (
    <main className="bg-[#020814] text-white">
      <section className="border-b border-gold/10 bg-[radial-gradient(circle_at_74%_18%,rgba(198,165,90,0.16),transparent_32%),linear-gradient(135deg,rgba(11,26,47,0.95)_0%,rgba(2,8,20,1)_74%)] py-14 sm:py-18">
        <div className="page-container max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
            Country pathway orientation
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-[-0.055em] text-gold-pale sm:text-6xl">
            {c.country}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
            {regionLabels[c.region] ?? c.region} · {maturityLabels[c.maturityLevel]} · Reviewed May 2026
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="page-container grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(300px,0.32fr)]">
          <article className="rounded-sm border border-gold/12 bg-[#071426]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
              Public-safe pathway summary
            </p>
            <p className="mt-5 text-base leading-8 text-white/70">{c.pathwaySummary}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Import/export</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.importExportRelevance}</p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Commercial review</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.commercialRelevance}</p>
              </div>
            </div>

            <p className="mt-8 text-sm leading-7 text-white/48">{c.disclaimer}</p>
          </article>

          <aside className="rounded-sm border border-gold/12 bg-black/20 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
              Controlled request path
            </p>
            <h2 className="mt-4 font-serif text-2xl tracking-[-0.035em] text-[#f5f1e8]">
              Request country intelligence
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/58">
              Full pathway intelligence is available on request, including licensing pathway, import/export requirements, documentation expectations and commercial route viability.
            </p>
            <Link href="/contact" className="btn-intelligence mt-6 min-h-[52px] justify-center">
              <span>Request Country Intelligence</span>
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
    </main>
  )
}
