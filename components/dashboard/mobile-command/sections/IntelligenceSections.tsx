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
    <SectionShell id="weekly-signals" sectionRef={sectionRef} eyebrow="Context / weekly signals" title="Intelligence requiring attention" description="All signals loaded into the current dashboard feed remain visible and reviewable here.">
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
