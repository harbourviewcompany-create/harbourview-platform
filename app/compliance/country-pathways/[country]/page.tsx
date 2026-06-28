import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentStatusNotice, InlineStatusBadge } from '@/components/ContentStatusNotice'
import { getComplianceCountry } from '@/lib/compliance/countries'
import { maturityLabels } from '@/lib/compliance/safePublicCompliance'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country: slug } = await params
  const c = getComplianceCountry(slug)
  if (!c) return { title: 'Country Not Found | Harbourview' }
  return {
    title: `${c.country} Compliance Pathways | Harbourview`,
    description: `${c.pathwaySummary.slice(0, 155)} Public-safe orientation only.`,
  }
}

const regionLabels: Record<string, string> = {
  europe: 'Europe',
  'north-america': 'North America',
  caribbean: 'Caribbean',
  'latin-america': 'Latin America',
  africa: 'Africa',
  'middle-east': 'Middle East',
  'asia-pacific': 'Asia-Pacific',
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params
  const c = getComplianceCountry(slug)

  if (!c) return notFound()

  return (
    <main className="bg-[#020814] text-white">
      <section className="border-b border-gold/10 bg-[radial-gradient(circle_at_74%_18%,rgba(198,165,90,0.16),transparent_32%),linear-gradient(135deg,rgba(11,26,47,0.95)_0%,rgba(2,8,20,1)_74%)] py-14 sm:py-18">
        <div className="page-container max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
            Country pathway orientation
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <InlineStatusBadge label={c.publicStatusLabel} />
            <InlineStatusBadge label={`Review: ${c.reviewStatus.replace(/_/g, ' ')}`} />
            <InlineStatusBadge label={`Source confidence: ${c.sourceConfidence}`} />
          </div>
          <h1 className="mt-5 font-serif text-4xl tracking-[-0.055em] text-gold-pale sm:text-6xl">
            {c.country}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
            {regionLabels[c.region] ?? c.region} · {maturityLabels[c.maturityLevel]} · {c.lastReviewed}
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

            <div className="mt-8">
              <ContentStatusNotice title="Country status" status="draft-orientation" origin="draft-orientation">
                {c.publicStatusExplanation} {c.sourceBasis}
              </ContentStatusNotice>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Import/export</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.importExportRelevance}</p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Commercial review</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.commercialRelevance}</p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Source confidence</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.sourceConfidence}</p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-black/18 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/68">Review owner</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{c.reviewOwner}</p>
              </div>
            </div>

            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-gold/70">Last reviewed</dt>
                <dd className="mt-1 text-white/54">{c.lastReviewed}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gold/70">Next review due</dt>
                <dd className="mt-1 text-white/54">{c.nextReviewDue}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gold/70">Review status</dt>
                <dd className="mt-1 text-white/54">{c.reviewStatus.replace(/_/g, ' ')}</dd>
              </div>
            </dl>

            <p className="mt-8 text-sm leading-7 text-white/48">{c.disclaimer}</p>
            <div className="mt-6 rounded border border-gold/10 bg-white/[0.02] p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/60">Compliance boundary</p>
              <p className="text-xs leading-6 text-white/40">{c.complianceBoundary ?? 'Pathway summaries are orientation-level only. They do not confirm licence eligibility, authorisation scope, import or export clearance, legal sufficiency or regulatory approval for any specific operator, product or transaction.'}</p>
            </div>
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
