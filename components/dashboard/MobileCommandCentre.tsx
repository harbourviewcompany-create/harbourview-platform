'use client'

import React, { useMemo, useState } from 'react'
import type { CountryIntelProfile, PipelineCounts, WantedListing, PathwayData, WatchlistData, LocalIntelData, SourceCoverageRow, EvidenceData, LiveEduTile, RecentEduModule } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'

type CommandPage = 'briefing' | 'access-pathway' | 'marketplace' | 'evidence' | 'education'

type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?: PipelineCounts
  wantedListings?: WantedListing[]
  countryIntel?: CountryIntelProfile | null
  localIntel?:      LocalIntelData | null
  pathwayData?:  PathwayData | null
  watchlistData?: WatchlistData | null
  evidenceData?:     EvidenceData
  liveTiles?:        LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  sourceCoverage?:   SourceCoverageRow[]
}

type CountryOption = { iso2: string; label: string }

type SelectOption = { value: string; label: string }

type MobileMarketCard = {
  id: string
  title: string
  description: string
  category: string
  jurisdiction: string
  status: string
  action: string
}

const COUNTRIES: CountryOption[] = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

const MOBILE_NAV: { id: CommandPage; label: string; icon: string }[] = [
  { id: 'briefing', label: 'Briefing', icon: '◎' },
  { id: 'access-pathway', label: 'Pathway', icon: '⬡' },
  { id: 'marketplace', label: 'Market', icon: '⊞' },
  { id: 'evidence', label: 'Evidence', icon: '⊟' },
  { id: 'education', label: 'Education', icon: '⬛' },
]

const MARKET_TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis', label: 'Listings' },
  { id: 'wanted', label: 'Wanted' },
  { id: 'opportunities', label: 'Buyer Routes' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'services', label: 'Services' },
  { id: 'new-products', label: 'New Products' },
]

const PENDING_REVIEW = 'Pending verified source review'

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w/g, char => char.toUpperCase())
}

function fieldValue(value: string | number | null | undefined, fallback = PENDING_REVIEW): string {
  if (typeof value === 'number') return String(value)
  return value && value.trim() ? value.trim() : fallback
}

function roleDisplay(roleId: string): string {
  if (!roleId) return 'All Roles'
  return ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES]?.short
    ?? ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES]?.label
    ?? titleCase(roleId)
}

function normalizeMarketRow(row: MarketRow, index: number, country: CountryOption): MobileMarketCard {
  const looksLikeTypedRow = ['supply', 'equip', 'service'].includes(String(row[0]))
  if (looksLikeTypedRow) {
    return {
      id: `${row[2] || row[7] || index}`,
      title: fieldValue(row[2], 'Marketplace opportunity'),
      description: fieldValue(row[3], 'Public listing details are available through Harbourview-mediated access.'),
      category: fieldValue(row[1], 'Marketplace'),
      jurisdiction: country.label,
      status: fieldValue(row[7], 'Listed'),
      action: fieldValue(row[6], 'Request mediated access'),
    }
  }

  return {
    id: `${row[7] || row[0] || index}`,
    title: fieldValue(row[0], 'Marketplace opportunity'),
    description: fieldValue(row[1], 'Public listing details are available through Harbourview-mediated access.'),
    category: fieldValue(row[3], 'Marketplace'),
    jurisdiction: fieldValue(row[2], country.label),
    status: fieldValue(row[4], 'Pending review'),
    action: fieldValue(row[5], 'Request mediated access'),
  }
}

function SectionCard({ label, title, detail, tone = 'neutral' }: { label: string; title: string; detail: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  return (
    <div className={`hvm-card hvm-card-${tone}`}>
      <div className="hvm-kicker">{label}</div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}

function MobileAccordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="hvm-accordion" open={defaultOpen}>
      <summary>{title}<span>⌄</span></summary>
      <div className="hvm-accordion-body">{children}</div>
    </details>
  )
}

