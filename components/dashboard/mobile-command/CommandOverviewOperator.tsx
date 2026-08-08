'use client'

import type { MobileCommandCentreProps } from './props'
import { readString, type NextAction, type NormalizedListing } from './contracts'
import type { SectionRef } from './SectionUI'
import './MobileCommandZeroStateDensity.css'

function signalTitle(signal: unknown) {
  return readString(signal, ['title', 'headline', 'title_en'], 'Material intelligence update')
}

function signalSummary(signal: unknown) {
  return readString(signal, ['commercialImpact', 'summary', 'summary_en', 'impact', 'analysis'], 'Open the intelligence record for reviewed context and evidence.')
}

function signalMeta(signal: unknown) {
  return [
    readString(signal, ['market', 'country', 'jurisdiction'], ''),
    readString(signal, ['type', 'cat', 'content_type'], ''),
  ].filter(Boolean).join(' · ')
}

function CompactZeroState({
  label,
  message,
  onOpen,
}: {
  label: string
  message: string
  onOpen: () => void
}) {
  return (
    <button type="button" className="hvm-op-compact-zero" onClick={onOpen}>
      <div>
        <span className="hvm-op-compact-zero-label">{label}</span>
        <strong>{message}</strong>
      </div>
      <span className="hvm-op-compact-zero-count" aria-hidden="true">0</span>
      <span className="hvm-op-compact-zero-arrow" aria-hidden="true">→</span>
    </button>
  )
}

export default function CommandOverviewOperator({
  sectionRef,
  countryLabel,
  roleLabel,
  attentionItems,
  signals,
  opportunities,
  operatingPicture,
  onOpenActions,
  onOpenIntel,
  onOpenOpportunities,
  onOpenContext,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleLabel: string
  attentionItems: NextAction[]
  signals: MobileCommandCentreProps['signals']
  opportunities: NormalizedListing[]
  operatingPicture?: string | null
  onOpenActions: () => void
  onOpenIntel: () => void
  onOpenOpportunities: () => void
  onOpenContext: () => void
}) {
  const signalRows = (signals ?? []).slice(0, 2)
  const opportunityRows = opportunities.slice(0, 2)
  const attentionRows = attentionItems.slice(0, 2)

  return (
    <section id="overview" ref={sectionRef} className="hvm-op-command" aria-labelledby="hvm-op-command-heading">
      <h2 id="hvm-op-command-heading" className="hvm-op-sr-only">Command operating view</h2>

      <div className="hvm-op-pulse" aria-label="Current command pulse">
        <button type="button" onClick={onOpenActions}>
          <span>Requires attention</span>
          <strong>{attentionItems.length}</strong>
        </button>
        <button type="button" onClick={onOpenIntel}>
          <span>Recent intelligence</span>
          <strong>{signals?.length ?? 0}</strong>
        </button>
        <button type="button" onClick={onOpenOpportunities}>
          <span>Opportunities</span>
          <strong>{opportunities.length}</strong>
        </button>
      </div>

      <section className="hvm-op-group" aria-labelledby="hvm-op-attention-heading">
        <div className="hvm-op-group-heading">
          <div>
            <span className="hvm-op-eyebrow">Priority</span>
            <h3 id="hvm-op-attention-heading">Requires attention</h3>
          </div>
          <button type="button" onClick={onOpenActions}>View all</button>
        </div>

        {attentionRows.length > 0 ? (
          <div className="hvm-op-row-list">
            {attentionRows.map(item => (
              <a key={item.id} href={item.href} className="hvm-op-row hvm-op-attention-row">
                <div>
                  <span className={`hvm-op-status hvm-op-status-${item.tone}`}>{item.tone === 'warn' ? 'Review' : 'Priority'}</span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </div>
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="hvm-op-empty">
            <strong>Nothing requires action</strong>
            <span>No outstanding reviews, approvals or exceptions are loaded in this context.</span>
          </div>
        )}
      </section>

      {signalRows.length > 0 ? (
        <section className="hvm-op-group" aria-labelledby="hvm-op-changes-heading">
          <div className="hvm-op-group-heading">
            <div>
              <span className="hvm-op-eyebrow">Latest</span>
              <h3 id="hvm-op-changes-heading">Recent intelligence</h3>
            </div>
            <button type="button" onClick={onOpenIntel}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {signalRows.map((signal, index) => (
              <button key={readString(signal, ['id'], `signal-${index}`)} type="button" className="hvm-op-row" onClick={onOpenIntel}>
                <div>
                  {signalMeta(signal) && <span className="hvm-op-meta">{signalMeta(signal)}</span>}
                  <strong>{signalTitle(signal)}</strong>
                  <small>{signalSummary(signal)}</small>
                </div>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <CompactZeroState
          label="Recent intelligence"
          message="No material updates in this context"
          onOpen={onOpenIntel}
        />
      )}

      {opportunityRows.length > 0 ? (
        <section className="hvm-op-group" aria-labelledby="hvm-op-opportunity-heading">
          <div className="hvm-op-group-heading">
            <div>
              <span className="hvm-op-eyebrow">Commercial</span>
              <h3 id="hvm-op-opportunity-heading">Commercial opportunity</h3>
            </div>
            <button type="button" onClick={onOpenOpportunities}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {opportunityRows.map(row => (
              <button key={`${row.view}-${row.id}`} type="button" className="hvm-op-row hvm-op-opportunity-row" onClick={onOpenOpportunities}>
                <div>
                  <span className="hvm-op-meta">{[row.jurisdiction, row.category].filter(Boolean).join(' · ')}</span>
                  <strong>{row.title}</strong>
                  <small>{row.summary}</small>
                </div>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <CompactZeroState
          label="Commercial opportunities"
          message="No matching opportunities currently"
          onOpen={onOpenOpportunities}
        />
      )}

      <section className="hvm-op-operating-picture" aria-labelledby="hvm-op-picture-heading">
        <div className="hvm-op-group-heading">
          <div>
            <span className="hvm-op-eyebrow">Operating picture</span>
            <h3 id="hvm-op-picture-heading">{countryLabel}</h3>
          </div>
          <span className="hvm-op-context-meta">{roleLabel}</span>
        </div>
        <p>{operatingPicture?.trim() || `${countryLabel} is the active operating context. Reviewed market, intelligence and pathway information will appear as coverage is loaded.`}</p>
        <button type="button" className="hvm-op-read-more" onClick={onOpenContext}>Read operating picture →</button>
      </section>
    </section>
  )
}
