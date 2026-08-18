'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'
import {
  classifyClinicalFailure,
  clinicalFailureLabel,
  clinicalStateLabel,
  diagnosticForFailure,
  isClinicalEvidenceApiResult,
  type ClinicalEvidenceApiResult,
} from '@/lib/clinical/runtime'
import {
  clinicalJurisdictionLabel,
  countryIso2FromCommandHref,
  getClinicalAuthoritiesForCountry,
} from './clinicalCommandContract'
import { formatStatus } from './contracts'

type ClinicalView =
  | 'evidence'
  | 'safety'
  | 'interactions'
  | 'formulations'
  | 'guidelines'
  | 'practice'
  | 'monitoring'

type EvidenceDomain = 'clinical' | 'preclinical' | 'regulatory' | 'mixed' | 'other' | 'not-assessed'

const VIEW_ORDER: ClinicalView[] = [
  'evidence',
  'safety',
  'interactions',
  'formulations',
  'guidelines',
  'practice',
  'monitoring',
]

const VIEW_LABELS: Record<ClinicalView, string> = {
  evidence: 'Evidence',
  safety: 'Safety',
  interactions: 'Interactions',
  formulations: 'Formulations',
  guidelines: 'Guidelines',
  practice: 'Practice',
  monitoring: 'Monitoring',
}