function BriefingMobile({ country, roleLabel, countryIntel, signals }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; signals: DashboardSignal[] }) {
  const summary = fieldValue(
    countryIntel?.public_summary,
    `${country.label} dashboard context is available for ${roleLabel}. Field-level source review is shown where verified data has not been loaded.`,
  )
  const updatedLabel = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card">
        <div className="hvm-country-row">
          <span className="hvm-country-mark">🌐</span>
          <div>
            <h2>{country.label}</h2>
            <p>{roleLabel}</p>
          </div>
        </div>
        <blockquote>{summary}</blockquote>
      </section>

      <div className="hvm-status-grid">
        <SectionCard label="Program status" title={fieldValue(countryIntel?.medical_status, 'Medical access review')} detail="Country medical-program status as approved for public dashboard display." tone="ok" />
        <SectionCard label="Market access" title={fieldValue(countryIntel?.market_access_status)} detail="Commercial access posture for the selected jurisdiction and role." />
        <SectionCard label="Import status" title={fieldValue(countryIntel?.import_status)} detail="Importer route visibility remains review-gated where source evidence is incomplete." />
        <SectionCard label="Export status" title={fieldValue(countryIntel?.export_status)} detail="Export posture is presented as public summary only; private evidence stays outside the mobile DTO." />
      </div>

      <MobileAccordion title="Source, verification, update and coverage" defaultOpen>
        <div className="hvm-meta-grid">
          <SectionCard label="Data sources" title="Government, regulatory, market and reviewed industry sources" detail="No raw provenance or admin evidence is exposed in the public mobile shell." />
          <SectionCard label="Verification" title={fieldValue(countryIntel?.review_status, 'Review gated')} detail="Public summaries are separated from private source evidence and internal notes." />
          <SectionCard label="Update cadence" title="Regulatory and marketplace review queue" detail={`Dashboard rendered ${updatedLabel}. Live source cadence depends on configured watchers and review state.`} />
          <SectionCard label="Coverage" title={fieldValue(countryIntel?.data_completeness, 'Coverage review pending')} detail="Coverage reflects loaded country data and reviewed public fields only." />
        </div>
      </MobileAccordion>

      {signals.length > 0 && (
        <MobileAccordion title="Recent signals">
          <div className="hvm-list-stack">
            {signals.slice(0, 4).map((signal, index) => (
              <div className="hvm-signal-card" key={`${signal.title}-${index}`}>
                <strong>{signal.flag} {signal.title}</strong>
                <small>{signal.market} · {signal.sourceLabel} · {signal.timeAgo} · {signal.confidence}% confidence</small>
                <p className="hvm-signal-impact">{signal.commercialImpact}</p>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}
    </div>
  )
}

function AccessPathwayMobile({ country, roleLabel, countryIntel, pathwayData }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; pathwayData?: PathwayData | null }) {
  const pathwaySummary = fieldValue(countryIntel?.commercial_pathway_summary, 'Pathway evidence is under Harbourview review for this country-role context.')
  const reviewState = fieldValue(countryIntel?.review_status, 'Review gated')
  const steps = pathwayData?.steps ?? []
  const requirements = pathwayData?.requirements ?? []
  const statuses = pathwayData?.requirementStatuses ?? []
  const progress = pathwayData?.progress
  const hasSteps = steps.length > 0

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Access Pathway</h2>
        <p>{country.label} · {roleLabel}</p>
        {pathwayData?.template ? (
          <blockquote>
            {pathwayData.template.name}
            {progress ? ` · Step ${progress.current_step} of ${pathwayData.template.total_steps}` : ` · ${pathwayData.template.total_steps} steps`}
          </blockquote>
        ) : (
          <blockquote>{pathwaySummary}</blockquote>
        )}
      </section>

      <div className="hvm-pathway-steps">
        {hasSteps ? steps.map(step => {
          const reqs = requirements.filter(r => r.step_id === step.id)
          const doneCount = reqs.filter(r => {
            const s = statuses.find(rs => rs.requirement_id === r.id)
            return s?.status === 'verified' || s?.status === 'waived'
          }).length
          const tone = reqs.length > 0 && doneCount === reqs.length ? 'ok' : 'neutral'
          const subtitle = reqs.length > 0 ? `${doneCount}/${reqs.length} requirements met` : step.title
          return (
            <SectionCard
              key={step.id}
              label={`${step.step_number} · ${step.title}`}
              title={subtitle}
              detail={step.description ?? 'Complete this step to advance your access pathway.'}
              tone={tone}
            />
          )
        }) : (
          <>
            <SectionCard label="1 · Eligibility" title={fieldValue(countryIntel?.market_access_status)} detail="Confirm the selected role is permitted to participate in the country pathway." />
            <SectionCard label="2 · Importer requirements" title={fieldValue(countryIntel?.import_status)} detail="Importer authorization, permit mechanics, pharmacy or distributor participation, and role-specific limits." />
            <SectionCard label="3 · Documents" title="Licence, authorization, COA and product dossier packet" detail="Document requirements loaded from verified regulatory sources once reviewed." />
            <SectionCard label="4 · Route constraints" title="Compliance-gated market access" detail="Controlled routes remain Harbourview-mediated." />
            <SectionCard label="5 · Review status" title={reviewState} detail="Only reviewed public summary fields appear in the mobile experience." tone="warn" />
            <SectionCard label="Next action" title="Open pathway review queue" detail="Verify current source evidence, confirm role fit, then release a reviewed access brief." tone="ok" />
          </>
        )}
      </div>
    </div>
  )
}

function MarketplaceMobile({ country, marketplaceRows, wantedListings = [], wantedCount = 0 }: { country: CountryOption; marketplaceRows?: Partial<DashboardMarketplaceRows>; wantedListings?: WantedListing[]; wantedCount?: number }) {
  const [activeTab, setActiveTab] = useState<MarketView>('cannabis')
  const [search, setSearch] = useState('')

  const cards = useMemo<MobileMarketCard[]>(() => {
    if (activeTab === 'wanted' && wantedListings.length > 0) {
      return wantedListings.map((wanted, index) => ({
        id: wanted.id ?? `wanted-${index}`,
        title: wanted.title,
        description: wanted.summary ?? 'Wanted demand is available through Harbourview-mediated review.',
        category: 'Wanted Demand',
        jurisdiction: wanted.location_country ?? country.label,
        status: 'Public request review',
        action: 'Respond through Harbourview',
      }))
    }

    return (marketplaceRows?.[activeTab] ?? []).map((row, index) => normalizeMarketRow(row, index, country))
  }, [activeTab, marketplaceRows, wantedListings, country])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(card => [card.title, card.description, card.category, card.jurisdiction].join(' ').toLowerCase().includes(q))
  }, [cards, search])

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>{country.label} Marketplace &amp; Access</h2>
        <p>Mediated market access. Requests and contact release remain Harbourview-reviewed.</p>
      </section>

      <div className="hvm-scroll-tabs" role="tablist" aria-label="Marketplace views">
        {MARKET_TABS.map(tab => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.label}{tab.id === 'wanted' && wantedCount > 0 ? ` ${wantedCount}` : ''}
          </button>
        ))}
      </div>

      <label className="hvm-search-label">
        <span>Search listings</span>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search public marketplace summaries…" />
      </label>

      <div className="hvm-market-list">
        {filteredCards.length > 0 ? filteredCards.slice(0, 12).map(card => (
          <article key={card.id} className="hvm-market-card">
            <div className="hvm-market-card-top">
              <span>{card.category}</span>
              <small>{card.status}</small>
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="hvm-market-meta">
              <span>{card.jurisdiction}</span>
              <strong>{card.action}</strong>
            </div>
          </article>
        )) : (
          <div className="hvm-empty-card">
            <strong>No public {MARKET_TABS.find(tab => tab.id === activeTab)?.label.toLowerCase()} rows for {country.label}.</strong>
            <p>Use wanted demand or submit the country-role pathway for review. This is not a data leak or private-source fallback.</p>
          </div>
        )}
      </div>

      <MobileAccordion title="Marketplace access requirements" defaultOpen>
        <div className="hvm-meta-grid">
          <SectionCard label="Licence" title={`${country.label} public pathway`} detail="Licence and authorization status must be verified before contact release." />
          <SectionCard label="Facility / site" title={PENDING_REVIEW} detail="Facility evidence is reviewed privately and surfaced only as public-safe status." />
          <SectionCard label="Documentation" title="SOP, COA and traceability packet" detail="Documentation requirements are staged for Harbourview-mediated review." />
        </div>
      </MobileAccordion>

      <MobileAccordion title="Verification gaps and counterparty controls">
        <div className="hvm-meta-grid">
          <SectionCard label="Verification gaps" title="Route-specific evidence review" detail="EU-GMP, residue testing, pest-management and destination rules remain field-level review items until source verified." tone="warn" />
          <SectionCard label="Counterparty status" title="Harbourview-mediated release" detail="Counterparty contact and proof release are controlled workflows, not public mobile fields." tone="ok" />
        </div>
      </MobileAccordion>
    </div>
  )
}

