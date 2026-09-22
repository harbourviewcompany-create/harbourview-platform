'use client'

import type { MobileCommandCentreProps } from './props'
import { readString, type NextAction, type NormalizedListing } from './contracts'
import type { SectionRef } from './SectionUI'
import type { WatchRuleHit } from './watchRuleHits'
import { describeFreshness, formatDeltaSentence, isNewSince, type CommandDelta } from '@/lib/dashboard/commandDelta'
import './MobileCommandZeroStateDensity.css'
import './MobileCommandRemediation.css'
import './CommandOverviewDelta.css'

function signalTitle(signal: unknown) {
  return readString(signal, ['title', 'headline', 'title_en'], 'Material intelligence update')
}

function signalSummary(signal: unknown) {
  return readString(signal, ['commercialImpact', 'summary', 'summary_en', 'impact', 'analysis'], 'Open the intelligence record for reviewed context and evidence.')
}

function signalMarket(signal: unknown) {
  return readString(signal, ['market', 'country', 'jurisdiction'], '')
}

/**
 * Row metadata a reader can act on: where, when, and how well sourced.
 *
 * This replaces "Active-country match" / "Broader watch", which restated the
 * jurisdiction already shown in the header and told the reader nothing about the
 * item. Age comes from `describeFreshness`, which refuses to present an observed
 * or ingested timestamp as a publication time — see docs/COMMAND_SURFACE_SPEC.md
 * §3 and §4.3 on why that distinction matters on this corpus.
 */
function signalMeta(signal: unknown) {
  const market = signalMarket(signal)
  const age = describeFreshness(signal as { timeAgo?: string; freshnessBasis?: string })
  const source = readString(signal, ['sourceLabel'], '')
  const confidence = (signal as { confidence?: number })?.confidence

  return [
    market,
    age,
    source,
    typeof confidence === 'number' && confidence > 0 ? `${Math.round(confidence)}% confidence` : '',
  ].filter(Boolean).join(' · ')
}

