'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { SectionId } from '../contracts'
import {
  humanizeJurisdictionStatus,
  normalizeJurisdictionAccessState,
  type JurisdictionActivity,
  type JurisdictionCommandDTO,
} from '@/lib/dashboard/jurisdictionCommandContract'
import styles from './JurisdictionCommandSection.module.css'

type LegacyPathwayStep = {
  id: string
  step_number: number
  title: string
  description: string | null
  unlock_condition: string
}

type Props = {
  sectionRef: (node: HTMLElement | null) => void
  countryLabel: string
  flag: string
  region?: string | null
  outlook?: string | null
  pathway?: string | null
  importStatus?: string | null
  exportStatus?: string | null
  medicalStatus?: string | null
  adultUseStatus?: string | null
  regulator?: string | null
  reviewStatus: string
  pathwaySteps: LegacyPathwayStep[]
  pathwayIsGeneric: boolean
  commandHref: (section: SectionId, changes?: Record<string, string | null>) => string
}

type SafeSignal = {
  id: string
  title: string
  timeAgo?: string
  commercialImpact?: string
  sourceLabel?: string
  type?: string
}

const ACTIVITIES: Array<{ id: JurisdictionActivity; label: string }> = [
  { id: 'market-entry', label: 'Market entry' },
  { id: 'import', label: 'Import' },
  { id: 'export', label: 'Export' },
  { id: 'medical', label: 'Medical' },
  { id: 'adult-use', label: 'Adult use' },
]

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not verified'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not verified'
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function formatMetric(value: number, unit: string | null): string {
  const formatted = new Intl.NumberFormat('en', {
    notation: Math.abs(value) >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value)
  return unit ? `${formatted} ${unit}` : formatted
}

function roleLabel(roleId: string): string {
  return roleId.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function fallbackAccess(props: Props) {
  return [
    ['Import', props.importStatus],
    ['Export', props.exportStatus],
    ['Medical', props.medicalStatus],
    ['Adult use', props.adultUseStatus],
  ].map(([label, raw]) => ({
    label: label as string,
    raw: raw as string | null | undefined,
    state: normalizeJurisdictionAccessState(raw),
  }))
}

export function JurisdictionSection(props: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<JurisdictionCommandDTO | null>(null)
  const [signals, setSignals] = useState<SafeSignal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const canonicalContext = useMemo(() => {
    const href = props.commandHref('jurisdiction')
    const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : ''
    const params = new URLSearchParams(query)
    return {
      country: (params.get('country') || 'CA').split('-')[0].toUpperCase(),
      role: params.get('role'),
    }
  }, [props.commandHref])

  const requestedActivity = searchParams.get('activity') as JurisdictionActivity | null
  const activity = ACTIVITIES.some(item => item.id === requestedActivity) ? requestedActivity! : 'market-entry'
  const selectedMarket = searchParams.get('market')
  const selectedProduct = searchParams.get('product')

  useEffect(() => {
    const controller = new AbortController()
    setError(null)

    const params = new URLSearchParams({ country: canonicalContext.country, activity })
    if (canonicalContext.role) params.set('role', canonicalContext.role)
    if (selectedMarket) params.set('market', selectedMarket)
    if (selectedProduct) params.set('product', selectedProduct)

    const commandRequest = fetch(`/api/dashboard/jurisdiction-command?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error(`Jurisdiction command returned ${response.status}`)
      return response.json() as Promise<JurisdictionCommandDTO>
    })

    const signalRequest = fetch(`/api/dashboard/signals?country=${encodeURIComponent(props.countryLabel)}&limit=8`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) return [] as SafeSignal[]
      const payload = await response.json() as { signals?: SafeSignal[] }
      return Array.isArray(payload.signals) ? payload.signals : []
    }).catch(() => [] as SafeSignal[])

    void Promise.all([commandRequest, signalRequest])
      .then(([command, nextSignals]) => {
        if (controller.signal.aborted) return
        setData(command)
        setSignals(nextSignals)
      })
      .catch(fetchError => {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Jurisdiction command data is unavailable.')
      })

    return () => controller.abort()
  }, [activity, canonicalContext.country, canonicalContext.role, props.countryLabel, refreshKey, selectedMarket, selectedProduct])

  const replaceScope = (changes: Record<string, string | null>) => {
    router.replace(props.commandHref('jurisdiction', changes), { scroll: false })
  }

  const fallback = fallbackAccess(props)
  const changes = data?.changes ?? []
  const displaySignals = signals.slice(0, Math.max(0, 5 - changes.length))
  const buildActivity: JurisdictionActivity = activity === 'market-entry' ? 'import' : activity
  const isTradeActivity = activity === 'import' || activity === 'export'

  return (
    <section ref={props.sectionRef} id="jurisdiction" className="hvm2-section" data-jurisdiction-command="v1">
      <div className={styles.root}>
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div>
              <span className={styles.eyebrow}>Jurisdiction command</span>
              <h2>{props.flag} {data?.country.name ?? props.countryLabel}</h2>
              <p>{data?.country.region ?? props.region ?? 'Jurisdiction'} · {data?.country.regulator ?? props.regulator ?? 'Regulator under review'}</p>
            </div>
            <span className={styles.qualityPill} data-state={data?.dataQuality.state ?? 'incomplete'}>
              {data?.dataQuality.state ?? 'Loading'}
            </span>
          </div>

          <div className={styles.qualityGrid}>
            <div className={styles.qualityCard}>
              <span>Last verified</span>
              <strong>{formatDate(data?.dataQuality.lastVerifiedAt)}</strong>
            </div>
            <div className={styles.qualityCard}>
              <span>Operating context</span>
              <strong>{canonicalContext.role ? roleLabel(canonicalContext.role) : 'All roles · baseline'}</strong>
            </div>
            <div className={styles.qualityCard}>
              <span>Evidence sources</span>
              <strong>{data ? `${data.dataQuality.registeredSourceCount} registered` : 'Loading'}</strong>
            </div>
            <div className={styles.qualityCard}>
              <span>Organization</span>
              <strong>{data ? humanizeJurisdictionStatus(data.operatingContext.workspaceState) : 'Loading'}</strong>
            </div>
          </div>

          <div className={styles.actions} aria-label="Jurisdiction actions">
            <Link
              className={`${styles.action} ${styles.actionPrimary}`}
              href={props.commandHref('jurisdiction', { activity: buildActivity, market: null, product: null })}
            >
              Build route
            </Link>
            <a className={styles.action} href="#jurisdiction-comparison">Compare</a>
            <Link className={styles.action} href={props.commandHref('weekly-signals', { page: 'watchlist' })}>Watch</Link>
          </div>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            Live command enrichment failed. The country baseline remains visible. {error}
            {' '}
            <button type="button" onClick={() => setRefreshKey(value => value + 1)}>Retry</button>
          </div>
        )}

        <div className={styles.panel} aria-labelledby="jurisdiction-changes-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>What changed</span>
              <h3 id="jurisdiction-changes-title">Material deltas</h3>
            </div>
            <span className={styles.count}>{changes.length + displaySignals.length}</span>
          </div>

          {!data && !error ? <div className={styles.loading}>Loading reviewed changes and live intelligence…</div> : null}
          {data && changes.length === 0 && displaySignals.length === 0 ? (
            <div className={styles.empty}>No reviewed field change or current intelligence signal is loaded for this jurisdiction. This is an explicit empty state, not a claim that nothing changed.</div>
          ) : null}
          <div className={styles.changeList}>
            {changes.map(change => (
              <article key={change.id} className={styles.change}>
                <strong>{change.title}</strong>
                <p>{change.detail}</p>
                <div className={styles.changeMeta}>
                  <span>{humanizeJurisdictionStatus(change.kind)}</span>
                  <span>{formatDate(change.changedAt)}</span>
                  {change.sourceLabel ? <span>{change.sourceLabel}</span> : null}
                </div>
              </article>
            ))}
            {displaySignals.map(signal => (
              <article key={`signal-${signal.id}`} className={styles.change}>
                <strong>{signal.title}</strong>
                <p>{signal.commercialImpact || 'Reviewed intelligence signal. Open Intelligence for the complete record.'}</p>
                <div className={styles.changeMeta}>
                  <span>Intelligence signal</span>
                  {signal.timeAgo ? <span>{signal.timeAgo}</span> : null}
                  {signal.sourceLabel ? <span>{signal.sourceLabel}</span> : null}
                </div>
              </article>
            ))}
          </div>
          {(changes.length > 0 || displaySignals.length > 0) ? (
            <Link className={styles.sourceLink} href={props.commandHref('weekly-signals')}>Open intelligence →</Link>
          ) : null}
        </div>

        <div className={styles.panel} aria-labelledby="jurisdiction-route-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>Decision route</span>
              <h3 id="jurisdiction-route-title">What are you trying to do?</h3>
            </div>
          </div>

          <div className={styles.activityRail} aria-label="Market-access objective">
            {ACTIVITIES.map(item => (
              <button
                key={item.id}
                type="button"
                className={styles.activity}
                data-active={activity === item.id}
                aria-pressed={activity === item.id}
                onClick={() => replaceScope({ activity: item.id, market: null, product: null })}
              >
                {item.label}
              </button>
            ))}
          </div>

          {data ? (
            <div className={styles.routeCard} data-route-coverage={data.access.route.coverage}>
              <div className={styles.routeTitle}>
                <strong>{ACTIVITIES.find(item => item.id === data.access.route.activity)?.label ?? 'Market access'}</strong>
                <span className={styles.status} data-state={data.access.route.state}>{humanizeJurisdictionStatus(data.access.route.state)}</span>
              </div>
              <p>{data.access.route.detail}</p>
              <div className={styles.smallMeta}>
                <span>Coverage: {humanizeJurisdictionStatus(data.access.route.coverage)}</span>
                {data.access.route.permitRequired !== null ? <span>Permit: {data.access.route.permitRequired ? 'required' : 'not flagged'}</span> : null}
                {data.access.route.permitAuthority ? <span>Authority: {data.access.route.permitAuthority}</span> : null}
              </div>
            </div>
          ) : (
            <div className={styles.routeCard}>
              <div className={styles.routeTitle}>
                <strong>{ACTIVITIES.find(item => item.id === activity)?.label}</strong>
                <span className={styles.status} data-state="unknown">Loading</span>
              </div>
              <p>Resolving the country baseline and reviewed route records.</p>
            </div>
          )}

          {data && isTradeActivity && (data.access.routeOptions.counterpartMarkets.length > 0 || data.access.routeOptions.products.length > 0) ? (
            <div className={styles.filters}>
              <label>
                {activity === 'import' ? 'Origin market' : 'Destination market'}
                <select
                  value={selectedMarket ?? ''}
                  onChange={event => replaceScope({ activity, market: event.target.value || null, product: selectedProduct })}
                >
                  <option value="">Any reviewed market</option>
                  {data.access.routeOptions.counterpartMarkets.map(market => <option key={market} value={market}>{market}</option>)}
                </select>
              </label>
              <label>
                Product
                <select
                  value={selectedProduct ?? ''}
                  onChange={event => replaceScope({ activity, market: selectedMarket, product: event.target.value || null })}
                >
                  <option value="">Any reviewed product</option>
                  {data.access.routeOptions.products.map(productOption => <option key={productOption} value={productOption}>{productOption}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          <div className={styles.accessGrid}>
            {(data?.access.lanes ?? fallback.map(item => ({
              id: 'market-entry' as JurisdictionActivity,
              label: item.label,
              rawStatus: item.raw ?? null,
              state: item.state,
              detail: '',
            }))).map((lane, index) => (
              <div key={`${lane.label}-${index}`} className={styles.accessCard}>
                <span>{lane.label}</span>
                <strong>{lane.rawStatus ? humanizeJurisdictionStatus(lane.rawStatus) : 'Under review'}</strong>
                <div className={styles.smallMeta}><span>{humanizeJurisdictionStatus(lane.state)}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel} aria-labelledby="jurisdiction-pathway-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>Dependency graph</span>
              <h3 id="jurisdiction-pathway-title">Access pathway</h3>
            </div>
            {data ? <span className={styles.status} data-state={data.pathway.state === 'curated' ? 'available' : data.pathway.state === 'generic' ? 'conditional' : 'unknown'}>{humanizeJurisdictionStatus(data.pathway.state)}</span> : null}
          </div>

          {data?.pathway.state === 'role-required' ? (
            <div className={styles.stateCard}>
              <p>Country-level access remains available in All roles. Select a role only to resolve role-specific dependencies; Harbourview does not manufacture an arbitrary pathway.</p>
              {data.pathway.availableRoleIds.length > 0 ? (
                <div className={styles.roleLinks}>
                  {data.pathway.availableRoleIds.map(role => (
                    <Link key={role} className={styles.roleLink} href={props.commandHref('jurisdiction', { role })}>{roleLabel(role)}</Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {data?.pathway.state === 'unavailable' ? (
            <div className={styles.empty}>No reviewed or generic pathway is available for the selected role. The jurisdiction baseline above remains usable; pathway-specific assertions stay unavailable.</div>
          ) : null}

          {data?.pathway.state === 'generic' ? (
            <div className={styles.empty}>This pathway is a generic role template. Treat every dependency as guidance until a curated jurisdiction-specific pathway is reviewed.</div>
          ) : null}

          {!data && props.pathwaySteps.length > 0 ? (
            <div className={styles.empty}>Loading dependency status for {props.pathwaySteps.length} existing pathway steps…</div>
          ) : null}

          <div className={styles.stepList}>
            {data?.pathway.steps.map(step => (
              <article key={step.id} className={styles.step}>
                <div className={styles.stepHead}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <div>
                    <h4>{step.title}</h4>
                    {step.description ? <p>{step.description}</p> : null}
                  </div>
                  <span className={styles.dependency} data-state={step.state}>{humanizeJurisdictionStatus(step.state)}</span>
                </div>
                {step.requirements.length > 0 ? (
                  <div className={styles.requirements}>
                    {step.requirements.map(requirement => (
                      <div key={requirement.id} className={styles.requirement}>
                        <strong>{requirement.title}</strong>
                        <div className={styles.smallMeta}>
                          <span>{requirement.required ? 'Required' : 'Optional'}</span>
                          <span>{requirement.statusLabel}</span>
                          {requirement.evidenceType ? <span>Evidence: {humanizeJurisdictionStatus(requirement.evidenceType)}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className={styles.panel} aria-labelledby="jurisdiction-commercial-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>Commercial picture</span>
              <h3 id="jurisdiction-commercial-title">Market signals</h3>
            </div>
          </div>

          {data && data.marketMetrics.length === 0 && data.tradeFlows.length === 0 ? (
            <div className={styles.empty}>No structured market metrics or trade-flow records are loaded for this jurisdiction. Harbourview does not substitute unsupported estimates.</div>
          ) : null}
          <div className={styles.metricList}>
            {data?.marketMetrics.slice(0, 5).map((metric, index) => (
              <article key={`${metric.name}-${metric.period ?? index}`} className={styles.metric}>
                <div className={styles.rowBetween}>
                  <strong>{metric.name}</strong>
                  <span className={styles.status} data-state="available">{formatMetric(metric.value, metric.unit)}</span>
                </div>
                <div className={styles.smallMeta}>
                  {metric.period ? <span>{metric.period}</span> : null}
                  {metric.dataType ? <span>{humanizeJurisdictionStatus(metric.dataType)}</span> : null}
                  {metric.sourceName ? <span>{metric.sourceName}</span> : null}
                </div>
              </article>
            ))}
            {data?.tradeFlows.slice(0, 4).map((flow, index) => (
              <article key={`${flow.originIso2}-${flow.destinationIso2}-${flow.productCategory ?? index}`} className={styles.metric}>
                <strong>{flow.originIso2} → {flow.destinationIso2}</strong>
                <p>{flow.productCategory || 'Trade-flow record'} · {flow.legalStatus ? humanizeJurisdictionStatus(flow.legalStatus) : 'Status under review'}</p>
                <div className={styles.smallMeta}>
                  {flow.permitRequired !== null ? <span>{flow.permitRequired ? 'Permit required' : 'No permit flag'}</span> : null}
                  {flow.permitAuthority ? <span>{flow.permitAuthority}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.panel} aria-labelledby="jurisdiction-counterparties-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>Market participants</span>
              <h3 id="jurisdiction-counterparties-title">Verified counterparties</h3>
            </div>
            <span className={styles.count}>{data?.counterparties.length ?? 0}</span>
          </div>
          {data && data.counterparties.length === 0 ? (
            <div className={styles.empty}>No verified operator or professional record is loaded for this jurisdiction. Capability matching is not inferred from unverified records.</div>
          ) : null}
          <div className={styles.counterpartyList}>
            {data?.counterparties.slice(0, 8).map(counterparty => (
              <article key={`${counterparty.kind}-${counterparty.id}`} className={styles.counterparty}>
                <strong>{counterparty.name}</strong>
                <p>{counterparty.detail}</p>
                <div className={styles.smallMeta}><span>{humanizeJurisdictionStatus(counterparty.kind)}</span><span>Verified record</span></div>
              </article>
            ))}
          </div>
          {data && data.counterparties.length > 0 ? <Link className={styles.sourceLink} href={props.commandHref('directories')}>Open directories →</Link> : null}
        </div>

        <div className={styles.panel} aria-labelledby="jurisdiction-evidence-title">
          <div className={styles.headingRow}>
            <div>
              <span className={styles.kicker}>Evidence health</span>
              <h3 id="jurisdiction-evidence-title">Can this answer be trusted?</h3>
            </div>
          </div>

          <div className={styles.qualityGrid}>
            <div className={styles.qualityCard}><span>Published playbook</span><strong>{data ? (data.dataQuality.evidenceVerified ? 'Verified' : 'Not verified') : 'Loading'}</strong></div>
            <div className={styles.qualityCard}><span>Tier-1 sources</span><strong>{data?.dataQuality.officialSourceCount ?? '—'}</strong></div>
            <div className={styles.qualityCard}><span>Last verification</span><strong>{formatDate(data?.dataQuality.lastVerifiedAt)}</strong></div>
            <div className={styles.qualityCard}><span>Conflict assessment</span><strong>Not modelled</strong></div>
          </div>

          {data?.dataQuality.gaps.length ? (
            <div className={styles.gapList}>
              {data.dataQuality.gaps.map(gap => <div key={gap} className={styles.gap}><p>{gap}</p></div>)}
            </div>
          ) : null}

          <div className={styles.evidenceList}>
            {data?.evidenceSources.slice(0, 6).map(source => (
              <article key={source.id} className={styles.evidence}>
                <div className={styles.evidenceRow}>
                  <strong>{source.name}</strong>
                  <span className={styles.status} data-state="available">{humanizeJurisdictionStatus(source.reliability)}</span>
                </div>
                <div className={styles.smallMeta}><span>{humanizeJurisdictionStatus(source.category)}</span><span>Checked {formatDate(source.lastChecked)}</span></div>
              </article>
            ))}
          </div>
          <Link className={styles.sourceLink} href={props.commandHref('review-gates', { page: 'evidence' })}>Open evidence →</Link>
        </div>

        {data?.calendar.length ? (
          <div className={styles.panel} aria-labelledby="jurisdiction-calendar-title">
            <div className={styles.headingRow}>
              <div><span className={styles.kicker}>Forward watch</span><h3 id="jurisdiction-calendar-title">Upcoming regulatory dates</h3></div>
            </div>
            <div className={styles.calendarList}>
              {data.calendar.map(event => (
                <article key={event.id} className={styles.calendar}>
                  <strong>{event.title}</strong>
                  {event.summary ? <p>{event.summary}</p> : null}
                  <div className={styles.smallMeta}>
                    <span>{event.expectedDate ? formatDate(event.expectedDate) : 'Date pending'}</span>
                    {event.confidence ? <span>{humanizeJurisdictionStatus(event.confidence)} confidence</span> : null}
                    {event.sourceLabel ? <span>{event.sourceLabel}</span> : null}
                  </div>
                  {event.sourceUrl ? <a className={styles.sourceLink} href={event.sourceUrl} rel="noreferrer" target="_blank">Primary/source record ↗</a> : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div id="jurisdiction-comparison" className={styles.panel} aria-labelledby="jurisdiction-comparison-title">
          <div className={styles.headingRow}>
            <div><span className={styles.kicker}>Cross-market view</span><h3 id="jurisdiction-comparison-title">Compare access posture</h3></div>
          </div>
          {data && data.comparisons.length === 0 ? <div className={styles.empty}>No comparison-country scores are currently available.</div> : null}
          <div className={styles.comparisonList}>
            {data?.comparisons.map(item => (
              <article key={item.iso2} className={styles.comparison}>
                <div className={styles.rowBetween}>
                  <strong>{item.name}</strong>
                  <span className={styles.status} data-state={normalizeJurisdictionAccessState(item.marketAccessStatus)}>{item.marketAccessStatus ? humanizeJurisdictionStatus(item.marketAccessStatus) : 'Under review'}</span>
                </div>
                <div className={styles.smallMeta}><span>Opportunity score {item.opportunityScore}</span><span>{item.dataCompleteness ? `Coverage ${humanizeJurisdictionStatus(item.dataCompleteness)}` : 'Coverage under review'}</span></div>
              </article>
            ))}
          </div>
        </div>

        {(data?.country.regulatoryOutlook || props.outlook || data?.country.publicSummary || props.pathway) ? (
          <details className={styles.panel}>
            <summary>Country context and reviewed narrative</summary>
            <p>{data?.country.regulatoryOutlook || props.outlook || data?.country.publicSummary || props.pathway}</p>
          </details>
        ) : null}
      </div>
    </section>
  )
}
