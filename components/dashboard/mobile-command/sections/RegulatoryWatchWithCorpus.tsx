'use client'

import Link from 'next/link'
import type { MobileCommandCentreProps } from '../props'
import { readString, type SectionId } from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'
import { CorpusWatchPanel } from '../CorpusWatchPanel'

type WatchlistItem = NonNullable<MobileCommandCentreProps['watchlistData']>['items'][number]

/** Regulatory Watch with corpus-level keyword hits + jurisdiction readiness. */
export function RegulatoryWatchSection({
  sectionRef, items, activeRules, regulatoryTier, outlook, sourceCoverageCount, commandHref,
}: {
  sectionRef: SectionRef
  items: WatchlistItem[]
  activeRules: number
  regulatoryTier?: string | null
  outlook?: string | null
  sourceCoverageCount: number
  commandHref: (section: SectionId) => string
}) {
  return (
    <SectionShell
      id="regulatory"
      sectionRef={sectionRef}
      eyebrow="Intel / regulatory watch"
      title="Regulatory change under watch"
      description="Tracked regulatory objects, active watch rules, corpus matches beyond this session, and jurisdiction registry readiness."
      action={<Link className="hvm2-text-link" href={commandHref('jurisdiction')}>Open jurisdiction context</Link>}
    >
      <div className="hvm2-metric-grid hvm2-regulatory-metrics">
        <Metric label="Tracked items" value={items.length} detail="Under active watch" />
        <Metric label="Watch rules" value={activeRules} detail="Active keyword rules" />
        <Metric label="Source coverage" value={sourceCoverageCount} detail="Registered jurisdiction sources" />
      </div>

      {regulatoryTier || outlook ? (
        <article className="hvm2-note hvm2-regulatory-posture">
          {regulatoryTier ? <StatusPill>{regulatoryTier}</StatusPill> : null}
          {outlook ? <p>{outlook}</p> : null}
        </article>
      ) : null}

      <CorpusWatchPanel />

      {items.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label={`All ${items.length} tracked regulatory items`}>
          {items.map(item => {
            const source = readString(item, ['source_name', 'source_label'], '')
            const date = readString(item, ['updated_at', 'last_changed_at', 'published_at'], '')
            const status = readString(item, ['status', 'watch_status'], '')
            const nextAction = readString(item, ['next_action'], '')
            return (
              <article key={readString(item, ['id'], `${readString(item, ['jurisdiction'], 'global')}-${readString(item, ['title'], 'watch')}`)} className="hvm2-intel-record-card">
                <div className="hvm2-intel-meta-row">
                  <span>{readString(item, ['jurisdiction'], 'Global')}</span>
                  <span>{readString(item, ['item_type'], 'Regulatory watch')}</span>
                  {status ? <span>{status}</span> : null}
                </div>
                <strong>{readString(item, ['title'], 'Untitled regulatory watch item')}</strong>
                <p>{readString(item, ['latest_change_note', 'subtitle'], 'No latest-change note is recorded for this watch item.')}</p>
                {(source || date) ? <small>{[source && `Source ${source}`, date].filter(Boolean).join(' · ')}</small> : <small>Evidence metadata Unknown</small>}
                {nextAction ? <div className="hvm2-intel-action"><span>Next action</span><p>{nextAction}</p></div> : null}
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState title="Nothing on the watch list yet" detail="Regulatory items added to the watch appear here with their latest recorded change." />
      )}
    </SectionShell>
  )
}