function commandParams(commandHref: string): URLSearchParams {
  const query = commandHref.includes('?') ? commandHref.slice(commandHref.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

function jurisdictionFromCommandHref(commandHref: string): string {
  const iso = countryIso2FromCommandHref(commandHref)
  if (iso) return clinicalJurisdictionLabel(iso)
  const raw = commandParams(commandHref).get('country')?.trim() ?? ''
  return raw
}

function roleFromCommandHref(commandHref: string): string {
  const raw = commandParams(commandHref).get('role')?.trim() ?? ''
  return raw ? formatStatus(raw) : 'All roles'
}

function date(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : 'Not recorded'
}

function evidenceDomain(record: ClinicalEvidenceRecordDTO): EvidenceDomain {
  return record.evidenceDomain ?? 'not-assessed'
}

function recordHasClaim(record: ClinicalEvidenceRecordDTO, kinds: string[]): boolean {
  return (record.claims ?? []).some((claim) => kinds.includes(claim.claimKind))
}

function recordIsSafety(record: ClinicalEvidenceRecordDTO): boolean {
  const searchable = [record.title, record.summary, record.outcome, record.uncertainty]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
  return (
    recordHasClaim(record, ['safety', 'tolerability']) ||
    record.evidenceType === 'pharmacovigilance-signal' ||
    /safety|adverse|contraindicat|interaction|tolerab/.test(searchable)
  )
}

function recordsForView(records: ClinicalEvidenceRecordDTO[], view: ClinicalView): ClinicalEvidenceRecordDTO[] {
  if (view === 'safety') return records.filter(recordIsSafety)
  if (view === 'interactions') return records.filter((record) => recordHasClaim(record, ['interaction']))
  if (view === 'monitoring') return records.filter((record) => recordHasClaim(record, ['monitoring']))
  if (view === 'formulations') {
    return records.filter(
      (record) =>
        record.interventionClass === 'regulated-cannabinoid-drug' ||
        record.interventionClass === 'cannabinoid-isolate' ||
        record.interventionClass === 'cannabis-derived-formulation' ||
        Boolean(record.formulation) ||
        record.cannabinoid.length > 0,
    )
  }
  if (view === 'guidelines') return records.filter((record) => record.evidenceType === 'clinical-guideline')
  if (view === 'practice') {
    return records.filter(
      (record) => record.evidenceType === 'regulation' || record.evidenceType === 'regulatory-guidance',
    )
  }
  return records
}

function stateAttention(
  result: ClinicalEvidenceApiResult | null,
  loading: boolean,
): { title: string; detail: string } {
  if (loading) {
    return {
      title: 'Checking evidence state',
      detail: 'Loading reviewed records, currentness and conflict status.',
    }
  }
  if (!result) {
    return {
      title: 'Evidence state unavailable',
      detail: 'Retry the evidence service before relying on this workspace.',
    }
  }
  if (result.state === 'conflicted') {
    return {
      title: 'Material conflict requires review',
      detail: 'Open the conflicting records and primary sources before relying on a conclusion.',
    }
  }
  if (result.state === 'stale') {
    return {
      title: 'Currentness requires review',
      detail: 'Only stale, superseded or review-required records match the current question.',
    }
  }
  if (result.state === 'degraded-source') {
    return {
      title: 'Partial source coverage',
      detail: 'At least one source has degraded or unresolved currentness. Verify the primary source.',
    }
  }
  if (result.state === 'permission') return { title: 'Evidence access restricted', detail: result.message }
  if (result.state === 'error') {
    const label = result.diagnostic
      ? clinicalFailureLabel(result.diagnostic.category)
      : 'Evidence service unavailable'
    return { title: label, detail: result.message }
  }
  if (result.state === 'no-evidence') {
    return {
      title: 'Known concept, no reviewed record',
      detail: 'The query resolved to governed terminology, but no eligible published evidence record matches this context.',
    }
  }
  if (result.state === 'no-match') {
    return {
      title: 'No reviewed match',
      detail: 'No governed concept or published evidence record matched this question.',
    }
  }

  const ungraded =
    result.synthesis?.ungradedRecordCount ??
    result.records.filter((record) => record.evidenceStrength === 'ungraded').length
  return ungraded > 0
    ? {
        title: 'Inspect certainty and applicability',
        detail: `${ungraded} loaded record${ungraded === 1 ? ' is' : 's are'} ungraded; source authority is not the same as clinical efficacy certainty.`,
      }
    : {
        title: 'Inspect applicability',
        detail: 'Confirm population, formulation, jurisdiction, professional scope and source date before relying on a record.',
      }
}

function evidenceClassLabel(record: ClinicalEvidenceRecordDTO): string {
  if (record.interventionClass === 'regulated-cannabinoid-drug') return 'Regulated cannabinoid drug'
  if (record.interventionClass === 'general-cannabis') return 'General cannabis / authority'
  return formatStatus(record.interventionClass)
}

function clientFailureMessage(category: ReturnType<typeof classifyClinicalFailure>): string {
  const messages = {
    configuration: 'Clinical evidence is not configured in this deployment.',
    'environment-mismatch':
      'Clinical evidence is connected to an unexpected data environment. Do not rely on this workspace until deployment configuration is corrected.',
    'missing-route': 'The Clinical evidence API route is unavailable in this deployment.',
    permission: 'Clinical evidence is not available to this access context.',
    'migration-drift': 'The Clinical evidence schema is not activated for this deployment.',
    schema: 'Clinical evidence returned a response that does not match the reviewed application contract.',
    upstream: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
    unknown: 'Clinical evidence could not be loaded. Retry before relying on this workspace.',
  }
  return messages[category]
}

function stateBadgeClass(state: string): string {
  if (state === 'ready' || state === 'loaded') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (state === 'loading') return 'bg-white/10 text-white/70 border-white/15'
  if (state === 'error' || state === 'permission') return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  if (state === 'stale' || state === 'conflicted' || state === 'degraded-source') {
    return 'bg-amber-500/15 text-amber-200 border-amber-500/30'
  }
  return 'bg-white/10 text-white/80 border-white/15'
}

/**
 * Mobile Evidence Command.
 * Keeps the current Tailwind layout so labels and navigation remain discrete on narrow
 * viewports, while exposing the governed Evidence OS metadata and recovery states.
 */
export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const countryIso2 = useMemo(() => countryIso2FromCommandHref(commandHref), [commandHref])
  const jurisdiction = useMemo(() => jurisdictionFromCommandHref(commandHref), [commandHref])
  const role = useMemo(() => roleFromCommandHref(commandHref), [commandHref])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)
  const [activeView, setActiveView] = useState<ClinicalView>('evidence')

  const loadEvidence = useCallback(async () => {
    const controller = new AbortController()
    const params = new URLSearchParams({ limit: '50' })
    if (jurisdiction) params.set('jurisdiction', jurisdiction)
    if (submittedQuery) params.set('q', submittedQuery)

    setLoading(true)
    try {
      const response = await fetch(`/api/clinical/evidence?${params}`, {
        signal: controller.signal,
        credentials: 'same-origin',
      })
      const body: unknown = await response.json().catch(() => null)
      if (!isClinicalEvidenceApiResult(body)) {
        // Preserve compatibility with the newer unified Clinical surface while the
        // governed API contract remains the authoritative path for this explorer.
        if (body && typeof body === 'object' && Array.isArray((body as { records?: unknown }).records)) {
          const rows = body as { records: ClinicalEvidenceRecordDTO[]; state?: string; message?: string }
          setResult({
            state: (rows.state as ClinicalEvidenceApiResult['state']) || (rows.records.length ? 'loaded' : 'no-match'),
            query: submittedQuery,
            records: rows.records,
            changes: [],
            message: rows.message || (rows.records.length ? '' : 'No reviewed evidence matched this context.'),
          })
          return
        }
        throw new Error(
          response.ok ? 'clinical_evidence_schema_contract_validation' : `clinical_evidence_http_${response.status}`,
        )
      }
      setResult(body)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message = error instanceof Error ? error.message : ''
      const category = classifyClinicalFailure({ message })
      const permission = category === 'permission'
      const statusMatch = message.match(/clinical_evidence_http_(\d{3})/)
      const httpStatus = statusMatch ? Number(statusMatch[1]) : null
      setResult({
        state: permission ? 'permission' : 'error',
        query: submittedQuery,
        records: [],
        changes: [],
        message: clientFailureMessage(category),
        diagnostic: diagnosticForFailure(category, httpStatus),
      })
    } finally {
      setLoading(false)
    }

    return () => controller.abort()
  }, [jurisdiction, submittedQuery])

  useEffect(() => {
    void loadEvidence()
  }, [loadEvidence, requestVersion])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveView('evidence')
    setSubmittedQuery(query.trim())
  }

  function clearSearch() {
    setQuery('')
    setSubmittedQuery('')
    setActiveView('evidence')
  }

  function searchCanonicalConcept() {
    const canonical = result?.resolution?.canonicalLabel
    if (!canonical) return
    setQuery(canonical)
    setSubmittedQuery(canonical)
    setActiveView('evidence')
  }

  const state = loading ? 'loading' : result?.state ?? 'error'
  const attention = stateAttention(result, loading)
  const latestChange = result?.changes?.[0] ?? null
  const visibleRecords = recordsForView(result?.records ?? [], activeView)
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const safetyAuthority = authorities.find((source) => source.id === 'safety-interactions')
  const documentAuthority = authorities.find((source) => source.id === 'medical-document')
  const pharmacovigilanceAuthority = authorities.find((source) => source.id === 'pharmacovigilance')
  const resolution = submittedQuery ? result?.resolution : undefined
  const corpus = result?.corpus
  const jurisdictionDisplay = jurisdiction || 'Jurisdiction not selected'

  return (
    <section className="space-y-4" aria-labelledby="clinical-evidence-title">
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        aria-live="polite"
      >
        <strong id="clinical-evidence-title" className="text-sm font-semibold text-white">
          Evidence command · {jurisdictionDisplay}
        </strong>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">
            {role}
          </span>
          <span
            className={`hvc-state rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stateBadgeClass(state)}`}
          >
            {clinicalStateLabel(state)}
          </span>
        </div>
      </div>

      <div className="grid gap-2" aria-label="Clinical command now">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">What changed</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {loading ? 'Checking current changes' : latestChange?.title ?? 'No published change event loaded'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            {loading
              ? 'Comparing the loaded clinical evidence context.'
              : latestChange
                ? `${latestChange.summary} Verified ${date(latestChange.verifiedAt)}.`
                : 'No reviewed material-change record is available for this context; this is not a claim that nothing changed externally.'}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">What needs attention</p>
          <p className="mt-1 text-sm font-semibold text-white">{attention.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">{attention.detail}</p>
        </article>
      </div>

      {corpus ? (
        <section
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
          aria-label="Governed corpus coverage"
          data-testid="clinical-corpus-profile"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">Corpus coverage</p>
          <strong className="mt-1 block text-sm text-white">
            {corpus.recordCount} eligible reviewed records · {corpus.conditionCount} linked conditions
          </strong>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Current', corpus.currentRecordCount],
              ['Graded', corpus.gradedRecordCount],
              ['Concepts', corpus.conceptCount],
              ['Sources', corpus.sourceCount],
              ['Study families', corpus.studyFamilyCount],
              ['Claim anchors', corpus.claimCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-black/20 px-2.5 py-2">
                <b className="block text-sm text-white">{String(value)}</b>
                <span className="text-[10px] text-white/50">{String(label)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            {corpus.studyFamilyCount > 0
              ? `${corpus.independentStudyCount} reviewed independent-study families are represented.`
              : 'Independent-study/publication-family normalization is not yet populated for this corpus scope; publication counts are not presented as independent studies.'}
          </p>
          <details className="mt-2 text-xs text-white/60">
            <summary className="cursor-pointer font-medium text-[#d4a853]">Governance methodology</summary>
            <p className="mt-2 leading-relaxed">
              {corpus.gradingMethodTitle
                ? `${corpus.gradingMethodTitle}${corpus.gradingMethodVersion ? ` · v${corpus.gradingMethodVersion}` : ''}. `
                : ''}
              Eligibility is limited to published reviewed records; withdrawn registered primary sources are excluded.
              Stale and superseded evidence remains visible as such rather than being silently treated as current.
            </p>
            <p className="mt-1 leading-relaxed">
              Last corpus verification represented here: {date(corpus.lastVerifiedAt)}. Coverage describes this governed corpus only, not the universe of external clinical literature.
            </p>
          </details>
        </section>
      ) : null}

      <form
        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
        onSubmit={submit}
        role="search"
        aria-label="Ask Clinical reviewed evidence search"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">Ask Clinical</p>
        <h3 className="mt-1 text-sm font-semibold text-white">Search the governed evidence corpus</h3>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Condition, formulation, cannabinoid or clinical evidence question. Results are deterministic reviewed records, not patient-specific advice.
        </p>
        <div className="mt-3 flex gap-2 max-[420px]:flex-col">
          <input
            id="clinical-evidence-query"
            aria-label="Condition, formulation or clinical evidence question"
            type="search"
            value={query}
            maxLength={160}
            autoComplete="off"
            placeholder="e.g. Dravet syndrome, cannabidiol"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#d4a853]/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[#d4a853] px-3 py-2 text-xs font-semibold text-black"
          >
            Search evidence
          </button>
        </div>
        {submittedQuery ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span>Current question: “{submittedQuery}”</span>
            <button type="button" onClick={clearSearch} className="text-[#d4a853] underline-offset-2 hover:underline">
              Clear
            </button>
          </div>
        ) : null}
      </form>

      {!loading && submittedQuery && resolution ? (
        <section
          className="hvc-resolution rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
          data-recognized={resolution.recognized}
          aria-label="Governed concept resolution"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">
            {resolution.recognized ? 'Recognized concept' : 'Terminology resolution'}
          </p>
          <strong className="mt-1 block text-sm text-white">
            {resolution.canonicalLabel ?? 'No governed concept resolved'}
          </strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            {resolution.recognized
              ? 'Matched deterministically against the reviewed concept vocabulary. Evidence retrieval expands only through published canonical terms and sourced aliases.'
              : 'No published concept matched this wording. Direct governed-record fields are still searched; this state does not mean the external literature contains no evidence.'}
          </p>
          {resolution.expandedTerms.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Expanded governed search terms">
              {resolution.expandedTerms.slice(0, 8).map((term) => (
                <span key={term} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60">
                  {term}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading &&
        result &&
        ['error', 'permission', 'no-match', 'no-evidence', 'stale', 'conflicted', 'degraded-source'].includes(result.state) && (
          <div
            className="hvc-state-panel rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3"
            data-state={result.state}
            role="status"
          >
            <strong className="text-sm text-amber-100">
              {result.diagnostic ? clinicalFailureLabel(result.diagnostic.category) : clinicalStateLabel(result.state)}
            </strong>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{result.message}</p>
            {result.state === 'no-evidence' && resolution?.canonicalLabel ? (
              <div className="mt-2 space-y-2 text-xs text-amber-100/80">
                <p>
                  Recognized as <strong>{resolution.canonicalLabel}</strong>. The zero result means no eligible reviewed record is published for this jurisdiction/query—not that no external evidence exists.
                </p>
                {resolution.canonicalLabel.toLocaleLowerCase() !== submittedQuery.toLocaleLowerCase() ? (
                  <button
                    type="button"
                    onClick={searchCanonicalConcept}
                    className="rounded-lg border border-[#d4a853]/30 px-2.5 py-1.5 font-medium text-[#d4a853]"
                  >
                    Search canonical term
                  </button>
                ) : null}
              </div>
            ) : null}
            {result.state === 'no-match' ? (
              <div className="mt-2 space-y-2 text-xs text-amber-100/80">
                <p>
                  {resolution?.recognized
                    ? 'A governed concept resolved, but the current evidence and jurisdiction filters produced no eligible record.'
                    : 'The terminology did not resolve to a governed concept and no reviewed record matched directly. Clear the search or use a canonical clinical term.'}
                </p>
                <button type="button" onClick={clearSearch} className="font-medium text-[#d4a853]">
                  Clear search
                </button>
              </div>
            ) : null}
            {result.state === 'error' && result.diagnostic?.retryable !== false ? (
              <button
                className="mt-2 text-xs font-medium text-[#d4a853]"
                type="button"
                onClick={() => setRequestVersion((version) => version + 1)}
              >
                Retry evidence service
              </button>
            ) : null}
          </div>
        )}

      <nav className="flex flex-wrap gap-1.5" aria-label="Clinical workspace views">
        {VIEW_ORDER.map((view) => {
          const active = activeView === view
          return (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              aria-pressed={active}
              className={
                active
                  ? 'rounded-full border border-[#d4a853]/50 bg-[#d4a853]/15 px-3 py-1.5 text-xs font-medium text-[#d4a853]'
                  : 'rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70'
              }
            >
              {VIEW_LABELS[view]}
            </button>
          )
        })}
      </nav>

      {activeView === 'interactions' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">Structured interaction evidence is not published for this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Clinical does not infer interaction severity or patient-specific compatibility. Use the current interactions deck below when published and verify against primary safety sources.
          </p>
          {safetyAuthority ? (
            <a className="mt-2 inline-flex text-xs text-[#d4a853]" href={safetyAuthority.href} target="_blank" rel="noreferrer">
              {safetyAuthority.sourceName} ↗
            </a>
          ) : null}
        </div>
      ) : activeView === 'monitoring' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">Governed monitoring evidence is not published for this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Clinical does not synthesize patient-specific goals, intervals or discontinuation rules without reviewed evidence and provenance.
          </p>
          <a className="mt-2 inline-flex text-xs text-[#d4a853]" href="/network/clinical-education">
            Reviewed clinical education →
          </a>
        </div>
      ) : activeView === 'safety' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No structured safety record in current scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Do not interpret this as absence of risk. Use current primary safety guidance while the governed corpus is expanded.
          </p>
          {safetyAuthority ? (
            <a className="mt-2 inline-flex text-xs text-[#d4a853]" href={safetyAuthority.href} target="_blank" rel="noreferrer">
              {safetyAuthority.sourceName} ↗
            </a>
          ) : null}
          {pharmacovigilanceAuthority ? (
            <a className="mt-2 ml-3 inline-flex text-xs text-[#d4a853]" href={pharmacovigilanceAuthority.href} target="_blank" rel="noreferrer">
              {pharmacovigilanceAuthority.label} ↗
            </a>
          ) : null}
        </div>
      ) : activeView === 'formulations' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No reviewed formulation-specific record matches this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Clinical keeps regulated cannabinoid drugs, isolates, cannabis-derived formulations and general cannabis evidence distinct. It does not transfer evidence between those classes without an explicit reviewed record.
          </p>
        </div>
      ) : activeView === 'guidelines' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No published clinical-guideline record matches this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Private intake candidates and unreviewed source identifications are not surfaced as clinical guidance.
          </p>
        </div>
      ) : activeView === 'practice' && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No reviewed practice record in this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Jurisdiction-specific primary authorities should be used directly. Profession-specific authorization rules are not inferred from the Command role alone.
          </p>
          {documentAuthority ? (
            <a className="mt-2 inline-flex text-xs text-[#d4a853]" href={documentAuthority.href} target="_blank" rel="noreferrer">
              Medical document authority ↗
            </a>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2" aria-label={`${VIEW_LABELS[activeView]} clinical records`}>
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h3 className="text-sm font-semibold text-white">{VIEW_LABELS[activeView]}</h3>
            <span className="text-xs text-white/50">
              {visibleRecords.length} reviewed record{visibleRecords.length === 1 ? '' : 's'}
            </span>
          </div>

          {!loading && result?.synthesis && result.synthesis.recordCount > 0 && activeView === 'evidence' ? (
            <div
              className="hvc-state-panel rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
              data-state={result.synthesis.hasMaterialConflict ? 'conflicted' : result.state}
              aria-label="Evidence set summary"
            >
              <strong className="text-sm text-white">
                {result.synthesis.currentRecordCount} current · {result.synthesis.gradedRecordCount} graded · {result.synthesis.ungradedRecordCount} ungraded
                {result.synthesis.independentStudyCount !== null && result.synthesis.independentStudyCount !== undefined
                  ? ` · ${result.synthesis.independentStudyCount} independent studies`
                  : ''}
              </strong>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                {result.synthesis.regulatedDrugRecordCount} regulated-drug · {result.synthesis.generalCannabisRecordCount} general-cannabis / authority · {result.synthesis.claimCount ?? 0} claim anchors. Counts describe the reviewed corpus only; they do not infer efficacy or comparative superiority.
              </p>
              {(result.synthesis.studyFamilyCount ?? 0) === 0 ? (
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Publication-family normalization is not yet populated for this result set, so source-record count is not presented as independent-study count.
                </p>
              ) : null}
            </div>
          ) : null}

          {visibleRecords.map((record) => (
            <details
              key={record.id}
              className="hvc-record rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 open:bg-white/[0.05]"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-white/45">
                      {record.condition || 'Regulatory / professional evidence'}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-white">{record.title}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
                    {formatStatus(record.evidenceStrength)}
                  </span>
                </div>
              </summary>
              <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                <p className="text-xs leading-relaxed text-white/65">{record.summary}</p>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1 text-xs text-white/60">
                  <dt className="text-white/40">Evidence</dt><dd>{formatStatus(record.evidenceType)} · {formatStatus(record.evidenceStrength)}</dd>
                  <dt className="text-white/40">Domain</dt><dd>{formatStatus(evidenceDomain(record))}</dd>
                  <dt className="text-white/40">Class</dt><dd>{evidenceClassLabel(record)}</dd>
                  {record.formulation ? <><dt className="text-white/40">Formulation</dt><dd>{record.formulation}</dd></> : null}
                  {record.cannabinoid.length > 0 ? <><dt className="text-white/40">Cannabinoid</dt><dd>{record.cannabinoid.join(', ')}</dd></> : null}
                  {record.population ? <><dt className="text-white/40">Population</dt><dd>{record.population}</dd></> : null}
                  {record.intervention ? <><dt className="text-white/40">Intervention</dt><dd>{record.intervention}</dd></> : null}
                  {record.comparator ? <><dt className="text-white/40">Comparator</dt><dd>{record.comparator}</dd></> : null}
                  {record.outcome ? <><dt className="text-white/40">Outcome</dt><dd>{record.outcome}</dd></> : null}
                  <dt className="text-white/40">Currentness</dt><dd>{formatStatus(record.freshnessStatus ?? 'current')} · {formatStatus(record.supersessionState)}</dd>
                  <dt className="text-white/40">Jurisdiction</dt><dd>{record.jurisdiction.join(', ') || 'Not encoded'}</dd>
                  <dt className="text-white/40">Profession</dt><dd>{record.professionRelevance.length ? record.professionRelevance.map((value) => formatStatus(value)).join(', ') : 'Not encoded'}</dd>
                  <dt className="text-white/40">Verified</dt><dd>{date(record.verifiedAt)}{record.effectiveDate ? ` · effective ${date(record.effectiveDate)}` : ''}</dd>
                </dl>
                {record.uncertainty ? <p className="text-xs leading-relaxed text-white/60"><strong className="text-white/75">Uncertainty:</strong> {record.uncertainty}</p> : null}
                {record.conflictStatus !== 'none' ? <p className="text-xs text-amber-200"><strong>Conflict:</strong> {formatStatus(record.conflictStatus)}</p> : null}
                {record.freshnessReason ? <p className="text-xs leading-relaxed text-white/60"><strong className="text-white/75">Currentness note:</strong> {record.freshnessReason}</p> : null}

                {(record.studyFamilies ?? []).length > 0 ? (
                  <div className="rounded-lg border-l-2 border-[#d4a853]/30 bg-black/20 px-2.5 py-2 text-xs text-white/60" aria-label="Publication family normalization">
                    <strong className="text-white/75">Publication / study family</strong>
                    {(record.studyFamilies ?? []).map((family) => (
                      <p key={`${record.id}-${family.familyKey}`} className="mt-1">
                        {family.title} · {formatStatus(family.publicationRole)}{family.countsAsIndependentStudy ? ' · independent-study family' : ''}{family.trialRegistryId ? ` · ${family.trialRegistryId}` : ''}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/55"><strong className="text-white/70">Publication family:</strong> Not yet linked; this source record is not automatically counted as an independent study.</p>
                )}

                {(record.claims ?? []).length > 0 ? (
                  <div className="rounded-lg border-l-2 border-[#d4a853]/30 bg-black/20 px-2.5 py-2 text-xs text-white/60" aria-label="Claim-level provenance">
                    <strong className="text-white/75">Claim-level provenance</strong>
                    {(record.claims ?? []).map((claim) => (
                      <p key={claim.id} className="mt-1.5">
                        {claim.statement}<br />
                        <span className="text-[10px] text-white/45">{formatStatus(claim.claimKind)} · {formatStatus(claim.claimOrigin)} · locator {claim.sourceLocator} · verified {date(claim.verifiedAt)}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/55"><strong className="text-white/70">Claim provenance:</strong> Record-level primary-source provenance only; no published claim anchor is attached to this record.</p>
                )}

                <p className="text-xs text-white/50">
                  <span className="text-white/70">Primary source:</span> {record.primarySource.publisher} · {record.primarySource.title}
                </p>
                <a className="inline-flex text-xs text-[#d4a853]" href={record.primarySource.url} target="_blank" rel="noreferrer">
                  Open primary source ↗
                </a>
              </div>
            </details>
          ))}

          {!loading && visibleRecords.length === 0 && activeView === 'evidence' ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="status">
              <strong className="text-sm text-white">{result ? clinicalStateLabel(result.state) : 'No evidence loaded'}</strong>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                {result?.message ?? 'Enter a condition or clinical question to search reviewed evidence. Empty result is not proof that evidence does not exist outside this corpus.'}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
