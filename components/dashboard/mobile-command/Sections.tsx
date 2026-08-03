import type React from 'react'
import Link from 'next/link'
import type { MarketView } from '../CommandCentre'
import { JOB_SECTOR_LABELS, JOB_TYPE_LABELS, type JOB_LISTINGS } from '../data/jobsBoard'
import type { MobileCommandCentreProps } from './props'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  type DirectoryRecord,
  type NextAction,
  type NormalizedListing,
  type SectionId,
  type SubmissionRecord,
  type Tone,
  formatStatus,
  readString,
} from './contracts'

type Signal = MobileCommandCentreProps['signals'][number]
type EducationTile = MobileCommandCentreProps['eduCategories'][number] | NonNullable<MobileCommandCentreProps['liveTiles']>[number]
type TalentRecord = (typeof JOB_LISTINGS)[number]
type SectionRef = (node: HTMLElement | null) => void

type SectionShellProps = {
  id: SectionId
  sectionRef: SectionRef
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function SectionShell({ id, sectionRef, eyebrow, title, description, action, className = '', children }: SectionShellProps) {
  return (
    <section id={id} ref={sectionRef} className={`hvm2-section ${className}`.trim()}>
      <header className="hvm2-section-heading">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function Metric({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: React.ReactNode
  detail: string
  tone?: Tone
}) {
  return (
    <article className={`hvm2-metric hvm2-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`hvm2-pill hvm2-pill-${tone}`}>{children}</span>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="hvm2-empty">
      <span aria-hidden="true">◇</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}

export function OverviewSection({
  sectionRef,
  countryLabel,
  roleLabel,
  publicSummary,
  marketAccessStatus,
  reviewStatus,
  dataCompleteness,
  firstAction,
  onOpenActions,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleLabel: string
  publicSummary?: string | null
  marketAccessStatus?: string | null
  reviewStatus: string
  dataCompleteness: string
  firstAction?: NextAction
  onOpenActions: () => void
}) {
  return (
    <section id="overview" ref={sectionRef} className="hvm2-section hvm2-overview">
      <div className="hvm2-hero-grid">
        <article className="hvm2-command-brief">
          <span>Command brief</span>
          <h2>{countryLabel} operating picture</h2>
          <p>{publicSummary?.trim() || `${countryLabel} is loaded as the active jurisdiction for ${roleLabel}. Live marketplace, intelligence, pathway and education signals are consolidated below.`}</p>
          <div className="hvm2-brief-tags">
            <StatusPill tone="gold">{formatStatus(marketAccessStatus, 'Market access review')}</StatusPill>
            <StatusPill>{reviewStatus}</StatusPill>
            <StatusPill>{dataCompleteness}</StatusPill>
          </div>
        </article>
        <article className="hvm2-priority-card">
          <span>Immediate priority</span>
          <strong>{firstAction?.label ?? 'Validate the active market context'}</strong>
          <p>{firstAction?.detail ?? 'Review the live operating picture before moving into commercial action.'}</p>
          <button type="button" onClick={onOpenActions}>Open action queue</button>
        </article>
      </div>
    </section>
  )
}

export function LiveStatusSection({
  sectionRef,
  marketplaceCount,
  wantedCount,
  signalCount,
  confidence,
  reviewStatus,
  sourceCoverageCount,
}: {
  sectionRef: SectionRef
  marketplaceCount: number
  wantedCount: number
  signalCount: number
  confidence: number | null
  reviewStatus: string
  sourceCoverageCount: number
}) {
  return (
    <SectionShell id="live-status" sectionRef={sectionRef} eyebrow="Metrics / live status" title="Current operating state" description="A compact read on opportunity, demand, evidence and intelligence in the selected jurisdiction-role context.">
      <div className="hvm2-metric-grid">
        <Metric label="Marketplace records" value={marketplaceCount} detail="Across all active categories" tone="gold" />
        <Metric label="Wanted demand" value={wantedCount} detail="Approved demand records" />
        <Metric label="Live intelligence" value={signalCount} detail="Signals in current feed" tone="ok" />
        <Metric label="Evidence confidence" value={confidence == null ? '—' : `${confidence}%`} detail={`${reviewStatus} · ${sourceCoverageCount} source lanes`} tone={confidence != null && confidence >= 75 ? 'ok' : 'neutral'} />
      </div>
    </SectionShell>
  )
}

export function MarketIntelligenceSection({
  sectionRef,
  marketMetrics,
  tradeFlows,
}: {
  sectionRef: SectionRef
  marketMetrics: NonNullable<MobileCommandCentreProps['marketMetrics']>
  tradeFlows: NonNullable<MobileCommandCentreProps['tradeFlows']>
}) {
  return (
    <SectionShell id="market-intelligence" sectionRef={sectionRef} eyebrow="Market intelligence" title="Metrics and trade flows" description="Country-context market indicators and reviewed trade corridors are presented separately from marketplace listings.">
      {marketMetrics.length > 0 || tradeFlows.length > 0 ? (
        <div className="hvm2-compliance-grid">
          {marketMetrics.map((metric, index) => (
            <article key={`metric-${readString(metric, ['id'], String(index))}`}>
              <span>{readString(metric, ['category', 'metric_type', 'label'], 'Market metric')}</span>
              <strong>{readString(metric, ['metric_name', 'name', 'title'], 'Market indicator')}</strong>
              <p>{readString(metric, ['display_value', 'value', 'summary'], 'Value under review')}</p>
            </article>
          ))}
          {tradeFlows.map((flow, index) => (
            <article key={`flow-${readString(flow, ['id'], String(index))}`}>
              <span>{readString(flow, ['origin', 'source_country'], 'Trade')} → {readString(flow, ['destination', 'destination_country'], 'Market')}</span>
              <strong>{readString(flow, ['product', 'product_type', 'title'], 'Reviewed trade flow')}</strong>
              <p>{readString(flow, ['summary', 'status', 'volume'], 'Corridor evidence under review')}</p>
            </article>
          ))}
        </div>
      ) : <EmptyState title="Market intelligence is ready for data" detail="No reviewed metrics or trade flows matched the current jurisdiction yet." />}
    </SectionShell>
  )
}

function ListingCard({ row, href, cta }: { row: NormalizedListing; href: string; cta: string }) {
  return (
    <article className="hvm2-listing-card">
      <div className="hvm2-card-topline"><StatusPill tone="gold">{row.category}</StatusPill><span>{row.jurisdiction}</span></div>
      <h3>{row.title}</h3>
      <p>{row.summary}</p>
      <div className="hvm2-card-meta">
        <span>{formatStatus(row.status)}</span>
        <span>{formatStatus(row.channel, MOBILE_COMMAND_COPY.listingChannel)}</span>
        {row.confidence != null && <span>{row.confidence}% confidence</span>}
      </div>
      <Link href={href}>{cta}</Link>
    </article>
  )
}

export function MarketplaceSection({
  sectionRef,
  activeMarketView,
  marketQuery,
  marketRows,
  filteredRows,
  onMarketViewChange,
  onMarketQueryChange,
  routeHref,
}: {
  sectionRef: SectionRef
  activeMarketView: MarketView
  marketQuery: string
  marketRows: NormalizedListing[]
  filteredRows: NormalizedListing[]
  onMarketViewChange: (view: MarketView) => void
  onMarketQueryChange: (value: string) => void
  routeHref: (path: string, changes?: Record<string, string>) => string
}) {
  const searchLabel = `Search ${MARKET_TABS.find(tab => tab.id === activeMarketView)?.label.toLowerCase() ?? 'marketplace'}`
  return (
    <SectionShell id="marketplace" sectionRef={sectionRef} eyebrow="Marketplace control" title="Demand, supply and commercial routes" description={MOBILE_COMMAND_COPY.marketplaceDescription} action={<Link className="hvm2-text-link" href={routeHref('/marketplace')}>Open exchange</Link>} className="hvm2-market-section">
      <div className="hvm2-quick-actions">
        <Link href={routeHref('/marketplace/wanted')}><span>＋</span><strong>Post wanted demand</strong><small>Buyer-led requirement</small></Link>
        <Link href={routeHref('/marketplace/sell')}><span>↗</span><strong>Submit supply</strong><small>Controlled review intake</small></Link>
        <Link href={routeHref('/marketplace/financing')}><span>¤</span><strong>Request financing</strong><small>Trade structure review</small></Link>
      </div>
      <div className="hvm2-market-controls">
        <div className="hvm2-tab-rail" role="tablist" aria-label="Marketplace categories">
          {MARKET_TABS.map(tab => {
            const count = marketRows.filter(row => row.view === tab.id).length
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`hvm2-tab-${tab.id}`}
                aria-controls="hvm2-market-panel"
                aria-selected={activeMarketView === tab.id}
                tabIndex={activeMarketView === tab.id ? 0 : -1}
                className={activeMarketView === tab.id ? 'active' : ''}
                onClick={() => onMarketViewChange(tab.id)}
              >
                {tab.label}<span aria-label={`${count} records`}>{count}</span>
              </button>
            )
          })}
        </div>
        <label className="hvm2-search-field">
          <span aria-hidden="true">⌕</span>
          <input value={marketQuery} onChange={event => onMarketQueryChange(event.target.value)} aria-label={searchLabel} placeholder={searchLabel} />
        </label>
      </div>
      <div id="hvm2-market-panel" role="tabpanel" aria-labelledby={`hvm2-tab-${activeMarketView}`}>
        {filteredRows.length > 0 ? (
          <div className="hvm2-listing-grid">
            {filteredRows.map(row => <ListingCard key={`${row.view}-${row.id}`} row={row} href={routeHref('/intake', { topic: 'marketplace', listing: row.id })} cta={MOBILE_COMMAND_COPY.reviewedIntroduction} />)}
          </div>
        ) : <EmptyState title="No records match this view" detail="The category remains available. Adjust the search or post a wanted requirement for Harbourview review." />}
      </div>
    </SectionShell>
  )
}

export function SupplySection({ sectionRef, supplyRows, routeHref }: { sectionRef: SectionRef; supplyRows: NormalizedListing[]; routeHref: (path: string, changes?: Record<string, string>) => string }) {
  return (
    <SectionShell id="supply" sectionRef={sectionRef} eyebrow="Supply" title="Products, consumables, equipment and services" description="The complete loaded supply universe remains visible across cannabis, equipment, consumables, services and new products." action={<Link className="hvm2-text-link" href={routeHref('/supply')}>Supply catalogue</Link>}>
      <div className="hvm2-metric-grid">
        {MARKET_TABS.filter(tab => !['wanted', 'opportunities'].includes(tab.id)).map(tab => <Metric key={tab.id} label={tab.label} value={supplyRows.filter(row => row.view === tab.id).length} detail="Approved loaded records" />)}
      </div>
      {supplyRows.length > 0 ? (
        <div className="hvm2-horizontal-deck hvm2-deck-spaced">
          {supplyRows.map(row => <ListingCard key={`supply-${row.view}-${row.id}`} row={row} href={routeHref('/intake', { topic: 'supply', listing: row.id })} cta={MOBILE_COMMAND_COPY.supplyReview} />)}
        </div>
      ) : <EmptyState title="No reviewed supply records loaded" detail="Post a supply submission or wanted requirement for Harbourview review." />}
    </SectionShell>
  )
}

export function NextActionsSection({ sectionRef, actions }: { sectionRef: SectionRef; actions: NextAction[] }) {
  return (
    <SectionShell id="next-actions" sectionRef={sectionRef} eyebrow="Context / next actions" title="Operator action queue" description="Actions are derived from the selected jurisdiction, role, marketplace pipeline and current evidence state.">
      <div className="hvm2-action-stack">
        {actions.map((action, index) => (
          <Link key={action.id} href={action.href} className={`hvm2-action-card hvm2-tone-${action.tone}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{action.label}</strong><p>{action.detail}</p></div>
            <i aria-hidden="true">→</i>
          </Link>
        ))}
      </div>
    </SectionShell>
  )
}

export function WeeklySignalsSection({ sectionRef, signals, routeHref }: { sectionRef: SectionRef; signals: Signal[]; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="weekly-signals" sectionRef={sectionRef} eyebrow="Context / weekly signals" title="Intelligence requiring attention" description="All signals loaded into the current dashboard feed remain visible and reviewable here." action={<Link className="hvm2-text-link" href={routeHref('/signals')}>Signals workspace</Link>}>
      {signals.length > 0 ? (
        <div className="hvm2-horizontal-deck" aria-label="Weekly intelligence signals">
          {signals.map(signal => (
            <article className="hvm2-signal-card" key={signal.id}>
              <div className="hvm2-card-topline"><StatusPill>{signal.type}</StatusPill><span>{signal.market}</span></div>
              <h3>{signal.title}</h3>
              <p>{signal.analysis?.what_changed || signal.commercialImpact}</p>
              <div className="hvm2-signal-footer"><span>{signal.confidence}% confidence</span><span>{signal.timeAgo}</span></div>
              {signal.analysis?.recommended_action && <small>{signal.analysis.recommended_action}</small>}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No reviewed signals loaded" detail="The intelligence surface is live but no current signals matched this context." />}
    </SectionShell>
  )
}

export function PersonalBriefingSection({ sectionRef, roleShort, countryLabel, narrative, marketplaceCount, signalCount, pipelineTotal, actionCount }: {
  sectionRef: SectionRef
  roleShort: string
  countryLabel: string
  narrative: string
  marketplaceCount: number
  signalCount: number
  pipelineTotal: number
  actionCount: number
}) {
  return (
    <SectionShell id="personal-briefing" sectionRef={sectionRef} eyebrow="Personal briefing" title={`${roleShort} briefing for ${countryLabel}`} description="A deterministic summary of the active jurisdiction, market pipeline, signal feed and next operational decisions.">
      <article className="hvm2-narrative-card">
        <p>{narrative}</p>
        <div className="hvm2-narrative-grid">
          <div><span>Commercial records</span><strong>{marketplaceCount}</strong></div>
          <div><span>Signals tracked</span><strong>{signalCount}</strong></div>
          <div><span>Pipeline items</span><strong>{pipelineTotal}</strong></div>
          <div><span>Action queue</span><strong>{actionCount}</strong></div>
        </div>
      </article>
    </SectionShell>
  )
}

export function SearchSection({ sectionRef, searchQuery, signalResults, listingResults, onQueryChange, onSignalSelect, onListingSelect }: {
  sectionRef: SectionRef
  searchQuery: string
  signalResults: Signal[]
  listingResults: NormalizedListing[]
  onQueryChange: (value: string) => void
  onSignalSelect: () => void
  onListingSelect: (row: NormalizedListing) => void
}) {
  const label = 'Search markets, products, regulations, operators or actions'
  return (
    <SectionShell id="search" sectionRef={sectionRef} eyebrow="Cross-command search" title="Search intelligence and marketplace records" description="Search operates across every signal and marketplace record already loaded into this authenticated command session.">
      <label className="hvm2-search-field hvm2-search-field-large">
        <span aria-hidden="true">⌕</span>
        <input value={searchQuery} onChange={event => onQueryChange(event.target.value)} aria-label={label} placeholder={label} />
      </label>
      <div className="hvm2-search-summary"><span>{signalResults.length} signals</span><span>{listingResults.length} marketplace records</span></div>
      {searchQuery.trim() && (
        <div className="hvm2-search-results">
          {signalResults.map(signal => <button type="button" key={`signal-${signal.id}`} onClick={onSignalSelect}><span>Signal</span><strong>{signal.title}</strong><small>{signal.market}</small></button>)}
          {listingResults.map(row => <button type="button" key={`listing-${row.view}-${row.id}`} onClick={() => onListingSelect(row)}><span>Marketplace</span><strong>{row.title}</strong><small>{row.category} · {row.jurisdiction}</small></button>)}
          {signalResults.length === 0 && listingResults.length === 0 && <EmptyState title="No command records matched" detail="Try a country, product, regulatory topic or commercial category." />}
        </div>
      )}
    </SectionShell>
  )
}

export function EducationSection({ sectionRef, roleShort, tiles, dashboardHref }: { sectionRef: SectionRef; roleShort: string; tiles: EducationTile[]; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="education" sectionRef={sectionRef} eyebrow="Context / education path" title={`${roleShort} learning path`} description="Role-relevant education is kept in the same operational context as market, access and compliance work." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'education' })}>Education hub</Link>}>
      {tiles.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {tiles.map((tile, index) => {
            const module = readString(tile, ['slug'], 'overview')
            return (
              <article className="hvm2-education-card" key={`${readString(tile, ['slug', 'title'], String(index))}-${index}`}>
                <span aria-hidden="true">{readString(tile, ['icon'], '◇')}</span>
                <h3>{readString(tile, ['title'], 'Education module')}</h3>
                <p>{readString(tile, ['desc', 'description'], 'Role-relevant education content.')}</p>
                <Link href={dashboardHref({ page: 'education', module })}>Open module</Link>
              </article>
            )
          })}
        </div>
      ) : <EmptyState title="Education path pending" detail="No published modules matched the active role yet." />}
    </SectionShell>
  )
}

export function JurisdictionSection({ sectionRef, countryLabel, countryIso2, region, outlook, pathway, importStatus, exportStatus, medicalStatus, adultUseStatus, regulator, reviewStatus, routeHref }: {
  sectionRef: SectionRef
  countryLabel: string
  countryIso2: string
  region?: string | null
  outlook?: string | null
  pathway?: string | null
  importStatus?: string | null
  exportStatus?: string | null
  medicalStatus?: string | null
  adultUseStatus?: string | null
  regulator?: string | null
  reviewStatus: string
  routeHref: (path: string) => string
}) {
  return (
    <SectionShell id="jurisdiction" sectionRef={sectionRef} eyebrow="Jurisdiction context" title={`${countryLabel} market-access context`} description="Country status, regulator, access posture and commercial pathway remain tied to the selected role." action={<Link className="hvm2-text-link" href={routeHref('/markets')}>All markets</Link>}>
      <article className="hvm2-jurisdiction-card">
        <div className="hvm2-jurisdiction-title"><span>{countryIso2}</span><div><h3>{countryLabel}</h3><p>{region || 'Global regulated market'}</p></div></div>
        <p>{outlook?.trim() || pathway?.trim() || 'Regulatory and commercial pathway detail remains subject to controlled evidence review.'}</p>
        <div className="hvm2-status-matrix">
          <div><span>Import</span><strong>{formatStatus(importStatus)}</strong></div>
          <div><span>Export</span><strong>{formatStatus(exportStatus)}</strong></div>
          <div><span>Medical</span><strong>{formatStatus(medicalStatus)}</strong></div>
          <div><span>Adult use</span><strong>{formatStatus(adultUseStatus)}</strong></div>
          <div><span>Regulator</span><strong>{regulator || 'Under review'}</strong></div>
          <div><span>Evidence</span><strong>{reviewStatus}</strong></div>
        </div>
      </article>
    </SectionShell>
  )
}

export function MarketStatusSection({ sectionRef, wanted, inquiry, proofReview, matched, dealRoom, submissions }: { sectionRef: SectionRef; wanted: number; inquiry: number; proofReview: number; matched: number; dealRoom: number; submissions: SubmissionRecord[] }) {
  const stages: Array<[string, number]> = [['Wanted', wanted], ['Inquiry', inquiry], ['Proof review', proofReview], ['Matched', matched], ['Deal room', dealRoom]]
  return (
    <SectionShell id="market-status" sectionRef={sectionRef} eyebrow="Marketplace status" title="Controlled transaction pipeline" description={MOBILE_COMMAND_COPY.transactionPipeline}>
      <div className="hvm2-pipeline" aria-label="Marketplace pipeline">
        {stages.map(([label, value], index) => <div key={label}><span>{index + 1}</span><strong>{value}</strong><small>{label}</small></div>)}
      </div>
      {submissions.length > 0 && <div className="hvm2-submission-list">{submissions.map(item => <article key={item.id}><div><span>My submission</span><strong>{item.title}</strong></div><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}</div>}
    </SectionShell>
  )
}

export function ReviewGatesSection({ sectionRef, reviewStatus, approved, dataCompleteness, sourceCoverageCount, proofReview, submissionCount }: { sectionRef: SectionRef; reviewStatus: string; approved: boolean; dataCompleteness: string; sourceCoverageCount: number; proofReview: number; submissionCount: number }) {
  return (
    <SectionShell id="review-gates" sectionRef={sectionRef} eyebrow="Review / gate status" title="Evidence and release controls" description={MOBILE_COMMAND_COPY.reviewDescription}>
      <div className="hvm2-gate-grid">
        <Metric label="Country review" value={reviewStatus} detail="Jurisdiction intelligence state" tone={approved ? 'ok' : 'warn'} />
        <Metric label="Data coverage" value={dataCompleteness} detail={`${sourceCoverageCount} source coverage lanes`} />
        <Metric label="Proof review" value={proofReview} detail="Marketplace records awaiting evidence" tone={proofReview > 0 ? 'warn' : 'ok'} />
        <Metric label="My submissions" value={submissionCount} detail="Private records in review workflow" />
      </div>
      <div className="hvm2-control-note"><strong>{MOBILE_COMMAND_COPY.controlTitle}</strong><p>{MOBILE_COMMAND_COPY.controlDetail}</p></div>
    </SectionShell>
  )
}

export function DirectoriesSection({ sectionRef, records, routeHref }: { sectionRef: SectionRef; records: DirectoryRecord[]; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="directories" sectionRef={sectionRef} eyebrow="Directories" title="Reviewed professionals, providers and operators" description={MOBILE_COMMAND_COPY.directoryDescription} action={<Link className="hvm2-text-link" href={routeHref('/reviewed-connections')}>Reviewed connections</Link>}>
      {records.length > 0 ? <div className="hvm2-horizontal-deck">{records.map(item => <article className="hvm2-directory-card" key={`${item.kind}-${item.id}`}><span>{item.kind}</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}</div> : <EmptyState title="No reviewed directory records loaded" detail="Professionals, providers and operators will appear after projection and review requirements are satisfied." />}
    </SectionShell>
  )
}

export function TalentSection({ sectionRef, records, dashboardHref }: { sectionRef: SectionRef; records: TalentRecord[]; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="talent" sectionRef={sectionRef} eyebrow="Talent" title="Roles and operating capability" description="Talent opportunities remain separated from counterparty records and are filtered to the active jurisdiction or role where possible." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'jobs' })}>Jobs workspace</Link>}>
      {records.length > 0 ? <div className="hvm2-horizontal-deck">{records.map(job => <article className="hvm2-directory-card" key={job.id}><span>{JOB_SECTOR_LABELS[job.sector]} · {job.country}</span><h3>{job.title}</h3><p>{job.company} · {job.city}{job.remote ? ' · Remote' : ''}</p><div className="hvm2-card-meta"><span>{JOB_TYPE_LABELS[job.type]}</span>{job.salary && <span>{job.salary}</span>}</div></article>)}</div> : <EmptyState title="No talent opportunities loaded" detail="The talent section remains active and will populate from the approved jobs dataset." />}
    </SectionShell>
  )
}