function CompactZeroState({
  label,
  message,
  onOpen,
  className,
}: {
  label: string
  message: string
  onOpen: () => void
  className?: string
}) {
  return (
    <button type="button" className={['hvm-op-compact-zero', className].filter(Boolean).join(' ')} onClick={onOpen}>
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
  roleFocus,
  attentionItems,
  corridorTools = [],
  signals,
  opportunities,
  watchRuleHits = [],
  delta,
  lastViewedAt,
  operatingPicture,
  onOpenActions,
  onOpenIntel,
  onOpenOpportunities,
  onOpenContext,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleLabel: string
  roleFocus?: string
  attentionItems: NextAction[]
  corridorTools?: NextAction[]
  signals: MobileCommandCentreProps['signals']
  opportunities: NormalizedListing[]
  watchRuleHits?: WatchRuleHit[]
  delta?: CommandDelta
  lastViewedAt?: string | null
  operatingPicture?: string | null
  onOpenActions: () => void
  onOpenIntel: () => void
  onOpenOpportunities: () => void
  onOpenContext: () => void
}) {
  const signalRows = [...(signals ?? [])]
    .map((signal, index) => ({
      signal,
      index,
      isNew: isNewSince(signal as { freshnessAt?: string }, lastViewedAt),
      activeCountryMatch: signalMarket(signal).localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0,
    }))
    // What is new to this reader leads, then jurisdiction, then the feed's own order.
    .sort((a, b) =>
      Number(b.isNew) - Number(a.isNew)
      || Number(b.activeCountryMatch) - Number(a.activeCountryMatch)
      || a.index - b.index)
    .slice(0, 2)
  const opportunityRows = opportunities.slice(0, 2)
  // Show enough slots that org onboarding cannot monopolize the surface.
  const attentionRows = attentionItems.slice(0, 4)
  const deltaSentence = delta ? formatDeltaSentence(delta) : ''

  return (
    <section id="overview" ref={sectionRef} className="hvm-op-command" aria-labelledby="hvm-op-command-heading">
      <h2 id="hvm-op-command-heading" className="hvm-op-sr-only">Command operating view</h2>

      {deltaSentence ? (
        <p className={`hvm-op-delta${delta?.state === 'changed' ? ' hvm-op-delta-changed' : ''}`}>
          {deltaSentence}
        </p>
      ) : null}

      {roleFocus ? (
        <p className="hvm-op-role-focus" style={{ fontSize: 12, color: 'rgba(212,175,55,.85)', margin: '0 0 10px', lineHeight: 1.4 }}>
          Role focus · {roleFocus}
        </p>
      ) : null}

      <div className="hvm-op-pulse" aria-label={`Operating state for ${countryLabel}, ${roleLabel}`}>
        <button type="button" onClick={onOpenActions}>
          <span>Attention</span>
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

      {(signals?.length ?? 0) > 0 || opportunities.length > 0 || attentionItems.length > 0 ? (
        <p className="hvm-op-live-strip" style={{ fontSize: 12, color: 'rgba(245,240,232,.55)', margin: '0 0 12px' }}>
          {(signals?.length ?? 0) > 0 ? `${signals!.length} signal${signals!.length === 1 ? '' : 's'}` : 'No signals'}
          {' · '}
          {attentionItems.length} priority
          {' · '}
          {opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'}
          {roleLabel && roleLabel !== 'All roles' ? ` · ${roleLabel}` : ' · set a role for a sharper queue'}
        </p>
      ) : null}

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

      {watchRuleHits.length > 0 ? (
        <section className="hvm-op-group" aria-labelledby="hvm-op-watch-heading">
          <div className="hvm-op-group-heading">
            <div>
              <span className="hvm-op-eyebrow">Your watch rules</span>
              <h3 id="hvm-op-watch-heading">
                {watchRuleHits.length} {watchRuleHits.length === 1 ? 'rule matched' : 'rules matched'}
              </h3>
            </div>
            <button type="button" onClick={onOpenIntel}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {watchRuleHits.slice(0, 2).map(hit => (
              <button key={hit.signalId} type="button" className="hvm-op-row" onClick={onOpenIntel}>
                <div>
                  <span className="hvm-op-meta">
                    {[hit.market, hit.timeAgo].filter(Boolean).join(' · ')}
                  </span>
                  <strong>{hit.title}</strong>
                  <small>Matched: {hit.matchedKeywords.slice(0, 4).join(', ')}</small>
                </div>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {signalRows.length > 0 ? (
        <section className="hvm-op-group" aria-labelledby="hvm-op-changes-heading">
          <div className="hvm-op-group-heading">
            <div>
              <span className="hvm-op-eyebrow">Contextual changes</span>
              <h3 id="hvm-op-changes-heading">Recent intelligence</h3>
            </div>
            <button type="button" onClick={onOpenIntel}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {signalRows.map(({ signal, isNew }, index) => (
              <button key={readString(signal, ['id'], `signal-${index}`)} type="button" className="hvm-op-row" onClick={onOpenIntel}>
                <div>
                  <span className="hvm-op-meta">
                    {isNew ? <em className="hvm-op-new">New</em> : null}
                    {signalMeta(signal)}
                  </span>
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
        <section className="hvm-op-group hvm-op-commercial-group" aria-labelledby="hvm-op-opportunity-heading">
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
          className="hvm-op-commercial-group"
          label="Commercial opportunities"
          message="No matching opportunities currently"
          onOpen={onOpenOpportunities}
        />
      )}

      {corridorTools.length > 0 ? (
        <section className="hvm-op-tools" aria-labelledby="hvm-op-tools-heading">
          <h3 id="hvm-op-tools-heading" className="hvm-op-eyebrow">Tools</h3>
          <div className="hvm-op-tool-row">
            {corridorTools.map(tool => (
              <a key={tool.id} href={tool.href} className="hvm-op-tool">
                {tool.label}
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

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
