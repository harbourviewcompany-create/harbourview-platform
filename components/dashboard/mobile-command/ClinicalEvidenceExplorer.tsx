'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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

function roleFromCommandHref(commandHref: string): string {
  const raw = commandParams(commandHref).get('role')?.trim() ?? ''
  return raw ? formatStatus(raw) : 'All roles'
}

function date(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : 'Not recorded'
}

function recordIsSafety(record: ClinicalEvidenceRecordDTO): boolean {
  const searchable = [record.title, record.summary, record.outcome, record.uncertainty]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
  return (
    record.evidenceType === 'pharmacovigilance-signal' ||
    /safety|adverse|contraindicat|interaction|tolerab/.test(searchable)
  )
}

function recordsForView(records: ClinicalEvidenceRecordDTO[], view: ClinicalView): ClinicalEvidenceRecordDTO[] {
  if (view === 'safety') return records.filter(recordIsSafety)
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
  if (view === 'interactions' || view === 'monitoring') return []
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
  if (result.state === 'permission') {
    return { title: 'Evidence access restricted', detail: result.message }
  }
  if (result.state === 'error') {
    const label = result.diagnostic
      ? clinicalFailureLabel(result.diagnostic.category)
      : 'Evidence service unavailable'
    return { title: label, detail: result.message }
  }
  if (result.state === 'no-evidence') {
    return {
      title: 'Known condition, no reviewed record',
      detail:
        'The condition is recognized but the governed corpus has no published evidence record for this context.',
    }
  }
  if (result.state === 'no-match') {
    return {
      title: 'No reviewed match',
      detail: 'Change the question or clear the search; no matching condition or evidence record is published.',
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
        detail:
          'Confirm population, formulation, jurisdiction, professional scope and source date before relying on a record.',
      }
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

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
        >
          <div className="h-2.5 w-24 rounded bg-white/10" />
          <div className="mt-2 h-3.5 w-3/4 rounded bg-white/15" />
          <div className="mt-2 h-2.5 w-full rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

/**
 * Mobile Evidence Command.
 * Uses Tailwind layout — does not depend on missing hvc-* stylesheet rules
 * (those caused concatenated labels: EvidenceSafety…, rolesReady, etc.).
 */
export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const countryIso2 = useMemo(() => countryIso2FromCommandHref(commandHref), [commandHref])
  const jurisdiction = useMemo(() => clinicalJurisdictionLabel(countryIso2), [countryIso2])
  const role = useMemo(() => roleFromCommandHref(commandHref), [commandHref])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)
  const [activeView, setActiveView] = useState<ClinicalView>('evidence')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const params = new URLSearchParams({ limit: '50' })
    // Prefer ISO2 country for the unified evidence API. Never invent a default jurisdiction.
    if (countryIso2) params.set('country', countryIso2)
    if (submittedQuery) params.set('q', submittedQuery)

    setLoading(true)
    setResult(null)

    void (async () => {
      try {
        const response = await fetch(`/api/clinical/evidence?${params}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        })
        const body: unknown = await response.json().catch(() => null)
        if (!active) return

        if (!isClinicalEvidenceApiResult(body)) {
          // Tolerate { records } shape from unified spine API
          if (body && typeof body === 'object' && Array.isArray((body as { records?: unknown }).records)) {
            const rows = body as {
              records: ClinicalEvidenceRecordDTO[]
              state?: string
              message?: string
            }
            setResult({
              state:
                (rows.state as ClinicalEvidenceApiResult['state']) ||
                (rows.records.length ? 'ready' : 'no-match'),
              query: submittedQuery,
              records: rows.records,
              changes: [],
              message:
                rows.message ||
                (rows.records.length ? '' : 'No reviewed evidence matched this context.'),
            })
            return
          }
          throw new Error(
            response.ok
              ? 'clinical_evidence_schema_contract_validation'
              : `clinical_evidence_http_${response.status}`,
          )
        }
        setResult(body)
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return
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
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [countryIso2, submittedQuery, requestVersion])

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

  const state = loading ? 'loading' : result?.state ?? 'error'
  const attention = stateAttention(result, loading)
  const latestChange = result?.changes?.[0] ?? null
  const visibleRecords = recordsForView(result?.records ?? [], activeView)
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const safetyAuthority = authorities.find((source) => source.id === 'safety-interactions')
  const documentAuthority = authorities.find((source) => source.id === 'medical-document')
  const pharmacovigilanceAuthority = authorities.find((source) => source.id === 'pharmacovigilance')

  const showRecordList =
    activeView !== 'interactions' &&
    activeView !== 'monitoring' &&
    !(activeView === 'safety' && visibleRecords.length === 0 && !loading) &&
    !(activeView === 'practice' && visibleRecords.length === 0 && !loading)

  return (
    <section className="space-y-4" aria-labelledby="clinical-evidence-title">
      {/* Status bar — flex so title and badge never concatenate */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        aria-live="polite"
      >
        <strong id="clinical-evidence-title" className="text-sm font-semibold text-white">
          Evidence command · {jurisdiction}
        </strong>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">
            {role}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stateBadgeClass(state)}`}
          >
            {clinicalStateLabel(state)}
          </span>
        </div>
      </div>

      {/* Now cards — stacked with explicit labels */}
      <div className="grid gap-2" aria-label="Clinical command now">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">What changed</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {loading
              ? 'Checking current changes'
              : latestChange?.title ?? 'No published change event loaded'}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">
            What needs attention
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{attention.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">{attention.detail}</p>
        </article>
      </div>

      {/* Search */}
      <form
        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
        onSubmit={submit}
        role="search"
        aria-label="Ask Clinical reviewed evidence search"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">Ask Clinical</p>
        <h3 className="mt-1 text-sm font-semibold text-white">Search the governed evidence corpus</h3>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Condition, formulation, cannabinoid or clinical evidence question. Results are deterministic reviewed
          records, not patient-specific advice.
        </p>
        <div className="mt-3 flex gap-2">
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
            Search
          </button>
        </div>
        {submittedQuery ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span>
              Current question: “{submittedQuery}”
            </span>
            <button type="button" onClick={clearSearch} className="text-[#d4a853] underline-offset-2 hover:underline">
              Clear
            </button>
          </div>
        ) : null}
      </form>

      {!loading &&
        result &&
        ['error', 'permission', 'no-match', 'no-evidence', 'stale', 'conflicted', 'degraded-source'].includes(
          result.state,
        ) && (
          <div
            className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3"
            data-state={result.state}
            role="status"
          >
            <strong className="text-sm text-amber-100">
              {result.diagnostic ? clinicalFailureLabel(result.diagnostic.category) : clinicalStateLabel(result.state)}
            </strong>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{result.message}</p>
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

      {/* View chips — flex-wrap, never a single text run */}
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

      {activeView === 'interactions' ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">Interaction tool</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Use the interactions deck below this explorer (when published) or primary safety sources. Always verify
            against the competent authority for this jurisdiction.
          </p>
          {safetyAuthority ? (
            <a
              className="mt-2 inline-flex text-xs text-[#d4a853]"
              href={safetyAuthority.href}
              target="_blank"
              rel="noreferrer"
            >
              {safetyAuthority.sourceName} ↗
            </a>
          ) : null}
        </div>
      ) : activeView === 'monitoring' ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">Monitoring protocol</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Governed monitoring protocol is not fully published here. Use primary professional authorities and reviewed
            education.
          </p>
          <a className="mt-2 inline-flex text-xs text-[#d4a853]" href="/network/clinical-education">
            Reviewed clinical education →
          </a>
        </div>
      ) : activeView === 'safety' && !loading && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No structured safety record in current scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Do not interpret this as absence of risk. Use current primary safety guidance.
          </p>
          {safetyAuthority ? (
            <a
              className="mt-2 inline-flex text-xs text-[#d4a853]"
              href={safetyAuthority.href}
              target="_blank"
              rel="noreferrer"
            >
              {safetyAuthority.sourceName} ↗
            </a>
          ) : null}
          {pharmacovigilanceAuthority ? (
            <a
              className="mt-2 ml-3 inline-flex text-xs text-[#d4a853]"
              href={pharmacovigilanceAuthority.href}
              target="_blank"
              rel="noreferrer"
            >
              {pharmacovigilanceAuthority.label} ↗
            </a>
          ) : null}
        </div>
      ) : activeView === 'practice' && !loading && visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="note">
          <strong className="text-sm text-white">No reviewed practice record in this scope</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
            Primary authorities remain available when registered for this jurisdiction.
          </p>
          {documentAuthority ? (
            <a
              className="mt-2 inline-flex text-xs text-[#d4a853]"
              href={documentAuthority.href}
              target="_blank"
              rel="noreferrer"
            >
              Medical document authority ↗
            </a>
          ) : null}
        </div>
      ) : showRecordList ? (
        <div className="space-y-2" aria-label={`${VIEW_LABELS[activeView]} clinical records`}>
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h3 className="text-sm font-semibold text-white">{VIEW_LABELS[activeView]}</h3>
            <span className="text-xs text-white/50">
              {loading ? '…' : `${visibleRecords.length} reviewed record${visibleRecords.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {visibleRecords.map((record) => (
                <details
                  key={record.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 open:bg-white/[0.05]"
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
                  <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                    <p className="text-xs leading-relaxed text-white/65">{record.summary}</p>
                    <p className="text-xs text-white/50">
                      <span className="text-white/70">Primary source:</span> {record.primarySource.publisher} ·{' '}
                      {record.primarySource.title}
                    </p>
                    <a
                      className="inline-flex text-xs text-[#d4a853]"
                      href={record.primarySource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open primary source ↗
                    </a>
                  </div>
                </details>
              ))}

              {visibleRecords.length === 0 && activeView === 'evidence' ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3" role="status">
                  <strong className="text-sm text-white">
                    {result ? clinicalStateLabel(result.state) : 'No evidence loaded'}
                  </strong>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                    {result?.message ??
                      'Enter a condition or clinical question to search reviewed evidence. Empty result is not proof that evidence does not exist outside this corpus.'}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