export function GeneticsSection({ sectionRef, records, dashboardHref }: { sectionRef: SectionRef; records: DirectoryRecord[]; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="genetics" sectionRef={sectionRef} eyebrow="Genetics" title="Cultivar and program intelligence" description="Reviewed cultivar passports and genetics records remain tied to evidence and controlled requests." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'genetics' })}>Genetics workspace</Link>}>
      {records.length > 0 ? <div className="hvm2-horizontal-deck">{records.map(item => <article className="hvm2-directory-card" key={item.id}><span>Cultivar passport</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}</div> : <EmptyState title="No reviewed genetics records loaded" detail="Genetics remains available through controlled program and evidence requests." />}
    </SectionShell>
  )
}

export function ClinicalSection({ sectionRef, roleShort, programStatus, medicalStatus, patientAccess, physicianAccess, routeHref }: { sectionRef: SectionRef; roleShort: string; programStatus?: string | null; medicalStatus?: string | null; patientAccess?: string | null; physicianAccess?: string | null; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="clinical" sectionRef={sectionRef} eyebrow="Clinical" title="Clinical access and education" description="Country-specific patient, prescriber and pharmacy context is kept separate from commercial claims." action={<Link className="hvm2-text-link" href={routeHref('/network/clinical-education')}>Clinical education</Link>}>
      <div className="hvm2-two-column">
        <article><span>Patient access</span><h3>{programStatus || formatStatus(medicalStatus, 'Clinical pathway review')}</h3><p>{patientAccess || 'Patient-access detail is available when supported by reviewed jurisdiction evidence.'}</p></article>
        <article><span>Prescriber access</span><h3>{roleShort}</h3><p>{physicianAccess || 'Prescribing, dispensing and professional obligations remain jurisdiction-specific and evidence-gated.'}</p></article>
      </div>
    </SectionShell>
  )
}

