import Link from 'next/link'
import type { MobileCommandCentreProps } from '../props'
import type { NextAction, NormalizedListing } from '../contracts'
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
            const record = tile as unknown as Record<string, unknown>
            const module = typeof record.slug === 'string' && record.slug ? record.slug : 'overview'
            const title = typeof record.title === 'string' && record.title ? record.title : 'Education module'
            const description = typeof record.desc === 'string' && record.desc
              ? record.desc
              : typeof record.description === 'string' && record.description
                ? record.description
                : 'Role-relevant education content.'
            const icon = typeof record.icon === 'string' && record.icon ? record.icon : '◇'
            return (
              <article className="hvm2-education-card" key={`${module}-${index}`}>
                <span aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={dashboardHref({ page: 'education', module })}>Open module</Link>
              </article>
            )
          })}
        </div>
      ) : <EmptyState title="Education path pending" detail="No published modules matched the active role yet." />}
    </SectionShell>
  )
}
