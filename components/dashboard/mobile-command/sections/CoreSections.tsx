'use client'

import type { MobileCommandCentreProps } from '../props'
import {
  formatMetricValue,
  formatStatus,
  readString,
  titleCase,
  type NextAction,
} from '../contracts'
import { CommandCard, EmptyState, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

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
        <CommandCard className="hvm2-command-brief">
          <span>Command brief</span>
          <h2>{countryLabel} operating picture</h2>
          <p>{publicSummary?.trim() || `${countryLabel} is loaded as the active jurisdiction for ${roleLabel}. Live marketplace, intelligence, pathway and education signals are consolidated below.`}</p>
          <div className="hvm2-brief-tags">
            <StatusPill tone="gold">{formatStatus(marketAccessStatus, 'Market access review')}</StatusPill>
            <StatusPill>{reviewStatus}</StatusPill>
          </div>
        </CommandCard>
        <CommandCard className="hvm2-priority-card">
          <span>Immediate priority</span>
          <strong>{firstAction?.label ?? 'Validate the active market context'}</strong>
          <p>{firstAction?.detail ?? 'Review the live operating picture before moving into commercial action.'}</p>
          <button type="button" onClick={onOpenActions}>Open action queue</button>
        </CommandCard>
      </div>
    </section>
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