export function ComplianceSection({ sectionRef, regulatoryTier, outlook, dataCompleteness, playbookStatus, marketAccessStatus, pathway, dashboardHref }: { sectionRef: SectionRef; regulatoryTier?: string | null; outlook?: string | null; dataCompleteness: string; playbookStatus: string; marketAccessStatus?: string | null; pathway?: string | null; dashboardHref: (changes: Record<string, string>) => string }) {
  return (
    <SectionShell id="compliance" sectionRef={sectionRef} eyebrow="Compliance" title="Regulatory and quality control" description="Import/export, licensing, quality and evidence requirements are consolidated for the active market-role combination." action={<Link className="hvm2-text-link" href={dashboardHref({ page: 'compliance' })}>Compliance workspace</Link>}>
      <div className="hvm2-compliance-grid">
        <article><span>Regulatory tier</span><strong>{formatStatus(regulatoryTier)}</strong><p>{outlook || 'Regulatory outlook requires reviewed source support.'}</p></article>
        <article><span>Quality posture</span><strong>{dataCompleteness}</strong><p>{playbookStatus}</p></article>
        <article><span>Access pathway</span><strong>{formatStatus(marketAccessStatus)}</strong><p>{pathway || 'Licence, permit, customs and quality gates remain jurisdiction-specific.'}</p></article>
      </div>
    </SectionShell>
  )
}

