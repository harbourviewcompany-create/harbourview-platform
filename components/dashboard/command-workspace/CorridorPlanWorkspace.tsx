'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CorridorDepthSections } from '@/components/intelligence/CorridorDepthSections'
import type { CorridorDepthBundle } from '@/lib/intelligence/corridorDepth'
import {
  TRADE_CORRIDORS,
  PRODUCT_OPTIONS,
  listOriginJurisdictions,
  listDestinationJurisdictions,
  getPopularCorridors,
  APPLICABLE_TRADE_JURISDICTIONS,
} from '@/lib/intelligence/tradeCorridors'
import { CLAIM_MAP_FIXTURES } from '@/lib/fixtures/clinical/claim-map'
import {
  assessClaimMapReadiness,
  corridorEvidenceFlags,
} from '@/lib/clinical/evidence-readiness'

type PlanPayload = {
  origin: { iso2: string; name: string; difficulty: string }
  destination: { iso2: string; name: string; difficulty: string }
  productClass: string
  totalSequentialWeeks: number
  criticalPathWeeksEstimate: number
  notes: string[]
  documentationChecklist: Array<{
    id: string
    side: string
    label: string
    required: boolean
    notes?: string
  }>
  steps: Array<{
    side: string
    country_iso2: string
    step: number
    title: string
    description: string
    estimated_weeks: number
  }>
  trust: {
    confidenceLabel: string
    confidence: number
    asOf: string
    disclaimer: string
  }
  depth: CorridorDepthBundle
}

