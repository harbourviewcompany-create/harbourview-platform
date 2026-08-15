import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireClinicalReviewAuth } from '@/lib/auth/clinicalReviewGuard'
import { loadClinicalSourceInspection } from '@/lib/server/clinicalEvidenceOperations'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clinical Source Inspection · Harbourview', robots: { index: false, follow: false } }

const card = 'rounded-xl border border-white/10 bg-white/[0.035] p-4'
const pre = 'mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-[#050d17] p-4 text-xs leading-5 text-white/70'

function pretty(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2)
}

export default async function ClinicalSourceInspectionPage({ params }: { params: Promise<{ sourceId: string }> }) {
  await requireClinicalReviewAuth()
  const { sourceId } = await params
  let inspection
  try {
    inspection = await loadClinicalSourceInspection(sourceId)
  } catch (error) {
    if (error instanceof Error && error.message === 'clinical_source_not_found') notFound()
    throw error
  }

  const source = inspection.source
  const latestSnapshot = inspection.snapshots[0]
  const latestExtraction = inspection.extractions[0]

  return (
    <main className="min-h-screen bg-[#081423] px-4 py-8 text-[#f5f1e8] md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-[#c6a55a]/25 pb-5">
          <Link href="/clinical/review" className="text-sm text-[#e6c979]">← Clinical Evidence V1.1 Workbench</Link>
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Private source inspection</p>
          <h1 className="mt-2 text-3xl font-semibold">{String(source.title)}</h1>
          <p className="mt-2 text-sm text-white/55">{String(source.publisher)} · {String(source.source_type)} · {String(source.source_key)}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a href={String(source.source_url)} target="_blank" rel="noreferrer" className="text-[#e6c979] underline-offset-4 hover:underline">Open authoritative source ↗</a>
            <span className="text-white/45">Currentness: {String(source.currentness)}</span>
            <span className="text-white/45">Version: {String(source.source_version ?? 'not recorded')}</span>
          </div>
        </header>

        <section aria-labelledby="side-by-side-heading">
          <h2 id="side-by-side-heading" className="text-xl font-semibold">Side-by-side source inspection</h2>
          <p className="mt-1 text-sm text-white/55">The left pane is immutable captured source material or its reviewed extract. The right pane is the structured extraction under review. Neither pane is a clinical conclusion by itself.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className={card}>
              <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Captured source snapshot</p>
              {latestSnapshot ? <>
                <p className="mt-2 text-sm text-white/55">{String(latestSnapshot.snapshot_key)} · {String(latestSnapshot.hash_scope)} · SHA-256 {String(latestSnapshot.content_sha256)}</p>
                <pre className={pre}>{pretty(latestSnapshot.normalized_extract ?? latestSnapshot.locator_manifest)}</pre>
                <details className="mt-3 text-xs text-white/55"><summary className="cursor-pointer text-[#e6c979]">Snapshot locator manifest</summary><pre className={pre}>{pretty(latestSnapshot.locator_manifest)}</pre></details>
              </> : <p className="mt-3 text-sm text-white/55">No immutable snapshot captured yet. The source remains in the snapshot-required queue.</p>}
            </article>

            <article className={card}>
              <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Structured extraction</p>
              {latestExtraction ? <>
                <p className="mt-2 text-sm text-white/55">{String(latestExtraction.verification_status)} · {String(latestExtraction.extraction_method)} · locator {String(latestExtraction.source_locator ?? 'not recorded')}</p>
                <pre className={pre}>{pretty({
                  summary: latestExtraction.extracted_summary,
                  population: latestExtraction.population_json,
                  intervention_or_exposure: latestExtraction.intervention_json,
                  comparator: latestExtraction.comparator_json,
                  outcomes: latestExtraction.outcomes_json,
                  study_design: latestExtraction.study_design,
                  sample_size: latestExtraction.sample_size,
                  follow_up: latestExtraction.follow_up,
                  effect_estimates: latestExtraction.effect_estimates_json,
                  uncertainty: latestExtraction.uncertainty_json,
                  limitations: latestExtraction.limitations_json,
                })}</pre>
              </> : <p className="mt-3 text-sm text-white/55">No structured extraction exists yet. No evidence claim should progress to review from this source.</p>}
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className={card}><h2 className="font-semibold">Evidence records</h2><p className="mt-1 text-xs text-white/45">{inspection.records.length} record(s) linked to this source.</p>{inspection.records.map(record => <div key={String(record.id)} className="mt-3 border-t border-white/10 pt-3"><p className="font-medium">{String(record.title)}</p><p className="mt-1 text-sm text-white/55">{String(record.review_status)} · {String(record.publication_scope)} · certainty {String(record.evidence_strength)} · freshness {String(record.freshness_status ?? 'current')}</p><p className="mt-1 text-xs text-white/35">{String(record.id)}</p></div>)}</article>
          <article className={card}><h2 className="font-semibold">Reviews</h2><p className="mt-1 text-xs text-white/45">{inspection.reviews.length} governed review decision(s).</p>{inspection.reviews.map(review => <div key={String(review.id)} className="mt-3 border-t border-white/10 pt-3"><p className="font-medium">{String(review.review_type)} · {String(review.decision)}</p><p className="mt-1 text-sm text-white/55">{String(review.reviewer_type)} · {String(review.rationale)}</p></div>)}</article>
          <article className={card}><h2 className="font-semibold">Contradictions / supersession</h2><p className="mt-1 text-xs text-white/45">{inspection.conflicts.length} linked conflict record(s).</p>{inspection.conflicts.map(conflict => <div key={String(conflict.id)} className="mt-3 border-t border-white/10 pt-3"><p className="font-medium">{String(conflict.conflict_type)} · {String(conflict.resolution_status)}</p><p className="mt-1 text-sm text-white/55">{String(conflict.summary)}</p></div>)}</article>
          <article className={card}><h2 className="font-semibold">Publication history</h2><p className="mt-1 text-xs text-white/45">{inspection.publicationVersions.length} immutable version(s).</p>{inspection.publicationVersions.map(version => <details key={String(version.id)} className="mt-3 border-t border-white/10 pt-3"><summary className="cursor-pointer font-medium">v{String(version.version_no)} · {String(version.trigger_event)}</summary><pre className={pre}>{pretty(version.public_projection)}</pre></details>)}</article>
        </section>
      </div>
    </main>
  )
}
