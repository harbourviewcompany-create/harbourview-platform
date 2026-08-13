'use client'

import type { MobileCommandCentreProps } from './props'
import { readString, type NextAction, type NormalizedListing } from './contracts'
import type { CommandCentreDataState } from '@/lib/dashboard/commandCentreDataTypes'
import type { SectionRef } from './SectionUI'
import './MobileCommandZeroStateDensity.css'
import './MobileCommandRemediation.css'

function signalTitle(signal: unknown) {
  return readString(signal, ['title', 'headline', 'title_en'], 'Material intelligence update')
}

function signalSummary(signal: unknown) {
  return readString(signal, ['commercialImpact', 'summary', 'summary_en', 'impact', 'analysis'], 'Open the intelligence record for reviewed context and evidence.')
}

function signalMarket(signal: unknown) {
  return readString(signal, ['market', 'country', 'jurisdiction'], '')
}

function signalMeta(signal: unknown, countryLabel: string) {
  const market = signalMarket(signal)
  const type = readString(signal, ['type', 'cat', 'content_type'], '')
  const activeCountryMatch = market.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0
  return [market, type, activeCountryMatch ? 'Active-country match' : 'Broader watch'].filter(Boolean).join(' · ')
}

function CompactZeroState({
  label,
  message,
  detail,
  state,
  onOpen,
  className,
}: {
  label: string
  message: string
  detail: string
  state: 'empty' | 'no-match'
  onOpen: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={['hvm-op-compact-zero', className].filter(Boolean).join(' ')}
      data-command-zero-state={state}
      aria-label={`${label}: ${message}. ${detail}`}
      onClick={onOpen}
    >
      <div>
        <span className="hvm-op-compact-zero-label">{label}</span>
        <strong>{message}</strong>
        <small>{detail}</small>
      </div>
      <span className="hvm-op-compact-zero-count" aria-hidden="true">0</span>
      <span className="hvm-op-compact-zero-arrow" aria-hidden="true">→</span>
    </button>
  )
}

function loadedDate(value: string | null | undefined) {
  if (!value) return null
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? null
}

export function CommandDataNotice({
  state,
  loadedAt,
  onRetry,
}: {
  state: CommandCentreDataState
  loadedAt?: string | null
  onRetry: () => void
}) {
  if (state === 'live') return null

  const copy: Record<Exclude<CommandCentreDataState, 'live'>, { title: string; detail: string }> = {
    partial: {
      title: 'Some Command data is degraded',
      detail: 'Verified records that loaded are still shown. Check the affected destination before making a decision.',
    },
    fallback: {
      title: 'Showing controlled fallback data',
      detail: 'A live source is unavailable. Treat counts as provisional until the source is available again.',
    },
    empty: {
      title: 'No records match this context yet',
      detail: 'The Command surface is available, but the selected jurisdiction and role have no loaded records.',
    },
    stale: {
      title: 'Some Command data may be stale',
      detail: 'Review timestamps and evidence before treating a change as current.',
    },
    error: {
      title: 'Command data is temporarily unavailable',
      detail: 'Retry the request. Existing submitted information is not changed by a refresh.',
    },
  }
  const message = copy[state]
  const date = loadedDate(loadedAt)

  return (
    <aside
      className={`hvm-op-data-notice hvm-op-data-notice-${state}`}
      data-command-data-state={state}
      role={state === 'error' ? 'alert' : 'status'}
      aria-live={state === 'error' ? 'assertive' : 'polite'}
    >
      <div>
        <strong>{message.title}</strong>
        <span>{message.detail}{date ? ` Last loaded ${date}.` : ''}</span>
      </div>
      {state === 'error' ? <button type="button" onClick={onRetry}>Retry</button> : null}
    </aside>
  )
}

