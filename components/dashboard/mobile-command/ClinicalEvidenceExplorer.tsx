'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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

type InteractionRow = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  clinicalSignificance: string
  mechanism?: string | null
  monitoringConsideration?: string | null
  primarySource?: { publisher?: string; url?: string }
  verifiedAt?: string
}

type MonitoringRow = {
  id: string
  protocolName: string
  context: string
  cannabinoid?: string | null
  monitoringParameter: string
  baselineRequired?: boolean
  followUpInterval?: string | null
  rationale?: string | null
  evidenceCertainty?: string
  primarySource?: { publisher?: string; url?: string }
  verifiedAt?: string
}

const FILTER_DEFS: { id: ClinicalFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'graded', label: 'Graded' },
  { id: 'safety', label: 'Safety' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'practice', label: 'Rules' },
]

const SWIPE_MIN_PX = 56
const PULL_TRIGGER_PX = 72
const PULL_MAX_PX = 96

function strengthRank(s: string): number {
  const order: Record<string, number> = {
    high: 0,
    moderate: 1,
    low: 2,
    'very-low': 3,
    'very_low': 3,
    insufficient: 4,
    conflicted: 5,
    ungraded: 6,
  }
  return order[s] ?? 7
}

function isClinicalBody(record: ClinicalEvidenceRecordDTO): boolean {
  return [
    'systematic-review',
    'meta-analysis',
    'randomized-trial',
    'observational-study',
    'clinical-guideline',
  ].includes(record.evidenceType)
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

function isGraded(record: ClinicalEvidenceRecordDTO): boolean {
  return record.evidenceStrength !== 'ungraded' && record.evidenceStrength !== 'conflicted'
}

function yearOf(record: ClinicalEvidenceRecordDTO): string | null {
  const raw = record.publicationDate || record.effectiveDate || record.verifiedAt
  return raw ? raw.slice(0, 4) : null
}

function shortDate(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null
}

function filterRecords(
  records: ClinicalEvidenceRecordDTO[],
  filter: ClinicalFilter,
  cannabinoid: string | null,
): ClinicalEvidenceRecordDTO[] {
  let rows = records
  if (filter === 'graded') rows = rows.filter(isGraded)
  if (filter === 'safety') rows = rows.filter(isSafety)
  if (filter === 'guidelines') rows = rows.filter((r) => r.evidenceType === 'clinical-guideline')
  if (filter === 'practice') {
    rows = rows.filter(
      (r) => r.evidenceType === 'regulation' || r.evidenceType === 'regulatory-guidance',
    )
  }
  if (cannabinoid) {
    const key = cannabinoid.toLowerCase()
    rows = rows.filter((r) => r.cannabinoid.some((c) => c.toLowerCase() === key))
  }
  return [...rows].sort((a, b) => {
    const clinicalDelta = Number(isClinicalBody(b)) - Number(isClinicalBody(a))
    if (clinicalDelta !== 0) return clinicalDelta
    const gradeDelta = strengthRank(a.evidenceStrength) - strengthRank(b.evidenceStrength)
    if (gradeDelta !== 0) return gradeDelta
    return (b.verifiedAt || '').localeCompare(a.verifiedAt || '')
  })
}

function strengthClass(s: string): string {
  if (s === 'high' || s === 'moderate') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
  if (s === 'low' || s === 'very-low' || s === 'very_low') return 'border-amber-500/35 bg-amber-500/15 text-amber-100'
  if (s === 'insufficient' || s === 'conflicted') return 'border-rose-500/30 bg-rose-500/10 text-rose-200'
  return 'border-white/15 bg-white/5 text-white/65'
}

function significanceClass(s: string): string {
  if (s === 'major') return 'text-rose-200'
  if (s === 'moderate') return 'text-amber-200'
  if (s === 'minor') return 'text-emerald-200'
  return 'text-white/70'
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

function buildAnswerLine(record: ClinicalEvidenceRecordDTO): string {
  const bits: string[] = []
  if (record.condition) bits.push(record.condition)
  if (record.intervention) bits.push(record.intervention)
  else if (record.cannabinoid.length) bits.push(record.cannabinoid.join('/'))
  if (record.outcome) bits.push(record.outcome)
  if (bits.length) return bits.join(' · ')
  return record.summary.slice(0, 140)
}

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5">
          <div className="h-2.5 w-24 max-w-[40%] rounded bg-white/10" />
          <div className="mt-2.5 h-3.5 w-full max-w-[90%] rounded bg-white/15" />
          <div className="mt-2 h-2.5 w-full max-w-[70%] rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

type GestureMode = 'none' | 'horizontal' | 'vertical'

export default function ClinicalEvidenceExplorer({ commandHref }: { commandHref: string }) {
  const countryIso2 = useMemo(() => countryIso2FromCommandHref(commandHref), [commandHref])
  const jurisdiction = useMemo(() => clinicalJurisdictionLabel(countryIso2), [countryIso2])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<ClinicalEvidenceApiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)
  const [filter, setFilter] = useState<ClinicalFilter>('all')
  const [cannabinoid, setCannabinoid] = useState<string | null>(null)
  const [pullPx, setPullPx] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [interactions, setInteractions] = useState<InteractionRow[]>([])
  const [showInteractions, setShowInteractions] = useState(false)
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([])
  const [showMonitoring, setShowMonitoring] = useState(false)

  const filterRef = useRef(filter)
  filterRef.current = filter
  const gesture = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    mode: 'none' as GestureMode,
  })

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
        if (active) {
          setLoading(false)
          setRefreshing(false)
          setPullPx(0)
        }
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [countryIso2, submittedQuery, requestVersion])

  useEffect(() => {
    let cancelled = false
    fetch('/api/clinical/interactions?limit=12')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        const rows = (body?.interactions ?? []) as InteractionRow[]
        setInteractions(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (!cancelled) setInteractions([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/clinical/monitoring?limit=12')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        const rows = (body?.protocols ?? []) as MonitoringRow[]
        setMonitoring(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (!cancelled) setMonitoring([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const records = result?.records ?? []
  const availableFilters = useMemo(() => {
    return FILTER_DEFS.filter((f) => {
      if (f.id === 'all') return true
      if (f.id === 'graded') return records.some(isGraded)
      if (f.id === 'safety') return records.some(isSafety)
      if (f.id === 'guidelines') return records.some((r) => r.evidenceType === 'clinical-guideline')
      if (f.id === 'practice') {
        return records.some(
          (r) => r.evidenceType === 'regulation' || r.evidenceType === 'regulatory-guidance',
        )
      }
      return true
    })
  }, [records])

  useEffect(() => {
    if (!availableFilters.some((f) => f.id === filter)) setFilter('all')
  }, [availableFilters, filter])

  const cannabinoidOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of records) for (const c of r.cannabinoid) if (c.trim()) set.add(c.trim())
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [records])

  const visible = useMemo(
    () => filterRecords(records, filter, cannabinoid),
    [records, filter, cannabinoid],
  )

  const answerRecord = useMemo(() => {
    const gradedClinical = records
      .filter((r) => isGraded(r) && isClinicalBody(r))
      .sort((a, b) => strengthRank(a.evidenceStrength) - strengthRank(b.evidenceStrength))
    if (gradedClinical[0]) return gradedClinical[0]
    const graded = records.filter(isGraded).sort((a, b) => strengthRank(a.evidenceStrength) - strengthRank(b.evidenceStrength))
    return graded[0] ?? null
  }, [records])

  const materialFlags = useMemo(() => {
    const conflicted =
      result?.state === 'conflicted' ||
      records.some((r) => r.conflictStatus === 'material-conflict' || r.evidenceStrength === 'conflicted')
    const stale =
      result?.state === 'stale' ||
      records.some((r) => r.freshnessStatus === 'stale' || r.freshnessStatus === 'review-required')
    const degraded =
      result?.state === 'degraded-source' || records.some((r) => r.freshnessStatus === 'source-degraded')
    return { conflicted, stale, degraded }
  }, [records, result?.state])

  const shiftFilter = useCallback(
    (dir: -1 | 1) => {
      const ids = availableFilters.map((f) => f.id)
      const idx = ids.indexOf(filterRef.current)
      const next = Math.max(0, Math.min(ids.length - 1, idx + dir))
      if (next !== idx) setFilter(ids[next])
    },
    [availableFilters],
  )

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, summary, details')) return
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      mode: 'none',
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gesture.current
      if (g.pointerId !== e.pointerId) return
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (g.mode === 'none') {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
        g.mode = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
      if (g.mode === 'vertical' && dy > 0 && !loading) {
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
        if (scrollY <= 4) setPullPx(Math.min(PULL_MAX_PX, dy * 0.45))
      }
    },
    [loading],
  )

  const endGesture = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gesture.current
      if (g.pointerId !== e.pointerId) return
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      const mode = g.mode
      g.pointerId = -1
      g.mode = 'none'
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (mode === 'horizontal' && Math.abs(dx) >= SWIPE_MIN_PX) {
        shiftFilter(dx < 0 ? 1 : -1)
        setPullPx(0)
        return
      }
      if (mode === 'vertical' && dy * 0.45 >= PULL_TRIGGER_PX && !loading) {
        setRefreshing(true)
        setPullPx(PULL_TRIGGER_PX * 0.4)
        setRequestVersion((v) => v + 1)
        return
      }
      setPullPx(0)
    },
    [loading, shiftFilter],
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilter('all')
    setCannabinoid(null)
    setShowInteractions(false)
    setSubmittedQuery(query.trim())
  }

  function clearSearch() {
    setQuery('')
    setSubmittedQuery('')
    setFilter('all')
    setCannabinoid(null)
  }

  const latestChange = result?.changes?.[0] ?? null
  const authorities = getClinicalAuthoritiesForCountry(countryIso2)
  const primaryAuthority = authorities.find((a) => a.id === 'federal-authority' || a.id === 'medical-document')
  const state = loading ? 'loading' : result?.state ?? 'error'
  const showServiceAlert =
    !loading &&
    result &&
    ['error', 'permission', 'no-match', 'no-evidence'].includes(result.state)
  const pullProgress = Math.min(1, pullPx / PULL_TRIGGER_PX)

  return (
    <section
      className="w-full min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-3.5"
      aria-label={`Evidence · ${jurisdiction}`}
    >
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

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55" aria-live="polite">
        <span className="font-medium text-white/85">{jurisdiction}</span>
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

      <p className="text-[11px] leading-relaxed text-white/40">
        Reviewed corpus for this jurisdiction. Not patient-specific advice. Verify against primary sources and local
        formulary.
      </p>

      {/* Material banners only when true */}
      {!loading && materialFlags.conflicted ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5" role="status">
          <p className="text-sm font-medium text-rose-100">Material conflict present</p>
          <p className="mt-0.5 text-xs text-rose-100/75">Inspect sources before relying on a single conclusion.</p>
        </div>
      ) : null}
      {!loading && !materialFlags.conflicted && (materialFlags.stale || materialFlags.degraded) ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5" role="status">
          <p className="text-sm font-medium text-amber-100">
            {materialFlags.degraded ? 'Source currentness degraded' : 'Some records may be stale'}
          </p>
          <p className="mt-0.5 text-xs text-amber-100/75">Confirm the primary source date before clinical use.</p>
        </div>
      ) : null}

      {showServiceAlert ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3" role="status">
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

      {/* Answer card — top graded clinical hit */}
      {!loading && answerRecord ? (
        <article className="rounded-2xl border border-[#d4a853]/35 bg-[#d4a853]/10 px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">Top graded</p>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${strengthClass(answerRecord.evidenceStrength)}`}
            >
              {formatStatus(answerRecord.evidenceStrength)}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold leading-snug text-white">{answerRecord.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{buildAnswerLine(answerRecord)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/50">
            {yearOf(answerRecord) ? <span>{yearOf(answerRecord)}</span> : null}
            {answerRecord.formulation ? <span>· {answerRecord.formulation}</span> : null}
            {answerRecord.population ? <span>· {answerRecord.population}</span> : null}
            <span>· Verified {shortDate(answerRecord.verifiedAt)}</span>
          </div>
          <a
            className="mt-2.5 inline-flex min-h-10 items-center touch-manipulation text-sm font-medium text-[#d4a853]"
            href={answerRecord.primarySource.url}
            target="_blank"
            rel="noreferrer"
          >
            {answerRecord.primarySource.publisher} ↗
          </a>
        </article>
      ) : null}

      {!loading && latestChange ? (
        <p className="line-clamp-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/70">
          <span className="font-medium text-white">Update · </span>
          {latestChange.title}
        </p>
      ) : null}

      {/* Dynamic filters — only paths with data */}
      {availableFilters.length > 1 ? (
        <nav
          className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          aria-label="Filter evidence"
        >
          {availableFilters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setShowInteractions(false)
                  setShowMonitoring(false)
                  setFilter(f.id)
                }}
                aria-pressed={active && !showInteractions && !showMonitoring}
                className={
                  active && !showInteractions && !showMonitoring
                    ? 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-[#d4a853]/50 bg-[#d4a853]/15 px-3.5 text-xs font-medium text-[#d4a853]'
                    : 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-xs text-white/65 active:bg-white/10'
                }
              >
                {f.label}
              </button>
            )
          })}
          {interactions.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setShowInteractions(true)
                setShowMonitoring(false)
              }}
              aria-pressed={showInteractions}
              className={
                showInteractions
                  ? 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-[#d4a853]/50 bg-[#d4a853]/15 px-3.5 text-xs font-medium text-[#d4a853]'
                  : 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-xs text-white/65'
              }
            >
              Interactions
            </button>
          ) : null}
          {monitoring.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setShowMonitoring(true)
                setShowInteractions(false)
              }}
              aria-pressed={showMonitoring}
              className={
                showMonitoring
                  ? 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-[#d4a853]/50 bg-[#d4a853]/15 px-3.5 text-xs font-medium text-[#d4a853]'
                  : 'snap-start min-h-9 shrink-0 touch-manipulation rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-xs text-white/65'
              }
            >
              Monitoring
            </button>
          ) : null}
        </nav>
      ) : null}

      {/* Cannabinoid chips — only when present in results */}
      {!showInteractions && !showMonitoring && cannabinoidOptions.length > 0 ? (
        <nav className="flex flex-wrap gap-1.5" aria-label="Cannabinoid filter">
          <button
            type="button"
            onClick={() => setCannabinoid(null)}
            className={
              !cannabinoid
                ? 'min-h-8 rounded-full border border-white/20 bg-white/10 px-2.5 text-[11px] text-white'
                : 'min-h-8 rounded-full border border-white/10 px-2.5 text-[11px] text-white/55'
            }
          >
            Any
          </button>
          {cannabinoidOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCannabinoid(c)}
              className={
                cannabinoid === c
                  ? 'min-h-8 rounded-full border border-[#d4a853]/45 bg-[#d4a853]/15 px-2.5 text-[11px] text-[#d4a853]'
                  : 'min-h-8 rounded-full border border-white/10 px-2.5 text-[11px] text-white/55'
              }
            >
              {c}
            </button>
          ))}
        </nav>
      ) : null}

      <div
        className="relative touch-pan-y select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        aria-label="Evidence results. Swipe to change filter. Pull to refresh."
      >
        <div
          className="pointer-events-none flex items-center justify-center overflow-hidden transition-[height] duration-150"
          style={{ height: pullPx || (refreshing ? 28 : 0) }}
          aria-hidden
        >
          <span
            className="text-[11px] font-medium text-[#d4a853]/90"
            style={{ opacity: refreshing ? 1 : 0.35 + pullProgress * 0.65 }}
          >
            {refreshing ? 'Refreshing…' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>

        {loading && !refreshing ? (
          <Skeleton />
        ) : showInteractions ? (
          <div className="space-y-2.5" aria-label="Interactions">
            {interactions.map((ix) => (
              <article
                key={ix.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white">
                    {ix.medicationIngredient} × {ix.cannabinoid}
                  </h3>
                  <span className={`shrink-0 text-[11px] font-medium capitalize ${significanceClass(ix.clinicalSignificance)}`}>
                    {ix.clinicalSignificance}
                  </span>
                </div>
                {ix.mechanism ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{ix.mechanism}</p>
                ) : null}
                {ix.monitoringConsideration ? (
                  <p className="mt-1 text-xs text-white/50">Monitor: {ix.monitoringConsideration}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                  {ix.verifiedAt ? <span>Verified {shortDate(ix.verifiedAt)}</span> : null}
                  {ix.primarySource?.url ? (
                    <a
                      className="font-medium text-[#d4a853]"
                      href={ix.primarySource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ix.primarySource.publisher || 'Source'} ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : showMonitoring ? (
          <div className="space-y-2.5" aria-label="Monitoring protocols">
            {monitoring.map((mp) => (
              <article
                key={mp.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white">{mp.protocolName}</h3>
                  {mp.baselineRequired ? (
                    <span className="shrink-0 rounded-full border border-amber-200/30 bg-amber-200/10 px-2 py-0.5 text-[10px] font-medium text-amber-200/90">
                      Baseline
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{mp.monitoringParameter}</p>
                {mp.followUpInterval ? (
                  <p className="mt-1 text-xs text-white/50">Follow-up: {mp.followUpInterval}</p>
                ) : null}
                {mp.rationale ? (
                  <p className="mt-1 text-xs text-white/50">{mp.rationale}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                  {mp.verifiedAt ? <span>Verified {shortDate(mp.verifiedAt)}</span> : null}
                  {mp.primarySource?.url ? (
                    <a
                      className="font-medium text-[#d4a853]"
                      href={mp.primarySource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {mp.primarySource.publisher || 'Source'} ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
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
                        {record.condition || formatStatus(record.evidenceType)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-white">
                        {record.title}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-white/45">
                        {yearOf(record) ? <span>{yearOf(record)}</span> : null}
                        {record.cannabinoid.length ? (
                          <span>{record.cannabinoid.slice(0, 3).join(', ')}</span>
                        ) : null}
                        {record.formulation ? <span>{record.formulation}</span> : null}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 max-w-[5.5rem] shrink-0 truncate rounded-full border px-2 py-0.5 text-center text-[10px] font-medium leading-tight ${strengthClass(record.evidenceStrength)}`}
                    >
                      {formatStatus(record.evidenceStrength)}
                    </span>
                  </div>
                </summary>
                <div className="space-y-2 border-t border-white/10 px-3.5 py-3">
                  <p className="text-xs leading-relaxed text-white/70">{record.summary}</p>
                  {record.uncertainty ? (
                    <p className="text-xs text-white/50">Uncertainty: {record.uncertainty}</p>
                  ) : null}
                  {record.population ? (
                    <p className="text-xs text-white/50">Population: {record.population}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
                    <span>Verified {shortDate(record.verifiedAt)}</span>
                    {record.supersessionState !== 'current' ? (
                      <span className="text-amber-200/90">{formatStatus(record.supersessionState)}</span>
                    ) : null}
                  </div>
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
      </div>
    </section>
  )
}
