import type { Metadata } from 'next'
import Link from 'next/link'
import { requireClinicalReviewAuth } from '@/lib/auth/clinicalReviewGuard'
import { loadClinicalOperationsDashboard } from '@/lib/server/clinicalEvidenceOperations'
import {
  addGradeAssessmentAction,
  addReviewAction,
  addStructuredExtractionAction,
  captureSnapshotAction,
  createEvidenceDraftAction,
  intakeSourceAction,
  resolveConflictAction,
  setPublicationStateAction,
  verifyCredentialAction,
} from './actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clinical Evidence Operations · Harbourview', robots: { index: false, follow: false } }

const input = 'w-full rounded-md border border-white/15 bg-[#07111d] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30'
const select = input
const button = 'rounded-md border border-[#c6a55a]/50 bg-[#c6a55a]/10 px-3 py-2 text-sm font-medium text-[#e6c979] hover:bg-[#c6a55a]/20'
const card = 'rounded-xl border border-white/10 bg-white/[0.035] p-4'

export default async function ClinicalEvidenceReviewPage() {
  const auth = await requireClinicalReviewAuth()
  const dashboard = await loadClinicalOperationsDashboard()
  const m = dashboard.metrics

  return (
    <main className="min-h-screen bg-[#081423] px-4 py-8 text-[#f5f1e8] md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-[#c6a55a]/25 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c6a55a]">Harbourview Clinical · private operations</p>
              <h1 className="mt-2 text-3xl font-semibold">Clinical Evidence V1.1 Workbench</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">Source intake, immutable snapshot capture, structured extraction, provenance and qualified review, grading, contradiction resolution, publication history and corpus freshness. Source identification never implies a clinical conclusion or grade.</p>
            </div>
            <Link href="/admin/hub" className={button}>Admin hub</Link>
          </div>
          <p className="mt-3 text-xs text-white/45">Signed in as {auth.user.email ?? auth.user.id} · roles {auth.appRoles.join(', ') || 'credentialed reviewer'} · qualified credentials {auth.qualifiedCredentialIds.length}</p>
        </header>

        <section aria-label="Clinical evidence corpus metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Published conditions', m?.publishedConditions ?? '—'],
            ['Published records', m?.publishedRecords ?? '—'],
            ['Under review', m?.underReviewRecords ?? '—'],
            ['Stale / review required', m?.staleOrReviewRequired ?? '—'],
            ['Unresolved material conflicts', m?.unresolvedMaterialConflicts ?? '—'],
            ['Ungraded published', m?.ungradedPublishedRecords ?? '—'],
            ['Sources without snapshot', m?.sourcesWithoutSnapshot ?? '—'],
            ['Queued sources', dashboard.reviewQueue.length],
          ].map(([label, value]) => <div key={String(label)} className={card}><p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-4">
            <div><h2 className="text-xl font-semibold">Evidence operations queue</h2><p className="mt-1 text-sm text-white/55">Private source candidates and their governed progression state.</p></div>
            {dashboard.reviewQueue.map(row => (
              <article key={row.intakeId} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-[0.16em] text-[#c6a55a]">{row.priority} · {row.intakeStatus} · {row.coverageStatus}</p><h3 className="mt-1 font-semibold">{row.sourceTitle}</h3><p className="mt-1 text-sm text-white/55">{row.publisher} · {row.sourceType} · {row.sourceKey}</p></div>
                  <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-[#e6c979] underline-offset-4 hover:underline">Source ↗</a>
                </div>
                <p className="mt-3 text-sm text-white/65">Coverage: {row.intendedConditions.join(', ') || 'not assigned'} · {row.intendedJurisdictions.join(', ') || 'not assigned'} · {row.intendedPublicationScope}</p>
                {row.notes && <p className="mt-2 text-sm text-white/50">{row.notes}</p>}
                <p className="mt-2 text-xs text-white/35">Source ID {row.sourceId} · Snapshot {row.latestSnapshotId ?? 'not captured'}</p>
              </article>
            ))}
          </div>

          <div className="space-y-4">
            <div><h2 className="text-xl font-semibold">Freshness queue</h2><p className="mt-1 text-sm text-white/55">Published or staged records requiring currentness review.</p></div>
            {dashboard.freshnessQueue.length === 0 ? <div className={card}><p className="text-sm text-white/55">No stale, review-required or source-degraded records are currently queued.</p></div> : dashboard.freshnessQueue.map(row => (
              <article key={row.id} className={card}><p className="text-xs uppercase tracking-[0.16em] text-[#e6c979]">{row.freshnessStatus} · {row.reviewStatus}</p><h3 className="mt-1 font-medium">{row.title}</h3><p className="mt-2 text-sm text-white/55">{row.freshnessReason ?? 'Review due by configured freshness policy.'}</p><p className="mt-2 text-xs text-white/35">{row.slug} · {row.sourceKey ?? 'no source registry link'}</p></article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Reviewer credentials</h2><p className="mt-1 text-sm text-white/55">Qualified clinical/methodology approval requires a verified, current credential owned by the reviewer.</p></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.credentials.map(c => <article className={card} key={c.id}><p className="text-xs uppercase tracking-[0.16em] text-[#c6a55a]">{c.profession} · {c.verificationStatus}</p><p className="mt-1 font-medium">{c.credentialReference}</p><p className="mt-1 text-sm text-white/55">{c.jurisdiction} · user {c.userId}</p><a href={c.verificationSourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-[#e6c979]">Verification source ↗</a></article>)}
          </div>
        </section>

        <section className="space-y-5">
          <div><h2 className="text-xl font-semibold">Governed operations</h2><p className="mt-1 text-sm text-white/55">Each mutation is server-side, authorization-gated and appended to the Clinical operations audit log. Publication remains subject to database review triggers.</p></div>

          <details className={card} open><summary className="cursor-pointer font-semibold">1. Intake source</summary><form action={intakeSourceAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="source_key" placeholder="source key" required/><select className={select} name="source_type" defaultValue="systematic-review"><option>product-monograph</option><option>systematic-review</option><option>meta-analysis</option><option>clinical-guideline</option><option>randomized-trial</option><option>other</option></select><input className={input} name="title" placeholder="source title" required/><input className={input} name="publisher" placeholder="publisher" required/><input className={input} name="source_url" type="url" placeholder="https://…" required/><input className={input} name="jurisdictions" placeholder="Canada, Global"/><input className={input} name="doi" placeholder="DOI"/><input className={input} name="pmid" placeholder="PMID"/><input className={input} name="din" placeholder="DIN"/><input className={input} name="source_version" placeholder="source version"/><input className={input} name="intended_conditions" placeholder="condition 1, condition 2"/><input className={input} name="intended_jurisdictions" defaultValue="Canada"/><select className={select} name="publication_scope" defaultValue="clinical-synthesis"><option value="clinical-synthesis">clinical synthesis</option><option value="source-metadata">source metadata</option></select><select className={select} name="priority" defaultValue="normal"><option>low</option><option>normal</option><option>high</option><option>urgent</option></select><textarea className={`${input} md:col-span-2`} name="notes" placeholder="scope / applicability notes"/><button className={button}>Add to governed intake</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">2. Capture immutable snapshot</summary><form action={captureSnapshotAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="source_id" placeholder="source UUID" required/><input className={input} name="snapshot_key" placeholder="deterministic snapshot key" required/><select className={select} name="hash_scope" defaultValue="normalized-reviewed-extract"><option value="normalized-reviewed-extract">normalized reviewed extract</option><option value="source-bytes">source bytes</option></select><input className={input} name="media_type" defaultValue="text/html"/><input className={input} name="content_sha256" placeholder="required only for source-bytes"/><input className={input} name="byte_size" type="number" placeholder="byte size for source-bytes"/><input className={input} name="storage_path" placeholder="private storage path, if archived"/><textarea className={input} name="locator_manifest" placeholder='{"page":3,"section":"1 INDICATIONS"}'/><textarea className={`${input} md:col-span-2`} name="normalized_extract" placeholder="canonical reviewed extract; hash is computed server-side"/><button className={button}>Capture immutable snapshot</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">3. Create ungraded evidence draft</summary><form action={createEvidenceDraftAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="source_id" placeholder="source UUID" required/><input className={input} name="slug" placeholder="record slug" required/><input className={input} name="title" placeholder="record title" required/><input className={input} name="condition_label" placeholder="condition"/><textarea className={`${input} md:col-span-2`} name="summary" placeholder="source-bounded draft summary" required/><input className={input} name="population" placeholder="population"/><input className={input} name="intervention" placeholder="intervention / exposure"/><input className={input} name="formulation" placeholder="formulation"/><input className={input} name="cannabinoids" placeholder="CBD, THC"/><input className={input} name="comparator" placeholder="comparator"/><input className={input} name="outcome" placeholder="outcome description"/><input className={input} name="jurisdictions" defaultValue="Canada"/><select className={select} name="intervention_class" defaultValue="not-applicable"><option>regulated-cannabinoid-drug</option><option>general-cannabis</option><option>cannabinoid-isolate</option><option>cannabis-derived-formulation</option><option>non-cannabis</option><option>not-applicable</option></select><select className={select} name="publication_scope" defaultValue="clinical-synthesis"><option value="clinical-synthesis">clinical synthesis</option><option value="source-metadata">source metadata</option></select><textarea className={`${input} md:col-span-2`} name="uncertainty" placeholder="explicit uncertainty / limitations"/><button className={button}>Create private ungraded draft</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">4. Structured extraction</summary><form action={addStructuredExtractionAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="source_id" placeholder="source UUID" required/><input className={input} name="source_snapshot_id" placeholder="snapshot UUID"/><input className={input} name="evidence_record_id" placeholder="evidence record UUID"/><select className={select} name="extraction_type" defaultValue="other"><option>indication</option><option>population</option><option>intervention</option><option>comparator</option><option>outcome</option><option>safety</option><option>limitation</option><option>bibliographic</option><option>other</option></select><textarea className={`${input} md:col-span-2`} name="extracted_summary" placeholder="reviewable extracted summary" required/><input className={`${input} md:col-span-2`} name="source_locator" placeholder="page / section / table / paragraph locator" required/>{['population_json','intervention_json','comparator_json','outcomes_json','effect_estimates_json','uncertainty_json','limitations_json'].map(name => <textarea key={name} className={input} name={name} placeholder={`${name} JSON`}/>)}<input className={input} name="study_design" placeholder="study design"/><input className={input} name="sample_size" type="number" placeholder="sample size"/><input className={input} name="follow_up" placeholder="follow-up"/><button className={button}>Create pending structured extraction</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">5. Provenance / qualified review</summary><form action={addReviewAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="evidence_record_id" placeholder="evidence record UUID" required/><select className={select} name="review_type" defaultValue="provenance"><option>provenance</option><option>clinical</option><option>methodology</option></select><select className={select} name="decision" defaultValue="approved"><option>approved</option><option>needs-changes</option><option>rejected</option></select><input className={input} name="reviewer_credential_id" placeholder="credential UUID for clinical/methodology"/><select className={select} name="assigned_evidence_strength" defaultValue=""><option value="">no grade assignment</option><option>ungraded</option><option>high</option><option>moderate</option><option>low</option><option>very-low</option><option>conflicted</option></select><textarea className={`${input} md:col-span-2`} name="rationale" placeholder="review rationale" required/><button className={button}>Record immutable review decision</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">6. Reproducible grading assessment</summary><form action={addGradeAssessmentAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="evidence_record_id" placeholder="evidence record UUID" required/><input className={input} name="review_id" placeholder="approved qualified review UUID" required/>{['starting_certainty','risk_of_bias','inconsistency','indirectness','imprecision','publication_bias','final_certainty'].map(name => <input key={name} className={input} name={name} placeholder={name.replaceAll('_',' ')}/>)}<textarea className={input} name="upgrade_factors" placeholder="upgrade factors JSON array"/><textarea className={input} name="downgrade_rationale" placeholder="downgrade rationale"/><textarea className={`${input} md:col-span-2`} name="assessment_rationale" placeholder="domain-by-domain assessment rationale" required/><button className={button}>Record grade assessment</button></form></details>

          <details className={card}><summary className="cursor-pointer font-semibold">7. Contradiction / partial supersession resolution</summary><form action={resolveConflictAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="conflict_id" placeholder="conflict UUID" required/><input className={input} name="resolution_review_id" placeholder="approved review UUID" required/><select className={select} name="resolution_status" defaultValue="contextualized"><option>contextualized</option><option>resolved</option><option>superseded</option></select><select className={select} name="public_impact" defaultValue="none"><option>none</option><option>stale</option><option>conflicted</option><option>withdraw</option></select><input className={input} name="supersession_scope" placeholder="claim / outcome / population scope"/><textarea className={`${input} md:col-span-2`} name="resolution_notes" placeholder="resolution rationale" required/><button className={button}>Record reviewed conflict resolution</button></form></details>

          {auth.canVerifyCredentials && <details className={card}><summary className="cursor-pointer font-semibold">8. Verify reviewer credential</summary><form action={verifyCredentialAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="credential_id" placeholder="credential UUID" required/><select className={select} name="verification_status" defaultValue="verified"><option>verified</option><option>pending</option><option>expired</option><option>revoked</option><option>rejected</option></select><input className={input} type="date" name="valid_from"/><input className={input} type="date" name="valid_until"/><button className={button}>Update credential verification</button></form></details>}

          {auth.canPublish && <details className={card}><summary className="cursor-pointer font-semibold">9. Publication / supersession</summary><form action={setPublicationStateAction} className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="evidence_record_id" placeholder="evidence record UUID" required/><select className={select} name="publication_action" defaultValue="publish"><option>publish</option><option>unpublish</option><option>supersede</option></select><textarea className={`${input} md:col-span-2`} name="reason" placeholder="reason / supersession scope note"/><button className={button}>Apply governed publication state</button></form></details>}
        </section>
      </div>
    </main>
  )
}
