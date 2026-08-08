import Link from 'next/link'
import type { MobileCommandCentreProps } from '../props'
import { readString, type NextAction, type NormalizedListing, type SectionId } from '../contracts'
import { EmptyState, SectionShell, StatusPill, type SectionRef } from '../SectionUI'

type Signal = MobileCommandCentreProps['signals'][number]
type EducationTile = MobileCommandCentreProps['eduCategories'][number] | NonNullable<MobileCommandCentreProps['liveTiles']>[number]

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

export function WeeklySignalsSection({ sectionRef, signals }: { sectionRef: SectionRef; signals: Signal[] }) {
  return (
    <SectionShell id="weekly-signals" sectionRef={sectionRef} eyebrow="Intel / material changes" title="Intelligence requiring a decision" description="Scan what changed and why it matters. Open any item for evidence, unknowns and a reasoned decision posture.">
      {signals.length > 0 ? (
        <div className="hvm2-record-stack" aria-label="Decision intelligence events">
          {signals.map(signal => {
            const whyItMatters = signal.analysis?.what_changed || signal.commercialImpact
            const recommendation = signal.analysis?.recommended_action ? 'Investigate' : 'Monitor'
            return (
              <Link
                className="hvm2-signal-card hvm2-intel-event-row"
                key={signal.id}
                href={`/dashboard/intel/events/${encodeURIComponent(`event:${signal.id}`)}`}
                aria-label={`Open intelligence dossier: ${signal.title}`}
              >
                <article>
                  <div className="hvm2-card-topline">
                    <StatusPill>{recommendation}</StatusPill>
                    <span>{signal.market || signal.type}</span>
                  </div>
                  <h3>{signal.title}</h3>
                  <p>{whyItMatters}</p>
                  <div className="hvm2-signal-footer">
                    <span>{signal.corroborationCount && signal.corroborationCount > 1 ? `${signal.corroborationCount} sources` : `${signal.confidence}% upstream confidence`}</span>
                    <span>{signal.timeAgo}</span>
                    <strong>Open dossier →</strong>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      ) : <EmptyState title="No reviewed intelligence events loaded" detail="The intelligence surface is live but no current reviewed events matched this context." />}
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
  const totalResults = signalResults.length + listingResults.length
  return (
    <SectionShell id="search" sectionRef={sectionRef} eyebrow="Cross-command search" title="Search intelligence and marketplace records" description="Search operates across every signal and marketplace record already loaded into this authenticated command session.">
      <label className="hvm2-search-field hvm2-search-field-large">
        <span aria-hidden="true">⌕</span>
        <input value={searchQuery} onChange={event => onQueryChange(event.target.value)} aria-label={label} placeholder={label} />
      </label>
      <div className="hvm2-search-summary" role="status" aria-live="polite" aria-atomic="true">
        <span>{totalResults} total results</span>
        <span>{signalResults.length} signals</span>
        <span>{listingResults.length} marketplace records</span>
      </div>
      {searchQuery.trim() && (
        <div className="hvm2-search-results">
          {totalResults > 0 && (
            <ul aria-label="Command search results">
              {signalResults.map(signal => (
                <li key={`signal-${signal.id}`}>
                  <button type="button" onClick={onSignalSelect}><span>Signal</span><strong>{signal.title}</strong><small>{signal.market}</small></button>
                </li>
              ))}
              {listingResults.map(row => (
                <li key={`listing-${row.view}-${row.id}`}>
                  <button type="button" onClick={() => onListingSelect(row)}><span>Marketplace</span><strong>{row.title}</strong><small>{row.category} · {row.jurisdiction}</small></button>
                </li>
              ))}
            </ul>
          )}
          {totalResults === 0 && <EmptyState title="No command records matched" detail="Try a country, product, regulatory topic or commercial category." />}
        </div>
      )}
    </SectionShell>
  )
}

export function EducationSection({
  sectionRef,
  roleShort,
  tiles,
  commandHref,
}: {
  sectionRef: SectionRef
  roleShort: string
  tiles: EducationTile[]
  commandHref: (section: SectionId, changes?: Record<string, string | null>) => string
}) {
  return (
    <SectionShell id="education" sectionRef={sectionRef} eyebrow="Context / education path" title={`${roleShort} learning path`} description="Role-relevant education is kept in the same operational context as market, access and compliance work.">
      {tiles.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {tiles.map((tile, index) => {
            const moduleSlug = readString(tile, ['slug'], 'overview')
            const title = readString(tile, ['title'], 'Education module')
            const description = readString(tile, ['desc', 'description'], 'Role-relevant education content.')
            const icon = readString(tile, ['icon'], '◇')
            return (
              <article className="hvm2-education-card" key={`${moduleSlug}-${index}`}>
                <span aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={commandHref('education', { module: moduleSlug })}>Open module</Link>
              </article>
            )
          })}
        </div>
      ) : <EmptyState title="Education path pending" detail="No published modules matched the active role yet." />}
    </SectionShell>
  )
}

type WatchlistItem = NonNullable<MobileCommandCentreProps['watchlistData']>['items'][number]
type LocalIntel = NonNullable<MobileCommandCentreProps['localIntel']>

/**
 * Regulatory watch. Reads the org's tracked watchlist items plus the
 * jurisdiction's regulatory posture. Both were previously reachable on mobile
 * only by following a module-rail link out to the desktop page.
 */
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
      description="Items this organization is tracking, and the regulatory posture of the active jurisdiction."
      action={<Link href={commandHref('jurisdiction')}>Open jurisdiction context</Link>}
    >
      <div className="hvm2-metric-grid">
        <article><span>Tracked items</span><strong>{items.length}</strong><p>Under active watch</p></article>
        <article><span>Watch rules</span><strong>{activeRules}</strong><p>Active keyword rules</p></article>
        <article><span>Source coverage</span><strong>{sourceCoverageCount}</strong><p>Registered sources</p></article>
      </div>

      {regulatoryTier || outlook ? (
        <article className="hvm2-note">
          {regulatoryTier ? <StatusPill>{regulatoryTier}</StatusPill> : null}
          {outlook ? <p>{outlook}</p> : null}
        </article>
      ) : null}

      {items.length > 0 ? (
        <div className="hvm2-record-stack">
          {items.slice(0, 8).map(item => (
            <article key={item.id}>
              <span>{item.jurisdiction ?? 'Global'} · {item.item_type}</span>
              <strong>{item.title}</strong>
              <p>{item.latest_change_note ?? item.subtitle ?? item.next_action ?? 'No change recorded since this item was added to the watch.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing on the watch list yet"
          detail="Regulatory items added to the watch appear here with their latest recorded change. Add one from the desktop watchlist to start tracking."
        />
      )}
    </SectionShell>
  )
}

/**
 * Local intelligence: the sub-national picture for the active jurisdiction --
 * who regulates, which subdivisions differ, and what is still unanswered.
 */
export function LocalIntelSection({
  sectionRef, localIntel, countryLabel,
}: {
  sectionRef: SectionRef
  localIntel: LocalIntel | null
  countryLabel: string
}) {
  const coverage = localIntel?.coverageStatus
  return (
    <SectionShell
      id="local-intel"
      sectionRef={sectionRef}
      eyebrow="Intel / local intelligence"
      title={`Sub-national picture for ${countryLabel}`}
      description="Regulating authorities, subdivision differences and open questions below national level."
    >
      {!localIntel || coverage !== 'available' ? (
        <EmptyState
          title={coverage === 'not_applicable'
            ? 'No sub-national layer for this jurisdiction'
            : 'Local research pending'}
          detail={coverage === 'not_applicable'
            ? `${countryLabel} is regulated at national level only, so there is no subdivision layer to record.`
            : `Local intelligence for ${countryLabel} has not been researched and reviewed yet. It records the regulating authorities, how subdivisions differ, and what remains unresolved.`}
        />
      ) : (
        <>
          {localIntel.authorities?.keyList?.length ? (
            <div className="hvm2-record-stack">
              {localIntel.authorities.keyList.slice(0, 6).map(a => (
                <article key={`${a.name}-${a.role}`}>
                  <span>Authority</span>
                  <strong>{a.name}</strong>
                  <p>{a.role}</p>
                </article>
              ))}
            </div>
          ) : null}

          {localIntel.municipalities.length > 0 ? (
            <div className="hvm2-record-stack">
              {localIntel.municipalities.slice(0, 8).map(m => (
                <article key={m.name}>
                  <span>{m.status} activity</span>
                  <strong>{m.name}</strong>
                  <p>{m.note ?? 'No local note recorded.'}</p>
                </article>
              ))}
            </div>
          ) : null}

          {[...localIntel.constraints, ...localIntel.routes].length > 0 ? (
            <div className="hvm2-record-stack">
              {[...localIntel.constraints, ...localIntel.routes].slice(0, 8).map(note => (
                <article key={`${note.label}-${note.text.slice(0, 24)}`}>
                  <span>{note.label}</span>
                  <strong>{note.icon ?? '◇'} {note.label}</strong>
                  <p>{note.text}</p>
                </article>
              ))}
            </div>
          ) : null}

          {localIntel.openQuestions.length > 0 ? (
            <article className="hvm2-note">
              <StatusPill>Open questions</StatusPill>
              <ul>{localIntel.openQuestions.slice(0, 6).map(q => <li key={q}>{q}</li>)}</ul>
            </article>
          ) : null}
        </>
      )}
    </SectionShell>
  )
}