function EvidenceMobile({ country, roleLabel, countryIntel, evidenceData, sourceCoverage }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; evidenceData?: EvidenceData; sourceCoverage?: SourceCoverageRow[] }) {
  const reviewed = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  const sources = evidenceData?.sources ?? []
  const orgDocs = evidenceData?.orgDocs ?? []
  const coverage = sourceCoverage ?? []

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Evidence &amp; Sources</h2>
        <p>{country.label} · {roleLabel}</p>
      </section>

      {sources.length > 0 ? (
        <MobileAccordion title={`Platform sources (${sources.length})`} defaultOpen>
          <div className="hvm-list-stack">
            {sources.slice(0, 8).map(src => (
              <div className="hvm-signal-card" key={src.id}>
                <strong>{src.name}</strong>
                <small>{src.category} · Reliability: {src.reliability} · {src.status}</small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      ) : (
        <div className="hvm-source-ledger">
          {[
            { label: 'Regulatory source review', title: fieldValue(countryIntel?.regulator_label, `${country.label} authority review`), detail: 'Public mobile shell shows reviewed source categories only, not raw URLs or private evidence.' },
            { label: 'Market access evidence', title: fieldValue(countryIntel?.market_access_status), detail: `${country.label} · ${roleLabel}. Commercial pathway claims stay review-gated until verified.` },
            { label: 'Review state', title: fieldValue(countryIntel?.review_status, 'Review gated'), detail: `Last public-shell render: ${reviewed}.` },
            { label: 'Public/private boundary', title: 'DTO protected', detail: 'Admin notes, raw source evidence, provenance URLs and counterparty intelligence remain outside public/mobile rendering.' },
          ].map(card => (
            <SectionCard key={card.label} label={card.label} title={card.title} detail={card.detail} />
          ))}
        </div>
      )}

      {orgDocs.length > 0 && (
        <MobileAccordion title={`My documents (${orgDocs.length})`}>
          <div className="hvm-list-stack">
            {orgDocs.map(doc => (
              <div className="hvm-signal-card" key={doc.id}>
                <strong>{doc.display_name}</strong>
                <small>
                  {doc.document_type} · {doc.verification_status}
                  {doc.expiry_date ? ` · Expires ${new Date(doc.expiry_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                </small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {coverage.length > 0 && (
        <MobileAccordion title="Source coverage breakdown">
          <div className="hvm-ledger-table" role="table" aria-label="Source coverage">
            {coverage.map((row, i) => (
              <div role="row" key={i}>
                <strong>{row.source_type} · Tier {row.tier}</strong>
                <span>{row.count} active source{row.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {sources.length === 0 && orgDocs.length === 0 && coverage.length === 0 && (
        <MobileAccordion title="Source ledger detail" defaultOpen>
          <div className="hvm-ledger-table" role="table" aria-label="Evidence source ledger">
            <div role="row"><strong>Source class</strong><span>Government / regulatory / marketplace / education</span></div>
            <div role="row"><strong>Evidence status</strong><span>{fieldValue(countryIntel?.data_completeness, PENDING_REVIEW)}</span></div>
            <div role="row"><strong>Confidence state</strong><span>{fieldValue(countryIntel?.review_status, 'Review gated')}</span></div>
            <div role="row"><strong>Public distinction</strong><span>Summary fields only; private evidence remains admin-only</span></div>
          </div>
        </MobileAccordion>
      )}
    </div>
  )
}

function EducationMobile({ country, roleLabel, eduCategories, liveTiles, recentEduModules }: { country: CountryOption; roleLabel: string; eduCategories: { icon: string; title: string; desc: string }[]; liveTiles?: LiveEduTile[]; recentEduModules?: RecentEduModule[] }) {
  const tiles = liveTiles && liveTiles.length > 0
    ? liveTiles
    : eduCategories.length > 0
      ? eduCategories
      : [
          { icon: '◎', title: 'Regulatory foundations', desc: 'Review country-specific rules and professional obligations.', slug: '' },
          { icon: '⬡', title: 'Documentation discipline', desc: 'Prepare evidence, COA, licence and product records.', slug: '' },
          { icon: '⊟', title: 'Market access readiness', desc: 'Understand mediated commercial access and review controls.', slug: '' },
        ]

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>{country.label} Learning Path</h2>
        <p>{roleLabel}</p>
      </section>

      <div className="hvm-education-list">
        {tiles.map((module, index) => (
          <article className="hvm-module-card" key={`${module.title}-${index}`}>
            <span>{module.icon}</span>
            <div>
              <strong>{index + 1}. {module.title}</strong>
              <p>{module.desc}</p>
              <small>{index < 2 ? 'Required' : 'Recommended'} · Not started</small>
            </div>
          </article>
        ))}
      </div>

      {recentEduModules && recentEduModules.length > 0 ? (
        <MobileAccordion title="Recently updated modules" defaultOpen>
          <div className="hvm-list-stack">
            {recentEduModules.map((m, i) => (
              <div className="hvm-signal-card" key={`${m.title}-${i}`}>
                <strong>{m.title}</strong>
                <small>{m.detail} · Updated {new Date(m.updated_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      ) : (
        <MobileAccordion title="Related evidence" defaultOpen>
          <div className="hvm-list-stack">
            <div className="hvm-signal-card"><strong>{country.label} regulatory framework overview</strong><small>Regulation · {PENDING_REVIEW}</small></div>
            <div className="hvm-signal-card"><strong>Documentation and COA packet guidance</strong><small>Template · {PENDING_REVIEW}</small></div>
            <div className="hvm-signal-card"><strong>Access-pathway evidence requirements</strong><small>Guidance · {PENDING_REVIEW}</small></div>
          </div>
        </MobileAccordion>
      )}
    </div>
  )
}

export default function MobileCommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  wantedCount = 0,
  marketplaceRows,
  wantedListings = [],
  countryIntel,
  pathwayData,
  evidenceData,
  liveTiles,
  recentEduModules,
  sourceCoverage,
}: Props) {
  const initialCountry = useMemo(() => COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? { iso2: 'GLOBAL', label: 'Global Market' }, [initialCountryIso2])
  const [country, setCountry] = useState<CountryOption>(initialCountry)
  const [role, setRole] = useState(initialRoleId ?? '')
  const [activePage, setActivePage] = useState<CommandPage>('briefing')
  const [contextOpen, setContextOpen] = useState(false)

  const countryOptions = useMemo<SelectOption[]>(() => COUNTRIES.map(c => ({ value: c.iso2, label: c.label })), [])
  const roleOptions = useMemo<SelectOption[]>(() => Object.entries(ROLE_PROFILES).map(([value, profile]) => ({ value, label: profile.label })), [])
  const roleLabel = roleDisplay(role)
  const pageTitle = MOBILE_NAV.find(item => item.id === activePage)?.label ?? 'Briefing'

  const handleCountryChange = (iso2: string) => {
    const nextCountry = COUNTRIES.find(c => c.iso2 === iso2)
    if (nextCountry) setCountry(nextCountry)
  }

  const page = (() => {
    switch (activePage) {
      case 'briefing':
        return <BriefingMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals} />
      case 'access-pathway':
        return <AccessPathwayMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} pathwayData={pathwayData} />
      case 'marketplace':
        return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} />
      case 'evidence':
        return <EvidenceMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} evidenceData={evidenceData} sourceCoverage={sourceCoverage} />
      case 'education':
        return <EducationMobile country={country} roleLabel={roleLabel} eduCategories={eduCategories} liveTiles={liveTiles} recentEduModules={recentEduModules} />
      default:
        return null
    }
  })()

  return (
    <div className="hvm-app">
      <style>{MOBILE_CSS}</style>

      <header className="hvm-header">
        <div className="hvm-wordmark" aria-label="Harbourview Command Centre">
          <span>HARBOURVIEW</span>
          <small>COMMAND CENTRE</small>
        </div>
        <button className="hvm-context-button" type="button" onClick={() => setContextOpen(true)}>Context</button>
      </header>

      <section className="hvm-titlebar">
        <div>
          <span className="hvm-title-kicker">{country.label} · {roleLabel}</span>
          <h1>{pageTitle}</h1>
        </div>
        {activePage !== 'briefing' && <button type="button" onClick={() => setActivePage('briefing')}>Briefing</button>}
      </section>

      <main className="hvm-main">{page}</main>

      <nav className="hvm-bottom-nav" aria-label="Mobile command centre navigation">
        {MOBILE_NAV.map(item => (
          <button key={item.id} type="button" className={activePage === item.id ? 'active' : ''} onClick={() => setActivePage(item.id)}>
            <span aria-hidden="true">{item.icon}</span>
            <em>{item.label}</em>
          </button>
        ))}
      </nav>

      {contextOpen && (
        <div className="hvm-context-sheet" role="dialog" aria-modal="true" aria-label="Change dashboard context">
          <button className="hvm-sheet-backdrop" type="button" aria-label="Close context sheet" onClick={() => setContextOpen(false)} />
          <div className="hvm-sheet-panel">
            <div className="hvm-sheet-head">
              <strong>Change Context</strong>
              <button type="button" onClick={() => setContextOpen(false)}>×</button>
            </div>
            <label>
              <span>Country</span>
              <select value={country.iso2} onChange={event => handleCountryChange(event.target.value)}>
                {countryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Role</span>
              <select value={role} onChange={event => setRole(event.target.value)}>
                <option value="">All roles</option>
                {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button className="hvm-sheet-apply" type="button" onClick={() => setContextOpen(false)}>Apply context</button>
          </div>
        </div>
      )}
    </div>
  )
}

const MOBILE_CSS = `
.hvm-app, .hvm-app * { box-sizing: border-box; min-width: 0; }
.hvm-app {
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: 100%;
  min-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  background: radial-gradient(circle at 80% 12%, rgba(18,45,58,.42), transparent 34%), linear-gradient(135deg, #030711 0%, #07111d 48%, #030812 100%);
  color: rgba(245,240,232,.94);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px));
  -webkit-text-size-adjust: 100%;
}
.hvm-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-height: calc(64px + env(safe-area-inset-top, 0px));
  padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px;
  background: rgba(3,7,17,.96);
  border-bottom: 1px solid rgba(255,255,255,.09);
  backdrop-filter: blur(14px);
}
.hvm-wordmark { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.hvm-wordmark span {
  color: #d4a84b;
  font-family: Georgia, serif;
  font-size: clamp(18px, 5vw, 23px);
  line-height: 1;
  letter-spacing: .16em;
  white-space: nowrap;
}
.hvm-wordmark small {
  color: rgba(245,240,232,.38);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: .22em;
  white-space: nowrap;
}
.hvm-context-button, .hvm-titlebar button, .hvm-sheet-head button, .hvm-sheet-apply {
  min-height: 44px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 999px;
  background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.9);
  font: 700 13px/1 Inter, system-ui, sans-serif;
  padding: 0 14px;
}
.hvm-titlebar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.hvm-titlebar > div { min-width: 0; }
.hvm-title-kicker {
  display: block;
  color: rgba(245,240,232,.46);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: .14em;
  line-height: 1.3;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.hvm-titlebar h1 {
  margin: 5px 0 0;
  color: #f5f0e8;
  font-family: Georgia, serif;
  font-size: clamp(32px, 10vw, 44px);
  line-height: .98;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}
.hvm-main { width: 100%; max-width: 100%; padding: 16px; overflow-x: hidden; }
.hvm-page-stack { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 100%; }
.hvm-hero-card, .hvm-card, .hvm-accordion, .hvm-market-card, .hvm-empty-card, .hvm-module-card, .hvm-signal-card {
  width: 100%;
  max-width: 100%;
  border: 1px solid rgba(255,255,255,.105);
  background: rgba(255,255,255,.045);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
}
.hvm-hero-card { padding: 18px; }
.hvm-hero-card.compact h2 { margin: 0 0 6px; }
.hvm-country-row { display: flex; align-items: center; gap: 13px; }
.hvm-country-mark { flex: 0 0 auto; font-size: 36px; }
.hvm-hero-card h2 {
  margin: 0;
  color: #f5f0e8;
  font-family: Georgia, serif;
  font-size: clamp(30px, 8vw, 42px);
  line-height: 1.04;
  overflow-wrap: anywhere;
}
.hvm-hero-card p, .hvm-hero-card blockquote {
  margin: 8px 0 0;
  color: rgba(245,240,232,.64);
  font-size: 16px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.hvm-hero-card blockquote {
  border-left: 3px solid #d4a84b;
  padding-left: 13px;
}
.hvm-status-grid, .hvm-meta-grid, .hvm-source-ledger, .hvm-pathway-steps, .hvm-education-list, .hvm-market-list, .hvm-list-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 100%;
}
.hvm-card { padding: 15px; }
.hvm-card-ok { border-color: rgba(76,175,130,.26); }
.hvm-card-warn { border-color: rgba(230,165,51,.28); }
.hvm-kicker {
  color: rgba(245,240,232,.42);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  margin-bottom: 7px;
}
.hvm-card strong, .hvm-market-card h3, .hvm-module-card strong, .hvm-signal-card strong {
  display: block;
  color: rgba(245,240,232,.95);
  font-size: 18px;
  line-height: 1.28;
  overflow-wrap: anywhere;
}
.hvm-card p, .hvm-market-card p, .hvm-module-card p {
  margin: 8px 0 0;
  color: rgba(245,240,232,.62);
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hvm-signal-impact {
  margin: 6px 0 0;
  color: rgba(245,240,232,.55);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hvm-accordion { overflow: hidden; }
.hvm-accordion summary {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 15px;
  cursor: pointer;
  color: #d4a84b;
  font-weight: 800;
  list-style: none;
}
.hvm-accordion summary::-webkit-details-marker { display: none; }
.hvm-accordion-body { padding: 0 13px 13px; }
.hvm-signal-card { padding: 14px; }
.hvm-signal-card small, .hvm-module-card small {
  display: block;
  margin-top: 7px;
  color: rgba(245,240,232,.48);
  font-size: 13px;
  line-height: 1.4;
}
.hvm-scroll-tabs {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  max-width: 100%;
  padding: 2px 0 8px;
  scrollbar-width: none;
}
.hvm-scroll-tabs::-webkit-scrollbar { display: none; }
.hvm-scroll-tabs button {
  flex: 0 0 auto;
  min-height: 44px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  background: rgba(255,255,255,.045);
  color: rgba(245,240,232,.68);
  padding: 0 15px;
  font-weight: 700;
}
.hvm-scroll-tabs button.active {
  color: #d4a84b;
  border-color: rgba(212,168,75,.55);
  background: rgba(212,168,75,.08);
}
.hvm-search-label { display: flex; flex-direction: column; gap: 7px; color: rgba(245,240,232,.48); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.hvm-search-label input, .hvm-sheet-panel select {
  width: 100%;
  min-height: 50px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 14px;
  background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.94);
  padding: 0 14px;
  font-size: 16px;
  outline: none;
}
.hvm-market-card { padding: 15px; }
.hvm-market-card-top, .hvm-market-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  color: rgba(245,240,232,.46);
  font-size: 12px;
  line-height: 1.35;
}
.hvm-market-card-top span, .hvm-market-meta strong { color: #d4a84b; }
.hvm-market-meta { margin: 12px 0 0; align-items: flex-start; }
.hvm-empty-card { padding: 16px; }
.hvm-empty-card p { margin: 8px 0 0; color: rgba(245,240,232,.58); line-height: 1.45; }
.hvm-ledger-table { display: grid; gap: 0; border: 1px solid rgba(255,255,255,.09); border-radius: 14px; overflow: hidden; }
.hvm-ledger-table div { display: grid; grid-template-columns: 42% minmax(0, 1fr); gap: 10px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
.hvm-ledger-table div:last-child { border-bottom: 0; }
.hvm-ledger-table strong { color: #d4a84b; font-size: 13px; }
.hvm-ledger-table span { color: rgba(245,240,232,.68); line-height: 1.4; overflow-wrap: anywhere; }
.hvm-module-card { display: flex; gap: 13px; padding: 15px; }
.hvm-module-card > span { flex: 0 0 34px; font-size: 28px; line-height: 1; }
.hvm-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  width: 100%;
  max-width: 100%;
  padding: 7px 6px calc(7px + env(safe-area-inset-bottom, 0px));
  background: rgba(3,7,17,.97);
  border-top: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(16px);
}
.hvm-bottom-nav button {
  min-height: 62px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: rgba(245,240,232,.46);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px 2px;
}
.hvm-bottom-nav button span { color: inherit; font-size: 17px; line-height: 1; }
.hvm-bottom-nav button em { font-style: normal; font-size: 10px; line-height: 1.15; max-width: 100%; overflow-wrap: anywhere; }
.hvm-bottom-nav button.active { color: #d4a84b; background: rgba(212,168,75,.07); }
.hvm-context-sheet { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; }
.hvm-sheet-backdrop { position: absolute; inset: 0; border: 0; background: rgba(0,0,0,.55); }
.hvm-sheet-panel {
  position: relative;
  width: 100%;
  max-width: 100%;
  border-radius: 22px 22px 0 0;
  border: 1px solid rgba(255,255,255,.12);
  background: #07111d;
  padding: 16px 16px calc(18px + env(safe-area-inset-bottom, 0px));
  display: grid;
  gap: 14px;
}
.hvm-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hvm-sheet-head strong { font-family: Georgia, serif; font-size: 24px; }
.hvm-sheet-head button { width: 44px; padding: 0; font-size: 24px; }
.hvm-sheet-panel label { display: grid; gap: 7px; color: rgba(245,240,232,.55); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.hvm-sheet-panel option { color: #07111d; }
.hvm-sheet-apply { background: rgba(212,168,75,.16); border-color: rgba(212,168,75,.45); color: #d4a84b; }
@media (orientation: landscape) and (max-width: 767px) {
  .hvm-header { min-height: calc(54px + env(safe-area-inset-top, 0px)); padding-bottom: 8px; }
  .hvm-titlebar { padding-top: 12px; padding-bottom: 10px; }
  .hvm-titlebar h1 { font-size: clamp(28px, 6vw, 38px); }
  .hvm-status-grid, .hvm-meta-grid, .hvm-source-ledger { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hvm-bottom-nav button { min-height: 54px; }
}
`