export function CorridorPlanWorkspace({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const origin = (searchParams.get('origin') ?? 'CA').toUpperCase()
  const destination = (searchParams.get('destination') ?? 'DE').toUpperCase()
  const product = searchParams.get('product') ?? 'any'

  const [plan, setPlan] = useState<PlanPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chipMode, setChipMode] = useState<'popular' | 'to-de' | 'from-ca'>('popular')

  const origins = useMemo(() => listOriginJurisdictions(), [])
  const destinations = useMemo(() => listDestinationJurisdictions(), [])
  const popular = useMemo(() => getPopularCorridors(), [])

  const chips = useMemo(() => {
    if (chipMode === 'to-de') return TRADE_CORRIDORS.filter((c) => c.to === 'DE')
    if (chipMode === 'from-ca') return TRADE_CORRIDORS.filter((c) => c.from === 'CA')
    return popular
  }, [chipMode, popular])

  const evidenceReadiness = useMemo(() => assessClaimMapReadiness(CLAIM_MAP_FIXTURES), [])
  const evidenceFlags = useMemo(
    () => corridorEvidenceFlags(CLAIM_MAP_FIXTURES, product),
    [product],
  )

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', 'logistics')
      params.set('section', 'supply')
      params.set('tool', 'corridor-plan')
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k)
        else params.set(k, v)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const q = new URLSearchParams({ origin, destination, product })
    fetch(`/api/corridor-plan?${q.toString()}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? 'Plan unavailable')
        if (!body.plan) {
          throw new Error(
            'No published playbooks for this pair yet. GMP recognition and notes still apply — request playbook coverage or try a popular corridor.',
          )
        }
        return body.plan as PlanPayload
      })
      .then((p) => {
        if (!cancelled) setPlan(p)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPlan(null)
          setError(e instanceof Error ? e.message : 'Unable to load plan')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [origin, destination, product])

  return (
    <section
      className="hvm2-workspace hvm2-corridor-workspace"
      data-mobile-command-tool="corridor-plan"
      aria-label="Corridor execution plan"
      tabIndex={-1}
    >
      <header className="hvm2-workspace-header">
        <div>
          <span>Command Centre / Logistics</span>
          <h3>Corridor execution plan</h3>
          <p>
            {APPLICABLE_TRADE_JURISDICTIONS.length} applicable jurisdictions ·{' '}
            {TRADE_CORRIDORS.length.toLocaleString()} directed corridors. Orientation-level only.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Back to Command Centre">
          Back
        </button>
      </header>

      <form
        className="cc-corridor-form"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          setParams({
            origin: String(fd.get('origin') ?? 'CA').toUpperCase(),
            destination: String(fd.get('destination') ?? 'DE').toUpperCase(),
            product: String(fd.get('product') ?? 'any'),
          })
        }}
      >
        <label>
          Origin
          <select name="origin" defaultValue={origin} className="cc-corridor-input" key={`o-${origin}`}>
            {origins.map((j) => (
              <option key={j.iso2} value={j.iso2}>
                {j.name} ({j.iso2})
              </option>
            ))}
          </select>
        </label>
        <label>
          Destination
          <select
            name="destination"
            defaultValue={destination}
            className="cc-corridor-input"
            key={`d-${destination}`}
          >
            {destinations.map((j) => (
              <option key={j.iso2} value={j.iso2}>
                {j.name} ({j.iso2})
              </option>
            ))}
          </select>
        </label>
        <label>
          Product
          <select name="product" defaultValue={product} className="cc-corridor-input" key={`p-${product}`}>
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="cc-corridor-submit">
          Build plan
        </button>
      </form>

      <div className="cc-corridor-chips" style={{ gap: 8 }}>
        {(['popular', 'to-de', 'from-ca'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className="cc-corridor-chip"
            style={chipMode === f ? { borderColor: 'rgba(198,165,90,0.8)', color: '#d4b56a' } : undefined}
            onClick={() => setChipMode(f)}
          >
            {f === 'popular' ? 'Popular' : f === 'to-de' ? 'Into Germany' : 'From Canada'}
          </button>
        ))}
      </div>

      <div className="cc-corridor-chips">
        {chips.map((q) => {
          const active = q.from === origin && q.to === destination
          return (
            <button
              key={q.id}
              type="button"
              className="cc-corridor-chip"
              style={active ? { borderColor: 'rgba(198,165,90,0.9)', color: '#d4b56a' } : undefined}
              onClick={() => setParams({ origin: q.from, destination: q.to, product })}
            >
              {q.label}
            </button>
          )
        })}
      </div>

      <div className="cc-corridor-body">
        {loading && <p className="cc-corridor-muted">Building plan…</p>}
        {error && !loading && <p className="cc-corridor-error">{error}</p>}
        {plan && !loading && (
          <>
            <div className="cc-corridor-summary">
              <h4>
                {plan.origin.name} → {plan.destination.name}
              </h4>
              <p className="cc-corridor-muted">
                Trust: {plan.trust.confidenceLabel} · {Math.round(plan.trust.confidence * 100)}% · as of{' '}
                {plan.trust.asOf}
              </p>
              <dl className="cc-corridor-metrics">
                <div>
                  <dt>Sequential</dt>
                  <dd>{plan.totalSequentialWeeks} wk</dd>
                </div>
                <div>
                  <dt>Parallel heuristic</dt>
                  <dd>{plan.criticalPathWeeksEstimate} wk</dd>
                </div>
                <div>
                  <dt>Origin</dt>
                  <dd>{plan.origin.difficulty}</dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>{plan.destination.difficulty}</dd>
                </div>
              </dl>
              <div className="cc-corridor-links">
                <button
                  type="button"
                  className="cc-corridor-link"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', 'trade-calc')
                    params.set('section', 'financing')
                    params.set('tool', 'landed-cost')
                    params.set('origin', origin)
                    params.set('destination', destination)
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                  }}
                >
                  Landed cost + sensitivity →
                </button>
              </div>
            </div>

            {/* Phase D — Evidence Readiness Checker (commercial orientation) */}
            <section className="cc-corridor-block" data-testid="corridor-evidence-readiness">
              <h4>Evidence readiness (commercial)</h4>
              <p className="cc-corridor-muted" style={{ marginBottom: 8 }}>
                Claim-map orientation only — not clinical advice. {evidenceReadiness.claimCount} living
                claims · {evidenceReadiness.gapClaims} gap · {evidenceReadiness.partialClaims} partial ·{' '}
                {evidenceReadiness.highPriorityGaps} high-priority dimension gaps.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {evidenceFlags.map((f) => (
                  <li
                    key={f.id}
                    style={{
                      borderRadius: 8,
                      border:
                        f.severity === 'critical'
                          ? '1px solid rgba(248,113,113,0.35)'
                          : f.severity === 'attention'
                            ? '1px solid rgba(251,191,36,0.35)'
                            : '1px solid rgba(255,255,255,0.1)',
                      background:
                        f.severity === 'critical'
                          ? 'rgba(248,113,113,0.08)'
                          : f.severity === 'attention'
                            ? 'rgba(251,191,36,0.08)'
                            : 'rgba(255,255,255,0.03)',
                      padding: '8px 10px',
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>{f.title}</strong>
                    <div className="cc-corridor-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {f.detail}
                    </div>
                  </li>
                ))}
              </ul>
              {evidenceReadiness.topGaps.length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary className="cc-corridor-muted" style={{ cursor: 'pointer', fontSize: 12 }}>
                    Top framework gaps (operator triage)
                  </summary>
                  <ul style={{ marginTop: 6, paddingLeft: 16, fontSize: 11 }}>
                    {evidenceReadiness.topGaps.slice(0, 5).map((g, i) => (
                      <li key={`${g.sourceId}-${g.dimension}-${i}`} className="cc-corridor-muted">
                        [{g.status}] {g.dimension} — {g.label.slice(0, 80)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            {plan.notes.length > 0 && (
              <ul className="cc-corridor-notes">
                {plan.notes.map((n) => (
                  <li key={n.slice(0, 40)}>{n}</li>
                ))}
              </ul>
            )}

            <CorridorDepthSections depth={plan.depth} />

            <section className="cc-corridor-block">
              <h4>Documentation checklist</h4>
              <ul>
                {plan.documentationChecklist.map((item) => (
                  <li key={item.id}>
                    <span className="cc-corridor-muted">{item.side}</span> {item.label}
                    {item.required ? ' · required' : ''}
                  </li>
                ))}
              </ul>
            </section>

            <section className="cc-corridor-block">
              <h4>Process steps</h4>
              <ol>
                {plan.steps.map((s) => (
                  <li key={`${s.side}-${s.step}-${s.title}`}>
                    <strong>
                      {s.side} · {s.country_iso2} · {s.step}. {s.title}
                    </strong>{' '}
                    <span className="cc-corridor-muted">~{s.estimated_weeks} wk</span>
                    <p>{s.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <p className="cc-corridor-muted">{plan.trust.disclaimer}</p>
          </>
        )}
      </div>
    </section>
  )
}
