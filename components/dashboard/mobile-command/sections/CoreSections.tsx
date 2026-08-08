'use client'

import { useRef, type KeyboardEvent, type MouseEvent } from 'react'
import type { MarketView } from '../../CommandCentre'
import type { MobileCommandCentreProps } from '../props'
import {
  MARKET_TABS,
  MOBILE_COMMAND_COPY,
  SUPPLY_TABS,
  formatMetricValue,
  formatStatus,
  readString,
  titleCase,
  type MobileCommandTool,
  type NextAction,
  type NormalizedListing,
  type SectionId,
} from '../contracts'
import { MarketplaceWorkspacePanel } from '../WorkspacePanels'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

export function OverviewSection({
  sectionRef,
  countryLabel,
  roleLabel,
  publicSummary,
  marketAccessStatus,
  reviewStatus,
  firstAction,
  onOpenActions,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleLabel: string
  publicSummary?: string | null
  marketAccessStatus?: string | null
  reviewStatus: string
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
          {/* `countries.data_completeness` used to render as a third pill here.
              It is a three-value Postgres enum (stub / seed / partial) that was
              printed raw, so Germany's brief read "Stub". The label is also
              inverted against the data it claims to describe: countries marked
              `stub` average 142 characters of written summary and all carry a
              published playbook, while 33 of the 50 marked `partial` are
              boilerplate. It described nothing a reader could act on, so it is
              no longer shown. No replacement metric is invented in its place. */}
          <div className="hvm2-brief-tags">
            <StatusPill tone="gold">{formatStatus(marketAccessStatus, 'Market access review')}</StatusPill>
            <StatusPill>{reviewStatus}</StatusPill>
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
          {/* Field names here must match what dashboardLiveData actually selects.
              They previously did not: metrics were read from `display_value` /
              `value` / `summary` and flows from `origin` / `destination` /
              `product` / `summary`, none of which exist on `market_metrics` or
              `trade_flows`. Every card therefore rendered its fallback, so six
              populated Canadian metrics all showed "Value under review" and
              sixteen distinct corridors rendered as sixteen identical
              "Reviewed trade flow" cards. */}
          {marketMetrics.map((metric, index) => (
            <article key={`metric-${readString(metric, ['id'], String(index))}`}>
              <span>{formatStatus(readString(metric, ['data_type', 'category', 'metric_type']), 'Market metric')}</span>
              <strong>{titleCase(readString(metric, ['metric_name', 'name', 'title'], 'Market indicator'))}</strong>
              <p>{formatMetricValue(
                readString(metric, ['metric_value', 'display_value', 'value']),
                readString(metric, ['metric_unit', 'unit']),
              )}</p>
            </article>
          ))}
          {tradeFlows.map((flow, index) => (
            <article key={`flow-${readString(flow, ['id'], String(index))}`}>
              <span>{readString(flow, ['origin_iso2', 'origin', 'source_country'], 'Trade')} → {readString(flow, ['destination_iso2', 'destination', 'destination_country'], 'Market')}</span>
              <strong>{titleCase(readString(flow, ['product_category', 'product', 'product_type'], 'Reviewed trade flow'))}</strong>
              <p>{[
                formatStatus(readString(flow, ['legal_status', 'status']), ''),
                readString(flow, ['flow_direction']) ? `${titleCase(readString(flow, ['flow_direction']))} flow` : '',
                readString(flow, ['permit_authority']) ? `Permit: ${readString(flow, ['permit_authority'])}` : '',
              ].filter(Boolean).join(' · ') || 'Corridor evidence under review'}</p>
            </article>
          ))}
        </div>
      ) : <EmptyState title="Market intelligence is ready for data" detail="No reviewed metrics or trade flows matched the current jurisdiction yet." />}
    </SectionShell>
  )
}

function ListingCard({ row, cta, onSelect }: { row: NormalizedListing; cta: string; onSelect: () => void }) {
  return (
    <article className="hvm2-listing-card">
      <div className="hvm2-card-topline"><StatusPill tone="gold">{row.category}</StatusPill><span>{row.jurisdiction}</span></div>
      <h3>{row.title}</h3>
      <p>{row.summary}</p>
      <div className="hvm2-card-meta">
        <span>{formatStatus(row.status)}</span>
        <span>{row.channel || MOBILE_COMMAND_COPY.listingChannel}</span>
        {row.confidence != null && <span>{row.confidence}% confidence</span>}
      </div>
      <button type="button" className="hvm2-inline-cta" onClick={onSelect}>{cta}</button>
    </article>
  )
}