export default function CommandOverviewOperator({
  sectionRef,
  countryLabel,
  roleLabel,
  attentionItems,
  signals,
  opportunities,
  marketRecordCount,
  operatingPicture,
  commandDataState,
  hasOrg,
  organizationHref,
  onOpenActions,
  onOpenIntel,
  onOpenOpportunities,
  onOpenOpportunity,
  onOpenContext,
}: {
  sectionRef: SectionRef
  countryLabel: string
  roleLabel: string
  attentionItems: NextAction[]
  signals: MobileCommandCentreProps['signals']
  opportunities: NormalizedListing[]
  marketRecordCount: number
  operatingPicture?: string | null
  commandDataState: CommandCentreDataState
  hasOrg: boolean
  organizationHref: string
  onOpenActions: () => void
  onOpenIntel: () => void
  onOpenOpportunities: () => void
  onOpenOpportunity: (row: NormalizedListing) => void
  onOpenContext: () => void
}) {
  const signalRows = [...(signals ?? [])]
    .map((signal, index) => ({
      signal,
      index,
      activeCountryMatch: signalMarket(signal).localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0,
    }))
    .sort((a, b) => Number(b.activeCountryMatch) - Number(a.activeCountryMatch) || a.index - b.index)
    .slice(0, 2)
    .map(item => item.signal)
  const opportunityRows = opportunities.slice(0, 2)
  const attentionRows = attentionItems.slice(0, 2)

  return (
    <section id="overview" ref={sectionRef} className="hvm-op-command" aria-labelledby="hvm-op-command-heading">
      <h2 id="hvm-op-command-heading" className="hvm-op-sr-only">Command operating view</h2>

      {!hasOrg && commandDataState === 'live' ? (
        <aside className="hvm-op-data-notice hvm-op-data-notice-permission" data-command-data-state="permission" role="status" aria-live="polite">
          <div>
            <strong>Organization access is not connected</strong>
            <span>Private submissions, evidence and reviewed introductions stay unavailable until an organization profile is connected.</span>
          </div>
          <a href={organizationHref}>Connect</a>
        </aside>
      ) : null}

      <div className="hvm-op-pulse" aria-label={`Operating state for ${countryLabel}, ${roleLabel}`}>
        <button type="button" data-command-action="open-actions" aria-label={`Open ${attentionItems.length} items requiring attention`} onClick={onOpenActions}>
          <span>Attention</span>
          <strong>{attentionItems.length}</strong>
        </button>
        <button type="button" data-command-action="open-intel" aria-label={`Open ${signals?.length ?? 0} recent intelligence records`} onClick={onOpenIntel}>
          <span>Recent intelligence</span>
          <strong>{signals?.length ?? 0}</strong>
        </button>
        <button type="button" data-command-action="open-opportunities" aria-label={`Open ${opportunities.length} commercial opportunities`} onClick={onOpenOpportunities}>
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
          <button type="button" data-command-action="view-all-actions" onClick={onOpenActions}>View all</button>
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
              <span className="hvm-op-eyebrow">Contextual changes</span>
              <h3 id="hvm-op-changes-heading">Recent intelligence</h3>
            </div>
            <button type="button" data-command-action="view-all-intel" onClick={onOpenIntel}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {signalRows.map((signal, index) => (
              <button key={readString(signal, ['id'], `signal-${index}`)} type="button" className="hvm-op-row" aria-label={`Open intelligence feed: ${signalTitle(signal)}`} onClick={onOpenIntel}>
                <div>
                  <span className="hvm-op-meta">{signalMeta(signal, countryLabel)}</span>
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
          detail="No reviewed signal record is loaded for this jurisdiction and role."
          state="empty"
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
            <button type="button" data-command-action="view-all-opportunities" onClick={onOpenOpportunities}>View all</button>
          </div>
          <div className="hvm-op-row-list">
            {opportunityRows.map(row => (
              <button key={`${row.view}-${row.id}`} type="button" className="hvm-op-row hvm-op-opportunity-row" aria-label={`Request a reviewed introduction for ${row.title}`} onClick={() => onOpenOpportunity(row)}>
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
          message={marketRecordCount > 0 ? 'No matching opportunities currently' : 'No opportunities are available yet'}
          detail={marketRecordCount > 0 ? `No opportunity record matches the ${countryLabel} context.` : 'The opportunities feed is empty for this context.'}
          state={marketRecordCount > 0 ? 'no-match' : 'empty'}
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
