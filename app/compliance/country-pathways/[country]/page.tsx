import { notFound } from 'next/navigation'
import { ContentStatusNotice, InlineStatusBadge } from '@/components/ContentStatusNotice'
import { getComplianceCountry } from '@/lib/compliance/countries'
import { maturityLabels } from '@/lib/compliance/safePublicCompliance'

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params
  const c = getComplianceCountry(slug)

  if (!c) notFound()

  return (
    <main className="bg-[#f5f1e8] py-12 text-navy">
      <div className="page-container max-w-5xl space-y-8">
        <section className="rounded-3xl border border-navy/10 bg-white p-6 shadow-[0_18px_55px_rgba(11,26,47,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Compliance country pathway</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <InlineStatusBadge label={c.publicStatusLabel} />
            <InlineStatusBadge label={`Review: ${c.reviewStatus.replace(/_/g, ' ')}`} />
            <InlineStatusBadge label={`Source confidence: ${c.sourceConfidence}`} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.025em] sm:text-5xl">{c.country}</h1>
          <p className="mt-4 text-base leading-8 text-gray-600">{c.pathwaySummary}</p>
        </section>

        <ContentStatusNotice title="Country status" status="draft-orientation" origin="draft-orientation">
          {c.publicStatusExplanation} {c.sourceBasis}
        </ContentStatusNotice>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[
            ['Maturity', maturityLabels[c.maturityLevel]],
            ['Import/export relevance', c.importExportRelevance],
            ['Cultivation/manufacturing relevance', c.cultivationManufacturingRelevance],
            ['GMP/GACP/GDP relevance', c.gmpGacpGdpRelevance],
            ['Testing and COA relevance', c.testingCoaRelevance],
            ['Packaging and labelling relevance', c.packagingLabellingRelevance],
            ['Facility, environment and security relevance', c.facilityEnvironmentSecurityRelevance],
            ['Commercial relevance', c.commercialRelevance],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-navy/10 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{copy}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-navy/10 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-navy">Known review bottlenecks</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.knownBottlenecks.map((item) => (
              <span key={item} className="rounded-full border border-navy/10 bg-navy/5 px-3 py-1 text-xs text-navy/60">
                {item}
              </span>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-navy">Last reviewed</dt>
              <dd className="mt-1 text-gray-500">{c.lastReviewed}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Next review due</dt>
              <dd className="mt-1 text-gray-500">{c.nextReviewDue}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Review owner</dt>
              <dd className="mt-1 text-gray-500">{c.reviewOwner}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gold/30 bg-gold-pale p-5 text-sm leading-7 text-navy">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Compliance boundary</p>
          <p className="mt-3">{c.disclaimer}</p>
        </section>
      </div>
    </main>
  )
}