export function MarketplaceSection({
  sectionRef,
  activeMarketView,
  marketQuery,
  marketRows,
  filteredRows,
  activeTool,
  selectedListing,
  onMarketViewChange,
  onMarketQueryChange,
  onOpenTool,
  onCloseTool,
  onViewSubmissions,
  commandHref,
}: {
  sectionRef: SectionRef
  activeMarketView: MarketView
  marketQuery: string
  marketRows: NormalizedListing[]
  filteredRows: NormalizedListing[]
  activeTool: MobileCommandTool | null
  selectedListing: NormalizedListing | null
  onMarketViewChange: (view: MarketView) => void
  onMarketQueryChange: (value: string) => void
  onOpenTool: (tool: MobileCommandTool, options?: { listing?: NormalizedListing; marketView?: MarketView }) => void
  onCloseTool: () => void
  onViewSubmissions: () => void
  commandHref: (section: SectionId, changes?: Record<string, string | null>) => string
}) {
  const tabRefs = useRef(new Map<MarketView, HTMLButtonElement>())
  const searchLabel = `Search ${MARKET_TABS.find(tab => tab.id === activeMarketView)?.label.toLowerCase() ?? 'marketplace'}`
  const supplyView = activeMarketView === 'wanted' ? 'cannabis' : activeMarketView

  function selectAndFocus(view: MarketView) {
    onMarketViewChange(view)
    window.requestAnimationFrame(() => tabRefs.current.get(view)?.focus())
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentView: MarketView) {
    const currentIndex = MARKET_TABS.findIndex(tab => tab.id === currentView)
    if (currentIndex < 0) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % MARKET_TABS.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + MARKET_TABS.length) % MARKET_TABS.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = MARKET_TABS.length - 1
    if (nextIndex == null) return

    event.preventDefault()
    selectAndFocus(MARKET_TABS[nextIndex].id)
  }

  function keepInCommand(
    event: MouseEvent<HTMLAnchorElement>,
    tool: MobileCommandTool,
    options?: { listing?: NormalizedListing; marketView?: MarketView },
  ) {
    event.preventDefault()
    onOpenTool(tool, options)
  }

  return (
    <SectionShell id="marketplace" sectionRef={sectionRef} eyebrow="Marketplace control" title="Demand, supply and commercial routes" description={MOBILE_COMMAND_COPY.marketplaceDescription} className="hvm2-market-section">
      <div className="hvm2-quick-actions">
        <a href={commandHref('marketplace', { tool: 'wanted-intake', marketView: 'wanted' })} onClick={event => keepInCommand(event, 'wanted-intake', { marketView: 'wanted' })}><span>＋</span><strong>Post wanted demand</strong><small>Buyer-led requirement</small></a>
        <a href={commandHref('marketplace', { tool: 'supply-intake', marketView: supplyView })} onClick={event => keepInCommand(event, 'supply-intake', { marketView: supplyView })}><span>↗</span><strong>Submit supply</strong><small>Controlled review intake</small></a>
        <a href={commandHref('financing', { tool: 'financing-intake', marketView: activeMarketView })} onClick={event => keepInCommand(event, 'financing-intake')}><span>¤</span><strong>Request financing</strong><small>Trade structure review</small></a>
      </div>

      <MarketplaceWorkspacePanel
        tool={activeTool}
        selectedListing={selectedListing}
        activeMarketView={activeMarketView}
        onClose={onCloseTool}
        onViewSubmissions={onViewSubmissions}
      />

      <div className="hvm2-market-controls">
        <div className="hvm2-tab-rail" role="tablist" aria-label="Marketplace categories">
          {MARKET_TABS.map(tab => {
            const count = marketRows.filter(row => row.view === tab.id).length
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  if (node) tabRefs.current.set(tab.id, node)
                  else tabRefs.current.delete(tab.id)
                }}
                type="button"
                role="tab"
                id={`hvm2-tab-${tab.id}`}
                aria-controls="hvm2-market-panel"
                aria-selected={activeMarketView === tab.id}
                aria-label={`${tab.label}, ${count} records`}
                tabIndex={activeMarketView === tab.id ? 0 : -1}
                className={activeMarketView === tab.id ? 'active' : ''}
                onClick={() => onMarketViewChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                {tab.label}<span aria-hidden="true">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="hvm2-search-field">
          <span aria-hidden="true">⌕</span>
          <input value={marketQuery} onChange={event => onMarketQueryChange(event.target.value)} aria-label={searchLabel} placeholder={searchLabel} />
        </label>
      </div>
      <div id="hvm2-market-panel" role="tabpanel" aria-labelledby={`hvm2-tab-${activeMarketView}`} tabIndex={0}>
        {filteredRows.length > 0 ? (
          <div className="hvm2-listing-grid">
            {filteredRows.map(row => <ListingCard key={`${row.view}-${row.id}`} row={row} onSelect={() => onOpenTool('introduction', { listing: row })} cta={MOBILE_COMMAND_COPY.reviewedIntroduction} />)}
          </div>
        ) : <EmptyState title="No records match this view" detail={MOBILE_COMMAND_COPY.marketplaceEmptyDetail} />}
      </div>
    </SectionShell>
  )
}

export function SupplySection({
  sectionRef,
  supplyRows,
  onOpenTool,
}: {
  sectionRef: SectionRef
  supplyRows: NormalizedListing[]
  onOpenTool: (tool: MobileCommandTool, options?: { listing?: NormalizedListing; marketView?: MarketView }) => void
}) {
  return (
    <SectionShell
      id="supply"
      sectionRef={sectionRef}
      eyebrow="Supply"
      title="Products, consumables, equipment and services"
      description={MOBILE_COMMAND_COPY.supplyDescription}
      action={<button type="button" className="hvm2-text-link" onClick={() => onOpenTool('supply-intake', { marketView: 'cannabis' })}>Submit supply</button>}
    >
      <div className="hvm2-metric-grid">
        {SUPPLY_TABS.map(tab => <Metric key={tab.id} label={tab.label} value={supplyRows.filter(row => row.view === tab.id).length} detail="Approved loaded records" />)}
      </div>
      {supplyRows.length > 0 ? (
        <div className="hvm2-horizontal-deck hvm2-deck-spaced">
          {supplyRows.map(row => <ListingCard key={`supply-${row.view}-${row.id}`} row={row} onSelect={() => onOpenTool('introduction', { listing: row })} cta={MOBILE_COMMAND_COPY.supplyReview} />)}
        </div>
      ) : <EmptyState title="No reviewed supply records loaded" detail={MOBILE_COMMAND_COPY.supplyEmptyDetail} />}
    </SectionShell>
  )
}
