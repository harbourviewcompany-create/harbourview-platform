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

type ClinicalFilter = 'all' | 'graded' | 'safety' | 'guidelines' | 'practice'

const FILTERS: { id: ClinicalFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'graded', label: 'Graded' },
  { id: 'safety', label: 'Safety' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'practice', label: 'Rules' },
]

function strengthRank(s: string): number {
  const order: Record<string, number> = {
    high: 0,
    moderate: 1,
    low: 2,
    'very-low': 3,
    'very_low': 3,
    insufficient: 4,
    ungraded: 5,
  }
  return order[s] ?? 6
}

function isSafety(record: ClinicalEvidenceRecordDTO): boolean {
  const text = [record.title, record.summary, record.outcome, record.uncertainty]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
  return (
    record.evidenceType === 'pharmacovigilance-signal' ||
    /safety|adverse|contraindicat|interaction|tolerab/.test(text)
  )
}

function filterRecords(
  records: ClinicalEvidenceRecordDTO[],
  filter: ClinicalFilter,
): ClinicalEvidenceRecordDTO[] {
  let rows = records
  if (filter === 'graded') rows = rows.filter((r) => r.evidenceStrength !== 'ungraded')
  if (filter === 'safety') rows = rows.filter(isSafety)
  if (filter === 'guidelines') rows = rows.filter((r) => r.evidenceType === 'clinical-guideline')
  if (filter === 'practice') {
    rows = rows.filter(
      (r) => r.evidenceType === 'regulation' || r.evidenceType === 'regulatory-guidance',
    )
  }
  return [...rows].sort((a, b) => strengthRank(a.evidenceStrength) - strengthRank(b.evidenceStrength))
}

function strengthClass(s: string): string {
  if (s === 'high' || s === 'moderate') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
  if (s === 'low' || s === 'very-low' || s === 'very_low') return 'border-amber-500/35 bg-amber-500/15 text-amber-100'
  if (s === 'insufficient') return 'border-rose-500/30 bg-rose-500/10 text-rose-200'
  return 'border-white/15 bg-white/5 text-white/65'
}

function clientFailureMessage(category: ReturnType<typeof classifyClinicalFailure>): string {
  const messages = {
    configuration: 'Evidence is not configured here.',
    'environment-mismatch': 'Evidence environment mismatch. Do not rely on this view.',
    'missing-route': 'Evidence API unavailable.',
    permission: 'Evidence is restricted for this access context.',
    'migration-drift': 'Evidence schema not active.',
    schema: 'Evidence response did not match contract.',
    upstream: 'Could not load evidence. Try again.',
    unknown: 'Could not load evidence. Try again.',
  }
  return messages[category]
}

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5"
        >
          <div className="h-2.5 w-24 max-w-[40%] rounded bg-white/10" />
          <div className="mt-2.5 h-3.5 w-full max-w-[90%] rounded bg-white/15" />
          <div className="mt-2 h-2.5 w-full max-w-[70%] rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

/**
 * Mobile evidence search — frictionless + responsive.
 * - Search-first, graded results first
 * - 44px min touch targets, 16px input (prevents iOS zoom)
 * - Horizontal filter scroll with snap, overflow-safe rows
 */
