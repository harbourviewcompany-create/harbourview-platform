'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, PathwayData, WatchlistData, LocalIntelData, SourceCoverageRow, EvidenceData, LiveEduTile, RecentEduModule } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'

type CommandPage = 'briefing' | 'marketplace' | 'signals' | 'education'

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
  { id: 'briefing',    label: 'Briefing',      icon: '◎' },
  { id: 'marketplace', label: 'Market',         icon: '⊞' },
  { id: 'signals',     label: 'Intelligence',   icon: '≋' },
  { id: 'education',   label: 'Education',      icon: '⬡' },
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

const FIELD_LABELS: Record<string, string> = {
  needs_review:   'Under review',
  stub:           'Data pending',
  pending:        'Pending',
  verified:       'Verified',
  published:      'Published',
  approved:       'Approved',
  review_gated:   'Under review',
  not_started:    'Not started',
  in_progress:    'In progress',
  completed:      'Completed',
  active:         'Active',
  inactive:       'Inactive',
  restricted:     'Restricted',
  draft:          'Draft',
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w/g, char => char.toUpperCase())
}

function fieldValue(value: string | number | null | undefined, fallback = PENDING_REVIEW): string {
  if (typeof value === 'number') return String(value)
  const raw = value && value.trim() ? value.trim() : fallback
  return FIELD_LABELS[raw] ?? raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

function BriefingOverview({ country, roleLabel, countryIntel, signals }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; signals: DashboardSignal[] }) {
  const summary = fieldValue(
    countryIntel?.public_summary,
    `${country.label} dashboard context is available for ${roleLabel}. Field-level source review is shown where verified data has not been loaded.`,
  )
  const updatedLabel = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <>
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
    </>
  )
}

type BriefingSub = 'overview' | 'pathway' | 'local-intel' | 'settings'

const BRIEF_TABS: { id: BriefingSub; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'pathway',    label: 'Pathway' },
  { id: 'local-intel',label: 'Local Intel' },
  { id: 'settings',   label: 'Settings' },
]