export function NetworkSection({ sectionRef, professionalCount, providerCount, operatorCount, collaborationCount, routeHref }: { sectionRef: SectionRef; professionalCount: number; providerCount: number; operatorCount: number; collaborationCount: number; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="network" sectionRef={sectionRef} eyebrow="Network" title="Reviewed commercial network" description="Professionals, service providers, licensed operators and collaboration projects remain available through controlled Harbourview access paths." action={<Link className="hvm2-text-link" href={routeHref('/network')}>Network workspace</Link>}>
      <div className="hvm2-metric-grid">
        <Metric label="Professionals" value={professionalCount} detail="Reviewed professional records" />
        <Metric label="Service providers" value={providerCount} detail="Approved capability records" />
        <Metric label="Licensed operators" value={operatorCount} detail="Operator records in context" />
        <Metric label="Collaborations" value={collaborationCount} detail="Controlled project opportunities" />
      </div>
    </SectionShell>
  )
}

export function FinancingSection({ sectionRef, countryLabel, roleShort, routeHref }: { sectionRef: SectionRef; countryLabel: string; roleShort: string; routeHref: (path: string) => string }) {
  return (
    <SectionShell id="financing" sectionRef={sectionRef} eyebrow="Trade financing" title="Structure the commercial corridor" description={MOBILE_COMMAND_COPY.financingDescription} action={<Link className="hvm2-text-link" href={routeHref('/marketplace/financing')}>Financing intake</Link>}>
      <article className="hvm2-finance-card">
        <div><span>Active corridor</span><strong>{countryLabel} · {roleShort}</strong></div>
        <ol>
          <li><span>1</span><div><strong>Define transaction</strong><p>Product, volume, origin, destination and timing.</p></div></li>
          <li><span>2</span><div><strong>Verify pathway</strong><p>Licences, permits, quality documents and counterparty readiness.</p></div></li>
          <li><span>3</span><div><strong>Review structure</strong><p>Payment, insurance, logistics and financing requirements.</p></div></li>
        </ol>
        <Link href={routeHref('/marketplace/financing')}>Start controlled financing review</Link>
      </article>
    </SectionShell>
  )
}