export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const countryIso2 = useMemo(() => countryIso2FromCommandHref(commandHref), [commandHref])
  const jurisdiction = useMemo(() => clinicalJurisdictionLabel(countryIso2), [countryIso2])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)
  const [filter, setFilter] = useState<ClinicalFilter>('all')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = new URLSearchParams({ limit: '50' })
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
          if (body && typeof body === 'object' && Array.isArray((body as { records?: unknown }).records)) {
            const rows = body as { records: ClinicalEvidenceRecordDTO[]; state?: string; message?: string }
            setResult({
              state:
                (rows.state as ClinicalEvidenceApiResult['state']) ||
                (rows.records.length ? 'ready' : 'no-match'),
              query: submittedQuery,
              records: rows.records,
              changes: [],
              message: rows.message || (rows.records.length ? '' : 'No reviewed evidence for this context.'),
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
        const statusMatch = message.match(/clinical_evidence_http_(\d{3})/)
        const httpStatus = statusMatch ? Number(statusMatch[1]) : null
        setResult({
          state: category === 'permission' ? 'permission' : 'error',
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
    setFilter('all')
    setSubmittedQuery(query.trim())
  }

  function clearSearch() {
    setQuery('')
    setSubmittedQuery('')
    setFilter('all')
  }

  const visible = filterRecords(result?.records ?? [], filter)
  const latestChange = result?.changes?.[0] ?? null
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const primaryAuthority = authorities.find((a) => a.id === 'federal-authority' || a.id === 'medical-document')
  const state = loading ? 'loading' : result?.state ?? 'error'
  const showAlert =
    !loading &&
    result &&
    ['error', 'permission', 'no-match', 'no-evidence', 'stale', 'conflicted', 'degraded-source'].includes(
      result.state,
    )

  return (
    <section
      className="w-full min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-3.5"
      aria-label={`Evidence · ${jurisdiction}`}
    >
      {/* Search — sticky on mobile, 16px font prevents iOS focus zoom */}
      <form
        onSubmit={submit}
        role="search"
        className="sticky top-0 z-10 -mx-0.5 flex gap-2 bg-[#0a0e17]/90 px-0.5 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-[#0a0e17]/75"
      >
        <input
          type="search"
          value={query}
          maxLength={160}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={`Search ${jurisdiction}…`}
          aria-label="Search clinical evidence"
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 min-w-0 flex-1 touch-manipulation rounded-2xl border border-white/15 bg-black/40 px-3.5 text-base text-white placeholder:text-white/40 outline-none focus:border-[#d4a853]/55 sm:text-sm"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 touch-manipulation rounded-2xl bg-[#d4a853] px-4 text-sm font-semibold text-black active:scale-[0.98]"
        >
          Search
        </button>
      </form>

      {/* Context row — wraps cleanly on narrow widths */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-none text-white/55"
        aria-live="polite"
      >
        <span className="font-medium text-white/85">{jurisdiction}</span>
        <span className="hidden text-white/25 xs:inline" aria-hidden>
          ·
        </span>
        <span>{clinicalStateLabel(state)}</span>
        {!loading && result ? (
          <span className="tabular-nums text-white/45">{result.records.length} records</span>
        ) : null}
        {submittedQuery ? (
          <button
            type="button"
            onClick={clearSearch}
            className="ml-auto max-w-full truncate touch-manipulation py-1 text-[#d4a853]"
          >
            Clear “{submittedQuery}”
          </button>
        ) : null}
      </div>

      {showAlert ? (
        <div
          className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3"
          role="status"
        >
          <p className="text-sm font-medium text-amber-100">
            {result!.diagnostic
              ? clinicalFailureLabel(result!.diagnostic.category)
              : clinicalStateLabel(result!.state)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{result!.message}</p>
          {result!.state === 'error' && result!.diagnostic?.retryable !== false ? (
            <button
              type="button"
              className="mt-2.5 min-h-10 touch-manipulation text-sm font-medium text-[#d4a853]"
              onClick={() => setRequestVersion((v) => v + 1)}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && latestChange ? (
        <p className="line-clamp-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/70">
          <span className="font-medium text-white">Update · </span>
          {latestChange.title}
        </p>
      ) : null}

      {/* Filter chips — horizontal scroll, snap, no scrollbar chrome */}
      <nav
        className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        aria-label="Filter evidence"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={
                active
                  ? 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-[#d4a853]/50 bg-[#d4a853]/15 px-3.5 text-xs font-medium text-[#d4a853]'
                  : 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-xs text-white/65 active:bg-white/10'
              }
            >
              {f.label}
            </button>
          )
        })}
      </nav>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-2.5" aria-label="Evidence results">
          {visible.map((record) => (
            <details
              key={record.id}
              className="group min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05]"
            >
              <summary className="min-h-12 cursor-pointer list-none touch-manipulation px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start gap-2.5">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-[10px] uppercase tracking-wide text-white/40">
                      {record.condition || 'Regulatory'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-white">
                      {record.title}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 max-w-[5.5rem] shrink-0 truncate rounded-full border px-2 py-0.5 text-center text-[10px] font-medium leading-tight ${strengthClass(record.evidenceStrength)}`}
                  >
                    {formatStatus(record.evidenceStrength)}
                  </span>
                </div>
              </summary>
              <div className="space-y-2.5 border-t border-white/10 px-3.5 py-3">
                <p className="text-xs leading-relaxed text-white/70 sm:text-[13px]">{record.summary}</p>
                <a
                  className="inline-flex min-h-10 items-center touch-manipulation text-sm font-medium text-[#d4a853]"
                  href={record.primarySource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {record.primarySource.publisher} ↗
                </a>
              </div>
            </details>
          ))}

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
              <p className="text-sm text-white/85">No records in this view</p>
              <p className="mt-1 text-xs text-white/50">Try another filter or search.</p>
              {primaryAuthority ? (
                <a
                  className="mt-4 inline-flex min-h-10 items-center touch-manipulation text-sm font-medium text-[#d4a853]"
                  href={primaryAuthority.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Primary authority ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