function BriefingMobile({ country, roleLabel, roleId, countryIntel, signals, pathwayData, localIntel, countryOptions, roleOptions, onCountryChange, onRoleChange }: { country: CountryOption; roleLabel: string; roleId: string; countryIntel?: CountryIntelProfile | null; signals: DashboardSignal[]; pathwayData?: PathwayData | null; localIntel?: LocalIntelData | null; countryOptions: SelectOption[]; roleOptions: SelectOption[]; onCountryChange: (iso2: string) => void; onRoleChange: (r: string) => void }) {
  const [sub, setSub] = useState<BriefingSub>('overview')

  return (
    <div className="hvm-page-stack">
      <div className="hvm-scroll-tabs" role="tablist" aria-label="Briefing sections">
        {BRIEF_TABS.map(tab => (
          <button key={tab.id} type="button" className={sub === tab.id ? 'active' : ''} onClick={() => setSub(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {sub === 'overview'    && <BriefingOverview country={country} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals} />}
      {sub === 'pathway'     && <AccessPathwayMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} pathwayData={pathwayData} />}
      {sub === 'local-intel' && <LocalIntelMobile country={country} roleLabel={roleLabel} signals={signals} localIntel={localIntel} countryIntel={countryIntel} />}
      {sub === 'settings'    && <SettingsMobile country={country} role={roleId} roleLabel={roleLabel} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={onCountryChange} onRoleChange={onRoleChange} />}
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
  const [selectedCard, setSelectedCard] = useState<MobileMarketCard | null>(null)

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

  if (selectedCard) {
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelectedCard(null)}>← Back to listings</button>
        <section className="hvm-hero-card compact">
          <div className="hvm-kicker">{selectedCard.category} · {selectedCard.jurisdiction}</div>
          <h2>{selectedCard.title}</h2>
          <p>{selectedCard.description}</p>
        </section>
        <div className="hvm-meta-grid">
          <SectionCard label="Status" title={selectedCard.status} detail="Listing status as approved for public display." />
          <SectionCard label="Access" title={selectedCard.action} detail="All counterparty contact and proof release are Harbourview-mediated." tone="ok" />
        </div>
        <SectionCard label="Next step" title="Submit via Harbourview intake" detail="Use the Command Centre intake flow to request mediated access. Counterparty details are released only after Harbourview review." />
      </div>
    )
  }

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
          <article
            key={card.id}
            className="hvm-market-card"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCard(card)}
            onKeyDown={e => e.key === 'Enter' && setSelectedCard(card)}
          >
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

type EduModule = { icon: string; title: string; desc: string; slug?: string }

const MODULE_TOPICS: Record<string, { topics: string[]; action: string }> = {
  'Dispensing Controls': {
    topics: [
      'Prescription validation and controlled-substance handling protocols',
      'Drug interaction screening and contraindication review',
      'Patient consultation and informed-consent requirements',
      'Good Pharmacy Practice standards and audit readiness',
      'Record-keeping, pharmacovigilance and adverse-event reporting',
    ],
    action: 'Review dispensing SOP',
  },
  'Compliance & Reg.': {
    topics: [
      'National regulatory authority requirements and licence conditions',
      'Authorization classes, permit types and renewal obligations',
      'Inspection readiness: documentation, SOPs and audit trail',
      'Continuing competency and professional obligations',
      'Enforcement exposure and voluntary disclosure procedures',
    ],
    action: 'Check compliance calendar',
  },
  'Country Rules': {
    topics: [
      'Medical cannabis programme status and legislative framework',
      'Permitted indications, formulations and quantity limits',
      'Import and export regime, INCB permits and customs controls',
      'Licence classes, authorization pathways and regulator contact',
      'Jurisdiction-specific restrictions and upcoming regulatory changes',
    ],
    action: 'View regulatory brief',
  },
  'Documentation': {
    topics: [
      'Certificate of Analysis (COA) interpretation and verification',
      'Product dossier structure and GMP certificate requirements',
      'Supplier verification, counterparty checks and due diligence',
      'Traceability record structure and chain-of-custody obligations',
      'Submission templates, format standards and filing deadlines',
    ],
    action: 'Access document templates',
  },
  'Export Regulations': {
    topics: [
      'Export licence classes, permit applications and processing times',
      'INCB notification requirements and Article 12 obligations',
      'Destination-country import permit mechanics and equivalence rules',
      'EU-GMP certification, phytosanitary and customs documentation',
      'Controlled shipment packaging, labelling and transit procedures',
    ],
    action: 'Review export pathway',
  },
  'Import Frameworks': {
    topics: [
      'Import licence requirements, quota allocation and application process',
      'Controlled substance INCB permits and national quota management',
      'Distributor authorization, pharmacy participation and custody rules',
      'Customs procedures, inspection requirements and duty classification',
      'Country-specific quantity limits, formulation restrictions and labelling',
    ],
    action: 'Review import pathway',
  },
  'Market Access': {
    topics: [
      'Commercial market entry pathways and access restrictions by role',
      'Mediated access protocols and counterparty disclosure controls',
      'Regulatory approval timeline and milestone mapping',
      'Market size, competitor landscape and pricing intelligence',
      'Strategic positioning and risk classification for selected role',
    ],
    action: 'Request market brief',
  },
  'Trade & Access': {
    topics: [
      'International trade framework and applicable bilateral treaties',
      'Counterparty verification and commercial due diligence requirements',
      'Partner and distributor identification and qualification process',
      'Harbourview-mediated access workflow and contact-release controls',
      'Risk classification and commercial review decision matrix',
    ],
    action: 'View trade pathway',
  },
  'GMP Standards': {
    topics: [
      'Good Manufacturing Practice framework (EU-GMP, GACP, GDP)',
      'Facility authorization, site master file and inspection requirements',
      'Quality management system: SOPs, deviations and CAPA process',
      'Batch release, product testing obligations and stability studies',
      'Supplier qualification, approved vendor list and audit procedures',
    ],
    action: 'Review GMP checklist',
  },
  'Prescribing Pathways': {
    topics: [
      'Clinical authorization requirements and prescriber eligibility criteria',
      'Patient eligibility, approved indications and diagnosis documentation',
      'Prescription format, quantity limits, duration and renewal rules',
      'Informed consent, monitoring requirements and follow-up obligations',
      'Adverse event recording, PSUR submissions and reporting timelines',
    ],
    action: 'Review prescribing SOP',
  },
  'Clinical Evidence': {
    topics: [
      'Current randomized controlled trial landscape and evidence base',
      'Meta-analyses and systematic review summaries by indication',
      'Cannabinoid pharmacology, mechanisms of action and receptor profile',
      'Efficacy and safety data stratified by formulation and population',
      'Evidence quality classification and regulatory acceptance criteria',
    ],
    action: 'View evidence library',
  },
  'Pharmacology': {
    topics: [
      'Endocannabinoid system, receptor pharmacology (CB1, CB2, TRPV1)',
      'Cannabinoid profiles: THC, CBD, CBG, CBN and minor cannabinoids',
      'Drug-drug interaction risk assessment and CYP450 pathway effects',
      'Pharmacokinetics, bioavailability and onset by formulation route',
      'Special population considerations: elderly, paediatric, renal/hepatic',
    ],
    action: 'Review pharmacology module',
  },
  'Logistics & Customs': {
    topics: [
      'Controlled substance shipping requirements, sealing and labelling',
      'Customs documentation, import/export permits and HS codes',
      'Cold chain, temperature monitoring and GDP requirements',
      'Carrier selection, route risk assessment and insurance requirements',
      'Delay, seizure and loss-of-shipment protocols and notifications',
    ],
    action: 'Review logistics checklist',
  },
  'Trade & Cross-Border': {
    topics: [
      'Cross-border shipment permit framework: INCB and national requirements',
      'Harmonized tariff codes and controlled substance customs classification',
      'Phytosanitary certificate, fumigation and plant import restrictions',
      'Insurance, Incoterms 2020 and liability allocation by trade route',
      'Destination-country controlled substance import documentation matrix',
    ],
    action: 'View cross-border guide',
  },
  'Cultivation Standards': {
    topics: [
      'Good Agricultural and Collection Practice (GACP) requirements',
      'Harvest and post-harvest handling, drying and storage protocols',
      'Permitted genetics, THC/CBD limits and variety registration obligations',
      'Water, soil, integrated pest management and contamination controls',
      'Chain-of-custody from harvest to processor and traceability records',
    ],
    action: 'Review cultivation standards',
  },
  'Lab & Testing Protocols': {
    topics: [
      'Certificate of Analysis scope, required analytes and acceptance criteria',
      'ISO 17025 and GLP accreditation standards for cannabis laboratories',
      'Contaminant panels: pesticides, heavy metals, mycotoxins and residual solvents',
      'Potency testing methods: HPLC, GC, and validated reference standards',
      'Shelf-life studies, stability testing and re-test interval requirements',
    ],
    action: 'Review testing protocols',
  },
  'Investment & Operations': {
    topics: [
      'Capital requirements: licence acquisition, build-out and working capital',
      'M&A, asset transfer and regulatory change-of-ownership procedures',
      'Operational setup: facility compliance, staffing and SOPs',
      'Revenue modelling, unit economics and market-entry payback timeline',
      'Risk matrix: regulatory, market, currency and execution exposures',
    ],
    action: 'View investment framework',
  },
  'Regulatory Compliance': {
    topics: [
      'Compliance programme design: policies, procedures and controls',
      'Regulatory change monitoring and impact assessment process',
      'Internal audit, gap analysis and remediation planning',
      'Regulator engagement, licence renewals and condition management',
      'Training, competency verification and culture of compliance',
    ],
    action: 'Review compliance framework',
  },
  'Evidence gap review': {
    topics: [
      'This country-role pathway requires additional evidence before full verification',
      'Harbourview is reviewing regulatory, market and licence-class data for this route',
      'Interim guidance is available through the mediated intake process',
      'Submit pathway verification requests via the intake workflow for priority review',
      'Evidence gaps are addressed as source review and regulatory data are confirmed',
    ],
    action: 'Submit pathway review request',
  },
}

function getModuleContent(title: string): { topics: string[]; action: string } {
  const key = Object.keys(MODULE_TOPICS).find(k => title.toLowerCase().includes(k.toLowerCase()))
  if (key) return MODULE_TOPICS[key]
  return {
    topics: [
      `${title} content is jurisdiction and role-specific`,
      'Harbourview-curated content is reviewed before publication',
      'Topics cover regulatory, commercial and compliance dimensions for your role',
      `${title} modules are updated as source evidence and regulatory changes are confirmed`,
      'Use the intake flow to request priority content for a specific market or question',
    ],
    action: 'Request content review',
  }
}

type EduSub = 'modules' | 'research'

const EDU_TABS: { id: EduSub; label: string }[] = [
  { id: 'modules',  label: 'Modules' },
  { id: 'research', label: 'Research' },
]

function EducationMobile({ country, roleLabel, eduCategories, liveTiles, recentEduModules, evidenceData, sourceCoverage }: { country: CountryOption; roleLabel: string; eduCategories: { icon: string; title: string; desc: string }[]; liveTiles?: LiveEduTile[]; recentEduModules?: RecentEduModule[]; evidenceData?: EvidenceData; sourceCoverage?: SourceCoverageRow[] }) {
  const [sub, setSub] = useState<EduSub>('modules')
  const [selectedModule, setSelectedModule] = useState<EduModule | null>(null)

  const tiles: EduModule[] = liveTiles && liveTiles.length > 0
    ? liveTiles
    : eduCategories.length > 0
      ? eduCategories
      : [
          { icon: '◎', title: 'Regulatory foundations', desc: 'Review country-specific rules and professional obligations.', slug: '' },
          { icon: '⬡', title: 'Documentation discipline', desc: 'Prepare evidence, COA, licence and product records.', slug: '' },
          { icon: '⊟', title: 'Market access readiness', desc: 'Understand mediated commercial access and review controls.', slug: '' },
        ]

  if (selectedModule) {
    const { topics, action } = getModuleContent(selectedModule.title)
    const isGap = selectedModule.title.toLowerCase().includes('evidence gap') || selectedModule.title.toLowerCase().includes('gap review')
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelectedModule(null)}>← Back to learning path</button>
        <section className={`hvm-hero-card compact${isGap ? ' hvm-hero-card--info' : ''}`}>
          <div className="hvm-kicker">{country.label} · {roleLabel}</div>
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>{isGap ? '📋' : selectedModule.icon}</div>
          <h2>{isGap ? 'Pathway in review' : selectedModule.title}</h2>
          <p>{isGap ? `Harbourview is building verified intelligence for ${country.label} · ${roleLabel}. Interim guidance is available below.` : selectedModule.desc}</p>
        </section>
        <div className="hvm-list-stack">
          {topics.map((topic, i) => (
            <div className="hvm-card" key={i}>
              <div className="hvm-kicker">{isGap ? `Step ${i + 1}` : `Topic ${i + 1}`}</div>
              <p style={{ margin: '4px 0 0', color: 'rgba(245,240,232,.85)', fontSize: 15, lineHeight: 1.55 }}>{topic}</p>
            </div>
          ))}
        </div>
        <SectionCard
          label="Next step"
          title={`${action} · ${country.label}`}
          detail={isGap ? 'Use the Harbourview intake flow to request priority review for this country-role pathway.' : 'Use the intake flow or contact Harbourview to access detailed content, templates and counterparty-reviewed guidance for this module.'}
          tone="ok"
        />
      </div>
    )
  }

  return (
    <div className="hvm-page-stack">
      <div className="hvm-scroll-tabs" role="tablist" aria-label="Education sections">
        {EDU_TABS.map(tab => (
          <button key={tab.id} type="button" className={sub === tab.id ? 'active' : ''} onClick={() => setSub(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {sub === 'modules' && (
        <>
          <section className="hvm-hero-card compact">
            <h2>{country.label} Learning Path</h2>
            <p>{roleLabel}</p>
          </section>

          <div className="hvm-education-list">
            {tiles.map((module, index) => (
              <article
                key={`${module.title}-${index}`}
                className="hvm-module-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedModule(module)}
                onKeyDown={e => e.key === 'Enter' && setSelectedModule(module)}
              >
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
        </>
      )}

      {sub === 'research' && (
        <EvidenceMobile country={country} roleLabel={roleLabel} evidenceData={evidenceData} sourceCoverage={sourceCoverage} />
      )}
    </div>
  )
}

type SignalSub = 'feed' | 'regulatory' | 'watchlist'

const SIGNALS_TABS: { id: SignalSub; label: string }[] = [
  { id: 'feed',       label: 'Signals' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'watchlist',  label: 'Watchlist' },
]

function SignalsFeed({ country, signals }: { country: CountryOption; signals: DashboardSignal[] }) {
  const [search, setSearch] = useState('')
  const [subState, setSubState] = useState<'idle'|'loading'|'subscribed'|'upgrade'|'error'>('idle')
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return signals
    return signals.filter(s =>
      [s.title, s.market, s.commercialImpact].join(' ').toLowerCase().includes(q)
    )
  }, [signals, search])

  async function handleSubscribe() {
    if (subState === 'subscribed' || subState === 'loading') return
    setSubState('loading')
    try {
      const res = await fetch('/api/signals/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markets: country.iso2 && country.iso2 !== 'GLOBAL' ? [country.iso2] : [],
          frequency: 'daily',
        }),
      })
      if (res.ok) { setSubState('subscribed'); return }
      if (res.status === 403) { setSubState('upgrade'); return }
      setSubState('error')
    } catch {
      setSubState('error')
    }
  }

  async function handleUnsubscribe() {
    setSubState('loading')
    try {
      const res = await fetch('/api/signals/subscribe', { method: 'DELETE' })
      setSubState(res.ok ? 'idle' : 'error')
    } catch {
      setSubState('error')
    }
  }

  if (selectedSignal) {
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelectedSignal(null)}>← Back to signals</button>
        <section className="hvm-hero-card compact">
          <div className="hvm-kicker">{selectedSignal.market} · {selectedSignal.timeAgo}</div>
          <h2>{selectedSignal.flag} {selectedSignal.title}</h2>
        </section>
        <div className="hvm-meta-grid">
          <SectionCard label="Confidence" title={`${selectedSignal.confidence}%`} detail="Signal confidence score based on source quality and corroboration." tone={selectedSignal.confidence >= 70 ? 'ok' : 'warn'} />
          <SectionCard label="Source" title={selectedSignal.sourceLabel ?? 'Harbourview Intelligence'} detail="Source category as reviewed for public display." />
        </div>
        <div className="hvm-card">
          <div className="hvm-kicker">Commercial impact</div>
          <p style={{ margin: '8px 0 0', color: 'rgba(245,240,232,.85)', fontSize: 15, lineHeight: 1.6 }}>{selectedSignal.commercialImpact}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Intelligence</h2>
        <p>{country.label} · {signals.length} signal{signals.length !== 1 ? 's' : ''}</p>
        <div className="hvm-sub-row">
          {subState === 'upgrade' ? (
            <span className="hvm-sub-upgrade">Intel plan required to subscribe</span>
          ) : subState === 'subscribed' ? (
            <button className="hvm-sub-btn active" onClick={handleUnsubscribe}>✓ Subscribed — tap to cancel</button>
          ) : (
            <button className="hvm-sub-btn" onClick={handleSubscribe} disabled={subState === 'loading'}>
              {subState === 'loading' ? 'Subscribing…' : '+ Subscribe to daily signals'}
            </button>
          )}
        </div>
      </section>

      <label className="hvm-search-label">
        <span>Filter signals</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by market, signal, impact…" />
      </label>

      <div className="hvm-list-stack">
        {filtered.length > 0 ? filtered.slice(0, 20).map((signal, index) => (
          <div
            className="hvm-signal-card hvm-signal-card--tap"
            key={`${signal.title}-${index}`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedSignal(signal)}
            onKeyDown={e => e.key === 'Enter' && setSelectedSignal(signal)}
          >
            <strong>{signal.flag} {signal.title}</strong>
            <small>{signal.market} · {signal.sourceLabel} · {signal.timeAgo} · {signal.confidence}% confidence</small>
            <p className="hvm-signal-impact">{signal.commercialImpact}</p>
          </div>
        )) : (
          <div className="hvm-signal-card">
            <strong>No signals match your filter</strong>
            <small>Try clearing the search or changing your country context.</small>
          </div>
        )}
        {filtered.length === 0 && signals.length === 0 && (
          <div className="hvm-signal-card">
            <strong>No intelligence signals loaded</strong>
            <small>Select a country to load curated regulatory and market signals.</small>
          </div>
        )}
      </div>
    </div>
  )
}

function SignalsMobile({ country, signals, watchlistData, countryIntel }: { country: CountryOption; signals: DashboardSignal[]; watchlistData?: WatchlistData | null; countryIntel?: CountryIntelProfile | null }) {
  const [sub, setSub] = useState<SignalSub>('feed')

  return (
    <div className="hvm-page-stack">
      <div className="hvm-scroll-tabs" role="tablist" aria-label="Intelligence sections">
        {SIGNALS_TABS.map(tab => (
          <button key={tab.id} type="button" className={sub === tab.id ? 'active' : ''} onClick={() => setSub(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {sub === 'feed'       && <SignalsFeed country={country} signals={signals} />}
      {sub === 'regulatory' && <RegulatoryMobile country={country} roleLabel="Regulatory" signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} />}
      {sub === 'watchlist'  && <WatchlistMobile country={country} roleLabel="Watchlist" watchlistData={watchlistData} />}
    </div>
  )
}

function WatchlistMobile({ country, roleLabel, watchlistData }: { country: CountryOption; roleLabel: string; watchlistData?: WatchlistData | null }) {
  const items = watchlistData?.items ?? []
  const rules = watchlistData?.rules ?? []
  const notifs = watchlistData?.notifications

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Watchlist</h2>
        <p>{country.label} · {roleLabel}</p>
        {notifs && notifs.total_alerts > 0 && (
          <blockquote>{notifs.awaiting_review} awaiting review · {notifs.resolved} resolved · {notifs.snoozed} snoozed</blockquote>
        )}
      </section>

      {items.length > 0 ? (
        <MobileAccordion title={`Watched items (${items.length})`} defaultOpen>
          <div className="hvm-list-stack">
            {items.slice(0, 10).map(item => (
              <div className="hvm-signal-card" key={item.id}>
                <strong>{item.title}</strong>
                <small>
                  {item.item_type.replace(/_/g, ' ')}
                  {item.jurisdiction ? ` · ${item.jurisdiction}` : ''}
                  {item.confidence_pct != null ? ` · ${item.confidence_pct}% confidence` : ''}
                </small>
                {item.subtitle && <p className="hvm-signal-impact">{item.subtitle}</p>}
              </div>
            ))}
          </div>
        </MobileAccordion>
      ) : (
        <SectionCard
          label="Watchlist"
          title="No items watched yet"
          detail="Add jurisdictions, signals, pathways or market listings to your watchlist from the Intelligence and Market tabs."
        />
      )}

      {rules.length > 0 && (
        <MobileAccordion title={`Watch rules (${rules.length})`}>
          <div className="hvm-list-stack">
            {rules.slice(0, 6).map(rule => (
              <div className="hvm-signal-card" key={rule.id}>
                <strong>{rule.rule_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Watch</strong>
                <small>{rule.keywords.slice(0, 3).join(' · ') || 'All signals'}</small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      <SectionCard
        label="Next step"
        title={`Add to watchlist · ${country.label}`}
        detail="Use the Intelligence or Marketplace tabs to add items. Watchlist alerts deliver via your notification settings."
        tone="ok"
      />
    </div>
  )
}

function RegulatoryMobile({ country, roleLabel, signals, watchlistData, countryIntel }: { country: CountryOption; roleLabel: string; signals: DashboardSignal[]; watchlistData?: WatchlistData | null; countryIntel?: CountryIntelProfile | null }) {
  const regSignals = useMemo(() => {
    const reg = signals.filter(s => {
      const t = s.title.toLowerCase()
      return /regulatory|licen|compliance|reform|legislation|enforcement|permit/.test(t)
    })
    return (reg.length > 0 ? reg : signals).slice(0, 8)
  }, [signals])

  const watchTriggers = useMemo(() => {
    const rules = watchlistData?.rules ?? []
    if (rules.length > 0) {
      return rules.slice(0, 5).map(r => ({
        label: r.rule_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        on: true,
      }))
    }
    return [
      { label: 'Rulemaking (Regulatory)', on: true },
      { label: 'Legislation & Bills', on: true },
      { label: 'Enforcement Actions', on: true },
      { label: 'Taxation Changes', on: false },
      { label: 'Local Ordinances', on: false },
    ]
  }, [watchlistData])

  const lastChange = regSignals[0] ?? signals[0] ?? null
  const status = fieldValue(countryIntel?.medical_status, 'Review pending')

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Regulatory Watch</h2>
        <p>{country.label} · {roleLabel}</p>
        <blockquote>Program status: {status}</blockquote>
      </section>

      {lastChange && (
        <SectionCard
          label="Last regulatory change"
          title={lastChange.title.length > 80 ? lastChange.title.slice(0, 80) + '…' : lastChange.title}
          detail={`${lastChange.market} · ${lastChange.timeAgo} · ${lastChange.confidence}% confidence`}
          tone={lastChange.confidence >= 70 ? 'ok' : 'warn'}
        />
      )}

      <MobileAccordion title={`Recent regulatory signals (${Math.min(regSignals.length, 6)})`} defaultOpen>
        <div className="hvm-list-stack">
          {regSignals.slice(0, 6).map((signal, index) => (
            <div className="hvm-signal-card" key={`${signal.title}-${index}`}>
              <strong>{signal.flag} {signal.title}</strong>
              <small>{signal.market} · {signal.timeAgo} · {signal.confidence}% confidence</small>
              <p className="hvm-signal-impact">{signal.commercialImpact}</p>
            </div>
          ))}
          {regSignals.length === 0 && (
            <div className="hvm-signal-card">
              <strong>No regulatory signals loaded</strong>
              <small>Select a country context to load curated regulatory signals.</small>
            </div>
          )}
        </div>
      </MobileAccordion>

      <MobileAccordion title="Watch triggers">
        <div className="hvm-list-stack">
          {watchTriggers.map(t => (
            <div className="hvm-signal-card hvm-trigger-row" key={t.label}>
              <span>{t.label}</span>
              <span style={{ color: t.on ? '#4caf82' : 'rgba(245,240,232,.3)', fontSize: 13, fontWeight: 700 }}>
                {t.on ? '● On' : '○ Off'}
              </span>
            </div>
          ))}
        </div>
      </MobileAccordion>
    </div>
  )
}

function LocalIntelMobile({ country, roleLabel, signals, localIntel, countryIntel }: { country: CountryOption; roleLabel: string; signals: DashboardSignal[]; localIntel?: LocalIntelData | null; countryIntel?: CountryIntelProfile | null }) {
  const constraints = useMemo(() => {
    if (localIntel?.constraints && localIntel.constraints.length > 0) return localIntel.constraints
    if (countryIntel) {
      const items: { icon: string; label: string; text: string }[] = []
      if (countryIntel.medical_status) items.push({ icon: '◎', label: 'Medical Programme', text: `Status: ${fieldValue(countryIntel.medical_status)}. Operator compliance required under national health authority rules.` })
      if (countryIntel.market_access_status) items.push({ icon: '⊞', label: 'Market Access', text: `Classification: ${fieldValue(countryIntel.market_access_status)}. Verify operator entry requirements before commercial engagement.` })
      if (countryIntel.import_status) items.push({ icon: '↓', label: 'Import Constraints', text: `Pathway: ${fieldValue(countryIntel.import_status)}. Documentation, permit and customs requirements apply.` })
      if (items.length > 0) return items
    }
    return [
      { icon: '◎', label: 'Licensing Requirements', text: `Verify licensing and permit requirements with the ${country.label} national regulatory authority.` },
      { icon: '⊟', label: 'Market Access Rules', text: 'Confirm current market access conditions and operational constraints with local authorities.' },
      { icon: '◷', label: 'Compliance Obligations', text: 'Maintain current documentation and certification as required by national regulations.' },
    ]
  }, [localIntel, countryIntel, country])

  const municipalities = localIntel?.municipalities ?? []

  const openQuestions = useMemo(() => {
    if (localIntel?.openQuestions && localIntel.openQuestions.length > 0) return localIntel.openQuestions
    return signals.slice(0, 3)
      .map(s => `How will ${s.title.slice(0, 60).trimEnd()}… developments affect ${country.label} operations?`)
      .concat([`What are the current enforcement priorities for licensed operators in ${country.label}?`])
      .slice(0, 3)
  }, [localIntel, signals, country])

  const keyList = localIntel?.authorities?.keyList ?? []

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Local Intel</h2>
        <p>{country.label} · {roleLabel}</p>
        {localIntel?.coverageStatus && (
          <blockquote>Coverage: {localIntel.coverageStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</blockquote>
        )}
      </section>

      <MobileAccordion title="Local access constraints" defaultOpen>
        <div className="hvm-list-stack">
          {constraints.map((c, i) => (
            <div className="hvm-signal-card" key={i}>
              <strong>{c.icon ? `${c.icon} ` : ''}{c.label}</strong>
              <p className="hvm-signal-impact">{c.text}</p>
            </div>
          ))}
        </div>
      </MobileAccordion>

      {municipalities.length > 0 && (
        <MobileAccordion title={`Municipal watch (${municipalities.length})`}>
          <div className="hvm-list-stack">
            {municipalities.map((m, i) => (
              <div className="hvm-signal-card hvm-muni-row" key={i}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>{m.name}</strong>
                  {m.note && <p className="hvm-signal-impact">{m.note}</p>}
                </div>
                <span className={`hvm-muni-badge hvm-muni-badge--${m.status}`}>
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {keyList.length > 0 && (
        <MobileAccordion title="Key authorities">
          <div className="hvm-list-stack">
            {keyList.map((a, i) => (
              <div className="hvm-signal-card" key={i}>
                <strong>⊙ {a.name}</strong>
                <small style={{ color: 'rgba(245,240,232,.48)', marginTop: 5, display: 'block' }}>{a.role}</small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {openQuestions.length > 0 && (
        <MobileAccordion title="Open intelligence questions">
          <div className="hvm-list-stack">
            {openQuestions.map((q, i) => (
              <div className="hvm-signal-card" key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#d4a84b', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>?</span>
                <p style={{ margin: 0, color: 'rgba(245,240,232,.75)', fontSize: 15, lineHeight: 1.5 }}>{q}</p>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      <SectionCard
        label="Intelligence gap"
        title={`Submit local intel request · ${country.label}`}
        detail="Use the Harbourview intake flow to request priority local intelligence review for this jurisdiction."
        tone="ok"
      />
    </div>
  )
}

function SettingsMobile({ country, role, roleLabel, countryOptions, roleOptions, onCountryChange, onRoleChange }: { country: CountryOption; role: string; roleLabel: string; countryOptions: SelectOption[]; roleOptions: SelectOption[]; onCountryChange: (iso2: string) => void; onRoleChange: (r: string) => void }) {
  const [notifWatchlist, setNotifWatchlist] = useState(true)
  const [notifSignals, setNotifSignals] = useState(true)
  const today = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Settings</h2>
        <p>{country.label} · {roleLabel}</p>
      </section>

      <MobileAccordion title="Jurisdiction context" defaultOpen>
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="hvm-settings-label">
            <span>Country</span>
            <select className="hvm-settings-select" value={country.iso2} onChange={e => onCountryChange(e.target.value)}>
              {countryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="hvm-settings-label">
            <span>Role</span>
            <select className="hvm-settings-select" value={role} onChange={e => onRoleChange(e.target.value)}>
              <option value="">All roles</option>
              {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </MobileAccordion>

      <MobileAccordion title="Notification preferences">
        <div className="hvm-list-stack">
          {([
            { label: 'Watchlist alerts', sub: 'Notify on new matches & changes', value: notifWatchlist, toggle: () => setNotifWatchlist(v => !v) },
            { label: 'Intelligence signals', sub: 'High-confidence signal alerts', value: notifSignals, toggle: () => setNotifSignals(v => !v) },
          ]).map(item => (
            <div className="hvm-signal-card hvm-notif-row" key={item.label}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 15 }}>{item.label}</strong>
                <small style={{ display: 'block', marginTop: 4, color: 'rgba(245,240,232,.48)' }}>{item.sub}</small>
              </div>
              <button
                type="button"
                className={`hvm-toggle${item.value ? ' on' : ''}`}
                onClick={item.toggle}
                aria-pressed={item.value}
              >
                <span className="hvm-toggle-thumb" />
              </button>
            </div>
          ))}
        </div>
      </MobileAccordion>

      <div className="hvm-meta-grid">
        <SectionCard label="Session" title="Active" detail={`Started ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} tone="ok" />
        <SectionCard label="Data as of" title={today} detail="Live source cadence depends on configured watchers and review state." />
      </div>

      <form action="/api/auth/signout" method="post">
        <button type="submit" className="hvm-signout-btn">Sign out</button>
      </form>
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
  watchlistData,
  evidenceData,
  localIntel,
  liveTiles,
  recentEduModules,
  sourceCoverage,
}: Props) {
  const router = useRouter()
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

  const handleApplyContext = () => {
    setContextOpen(false)
    const params = new URLSearchParams()
    if (country.iso2 && country.iso2 !== 'GLOBAL') params.set('country', country.iso2)
    if (role) params.set('role', role)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/dashboard')
  }

  const page = (() => {
    switch (activePage) {
      case 'briefing':
        return (
          <BriefingMobile
            country={country} roleLabel={roleLabel} roleId={role}
            countryIntel={countryIntel} signals={signals}
            pathwayData={pathwayData} localIntel={localIntel}
            countryOptions={countryOptions} roleOptions={roleOptions}
            onCountryChange={handleCountryChange} onRoleChange={setRole}
          />
        )
      case 'marketplace':
        return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} />
      case 'signals':
        return <SignalsMobile country={country} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} />
      case 'education':
        return (
          <EducationMobile
            country={country} roleLabel={roleLabel}
            eduCategories={eduCategories} liveTiles={liveTiles}
            recentEduModules={recentEduModules}
            evidenceData={evidenceData} sourceCoverage={sourceCoverage}
          />
        )
      default:
        return null
    }
  })()

  return (
    <div className="hvm-app">
      <style>{MOBILE_CSS}</style>

      <section className="hvm-titlebar">
        <div className="hvm-titlebar-text">
          <span className="hvm-title-kicker">{country.label} · {roleLabel}</span>
          <h1>{pageTitle}</h1>
        </div>
        <div className="hvm-titlebar-actions">
          <button type="button" onClick={() => setContextOpen(true)}>Context</button>
        </div>
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
            <button className="hvm-sheet-apply" type="button" onClick={handleApplyContext}>Apply context</button>
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
.hvm-titlebar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 14px;
  background: rgba(3,7,17,.97);
  border-bottom: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
}
.hvm-titlebar-text { min-width: 0; flex: 1; }
.hvm-titlebar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.hvm-titlebar-actions button, .hvm-sheet-head button, .hvm-sheet-apply {
  min-height: 44px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 999px;
  background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.9);
  font: 700 13px/1 Inter, system-ui, sans-serif;
  padding: 0 14px;
  cursor: pointer;
}
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
  font-size: clamp(28px, 9vw, 40px);
  line-height: .98;
  letter-spacing: -.035em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
.hvm-sub-row { margin-top: 10px; }
.hvm-sub-btn {
  font-size: 12px; padding: 7px 14px; border-radius: 8px; cursor: pointer; font: inherit;
  border: 1px solid rgba(212,168,75,.5); color: #d4a84b; background: rgba(212,168,75,.07);
  transition: all .12s; width: 100%; text-align: left;
}
.hvm-sub-btn:hover:not(:disabled) { background: rgba(212,168,75,.15); border-color: #d4a84b; }
.hvm-sub-btn:disabled { opacity: .5; cursor: default; }
.hvm-sub-btn.active { border-color: rgba(76,175,130,.5); color: #4caf82; background: rgba(76,175,130,.07); }
.hvm-sub-upgrade { font-size: 11px; color: rgba(245,240,232,.38); }
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
.hvm-hero-card--info { border-color: rgba(91,155,213,.3); background: rgba(91,155,213,.06); }
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
.hvm-signal-card--tap { cursor: pointer; }
.hvm-signal-card--tap:hover { border-color: rgba(212,168,75,.25); background: rgba(255,255,255,.065); }
.hvm-signal-card small, .hvm-module-card small {
  display: block;
  margin-top: 7px;
  color: rgba(245,240,232,.48);
  font-size: 13px;
  line-height: 1.4;
}
.hvm-scroll-tabs {
  position: sticky;
  top: calc(84px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: rgba(3,7,17,.97);
  border-bottom: 1px solid rgba(255,255,255,.06);
  margin: 0 -16px;
  padding: 8px 16px 10px;
  display: flex;
  gap: 9px;
  overflow-x: auto;
  max-width: calc(100% + 32px);
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
.hvm-market-card { padding: 15px; cursor: pointer; }
.hvm-market-card:hover { border-color: rgba(212,168,75,.35); background: rgba(255,255,255,.07); }
.hvm-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none;
  color: #d4a84b; font-size: 13px; font-weight: 700;
  padding: 0; cursor: pointer; min-height: 44px;
  letter-spacing: .04em;
}
.hvm-back-btn:hover { opacity: .7; }
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
.hvm-module-card { display: flex; gap: 13px; padding: 15px; cursor: pointer; }
.hvm-module-card:hover { border-color: rgba(212,168,75,.35); background: rgba(255,255,255,.07); }
.hvm-module-card > span { flex: 0 0 34px; font-size: 28px; line-height: 1; }
.hvm-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
.hvm-trigger-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.hvm-muni-row { display: flex; align-items: flex-start; gap: 10px; }
.hvm-muni-badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; flex-shrink: 0; }
.hvm-muni-badge--high   { background: rgba(230,165,51,.15); color: #e6a533; }
.hvm-muni-badge--medium { background: rgba(91,155,213,.15); color: #5b9bd5; }
.hvm-muni-badge--low    { background: rgba(76,175,130,.15);  color: #4caf82; }
.hvm-notif-row { display: flex; align-items: center; gap: 12px; }
.hvm-toggle {
  flex-shrink: 0; width: 46px; height: 26px; border-radius: 13px;
  border: none; cursor: pointer; position: relative; transition: background .2s;
  background: rgba(255,255,255,.15);
}
.hvm-toggle.on { background: #4caf82; }
.hvm-toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left .2s;
}
.hvm-toggle.on .hvm-toggle-thumb { left: 23px; }
.hvm-settings-label { display: grid; gap: 7px; color: rgba(245,240,232,.55); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.hvm-settings-select {
  width: 100%; min-height: 50px; border: 1px solid rgba(255,255,255,.13);
  border-radius: 14px; background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.94); padding: 0 14px; font-size: 16px; outline: none;
}
.hvm-settings-select option { color: #07111d; }
.hvm-signout-btn {
  width: 100%; min-height: 50px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.7); font-size: 15px; font-weight: 700; cursor: pointer;
}
@media (orientation: landscape) and (max-width: 767px) {
  .hvm-titlebar { padding-top: calc(8px + env(safe-area-inset-top, 0px)); padding-bottom: 8px; }
  .hvm-titlebar h1 { font-size: clamp(24px, 6vw, 34px); }
  .hvm-scroll-tabs { top: calc(66px + env(safe-area-inset-top, 0px)); }
  .hvm-status-grid, .hvm-meta-grid, .hvm-source-ledger { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hvm-bottom-nav button { min-height: 54px; }
}
`
