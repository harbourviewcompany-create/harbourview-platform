'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CountryIntelProfile, PipelineCounts, WantedListing, PathwayData, WatchlistData, LocalIntelData, SourceCoverageRow, EvidenceData, LiveEduTile, RecentEduModule, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { DashboardMarketplaceRows, MarketRow, MarketView, CommandPage, DigestWindow } from '@/components/dashboard/CommandCentre'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { complianceRegions } from '@/lib/compliance/regions'
import { GeneticsRequestModal } from './GeneticsRequestModal'
import { formatOpportunityScore, opportunityScoreTone } from '@/lib/dashboard/opportunityScore'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'


type PublicServiceProvider = {
  id: string; displayName: string; service_category: string
  service_summary: string; country_code: string | null
  jurisdiction_label: string | null; verification_level: string
}
type PublicCollaborationProject = {
  id: string; slug: string; title: string; projectType: string
  status: string; countryCode: string | null; jurisdictionLabel: string | null
  publicSummary: string; evidenceNeeded: string | null; cta: string
}

type Props = {
  signals: DashboardSignal[]
  digestSignals?: DashboardSignal[]
  digestWindow?: DigestWindow
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  initialPage?: string | null
  wantedCount?: number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?: PipelineCounts
  wantedListings?: WantedListing[]
  countryIntel?: CountryIntelProfile | null
  localIntel?:      LocalIntelData | null
  pathwayData?:  PathwayData | null
  watchlistData?: WatchlistData | null
  evidenceData?:     EvidenceData
  liveTiles?:           LiveEduTile[]
  recentEduModules?:    RecentEduModule[]
  sourceCoverage?:      SourceCoverageRow[]
  countryEducationOverlays?: CountryEducationOverlay[]
  jurisdictionPlaybook?: JurisdictionPlaybook
  educationTracks?:     EducationTrack[]
  marketMetrics?:       MarketMetric[]
  tradeFlows?:          TradeFlow[]
  professionals?:       HvProfessional[]
  cannabisOperators?:   CannabisOperator[]
  userEmail?:           string | null
  cultivarPassports?:   PublicCultivarPassportDTO[]
  serviceProviders?:    PublicServiceProvider[]
  collaborationProjects?: PublicCollaborationProject[]
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
  rating: number
  reviewCount: number
}

const COUNTRIES: CountryOption[] = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

const MOBILE_NAV: { id: CommandPage; label: string; icon: string }[] = [
  { id: 'briefing',        label: 'Briefing',       icon: '◎' },
  { id: 'digest',          label: 'Digest',         icon: '❑' },
  { id: 'marketplace',     label: 'Market',         icon: '⊞' },
  { id: 'signals',         label: 'Intel',          icon: '≋' },
  { id: 'education',       label: 'Education',      icon: '⬡' },
  { id: 'genetics',        label: 'Genetics',       icon: '⊕' },
  { id: 'countries',       label: 'Countries',      icon: '⊗' },
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

const SOURCE_TYPE_LABELS: Record<string, string> = {
  regulator:                  'Regulatory Authority',
  government:                 'Government',
  government_notices:         'Government Notices',
  trade:                      'Trade & Industry',
  news:                       'News & Media',
  news_media:                 'News & Media',
  academic:                   'Academic',
  clinical:                   'Clinical Research',
  industry:                   'Industry',
  international:              'International',
  marketplace:                'Marketplace',
  education:                  'Educational',
  cannabis_licence_database:  'Licence Database',
  laboratory:                 'Laboratory',
  legal:                      'Legal & Compliance',
  packaging_supplier:         'Packaging & Supply',
  importer_distributor_list:  'Importer / Distributor',
  distributor:                'Distributor',
  pharmacy:                   'Pharmacy',
  association:                'Industry Association',
  ngo:                        'NGO / Advocacy',
  standard_setter:            'Standards Body',
}

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
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function fieldValue(value: string | number | null | undefined, fallback = PENDING_REVIEW): string {
  if (typeof value === 'number') return String(value)
  const raw = value && value.trim() ? value.trim() : fallback
  if (FIELD_LABELS[raw]) return FIELD_LABELS[raw]
  return raw
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatLastChecked(lastChecked?: string | Date | null): string {
  if (!lastChecked) return ''
  const d = new Date(lastChecked)
  if (Number.isNaN(d.getTime())) return ''
  return ` · Checked ${d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })}`
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
      rating: 0,
      reviewCount: 0,
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
    rating: Number(row[8]) || 0,
    reviewCount: Number(row[9]) || 0,
  }
}

function freshnessLabel(lastChecked?: string | Date | null): string {
  if (!lastChecked) return 'Not checked'
  const d = typeof lastChecked === 'string' ? new Date(lastChecked) : lastChecked
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function confFromRel(reliability?: string | null): number {
  if (!reliability) return 50
  const r = reliability.toLowerCase()
  if (r === 'high' || r === 'verified') return 90
  if (r === 'medium' || r === 'moderate') return 65
  if (r === 'low') return 35
  return 50
}

function buildConfBars(items: { confidence: number }[], bins = 5): number[] {
  const counts = Array.from({ length: bins }, () => 0)
  for (const item of items) {
    const idx = Math.min(Math.floor(item.confidence / (100 / bins)), bins - 1)
    counts[idx]++
  }
  return counts
}

function confOverallPct(items: { confidence: number }[]): number {
  if (!items.length) return 0
  return Math.round(items.reduce((s, i) => s + i.confidence, 0) / items.length)
}

function deriveImp(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 80) return 'high'
  if (confidence >= 55) return 'medium'
  return 'low'
}

function SectionCard({ label, title, detail, tone = 'neutral' }: { label: string; title: string; detail?: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  return (
    <div className={`hvm-card hvm-card-${tone}`}>
      <div className="hvm-kicker">{label}</div>
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
    </div>
  )
}

function MobileAccordion({ title, children, defaultOpen = false }: { title: string; children?: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="hvm-accordion" open={defaultOpen}>
      <summary>{title}<span>⌄</span></summary>
      <div className="hvm-accordion-body">{children}</div>
    </details>
  )
}

function BriefingOverview({ country, roleLabel, countryIntel, signals, marketMetrics = [], tradeFlows = [], onOpenSettings }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; signals: DashboardSignal[]; marketMetrics?: MarketMetric[]; tradeFlows?: TradeFlow[]; onOpenSettings?: () => void }) {
  const summary = countryIntel?.public_summary?.trim()
    || `${country.label} dashboard context is available for ${roleLabel}.`

  const programStatus = countryIntel?.briefing_program_status
    || fieldValue(countryIntel?.medical_status, 'Regulated medical access')

  const hasJurisdictionBriefing = !!(
    countryIntel?.briefing_patient_access ||
    countryIntel?.briefing_physician_access ||
    countryIntel?.briefing_market_dynamics ||
    countryIntel?.briefing_regulatory_outlook ||
    countryIntel?.briefing_regulatory_body
  )

  return (
    <>
      <section className="hvm-hero-card">
        <div className="hvm-country-row">
          <span className="hvm-country-mark">{flagEmoji(country.iso2)}</span>
          <div>
            <h2>{country.label}</h2>
            <p>{roleLabel}</p>
          </div>
        </div>
        <blockquote>{summary}</blockquote>
        {programStatus && (
          <div className="hvm-program-badge">{programStatus}</div>
        )}
      </section>

      <div className="hvm-status-grid">
        <SectionCard label="Import status" title={fieldValue(countryIntel?.import_status, 'Contact for status')} tone={countryIntel?.import_status === 'open' ? 'ok' : 'neutral'} />
        <SectionCard label="Export status" title={fieldValue(countryIntel?.export_status, 'Contact for status')} />
        <SectionCard label="Market access" title={fieldValue(countryIntel?.market_access_status, 'Review required')} />
        <SectionCard label="Adult-use" title={fieldValue(countryIntel?.adult_use_status, 'Not applicable')} />
      </div>

      {hasJurisdictionBriefing && (
        <>
          {countryIntel?.briefing_patient_access && (
            <MobileAccordion title="Patient &amp; consumer access" defaultOpen>
              <p className="hvm-briefing-body">{countryIntel.briefing_patient_access}</p>
            </MobileAccordion>
          )}

          {countryIntel?.briefing_physician_access && (
            <MobileAccordion title="Physician &amp; prescriber access">
              <p className="hvm-briefing-body">{countryIntel.briefing_physician_access}</p>
            </MobileAccordion>
          )}

          {countryIntel?.briefing_market_dynamics && (
            <MobileAccordion title="Market dynamics">
              <p className="hvm-briefing-body">{countryIntel.briefing_market_dynamics}</p>
            </MobileAccordion>
          )}

          {countryIntel?.briefing_regulatory_outlook && (
            <MobileAccordion title="Regulatory outlook">
              <p className="hvm-briefing-body">{countryIntel.briefing_regulatory_outlook}</p>
            </MobileAccordion>
          )}

          {countryIntel?.briefing_regulatory_body && (
            <div className="hvm-regulator-row">
              <span className="hvm-kicker">Competent authority</span>
              <span>{countryIntel.briefing_regulatory_body}</span>
            </div>
          )}
        </>
      )}

      {signals.length > 0 && (
        <MobileAccordion title={`Recent intelligence signals (${signals.length})`} defaultOpen>
          <div className="hvm-list-stack">
            {signals.slice(0, 4).map((signal, index) => {
              const cat = signal.type?.toLowerCase().includes('reg') || signal.type?.toLowerCase().includes('policy') ? 'regulatory' :
                          signal.type?.toLowerCase().includes('market') || signal.type?.toLowerCase().includes('trade') ? 'economic' : 'trade'
              const catColor = cat === 'regulatory' ? '#5b9bd5' : cat === 'economic' ? '#d4a84b' : '#4caf82'
              const confColor = signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555'
              return (
                <div className="hvm-signal-card hvm-signal-card--rich" key={`${signal.title}-${index}`} style={{ borderLeft: `3px solid ${catColor}` }}>
                  <div className="hvm-sig-head">
                    <span className="hvm-sig-cat-chip" style={{ '--chip-color': catColor } as React.CSSProperties}>{cat.toUpperCase()}</span>
                    <span className="hvm-sig-market">{signal.market}</span>
                    <span className="hvm-sig-time">{signal.timeAgo}</span>
                  </div>
                  <div className="hvm-sig-title">{signal.flag} {signal.title}</div>
                  <p className="hvm-signal-impact">{signal.commercialImpact}</p>
                  <div className="hvm-sig-footer">
                    <div className="hvm-sig-conf-bar">
                      <div className="hvm-sig-conf-fill" style={{ width: `${signal.confidence}%`, background: confColor }} />
                    </div>
                    <span className="hvm-sig-conf-val" style={{ color: confColor }}>{signal.confidence}%</span>
                  </div>
                </div>
              )
            })}
            {signals.length > 4 && (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <span style={{ fontSize: 12, color: '#d4a84b', fontWeight: 600 }}>+{signals.length - 4} more · tap Intel tab for full feed</span>
              </div>
            )}
          </div>
        </MobileAccordion>
      )}

      {marketMetrics.length > 0 && (
        <MobileAccordion title={`Market metrics (${marketMetrics.length})`}>
          <div className="hvm-ledger-table" role="table" aria-label="Market metrics">
            {marketMetrics.slice(0, 8).map((m, i) => (
              <div role="row" key={i}>
                <strong>{m.metric_name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong>
                <span>{m.metric_value.toLocaleString()}{m.metric_unit ? ` ${m.metric_unit}` : ''}</span>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {tradeFlows.length > 0 && (
        <MobileAccordion title={`Trade flows (${tradeFlows.length})`}>
          <div className="hvm-list-stack">
            {tradeFlows.slice(0, 6).map((t, i) => (
              <div className="hvm-signal-card" key={i}>
                <strong>{t.origin_iso2} → {t.destination_iso2}</strong>
                <small>
                  {t.product_category ?? 'Cannabis'}
                  {t.legal_status ? ` · ${t.legal_status}` : ''}
                  {t.permit_required != null ? ` · Permit: ${t.permit_required ? 'required' : 'not required'}` : ''}
                </small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {signals.length >= 2 && (() => {
        const regionMap: Record<string, number> = {}
        for (const s of signals) { if (s.market) regionMap[s.market] = (regionMap[s.market] ?? 0) + 1 }
        const regions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
        if (regions.length < 2) return null
        return (
          <MobileAccordion title={`Watch regions (${regions.length})`}>
            <div className="hvm-ledger-table" role="table" aria-label="Watch regions">
              {regions.map(([market, count]) => (
                <div role="row" key={market}>
                  <strong>{market}</strong>
                  <span>{count} signal{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </MobileAccordion>
        )
      })()}

      {signals.length >= 3 && (() => {
        const avg = confOverallPct(signals)
        const bars = buildConfBars(signals)
        const maxBar = Math.max(...bars, 1)
        return (
          <MobileAccordion title={`Evidence confidence · ${avg}% avg`}>
            <div className="hvm-hist-bar-wrap">
              {bars.map((count, i) => (
                <div key={i} className="hvm-conf-bar-col">
                  <div className="hvm-conf-bar-track">
                    <div className="hvm-hist-bar-fill" style={{ height: `${Math.round((count / maxBar) * 100)}%` }} />
                  </div>
                  <span>{(i + 1) * 20}%</span>
                </div>
              ))}
            </div>
            <div className="hvm-ledger-table" style={{ marginTop: 10 }} role="table" aria-label="Confidence stats">
              <div role="row"><strong>Signals</strong><span>{signals.length}</span></div>
              <div role="row"><strong>Avg confidence</strong><span>{avg}%</span></div>
              <div role="row"><strong>High (≥80%)</strong><span>{signals.filter(s => s.confidence >= 80).length}</span></div>
            </div>
          </MobileAccordion>
        )
      })()}
    </>
  )
}

type BriefingSub = 'overview' | 'compliance' | 'local-intel' | 'access-pathway'

const BRIEF_TABS: { id: BriefingSub; label: string }[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'compliance',     label: 'Compliance' },
  { id: 'local-intel',    label: 'Local Intel' },
  { id: 'access-pathway', label: 'Access Pathway' },
]

function BriefingMobile({ country, roleLabel, countryIntel, signals, pathwayData, localIntel, marketMetrics, tradeFlows, jurisdictionPlaybook, onOpenSettings, sub }: { country: CountryOption; roleLabel: string; roleId: string; countryIntel?: CountryIntelProfile | null; signals: DashboardSignal[]; pathwayData?: PathwayData | null; localIntel?: LocalIntelData | null; countryOptions: SelectOption[]; roleOptions: SelectOption[]; marketMetrics?: MarketMetric[]; tradeFlows?: TradeFlow[]; jurisdictionPlaybook?: JurisdictionPlaybook; onCountryChange: (iso2: string) => void; onRoleChange: (r: string) => void; onOpenSettings: () => void; sub: BriefingSub; userEmail?: string | null }) {
  return (
    <div className="hvm-page-stack">
      {sub === 'overview'       && <BriefingOverview country={country} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals} marketMetrics={marketMetrics} tradeFlows={tradeFlows} onOpenSettings={onOpenSettings} />}
      {sub === 'compliance'     && <ComplianceMobile country={country} countryIntel={countryIntel} jurisdictionPlaybook={jurisdictionPlaybook} />}
      {sub === 'local-intel'    && <LocalIntelMobile country={country} roleLabel={roleLabel} signals={signals} localIntel={localIntel} countryIntel={countryIntel} />}
      {sub === 'access-pathway' && <AccessPathwayMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} pathwayData={pathwayData} jurisdictionPlaybook={jurisdictionPlaybook} />}
    </div>
  )
}

function AccessPathwayMobile({ country, roleLabel, countryIntel, pathwayData, jurisdictionPlaybook }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; pathwayData?: PathwayData | null; jurisdictionPlaybook?: JurisdictionPlaybook }) {
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

      {progress && pathwayData?.template && (
        <div className="hvm-ledger-table" role="table" aria-label="Pathway progress">
          <div role="row"><strong>Current step</strong><span>{progress.current_step} of {pathwayData.template.total_steps}</span></div>
          <div role="row"><strong>Overall progress</strong><span>{Math.round((progress.current_step / pathwayData.template.total_steps) * 100)}%</span></div>
          {progress.status && <div role="row"><strong>Status</strong><span>{fieldValue(progress.status)}</span></div>}
        </div>
      )}

      <div className="hvm-pathway-steps">
        {hasSteps ? steps.map(step => {
          const reqs = requirements.filter(r => r.step_id === step.id)
          const doneCount = reqs.filter(r => {
            const s = statuses.find(rs => rs.requirement_id === r.id)
            return s?.status === 'verified' || s?.status === 'waived'
          }).length
          const tone = reqs.length > 0 && doneCount === reqs.length ? 'ok' : 'neutral'
          const pct = reqs.length > 0 ? Math.round((doneCount / reqs.length) * 100) : 0
          if (reqs.length > 0) {
            return (
              <MobileAccordion key={step.id} title={`${step.step_number}. ${step.title} — ${doneCount}/${reqs.length} met`} defaultOpen={step.step_number === 1}>
                <div style={{ marginBottom: 10 }}>
                  <div className="hvm-conf-bar-track" style={{ height: 6, borderRadius: 3 }}>
                    <div className="hvm-hist-bar-fill" style={{ height: '100%', width: `${pct}%`, borderRadius: 3 }} />
                  </div>
                </div>
                {step.description && (
                  <p style={{ fontSize: 13, color: 'rgba(245,240,232,.65)', margin: '0 0 10px', lineHeight: 1.5 }}>{step.description}</p>
                )}
                <div className="hvm-list-stack">
                  {reqs.map(req => {
                    const st = statuses.find(rs => rs.requirement_id === req.id)
                    const done = st?.status === 'verified' || st?.status === 'waived'
                    return (
                      <div className="hvm-signal-card" key={req.id} style={{ opacity: done ? 0.7 : 1 }}>
                        <strong style={{ fontSize: 14 }}>{done ? '✓ ' : '○ '}{req.title}</strong>
                        {req.description && <p className="hvm-signal-impact">{req.description}</p>}
                        <small>{fieldValue(st?.status, 'Not started')} · {req.evidence_type.replace(/_/g, ' ')}</small>
                      </div>
                    )
                  })}
                </div>
              </MobileAccordion>
            )
          }
          return (
            <SectionCard
              key={step.id}
              label={`${step.step_number} · ${step.title}`}
              title={step.description ?? 'Complete this step to advance your access pathway.'}
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

      {jurisdictionPlaybook && (
        <MobileAccordion title="Jurisdiction playbook">
          <div className="hvm-ledger-table" role="table" aria-label="Jurisdiction playbook">
            {jurisdictionPlaybook.difficulty && (
              <div role="row"><strong>Difficulty</strong><span>{jurisdictionPlaybook.difficulty}</span></div>
            )}
            {jurisdictionPlaybook.typical_timeline_months && (
              <div role="row"><strong>Timeline</strong><span>{jurisdictionPlaybook.typical_timeline_months} months</span></div>
            )}
            {jurisdictionPlaybook.estimated_cost_range && (
              <div role="row"><strong>Est. cost</strong><span>{jurisdictionPlaybook.estimated_cost_range}</span></div>
            )}
          </div>
          {jurisdictionPlaybook.legal_framework_summary && (
            <p style={{ fontSize: 13, color: 'rgba(245,240,232,.65)', lineHeight: 1.55, margin: '10px 0 0' }}>
              {jurisdictionPlaybook.legal_framework_summary}
            </p>
          )}
          {jurisdictionPlaybook.common_pitfalls.length > 0 && (
            <div className="hvm-list-stack" style={{ marginTop: 10 }}>
              {jurisdictionPlaybook.common_pitfalls.slice(0, 3).map((p, i) => (
                <div className="hvm-signal-card" key={i} style={{ color: 'rgba(229,115,115,.85)' }}>
                  <strong>⚠ {p}</strong>
                </div>
              ))}
            </div>
          )}
        </MobileAccordion>
      )}
    </div>
  )
}

function getDefaultMarketTab(rows?: Partial<DashboardMarketplaceRows>, wanted: WantedListing[] = []): MarketView {
  for (const tab of MARKET_TABS) {
    if (tab.id === 'wanted') { if (wanted.length > 0) return 'wanted' }
    else if ((rows?.[tab.id] ?? []).length > 0) return tab.id
  }
  return 'cannabis'
}

function MarketplaceMobile({ country, marketplaceRows, wantedListings = [], wantedCount = 0, cannabisOperators = [], pipeline }: { country: CountryOption; marketplaceRows?: Partial<DashboardMarketplaceRows>; wantedListings?: WantedListing[]; wantedCount?: number; cannabisOperators?: CannabisOperator[]; pipeline?: PipelineCounts }) {
  const [activeTab, setActiveTab] = useState<MarketView>(() => getDefaultMarketTab(marketplaceRows, wantedListings))
  const [search, setSearch] = useState('')
  const [sortByRating, setSortByRating] = useState(false)
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
        rating: 0,
        reviewCount: 0,
      }))
    }

    return (marketplaceRows?.[activeTab as MarketView] ?? []).map((row, index) => normalizeMarketRow(row, index, country))
  }, [activeTab, marketplaceRows, wantedListings, country])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q
      ? cards.filter(card => [card.title, card.description, card.category, card.jurisdiction].join(' ').toLowerCase().includes(q))
      : cards
    if (sortByRating) {
      list = [...list].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    }
    return list
  }, [cards, search, sortByRating])

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
        <div className="hvm-hero-actions">
          <Link href="/supplier-directory" className="hvm-hero-link">Browse supplier profiles →</Link>
          <Link href="/supplier-directory/apply" className="hvm-hero-link hvm-hero-link--gold">Apply as a supplier →</Link>
        </div>
      </section>

      <div className="hvm-scroll-tabs" role="tablist" aria-label="Marketplace views">
        {MARKET_TABS.map(tab => {
          const count = tab.id === 'wanted' ? wantedListings.length : (marketplaceRows?.[tab.id] ?? []).length
          return (
            <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
              {tab.label}{count > 0 ? <span className="hvm-tab-count">{count}</span> : null}
            </button>
          )
        })}
      </div>

      <label className="hvm-search-label">
        <span>Search listings</span>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search public marketplace summaries…" />
      </label>

      <button
        type="button"
        className={`hvm-sort-toggle${sortByRating ? ' active' : ''}`}
        onClick={() => setSortByRating(v => !v)}
      >
        {sortByRating ? '★ Sorted by top rated' : 'Sort by top rated'}
      </button>

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
              {card.rating > 0 && card.reviewCount > 0 ? (
                <span className="hvm-market-rating">★ {card.rating.toFixed(1)} ({card.reviewCount})</span>
              ) : null}
              <strong>{card.action}</strong>
            </div>
          </article>
        )) : (
          <div className="hvm-empty-card">
            <strong>No {MARKET_TABS.find(tab => tab.id === activeTab)?.label.toLowerCase()} listings for {country.label} yet.</strong>
            {(() => {
              const populated = MARKET_TABS.filter(t => t.id !== activeTab && (t.id === 'wanted' ? wantedListings.length > 0 : (marketplaceRows?.[t.id] ?? []).length > 0))
              return populated.length > 0
                ? <p>Try {populated.map(t => t.label).join(', ')} — those tabs have available listings. Use wanted demand or submit the country-role pathway for review. This is not a data leak or private source fallback.</p>
                : <p>Supply routes for this market are managed through Harbourview-mediated review, not public listing.</p>
            })()}
            <div className="hvm-empty-actions">
              <Link href="/supplier-directory/apply" className="hvm-empty-link hvm-empty-link--primary">Apply as a supplier →</Link>
              <Link href="/supplier-directory" className="hvm-empty-link">Browse supplier directory →</Link>
            </div>
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

      {cannabisOperators.length > 0 && (
        <MobileAccordion title={`Verified operators — ${country.label} (${cannabisOperators.length})`}>
          <div className="hvm-list-stack">
            {cannabisOperators.slice(0, 8).map(op => (
              <div className="hvm-signal-card" key={op.id}>
                <strong>{op.legal_name}</strong>
                <small>
                  {op.operator_type ?? 'Operator'}
                  {op.verification_status === 'verified' ? ' · ✓ Verified' : ' · Pending'}
                </small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {pipeline && (pipeline.wanted + pipeline.matched + pipeline.proof_review + pipeline.inquiry + pipeline.deal_room) > 0 && (
        <MobileAccordion title="Pipeline status">
          <div className="hvm-meta-grid">
            {[
              { label: 'Wanted demand', value: pipeline.wanted },
              { label: 'Matched',       value: pipeline.matched },
              { label: 'Proof review',  value: pipeline.proof_review },
              { label: 'Inquiry',       value: pipeline.inquiry },
              { label: 'Deal room',     value: pipeline.deal_room },
            ].filter(r => r.value > 0).map(r => (
              <SectionCard key={r.label} label={r.label} title={`${r.value} active`} />
            ))}
          </div>
        </MobileAccordion>
      )}

      <div className="hvm-supplier-cta">
        <div className="hvm-supplier-cta-kicker">Supplier Directory</div>
        <div className="hvm-supplier-cta-title">List your company in the Harbourview Supplier Directory</div>
        <p className="hvm-supplier-cta-body">Reviewed profiles for producers, distributors, equipment vendors and service providers operating in regulated cannabis markets. Every submission is individually reviewed before publication.</p>
        <div className="hvm-supplier-cta-actions">
          <Link href="/supplier-directory/apply" className="hvm-supplier-cta-btn">Apply as a supplier</Link>
          <Link href="/supplier-directory" className="hvm-supplier-cta-link">Browse directory →</Link>
        </div>
      </div>
    </div>
  )
}

type EvidenceTypeTab = 'all' | 'regulatory' | 'market' | 'clinical' | 'education'
const EVIDENCE_TYPE_TABS: { id: EvidenceTypeTab; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'market',     label: 'Market' },
  { id: 'clinical',   label: 'Clinical' },
  { id: 'education',  label: 'Education' },
]

const EVIDENCE_TYPE_MAP: Record<string, EvidenceTypeTab> = {
  regulator: 'regulatory', government: 'regulatory', government_notices: 'regulatory', legal: 'regulatory',
  trade: 'market', marketplace: 'market', industry: 'market', importer_distributor_list: 'market',
  cannabis_licence_database: 'market',
  academic: 'clinical', clinical: 'clinical', laboratory: 'clinical',
  education: 'education',
}

function EvidenceMobile({ country, roleLabel, countryIntel, evidenceData, sourceCoverage, professionals = [] }: { country: CountryOption; roleLabel: string; countryIntel?: CountryIntelProfile | null; evidenceData?: EvidenceData; sourceCoverage?: SourceCoverageRow[]; professionals?: HvProfessional[] }) {
  const reviewed = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  const sources = evidenceData?.sources ?? []
  const orgDocs = evidenceData?.orgDocs ?? []
  const coverage = sourceCoverage ?? []
  const [activeEvidenceType, setActiveEvidenceType] = useState<EvidenceTypeTab>('all')

  const filteredSources = useMemo(() => {
    if (activeEvidenceType === 'all') return sources
    return sources.filter(s => (EVIDENCE_TYPE_MAP[s.category] ?? 'market') === activeEvidenceType)
  }, [sources, activeEvidenceType])

  const avgConf = useMemo(() => {
    const withRel = sources.filter(s => s.reliability)
    if (!withRel.length) return 0
    return Math.round(withRel.reduce((sum, s) => sum + confFromRel(s.reliability), 0) / withRel.length)
  }, [sources])

  const staleCount = useMemo(() => {
    return sources.filter(s => {
      if (!s.last_checked) return true
      const days = Math.floor((Date.now() - new Date(s.last_checked).getTime()) / 86400000)
      return days > 90
    }).length
  }, [sources])

  const evidenceGaps = useMemo(() => {
    const covered = new Set(sources.map(s => s.category))
    const critical = ['regulator', 'government', 'legal', 'trade', 'academic']
    return critical.filter(c => !covered.has(c)).map(c => SOURCE_TYPE_LABELS[c] ?? c)
  }, [sources])

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <h2>Evidence &amp; Sources</h2>
        <p>{country.label} · {roleLabel}</p>
      </section>

      {sources.length > 0 && (
        <div className="hvm-status-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <SectionCard label="Sources" title={String(sources.length)} tone="ok" />
          <SectionCard label="Avg confidence" title={avgConf > 0 ? `${avgConf}%` : 'N/A'} />
          <SectionCard label="Stale (>90d)" title={String(staleCount)} tone={staleCount > 0 ? 'warn' : 'ok'} />
          <SectionCard label="Evidence gaps" title={evidenceGaps.length > 0 ? String(evidenceGaps.length) : 'None'} tone={evidenceGaps.length > 0 ? 'warn' : 'ok'} />
        </div>
      )}

      {sources.length > 0 && (
        <div className="hvm-scroll-tabs" role="tablist" aria-label="Evidence type filter">
          {EVIDENCE_TYPE_TABS.map(tab => (
            <button key={tab.id} type="button" className={activeEvidenceType === tab.id ? 'active' : ''} onClick={() => setActiveEvidenceType(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {sources.length > 0 ? (
        <MobileAccordion title={`Platform sources (${filteredSources.length})`} defaultOpen>
          <div className="hvm-list-stack">
            {filteredSources.slice(0, 8).map(src => (
              <div className="hvm-signal-card" key={src.id}>
                <strong>{src.name}</strong>
                <small>
                  {SOURCE_TYPE_LABELS[src.category] ?? fieldValue(src.category)}
                  {' · '}{fieldValue(src.reliability)} reliability
                  {src.last_checked ? ` · ${freshnessLabel(src.last_checked)}` : ''}
                </small>
                {src.markets && src.markets.length > 0 && (
                  <p className="hvm-signal-impact">
                    {src.markets.slice(0, 4).join(' · ')}{src.markets.length > 4 ? ` +${src.markets.length - 4} more` : ''}
                  </p>
                )}
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
                <strong>
                  {SOURCE_TYPE_LABELS[row.source_type]
                    ?? row.source_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  } · Tier {row.tier}
                </strong>
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

      {sources.length > 0 && (
        <MobileAccordion title="Source freshness status">
          <div className="hvm-ledger-table" role="table" aria-label="Source freshness">
            {sources.slice(0, 6).map(src => (
              <div role="row" key={src.id}>
                <strong>{src.name.length > 30 ? src.name.slice(0, 30) + '…' : src.name}</strong>
                <span>{src.last_checked ? freshnessLabel(src.last_checked) : 'Not checked'}</span>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {evidenceGaps.length > 0 && (
        <MobileAccordion title={`Evidence gaps (${evidenceGaps.length})`}>
          <div className="hvm-list-stack">
            {evidenceGaps.map((gap, i) => (
              <div className="hvm-signal-card" key={i} style={{ color: 'rgba(230,165,51,.85)' }}>
                <strong>⚠ {gap} — not yet indexed for {country.label}</strong>
                <p className="hvm-signal-impact">Submit a source verification request to prioritise coverage for this category.</p>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {professionals.length > 0 && (
        <MobileAccordion title={`Verified professionals (${professionals.length})`}>
          <div className="hvm-list-stack">
            {professionals.slice(0, 6).map(p => (
              <div className="hvm-signal-card" key={p.id}>
                <strong>{p.full_name}</strong>
                <small>
                  {p.title ?? p.credential_type ?? 'Professional'}
                  {p.institution ? ` · ${p.institution}` : ''}
                  {p.accepts_referrals ? ' · Accepts referrals' : ''}
                </small>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}
    </div>
  )
}

type EduModule = { icon: string; title: string; desc: string; slug?: string; sections?: { heading: string; body: string }[] }

type EduSub = 'modules' | 'research'

const EDU_TABS: { id: EduSub; label: string }[] = [
  { id: 'modules',  label: 'Modules' },
  { id: 'research', label: 'Research' },
]

function EducationMobile({ country, roleLabel, eduCategories, liveTiles, recentEduModules, educationTracks = [], evidenceData, sourceCoverage, countryEducationOverlays, professionals = [], initialSub = 'modules' }: { country: CountryOption; roleLabel: string; eduCategories: { icon: string; title: string; desc: string }[]; liveTiles?: LiveEduTile[]; recentEduModules?: RecentEduModule[]; educationTracks?: EducationTrack[]; evidenceData?: EvidenceData; sourceCoverage?: SourceCoverageRow[]; countryEducationOverlays?: CountryEducationOverlay[]; professionals?: HvProfessional[]; initialSub?: EduSub }) {
  const [sub, setSub] = useState<EduSub>(initialSub)
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
    const hasRealSections = (selectedModule.sections?.length ?? 0) > 0
    const { topics, action, isVerified } = hasRealSections
      ? { topics: [], action: `Request ${selectedModule.title} briefing`, isVerified: true }
      : getModuleContent(selectedModule.title, countryEducationOverlays)
    const isGap = selectedModule.title.toLowerCase().includes('evidence gap') || selectedModule.title.toLowerCase().includes('gap review')
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelectedModule(null)}>← Back to learning path</button>
        <section className={`hvm-hero-card compact${isGap ? ' hvm-hero-card--info' : ''}`}>
          <div className="hvm-kicker">{country.label} · {roleLabel}</div>
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>{isGap ? '📋' : selectedModule.icon}</div>
          <h2>{isGap ? 'Pathway in review' : selectedModule.title}</h2>
          <p>{isGap ? `Harbourview is building verified intelligence for ${country.label} · ${roleLabel}. Interim guidance is available below.` : selectedModule.desc}</p>
          {!isVerified && !isGap && (
            <div className="hvm-kicker" style={{ color: 'rgba(198,165,90,.6)', marginTop: 8 }}>
              General guidance — not yet verified for {country.label}
            </div>
          )}
        </section>
        {hasRealSections ? (
          <div className="hvm-list-stack">
            {selectedModule.sections!.map((section, i) => (
              <div className="hvm-card" key={i}>
                <div className="hvm-kicker">{section.heading}</div>
                <p style={{ margin: '4px 0 0', color: 'rgba(245,240,232,.85)', fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{section.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="hvm-list-stack">
            {topics.map((topic, i) => (
              <div className="hvm-card" key={i}>
                <div className="hvm-kicker">{isGap ? `Step ${i + 1}` : `Topic ${i + 1}`}</div>
                <p style={{ margin: '4px 0 0', color: 'rgba(245,240,232,.85)', fontSize: 15, lineHeight: 1.55 }}>{topic}</p>
              </div>
            ))}
          </div>
        )}
        <a href={`/intake?country=${country.iso2}&role=${encodeURIComponent(roleLabel)}&module=${encodeURIComponent(selectedModule.title)}`} className="hvm-cta-card">
          <span className="hvm-kicker">Next step</span>
          <strong>{action} · {country.label}</strong>
          <span className="hvm-cta-arrow">Get briefing →</span>
        </a>
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

          {tiles.length > 0 && (
            <a href="/intake" className="hvm-cta-card">
              <span className="hvm-kicker">Next best action</span>
              <strong>{tiles[0].title} · {country.label}</strong>
              <p style={{ margin: '6px 0 0', color: 'rgba(245,240,232,.62)', fontSize: 14, lineHeight: 1.45 }}>{tiles[0].desc}</p>
              <span className="hvm-cta-arrow">Start module →</span>
            </a>
          )}

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

          {educationTracks.length > 0 && (
            <MobileAccordion title={`Learning tracks (${educationTracks.length})`}>
              <div className="hvm-list-stack">
                {educationTracks.slice(0, 8).map(t => (
                  <div className="hvm-signal-card" key={t.id}>
                    <strong>{t.icon ?? '⬛'} {t.title}</strong>
                    <small>{t.level ?? 'Track'}{t.description ? ` · ${t.description.slice(0, 80)}` : ''}</small>
                  </div>
                ))}
              </div>
            </MobileAccordion>
          )}
        </>
      )}

      {sub === 'research' && (
        <EvidenceMobile country={country} roleLabel={roleLabel} evidenceData={evidenceData} sourceCoverage={sourceCoverage} professionals={professionals} />
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

const SIG_CATS = [
  { id: 'all',        label: 'All',        color: '#d4a84b' },
  { id: 'regulatory', label: 'Regulatory', color: '#5b9bd5' },
  { id: 'economic',   label: 'Economic',   color: '#d4a84b' },
  { id: 'trade',      label: 'Trade',      color: '#4caf82' },
] as const
type SigCat = typeof SIG_CATS[number]['id']

function classifySignal(type: string): Exclude<SigCat, 'all'> {
  const t = type.toLowerCase()
  if (t.includes('reg') || t.includes('policy') || t.includes('law') || t.includes('compliance')) return 'regulatory'
  if (t.includes('econ') || t.includes('market') || t.includes('price') || t.includes('demand')) return 'economic'
  return 'trade'
}

function SignalsFeed({ country, signals }: { country: CountryOption; signals: DashboardSignal[] }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<SigCat>('all')
  const [filterType, setFilterType] = useState('')
  const [filterImp, setFilterImp] = useState('')
  const [subState, setSubState] = useState<'idle'|'loading'|'subscribed'|'upgrade'|'error'>('idle')
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)

  const catCounts = useMemo(() => ({
    regulatory: signals.filter(s => classifySignal(s.type) === 'regulatory').length,
    economic:   signals.filter(s => classifySignal(s.type) === 'economic').length,
    trade:      signals.filter(s => classifySignal(s.type) === 'trade').length,
  }), [signals])

  // Signals whose `market` genuinely matches the country being viewed. When a
  // country has no reviewed signals yet, fetchDashboardSignals() backfills
  // the feed with recent global signals so the page isn't empty — but the
  // header must not claim those backfilled rows are "this period" activity
  // for the country. See AGENTS.md Depth & Competitive Bar rule 2.
  const countryLabelNorm = country.label?.trim().toLowerCase()
  const countryMatchCount = useMemo(
    () => signals.filter(s => s.market?.trim().toLowerCase() === countryLabelNorm).length,
    [signals, countryLabelNorm],
  )

  const signalTypes = useMemo(() => {
    const types = new Set<string>()
    for (const s of signals) {
      const t = s.title.toLowerCase()
      if (/regulatory|licen|compliance|reform|legislation|enforcement|permit/.test(t)) types.add('Regulatory')
      else if (/market|trade|import|export|supply/.test(t)) types.add('Market')
      else if (/clinical|medical|patient|prescription/.test(t)) types.add('Clinical')
      else types.add('General')
    }
    return Array.from(types)
  }, [signals])

  const filtered = useMemo(() => {
    let base = filterCat === 'all' ? signals : signals.filter(s => classifySignal(s.type) === filterCat)
    const q = search.trim().toLowerCase()
    if (q) base = base.filter(s => [s.title, s.market, s.commercialImpact].join(' ').toLowerCase().includes(q))
    if (filterType) {
      base = base.filter(s => {
        const t = s.title.toLowerCase()
        if (filterType === 'Regulatory') return /regulatory|licen|compliance|reform|legislation|enforcement|permit/.test(t)
        if (filterType === 'Market') return /market|trade|import|export|supply/.test(t)
        if (filterType === 'Clinical') return /clinical|medical|patient|prescription/.test(t)
        if (filterType === 'General') return !/regulatory|licen|compliance|reform|legislation|enforcement|permit|market|trade|import|export|supply|clinical|medical|patient|prescription/.test(t)
        return true
      })
    }
    if (filterImp) {
      base = base.filter(s => deriveImp(s.confidence) === filterImp)
    }
    return base
  }, [signals, search, filterCat, filterType, filterImp])

  const hasFilters = !!(search || filterType || filterImp)

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
    } catch { setSubState('error') }
  }

  async function handleUnsubscribe() {
    setSubState('loading')
    try {
      const res = await fetch('/api/signals/subscribe', { method: 'DELETE' })
      setSubState(res.ok ? 'idle' : 'error')
    } catch { setSubState('error') }
  }

  if (selectedSignal) {
    const cat = classifySignal(selectedSignal.type)
    const catColor = SIG_CATS.find(c => c.id === cat)?.color ?? '#d4a84b'
    const confColor = selectedSignal.confidence >= 80 ? '#4caf82' : selectedSignal.confidence >= 60 ? '#d4a84b' : '#e05555'
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelectedSignal(null)}>← Intelligence feed</button>
        <section className="hvm-hero-card compact" style={{ borderLeft: `3px solid ${catColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="hvm-sig-cat-chip" style={{ '--chip-color': catColor } as React.CSSProperties}>{cat.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace' }}>{selectedSignal.market}</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.3)', marginLeft: 'auto' }}>{selectedSignal.timeAgo}</span>
          </div>
          <h2 style={{ fontSize: 20 }}>{selectedSignal.flag} {selectedSignal.title}</h2>
        </section>

        <div className="hvm-sig-detail-grid">
          <div className="hvm-sig-detail-cell">
            <div className="hvm-kicker">Confidence</div>
            <div className="hvm-sig-conf-big" style={{ color: confColor }}>{selectedSignal.confidence}%</div>
            <div className="hvm-conf-bar-wrap"><div className="hvm-conf-bar-fill" style={{ width: `${selectedSignal.confidence}%`, background: confColor }} /></div>
          </div>
          <div className="hvm-sig-detail-cell">
            <div className="hvm-kicker">Source</div>
            <div style={{ fontSize: 13, color: 'rgba(245,240,232,.82)', lineHeight: 1.4, marginTop: 4 }}>{selectedSignal.sourceLabel ?? 'Harbourview Intelligence'}</div>
          </div>
        </div>

        <div className="hvm-card">
          <div className="hvm-kicker">Commercial impact</div>
          <p style={{ margin: '8px 0 0', color: 'rgba(245,240,232,.88)', fontSize: 14, lineHeight: 1.65 }}>{selectedSignal.commercialImpact}</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span className="hvm-tag-chip" style={{ background: selectedSignal.tag.bg, borderColor: selectedSignal.tag.border, color: selectedSignal.tag.color }}>{selectedSignal.tag.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className={`hvm-live-dot${countryMatchCount > 0 ? ' active' : ''}`} />
          <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em' }}>
            {countryMatchCount > 0 ? 'STREAM ACTIVE' : 'SCANNING'}
          </span>
        </div>
        <h2>Intelligence</h2>
        {countryMatchCount > 0 ? (
          <p>{country.label} · {countryMatchCount} signal{countryMatchCount !== 1 ? 's' : ''} this period</p>
        ) : (
          <p style={{ color: 'rgba(230,165,51,.85)' }}>
            ⚠ No reviewed signals for {country.label} yet — showing {signals.length} recent global signal{signals.length !== 1 ? 's' : ''} for context
          </p>
        )}
        <div className="hvm-sub-row">
          {subState === 'upgrade' ? (
            <span className="hvm-sub-upgrade">Intel plan required to subscribe</span>
          ) : subState === 'subscribed' ? (
            <button className="hvm-sub-btn active" onClick={handleUnsubscribe}>✓ Subscribed to daily signals</button>
          ) : (
            <button className="hvm-sub-btn" onClick={handleSubscribe} disabled={subState === 'loading'}>
              {subState === 'loading' ? 'Subscribing…' : '+ Subscribe to daily signals'}
            </button>
          )}
        </div>
      </section>

      {/* Category stats grid */}
      <div className="hvm-cat-grid">
        {SIG_CATS.map(cat => {
          const count = cat.id === 'all' ? signals.length : catCounts[cat.id]
          const active = filterCat === cat.id
          return (
            <button
              key={cat.id}
              className={`hvm-cat-cell${active ? ' active' : ''}`}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
              onClick={() => setFilterCat(cat.id)}
            >
              <span className="hvm-cat-count">{count}</span>
              <span className="hvm-cat-label">{cat.label}</span>
            </button>
          )
        })}
      </div>

      <label className="hvm-search-label">
        <span>Search signals</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Market, signal, impact…" />
      </label>

      {signalTypes.length > 1 && (
        <div className="hvm-filter-row">
          <select className="hvm-filter-sel" value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Filter by type">
            <option value="">All types</option>
            {signalTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="hvm-filter-sel" value={filterImp} onChange={e => setFilterImp(e.target.value)} aria-label="Filter by confidence">
            <option value="">All confidence</option>
            <option value="high">High ≥80%</option>
            <option value="medium">Medium 55–79%</option>
            <option value="low">Low &lt;55%</option>
          </select>
          {hasFilters && (
            <button type="button" className="hvm-clear-filters" onClick={() => { setSearch(''); setFilterType(''); setFilterImp('') }}>
              Clear
            </button>
          )}
        </div>
      )}

      <div className="hvm-list-stack">
        {filtered.length > 0 ? filtered.slice(0, 25).map((signal, index) => {
          const cat = classifySignal(signal.type)
          const catColor = SIG_CATS.find(c => c.id === cat)?.color ?? '#d4a84b'
          return (
            <div
              className="hvm-signal-card hvm-signal-card--tap hvm-signal-card--rich"
              key={`${signal.title}-${index}`}
              style={{ borderLeft: `3px solid ${catColor}` }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSignal(signal)}
              onKeyDown={e => e.key === 'Enter' && setSelectedSignal(signal)}
            >
              <div className="hvm-sig-head">
                <span className="hvm-sig-cat-chip" style={{ '--chip-color': catColor } as React.CSSProperties}>{cat.toUpperCase()}</span>
                <span className="hvm-sig-market">{signal.market}</span>
                <span className="hvm-sig-time">{signal.timeAgo}</span>
              </div>
              <div className="hvm-sig-title">{signal.flag} {signal.title}</div>
              <p className="hvm-signal-impact">{signal.commercialImpact}</p>
              <div className="hvm-sig-footer">
                <div className="hvm-sig-conf-bar">
                  <div className="hvm-sig-conf-fill" style={{
                    width: `${signal.confidence}%`,
                    background: signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555',
                  }} />
                </div>
                <span className="hvm-sig-conf-val" style={{
                  color: signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555',
                }}>{signal.confidence}%</span>
                <span className="hvm-tag-chip" style={{ background: signal.tag.bg, borderColor: signal.tag.border, color: signal.tag.color, marginLeft: 4 }}>{signal.tag.label}</span>
              </div>
            </div>
          )
        }) : signals.length === 0 ? (
          <div className="hvm-monitor-panel">
            <div className="hvm-live-dot" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.7)', textAlign: 'center', marginBottom: 16 }}>
              Intelligence stream active — no signals loaded for {country.label}
            </div>
            <div className="hvm-monitor-grid">
              {['Regulatory filings','Legislation drafts','Import/export permits','Price & demand shifts','Enforcement actions','Licence changes','Policy consultations','Trade flow alerts'].map(item => (
                <div className="hvm-monitor-item" key={item}>
                  <div className="hvm-live-dot small" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hvm-signal-card">
            <strong>No signals match filter</strong>
            <small>Try clearing the search or switching category.</small>
          </div>
        )}
      </div>
    </div>
  )
}

const DIGEST_WINDOW_LABEL: Record<DigestWindow, { kicker: string; sub: string }> = {
  '24h':    { kicker: 'New in 24 hours',  sub: 'Fresh reviewed intel since yesterday.' },
  '7d':     { kicker: 'This week',        sub: 'Nothing new in 24h — last 7 days.' },
  '30d':    { kicker: 'This month',       sub: 'Quiet week — last 30 days.' },
  'recent': { kicker: 'Most recent',      sub: 'Latest reviewed signals.' },
}

function DigestMobile({ country, roleLabel, digestSignals, digestWindow, signals }: { country: CountryOption; roleLabel?: string; digestSignals?: DashboardSignal[]; digestWindow?: DigestWindow; signals: DashboardSignal[] }) {
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)
  const [liveWindow,  setLiveWindow]  = useState<DigestWindow | null>(null)
  const [liveTotal,   setLiveTotal]   = useState<number | null>(null)
  const [selected,    setSelected]    = useState<DashboardSignal | null>(null)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: '20' })
    if (country.label) params.set('country', country.label)
    fetch(`/api/dashboard/digest?${params.toString()}`)
      .then(r => r.json())
      .then((json: { signals?: DashboardSignal[]; window?: DigestWindow; total?: number }) => {
        if (cancelled) return
        if (Array.isArray(json.signals)) setLiveSignals(json.signals)
        if (json.window) setLiveWindow(json.window)
        if (typeof json.total === 'number') setLiveTotal(json.total)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [country.label])

  const effectiveSignals = liveSignals ?? digestSignals ?? signals.slice(0, 20)
  const effectiveWindow: DigestWindow = liveWindow ?? digestWindow ?? 'recent'
  const copy = DIGEST_WINDOW_LABEL[effectiveWindow]
  const isStale = effectiveWindow !== '24h'

  if (selected) {
    if (selected.contentType === 'editorial') {
      return (
        <div className="hvm-page-stack">
          <button className="hvm-back-btn" type="button" onClick={() => setSelected(null)}>← Daily digest</button>
          <section className="hvm-hero-card compact" style={{ borderLeft: '3px solid #B8AF9E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="hvm-tag-chip" style={{ background: selected.tag.bg, borderColor: selected.tag.border, color: selected.tag.color }}>{selected.tag.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace' }}>{selected.market}</span>
              <span style={{ fontSize: 11, color: 'rgba(245,240,232,.3)', marginLeft: 'auto' }}>{selected.timeAgo}</span>
            </div>
            <h2 style={{ fontSize: 20 }}>{selected.flag} {selected.title}</h2>
          </section>
          <div className="hvm-card">
            <div className="hvm-kicker">Why it matters</div>
            <p style={{ margin: '8px 0 0', color: 'rgba(245,240,232,.88)', fontSize: 14, lineHeight: 1.65 }}>{selected.commercialImpact}</p>
          </div>
          {selected.sourceLabel && (
            selected.sourceUrl
              ? <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 11, color: '#B8AF9E', textAlign: 'center', textDecoration: 'underline' }}>Read the original at {selected.sourceLabel} →</a>
              : <p style={{ fontSize: 11, color: 'rgba(245,240,232,.35)', textAlign: 'center' }}>{selected.sourceLabel}</p>
          )}
        </div>
      )
    }
    const cat = classifySignal(selected.type)
    const catColor = SIG_CATS.find(c => c.id === cat)?.color ?? '#d4a84b'
    const confColor = selected.confidence >= 80 ? '#4caf82' : selected.confidence >= 60 ? '#d4a84b' : '#e05555'
    return (
      <div className="hvm-page-stack">
        <button className="hvm-back-btn" type="button" onClick={() => setSelected(null)}>← Daily digest</button>
        <section className="hvm-hero-card compact" style={{ borderLeft: `3px solid ${catColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="hvm-sig-cat-chip" style={{ '--chip-color': catColor } as React.CSSProperties}>{cat.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace' }}>{selected.market}</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.3)', marginLeft: 'auto' }}>{selected.timeAgo}</span>
          </div>
          <h2 style={{ fontSize: 20 }}>{selected.flag} {selected.title}</h2>
        </section>
        <div className="hvm-card">
          <div className="hvm-kicker">Confidence</div>
          <div className="hvm-sig-conf-big" style={{ color: confColor }}>{selected.confidence}%</div>
          <div className="hvm-conf-bar-wrap"><div className="hvm-conf-bar-fill" style={{ width: `${selected.confidence}%`, background: confColor }} /></div>
        </div>
        <div className="hvm-card">
          <div className="hvm-kicker">Commercial impact</div>
          <p style={{ margin: '8px 0 0', color: 'rgba(245,240,232,.88)', fontSize: 14, lineHeight: 1.65 }}>{selected.commercialImpact}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hvm-page-stack">
      <section className={`hvm-hero-card compact${isStale ? '' : ' hvm-digest-fresh'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className={`hvm-live-dot${isStale ? '' : ' active'}`} />
          <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em' }}>
            {copy.kicker.toUpperCase()}
          </span>
        </div>
        <h2>Daily Digest</h2>
        <p>{country.label}{roleLabel ? ` · ${roleLabel}` : ''} · {copy.sub}</p>
        <p style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', fontFamily: 'JetBrains Mono, monospace', marginTop: 6 }}>
          {effectiveSignals.length} item{effectiveSignals.length !== 1 ? 's' : ''}{liveTotal !== null ? ` · ${liveTotal} reviewed in feed` : ''}
        </p>
      </section>

      <div className="hvm-list-stack">
        {effectiveSignals.length > 0 ? effectiveSignals.map((signal, index) => {
          if (signal.contentType === 'editorial') {
            return (
              <div
                className="hvm-signal-card hvm-signal-card--tap hvm-signal-card--rich"
                key={signal.id ?? `${signal.title}-${index}`}
                style={{ borderLeft: '3px solid #B8AF9E' }}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(signal)}
                onKeyDown={e => e.key === 'Enter' && setSelected(signal)}
              >
                <div className="hvm-sig-head">
                  <span className="hvm-tag-chip" style={{ background: signal.tag.bg, borderColor: signal.tag.border, color: signal.tag.color }}>{signal.tag.label}</span>
                  <span className="hvm-sig-market">{signal.market}</span>
                  <span className="hvm-sig-time">{signal.timeAgo}</span>
                </div>
                <div className="hvm-sig-title">{signal.flag} {signal.title}</div>
                <p className="hvm-signal-impact" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}>{signal.commercialImpact}</p>
                <span style={{ fontSize: 11, color: '#B8AF9E', fontWeight: 600 }}>Read more →</span>
                {signal.sourceLabel && (
                  <div className="hvm-sig-footer">
                    <span style={{ fontSize: 10, color: 'rgba(245,240,232,.35)', fontFamily: 'JetBrains Mono, monospace' }}>{signal.sourceLabel}</span>
                  </div>
                )}
              </div>
            )
          }
          const cat = classifySignal(signal.type)
          const catColor = SIG_CATS.find(c => c.id === cat)?.color ?? '#d4a84b'
          return (
            <div
              className="hvm-signal-card hvm-signal-card--tap hvm-signal-card--rich"
              key={signal.id ?? `${signal.title}-${index}`}
              style={{ borderLeft: `3px solid ${catColor}` }}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(signal)}
              onKeyDown={e => e.key === 'Enter' && setSelected(signal)}
            >
              <div className="hvm-sig-head">
                <span className="hvm-sig-cat-chip" style={{ '--chip-color': catColor } as React.CSSProperties}>{cat.toUpperCase()}</span>
                <span className="hvm-sig-market">{signal.market}</span>
                <span className="hvm-sig-time">{signal.timeAgo}</span>
              </div>
              <div className="hvm-sig-title">{signal.flag} {signal.title}</div>
              <p className="hvm-signal-impact">{signal.commercialImpact}</p>
              <div className="hvm-sig-footer">
                <div className="hvm-sig-conf-bar">
                  <div className="hvm-sig-conf-fill" style={{
                    width: `${signal.confidence}%`,
                    background: signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555',
                  }} />
                </div>
                <span className="hvm-sig-conf-val" style={{
                  color: signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555',
                }}>{signal.confidence}%</span>
                <span className="hvm-tag-chip" style={{ background: signal.tag.bg, borderColor: signal.tag.border, color: signal.tag.color, marginLeft: 4 }}>{signal.tag.label}</span>
              </div>
            </div>
          )
        }) : (
          <div className="hvm-monitor-panel">
            <div className="hvm-live-dot" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.7)', textAlign: 'center' }}>
              No reviewed intelligence yet for {country.label} — automated daily promotion is being wired up.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SignalsMobile({ country, signals, watchlistData, countryIntel, sourceCoverage, sub }: { country: CountryOption; signals: DashboardSignal[]; watchlistData?: WatchlistData | null; countryIntel?: CountryIntelProfile | null; sourceCoverage?: SourceCoverageRow[]; sub: SignalSub }) {
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: '100' })
    if (country.label) params.set('country', country.label)
    fetch(`/api/dashboard/signals?${params.toString()}`)
      .then(r => r.json())
      .then((json: { signals?: DashboardSignal[] }) => {
        if (!cancelled && Array.isArray(json.signals) && json.signals.length > 0) {
          setLiveSignals(json.signals)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [country.label])
  const effectiveSignals = liveSignals ?? signals
  return (
    <div className="hvm-page-stack">
      {sub === 'feed'       && <SignalsFeed country={country} signals={effectiveSignals} />}
      {sub === 'regulatory' && <RegulatoryMobile country={country} roleLabel="Regulatory" signals={effectiveSignals} watchlistData={watchlistData} countryIntel={countryIntel} sourceCoverage={sourceCoverage} />}
      {sub === 'watchlist'  && <WatchlistMobile country={country} roleLabel="Watchlist" watchlistData={watchlistData} signals={effectiveSignals} />}
    </div>
  )
}

const ITEM_TYPE_ICONS: Record<string, string> = {
  jurisdiction: '🌐', signal: '≋', pathway: '◈', marketplace_item: '⊞', source: '⊟', policy: '◎',
}
const FALLBACK_ADJACENT_MARKETS = [
  { iso2: 'DE', label: 'Germany',     status: 'Regulated', trend: '+' },
  { iso2: 'CA', label: 'Canada',      status: 'Mature',    trend: '→' },
  { iso2: 'BR', label: 'Brazil',      status: 'Medical',   trend: '+' },
  { iso2: 'AU', label: 'Australia',   status: 'Medical',   trend: '→' },
  { iso2: 'CO', label: 'Colombia',    status: 'Exporter',  trend: '+' },
  { iso2: 'NL', label: 'Netherlands', status: 'Pilot',     trend: '→' },
]
const WATCH_TYPE_CARDS = [
  { type: 'jurisdiction', icon: '🌐', label: 'Jurisdiction', desc: "Track a market's regulatory changes & alerts" },
  { type: 'signal',       icon: '≋',  label: 'Signal',       desc: 'Watch for specific signal types or keywords' },
  { type: 'pathway',      icon: '◈',  label: 'Pathway',      desc: 'Monitor import/export pathway developments' },
  { type: 'marketplace_item', icon: '⊞', label: 'Listing',  desc: 'Track marketplace listings for price & status' },
]
type WatchType = 'all' | 'signal' | 'country' | 'listing' | 'pathway'
const WATCH_TYPE_TABS: { id: WatchType; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'signal',  label: 'Signals' },
  { id: 'country', label: 'Countries' },
  { id: 'listing', label: 'Listings' },
  { id: 'pathway', label: 'Pathways' },
]

function WatchlistMobile({ country, roleLabel, watchlistData, signals = [] }: { country: CountryOption; roleLabel?: string; watchlistData?: WatchlistData | null; signals?: DashboardSignal[] }) {
  const router = useRouter()
  const [activeType, setActiveType] = useState<WatchType>('all')
  const [saving, setSaving] = useState(false)
  const [addingType, setAddingType] = useState<string | null>(null)
  const [itemTitle, setItemTitle] = useState('')
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleType, setRuleType] = useState('keyword_match')
  const [ruleKeywords, setRuleKeywords] = useState('')
  const items = watchlistData?.items ?? []
  const rules = watchlistData?.rules ?? []
  const notifs = watchlistData?.notifications
  const hasAlerts = notifs && notifs.total_alerts > 0

  async function watchCurrentMarket() {
    setSaving(true)
    try {
      const res = await fetch('/api/watchlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: 'jurisdiction', title: country.label, jurisdiction: country.iso2 }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function addItemByType(type: string) {
    const title = itemTitle.trim() || country.label
    setSaving(true)
    try {
      const res = await fetch('/api/watchlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: type,
          title,
          jurisdiction: type === 'jurisdiction' ? country.iso2 : undefined,
        }),
      })
      if (res.ok) {
        setItemTitle('')
        setAddingType(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function createRule() {
    const keywords = ruleKeywords.split(',').map(k => k.trim()).filter(Boolean)
    if (!keywords.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/watchlist/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_type: ruleType, keywords }),
      })
      if (res.ok) {
        setRuleKeywords('')
        setShowRuleForm(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteRule(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/watchlist/rules?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const adjacentMarkets = useMemo(() => {
    const markets = new Map<string, { count: number; conf: number }>()
    for (const s of signals) {
      if (!s.market || s.market === country.label) continue
      const entry = markets.get(s.market) ?? { count: 0, conf: 0 }
      entry.count++
      entry.conf += s.confidence
      markets.set(s.market, entry)
    }
    const fromSignals = Array.from(markets.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([label, stats]) => {
        const found = ALL_COUNTRIES.find(c => c.displayName === label)
        const avgConf = Math.round(stats.conf / stats.count)
        return {
          iso2: found?.iso2 ?? label.slice(0, 2).toUpperCase(),
          label,
          status: avgConf >= 75 ? 'Active signals' : avgConf >= 55 ? 'Monitoring' : 'Low activity',
          trend: avgConf >= 70 ? '+' : '→',
        }
      })
    return fromSignals.length >= 3 ? fromSignals : FALLBACK_ADJACENT_MARKETS
  }, [signals, country.label])

  const filteredItems = useMemo(() => {
    if (activeType === 'all') return items
    return items.filter(item => {
      const t = item.item_type.toLowerCase()
      if (activeType === 'signal') return t.includes('signal')
      if (activeType === 'country') return t.includes('country') || t.includes('jurisdiction')
      if (activeType === 'listing') return t.includes('listing') || t.includes('market')
      if (activeType === 'pathway') return t.includes('pathway') || t.includes('step')
      return true
    })
  }, [items, activeType])

  const typeCounts = useMemo(() => {
    const counts: Record<WatchType, number> = { all: items.length, signal: 0, country: 0, listing: 0, pathway: 0 }
    for (const item of items) {
      const t = item.item_type.toLowerCase()
      if (t.includes('signal')) counts.signal++
      else if (t.includes('country') || t.includes('jurisdiction')) counts.country++
      else if (t.includes('listing') || t.includes('market')) counts.listing++
      else if (t.includes('pathway') || t.includes('step')) counts.pathway++
    }
    return counts
  }, [items])

  const suggestedAdditions = [
    `${country.label} import regime changes`,
    `${country.label} licence renewal signals`,
    `Regulatory authority enforcement updates`,
    `Market access status changes`,
  ]

  return (
    <div className="hvm-page-stack">
      {/* Hero */}
      <section className="hvm-hero-card compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em' }}>WATCHLIST</span>
          {hasAlerts && <span className="hvm-alert-badge">{notifs!.awaiting_review} pending</span>}
        </div>
        <h2>Market Radar</h2>
        <p>{country.label} · {items.length} item{items.length !== 1 ? 's' : ''} watched</p>

        {hasAlerts && (
          <div className="hvm-notif-row-grid">
            <div className="hvm-notif-cell hvm-notif-cell--warn">
              <span className="hvm-notif-val">{notifs!.awaiting_review}</span>
              <span className="hvm-notif-lbl">Pending</span>
            </div>
            <div className="hvm-notif-cell hvm-notif-cell--ok">
              <span className="hvm-notif-val">{notifs!.resolved}</span>
              <span className="hvm-notif-lbl">Resolved</span>
            </div>
            <div className="hvm-notif-cell">
              <span className="hvm-notif-val">{notifs!.snoozed}</span>
              <span className="hvm-notif-lbl">Snoozed</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick-add current market */}
      <div className="hvm-current-market-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🌐</span>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(245,240,232,.42)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 3 }}>CURRENT MARKET</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8' }}>{country.label}</div>
          </div>
          <button className="hvm-add-watch-btn" onClick={watchCurrentMarket} disabled={saving}>{saving ? '…' : '+ Watch'}</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="hvm-scroll-tabs" role="tablist" aria-label="Watchlist type filter">
          {WATCH_TYPE_TABS.map(tab => (
            <button key={tab.id} type="button" className={activeType === tab.id ? 'active' : ''} onClick={() => setActiveType(tab.id)}>
              {tab.label}{typeCounts[tab.id] > 0 ? ` ${typeCounts[tab.id]}` : ''}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length > 0 ? (
        <MobileAccordion title={`Watched items (${filteredItems.length})`} defaultOpen>
          <div className="hvm-list-stack">
            {filteredItems.slice(0, 12).map(item => {
              const icon = ITEM_TYPE_ICONS[item.item_type] ?? '◎'
              return (
                <div className="hvm-signal-card hvm-signal-card--rich" key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(245,240,232,.95)', lineHeight: 1.35 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(245,240,232,.42)', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{item.item_type.replace(/_/g, ' ')}</span>
                      {item.jurisdiction && <span>· {item.jurisdiction}</span>}
                      {item.confidence_pct != null && <span>· {item.confidence_pct}% conf</span>}
                    </div>
                    {item.subtitle && <p className="hvm-signal-impact" style={{ marginTop: 6, fontSize: 12 }}>{item.subtitle}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </MobileAccordion>
      ) : (
        <div className="hvm-wl-empty-panel">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: .35 }}>◎</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(245,240,232,.65)', marginBottom: 6 }}>{items.length > 0 ? `No ${activeType} items` : 'No items watched yet'}</div>
          <div style={{ fontSize: 12, color: 'rgba(245,240,232,.38)', lineHeight: 1.6 }}>{items.length > 0 ? 'Switch filter tab to see other watched items.' : 'Add jurisdictions, signals, pathways or listings from the Intelligence and Market tabs. You will receive alerts on every change.'}</div>
        </div>
      )}

      {/* Adjacent market radar */}
      <MobileAccordion title="Market radar — adjacent markets" defaultOpen={false}>
        <div className="hvm-radar-grid">
          {adjacentMarkets.map(m => (
            <div className="hvm-radar-cell" key={m.iso2}>
              <div className="hvm-radar-iso">{m.iso2}</div>
              <div className="hvm-radar-name">{m.label}</div>
              <div className="hvm-radar-status">{m.status}</div>
              <div className="hvm-radar-trend" style={{ color: m.trend === '+' ? '#4caf82' : '#d4a84b' }}>{m.trend}</div>
              <button className="hvm-radar-add">+</button>
            </div>
          ))}
        </div>
      </MobileAccordion>

      {/* Watch type cards */}
      <MobileAccordion title="Add to watchlist" defaultOpen={items.length === 0}>
        <div className="hvm-watch-types">
          {WATCH_TYPE_CARDS.map(wt => (
            <div className="hvm-watch-type-card" key={wt.type}>
              <span className="hvm-watch-type-icon">{wt.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{wt.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,.42)', marginTop: 2, lineHeight: 1.4 }}>{wt.desc}</div>
              </div>
              {addingType === wt.type ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <input
                    autoFocus
                    style={{ width: 110, fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(245,240,232,.2)', background: 'rgba(0,0,0,.3)', color: '#f5f0e8', outline: 'none' }}
                    placeholder={wt.type === 'jurisdiction' ? country.label : 'Title…'}
                    value={itemTitle}
                    onChange={e => setItemTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addItemByType(wt.type) }}
                    disabled={saving}
                  />
                  <button className="hvm-add-watch-btn" onClick={() => addItemByType(wt.type)} disabled={saving}>✓</button>
                  <button className="hvm-add-watch-btn" style={{ opacity: .6 }} onClick={() => setAddingType(null)}>✕</button>
                </div>
              ) : (
                <button
                  className="hvm-add-watch-btn"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => { setItemTitle(wt.type === 'jurisdiction' ? country.label : ''); setAddingType(wt.type) }}
                >
                  + Add
                </button>
              )}
            </div>
          ))}
        </div>
      </MobileAccordion>

      {/* Watch rules */}
      <MobileAccordion title={rules.length > 0 ? `Alert rules (${rules.length})` : 'Alert rules'} defaultOpen={rules.length === 0}>
        <div className="hvm-list-stack">
          {rules.length === 0 && !showRuleForm && (
            <div style={{ fontSize: 12, color: 'rgba(245,240,232,.38)', textAlign: 'center', padding: '12px 0' }}>
              No alert rules yet. Add keywords to get notified.
            </div>
          )}
          {rules.slice(0, 8).map(rule => (
            <div className="hvm-signal-card" key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>
                  {rule.rule_type.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Watch
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', marginTop: 3 }}>
                  {rule.keywords.slice(0, 3).join(' · ') || 'All signals'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf82', flexShrink: 0 }} />
                <button
                  onClick={() => deleteRule(rule.id)}
                  disabled={saving}
                  style={{ fontSize: 10, color: 'rgba(245,240,232,.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                  aria-label="Remove rule"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {showRuleForm ? (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select
                style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(245,240,232,.2)', background: 'rgba(0,0,0,.4)', color: '#f5f0e8', outline: 'none' }}
                value={ruleType}
                onChange={e => setRuleType(e.target.value)}
                disabled={saving}
              >
                <option value="keyword_match">Keyword match</option>
                <option value="regulatory_change">Regulatory change</option>
                <option value="licence_update">Licence update</option>
                <option value="enforcement_action">Enforcement action</option>
                <option value="market_access">Market access</option>
                <option value="legislation">Legislation</option>
              </select>
              <input
                autoFocus
                style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(245,240,232,.2)', background: 'rgba(0,0,0,.3)', color: '#f5f0e8', outline: 'none' }}
                placeholder="Keywords, comma-separated…"
                value={ruleKeywords}
                onChange={e => setRuleKeywords(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createRule() }}
                disabled={saving}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="hvm-add-watch-btn" style={{ flex: 1 }} onClick={createRule} disabled={saving || !ruleKeywords.trim()}>
                  {saving ? '…' : '+ Save rule'}
                </button>
                <button className="hvm-add-watch-btn" style={{ opacity: .6 }} onClick={() => { setShowRuleForm(false); setRuleKeywords('') }} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="hvm-add-watch-btn"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => setShowRuleForm(true)}
            >
              + Add rule
            </button>
          )}
        </div>
      </MobileAccordion>

      {/* Next step */}
      <div className="hvm-cta-card" style={{ background: 'rgba(212,168,75,.07)', borderColor: 'rgba(212,168,75,.25)' }}>
        <strong style={{ fontSize: 14, color: '#f5f0e8' }}>Build your intelligence radar</strong>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(245,240,232,.5)', lineHeight: 1.55 }}>
          Watch jurisdictions, signals, pathways and listings. Receive daily or real-time alerts as conditions change across {country.label} and adjacent markets.
        </p>
        <span className="hvm-cta-arrow">Explore Intelligence Platform →</span>
      </div>

      <MobileAccordion title="Suggested additions">
        <div className="hvm-list-stack">
          {suggestedAdditions.map((s, i) => (
            <div className="hvm-signal-card" key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 14, color: 'rgba(245,240,232,.75)' }}>{s}</span>
              <span style={{ fontSize: 11, color: '#d4a84b', fontWeight: 700, flexShrink: 0 }}>+ Add</span>
            </div>
          ))}
        </div>
      </MobileAccordion>

      <SectionCard
        label="Next step"
        title={`Add to watchlist · ${country.label}`}
        detail="Use the Intelligence or Marketplace tabs to add items. Watchlist alerts deliver via your notification settings."
        tone="ok"
      />
    </div>
  )
}

const REG_STATUS_FIELDS = [
  { key: 'market_access_status', label: 'Market Access',   icon: '⊞' },
  { key: 'medical_status',       label: 'Medical Program', icon: '◎' },
  { key: 'adult_use_status',     label: 'Adult Use',       icon: '◈' },
  { key: 'import_status',        label: 'Import',          icon: '↓' },
  { key: 'export_status',        label: 'Export',          icon: '↑' },
  { key: 'regulatory_tier',      label: 'Reg. Tier',       icon: '≋' },
] as const

function statusColor(val: string | null | undefined) {
  if (!val) return 'rgba(245,240,232,.3)'
  const v = val.toLowerCase()
  if (v.includes('active') || v.includes('open') || v.includes('legal') || v === 'regulated' || v.includes('permit')) return '#4caf82'
  if (v.includes('restrict') || v.includes('prohibit') || v.includes('illegal') || v.includes('banned')) return '#e05555'
  if (v.includes('emerging') || v.includes('pending') || v.includes('review') || v.includes('pilot')) return '#d4a84b'
  return 'rgba(245,240,232,.55)'
}

const DEFAULT_WATCH_TRIGGERS = [
  { label: 'Rulemaking & Regulations', on: true },
  { label: 'Legislation & Bills',      on: true },
  { label: 'Enforcement Actions',      on: true },
  { label: 'Licence Changes',          on: true },
  { label: 'GMP & Standards Updates',  on: true },
  { label: 'Taxation Changes',         on: false },
  { label: 'Local Ordinances',         on: false },
  { label: 'International Treaties',   on: false },
]

function RegulatoryMobile({ country, roleLabel, signals, watchlistData, countryIntel, sourceCoverage }: { country: CountryOption; roleLabel?: string; signals: DashboardSignal[]; watchlistData?: WatchlistData | null; countryIntel?: CountryIntelProfile | null; sourceCoverage?: SourceCoverageRow[] }) {
  const regSignals = useMemo(() => {
    const reg = signals.filter(s => {
      const t = (s.title + ' ' + s.type).toLowerCase()
      return /regulatory|licen|compliance|reform|legislation|enforcement|permit|policy/.test(t)
    })
    return (reg.length > 0 ? reg : signals).slice(0, 8)
  }, [signals])

  const watchTriggers = useMemo(() => {
    const rules = watchlistData?.rules ?? []
    if (rules.length > 0) {
      return rules.slice(0, 8).map(r => ({
        label: r.rule_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        on: true,
      }))
    }
    return DEFAULT_WATCH_TRIGGERS
  }, [watchlistData])

  const oppScore = countryIntel?.opportunity_score
  const oppColor = oppScore != null ? (oppScore >= 7 ? '#4caf82' : oppScore >= 4 ? '#d4a84b' : '#e05555') : '#d4a84b'
  const regulator = countryIntel?.regulator_label
  const region = countryIntel?.region

  const comparableMarkets = useMemo(() => {
    const markets = new Map<string, { count: number; avg: number; sum: number }>()
    for (const s of signals) {
      if (!s.market || s.market === country.label) continue
      const entry = markets.get(s.market) ?? { count: 0, avg: 0, sum: 0 }
      entry.count++
      entry.sum += s.confidence
      entry.avg = Math.round(entry.sum / entry.count)
      markets.set(s.market, entry)
    }
    return Array.from(markets.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
  }, [signals, country])

  const policyQuestions = useMemo(() => {
    const questions: string[] = []
    if (countryIntel?.medical_status) questions.push(`What are the current conditions for medical cannabis programme participation in ${country.label}?`)
    if (countryIntel?.import_status) questions.push(`How will changes to import permit requirements affect supply chain operations in ${country.label}?`)
    if (regSignals.length > 0) questions.push(`How will the recent ${regSignals[0].title.slice(0, 60).trimEnd()}… development affect licensed operators?`)
    questions.push(`What enforcement priorities should operators anticipate in ${country.label} over the next 12 months?`)
    return questions.slice(0, 4)
  }, [countryIntel, regSignals, country])

  const sourceGaps = useMemo(() => {
    if (!sourceCoverage || sourceCoverage.length === 0) return []
    const regTypes = ['regulator', 'government', 'government_notices', 'legal']
    const present = new Set(sourceCoverage.map(r => r.source_type))
    return regTypes.filter(t => !present.has(t)).map(t => SOURCE_TYPE_LABELS[t] ?? t)
  }, [sourceCoverage])

  return (
    <div className="hvm-page-stack">
      {/* Hero with opportunity score */}
      <section className="hvm-hero-card compact">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>
              REGULATORY WATCH{region ? ` · ${region.toUpperCase()}` : ''}
            </div>
            <h2 style={{ marginBottom: 4 }}>Regulatory<br />Intelligence</h2>
            <p style={{ marginTop: 6 }}>{country.label}{regulator ? ` · ${regulator}` : ''}</p>
          </div>
          {oppScore != null && (
            <div className="hvm-opp-badge" style={{ '--opp-color': oppColor } as React.CSSProperties}>
              <span className="hvm-opp-score">{oppScore}</span>
              <span className="hvm-opp-label">/ 10</span>
              <span className="hvm-opp-sub">Opportunity</span>
            </div>
          )}
        </div>
        {countryIntel?.public_summary && (
          <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(245,240,232,.5)', lineHeight: 1.6, borderLeft: '2px solid rgba(212,168,75,.3)', paddingLeft: 10 }}>
            {countryIntel.public_summary.length > 160 ? countryIntel.public_summary.slice(0, 160) + '…' : countryIntel.public_summary}
          </p>
        )}
      </section>

      {/* Status matrix */}
      <MobileAccordion title="Market status matrix" defaultOpen>
        <div className="hvm-reg-matrix-grid">
          {REG_STATUS_FIELDS.map(f => {
            const val = countryIntel?.[f.key]
            const color = statusColor(val)
            return (
              <div className="hvm-reg-matrix-cell" key={f.key}>
                <div className="hvm-reg-matrix-icon">{f.icon}</div>
                <div className="hvm-reg-matrix-label">{f.label}</div>
                <div className="hvm-reg-matrix-val" style={{ color }}>{val ?? '–'}</div>
              </div>
            )
          })}
        </div>
      </MobileAccordion>

      {/* Regulatory signals */}
      <MobileAccordion title={`Regulatory signals (${Math.min(regSignals.length, 6)})`} defaultOpen>
        <div className="hvm-list-stack">
          {regSignals.length > 0 ? regSignals.slice(0, 6).map((signal, index) => {
            const confColor = signal.confidence >= 80 ? '#4caf82' : signal.confidence >= 60 ? '#d4a84b' : '#e05555'
            return (
              <div className="hvm-signal-card hvm-signal-card--rich" key={`${signal.title}-${index}`} style={{ borderLeft: '3px solid #5b9bd5' }}>
                <div className="hvm-sig-head">
                  <span className="hvm-sig-cat-chip" style={{ '--chip-color': '#5b9bd5' } as React.CSSProperties}>REG</span>
                  <span className="hvm-sig-market">{signal.market}</span>
                  <span className="hvm-sig-time">{signal.timeAgo}</span>
                </div>
                <div className="hvm-sig-title">{signal.flag} {signal.title}</div>
                <p className="hvm-signal-impact">{signal.commercialImpact}</p>
                <div className="hvm-sig-footer">
                  <div className="hvm-sig-conf-bar"><div className="hvm-sig-conf-fill" style={{ width: `${signal.confidence}%`, background: confColor }} /></div>
                  <span className="hvm-sig-conf-val" style={{ color: confColor }}>{signal.confidence}%</span>
                </div>
              </div>
            )
          }) : (
            <div className="hvm-signal-card">
              <strong style={{ fontSize: 14 }}>No regulatory signals loaded</strong>
              <small>Select a country context to load curated regulatory intelligence.</small>
            </div>
          )}
        </div>
      </MobileAccordion>

      {/* Compliance calendar */}
      <MobileAccordion title="Compliance milestones">
        <div className="hvm-timeline">
          {[
            { label: 'Annual GMP renewal',          date: 'Quarterly',     color: '#5b9bd5' },
            { label: 'Import permit re-validation',  date: 'Semi-annual',   color: '#d4a84b' },
            { label: 'Licence condition review',     date: 'Annual',        color: '#4caf82' },
            { label: 'Regulatory authority report',  date: 'Annual',        color: '#d4a84b' },
          ].map((m, i) => (
            <div className="hvm-timeline-item" key={i}>
              <div className="hvm-timeline-dot" style={{ background: m.color }} />
              <div className="hvm-timeline-body">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(245,240,232,.88)' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', marginTop: 2 }}>{m.date}</div>
              </div>
            </div>
          ))}
        </div>
      </MobileAccordion>

      {/* Cross-border requirements */}
      <MobileAccordion title="Cross-border requirements">
        <div className="hvm-ledger-table">
          {[
            { label: 'Permit class',   val: fieldValue(countryIntel?.import_status, 'Confirm with authority') },
            { label: 'GMP standard',   val: 'EU-GMP / WHO-GMP' },
            { label: 'HS code',        val: '2901.29 / 1211.90' },
            { label: 'Phyto certificate', val: 'Required' },
            { label: 'Country of origin', val: 'Certificate required' },
            { label: 'Packaging',      val: 'Tamper-evident, labelled' },
          ].map(row => (
            <div key={row.label}>
              <strong>{row.label}</strong>
              <span>{row.val}</span>
            </div>
          ))}
        </div>
      </MobileAccordion>

      {/* Watch triggers */}
      <MobileAccordion title={`Watch triggers (${watchTriggers.filter(t => t.on).length} active)`}>
        <div className="hvm-list-stack">
          {watchTriggers.map(t => (
            <div className="hvm-signal-card hvm-trigger-row" key={t.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="hvm-trigger-dot" style={{ background: t.on ? '#4caf82' : 'rgba(255,255,255,.15)' }} />
                <span style={{ fontSize: 13, color: t.on ? 'rgba(245,240,232,.88)' : 'rgba(245,240,232,.38)' }}>{t.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.on ? '#4caf82' : 'rgba(245,240,232,.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                {t.on ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </MobileAccordion>

      {comparableMarkets.length > 0 && (
        <MobileAccordion title={`Comparable markets (${comparableMarkets.length})`}>
          <div className="hvm-ledger-table" role="table" aria-label="Comparable markets">
            {comparableMarkets.map(([market, stats]) => (
              <div role="row" key={market}>
                <strong>{market}</strong>
                <span>{stats.count} signal{stats.count !== 1 ? 's' : ''} · {stats.avg}% avg confidence</span>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {policyQuestions.length > 0 && (
        <MobileAccordion title="Open policy questions">
          <div className="hvm-list-stack">
            {policyQuestions.map((q, i) => (
              <div className="hvm-signal-card" key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#d4a84b', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>?</span>
                <p style={{ margin: 0, color: 'rgba(245,240,232,.75)', fontSize: 15, lineHeight: 1.5 }}>{q}</p>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {sourceGaps.length > 0 && (
        <MobileAccordion title={`Source gaps (${sourceGaps.length})`}>
          <div className="hvm-list-stack">
            {sourceGaps.map((gap, i) => (
              <div className="hvm-signal-card" key={i} style={{ color: 'rgba(230,165,51,.85)' }}>
                <strong>⚠ {gap} — not yet indexed</strong>
                <p className="hvm-signal-impact">Submit a source verification request to prioritise coverage for this category.</p>
              </div>
            ))}
          </div>
        </MobileAccordion>
      )}

      {/* Competent authority */}
      {regulator && (
        <div className="hvm-authority-card">
          <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>COMPETENT AUTHORITY</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8' }}>{regulator}</div>
          {countryIntel?.briefing_regulatory_body && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(245,240,232,.52)', lineHeight: 1.55 }}>{countryIntel.briefing_regulatory_body}</p>
          )}
          <a href="/compliance" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', textDecoration: 'none', fontWeight: 600 }}>Request compliance review →</a>
        </div>
      )}
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
          <blockquote>Coverage: {localIntel.coverageStatus.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</blockquote>
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

      {countryIntel && (
        <MobileAccordion title="Commercial routes">
          <div className="hvm-ledger-table" role="table" aria-label="Commercial routes">
            {countryIntel.import_status && (
              <div role="row"><strong>Import route</strong><span>{fieldValue(countryIntel.import_status)}</span></div>
            )}
            {countryIntel.export_status && (
              <div role="row"><strong>Export route</strong><span>{fieldValue(countryIntel.export_status)}</span></div>
            )}
            {countryIntel.market_access_status && (
              <div role="row"><strong>Market access</strong><span>{fieldValue(countryIntel.market_access_status)}</span></div>
            )}
            {countryIntel.adult_use_status && (
              <div role="row"><strong>Adult-use</strong><span>{fieldValue(countryIntel.adult_use_status)}</span></div>
            )}
            {countryIntel.regulator_label && (
              <div role="row"><strong>Regulator</strong><span>{countryIntel.regulator_label}</span></div>
            )}
          </div>
        </MobileAccordion>
      )}

      <MobileAccordion title="Operating notes">
        <div className="hvm-list-stack">
          {localIntel?.constraints && localIntel.constraints.length > 0 ? (
            localIntel.constraints.slice(0, 4).map((c, i) => (
              <div className="hvm-signal-card" key={i}>
                <strong>{c.icon ? `${c.icon} ` : ''}{c.label}</strong>
                <p className="hvm-signal-impact">{c.text}</p>
              </div>
            ))
          ) : (
            <>
              <div className="hvm-signal-card">
                <strong>All routes remain Harbourview-mediated</strong>
                <p className="hvm-signal-impact">Contact release, counterparty details and operator proof are controlled workflows, not public mobile fields.</p>
              </div>
              <div className="hvm-signal-card">
                <strong>Verify compliance obligations locally</strong>
                <p className="hvm-signal-impact">Confirm licence conditions, permit validity and documentation requirements with the {country.label} competent authority before commercial engagement.</p>
              </div>
            </>
          )}
        </div>
      </MobileAccordion>

      <SectionCard
        label="Intelligence gap"
        title={`Submit local intel request · ${country.label}`}
        detail="Use the Harbourview intake flow to request priority local intelligence review for this jurisdiction."
        tone="ok"
      />
    </div>
  )
}

// ── Genetics mobile page ──────────────────────────────────────────────────────

type GeneticsTabM = 'passports' | 'services' | 'projects'
const GENETICS_TABS: { id: GeneticsTabM; label: string }[] = [
  { id: 'passports', label: 'Cultivars' },
  { id: 'services',  label: 'Providers' },
  { id: 'projects',  label: 'Projects' },
]

function GeneticsMobile({ country, cultivarPassports = [], serviceProviders = [], collaborationProjects = [] }: { country: CountryOption; cultivarPassports?: PublicCultivarPassportDTO[]; serviceProviders?: PublicServiceProvider[]; collaborationProjects?: PublicCollaborationProject[] }) {
  const [tab, setTab] = useState<GeneticsTabM>('passports')
  const [selectedPassport, setSelectedPassport] = useState<PublicCultivarPassportDTO | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)

  const isGlobal = country.iso2 === 'GLOBAL'
  const filteredPassports = isGlobal ? cultivarPassports : cultivarPassports.filter(p => p.countryOpportunitiesPublic.some(o => o.countryCode === country.iso2))
  const displayPassports = filteredPassports.length > 0 ? filteredPassports : cultivarPassports
  const filteredProviders = isGlobal ? serviceProviders : serviceProviders.filter(sp => sp.country_code === country.iso2)
  const displayProviders = filteredProviders.length > 0 ? filteredProviders : serviceProviders
  const filteredProjects = isGlobal ? collaborationProjects : collaborationProjects.filter(cp => cp.countryCode === country.iso2)
  const displayProjects = filteredProjects.length > 0 ? filteredProjects : collaborationProjects

  const tabs = GENETICS_TABS.map(t => ({
    ...t,
    count: t.id === 'passports' ? displayPassports.length : t.id === 'services' ? displayProviders.length : displayProjects.length,
  }))

  if (selectedPassport) {
    const allOpps = selectedPassport.countryOpportunitiesPublic
    return (
      <div className="hvm-page-stack">
        <button type="button" onClick={() => setSelectedPassport(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px', background: 'none', border: 'none', color: 'rgba(212,168,75,.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '.06em', marginBottom: 4 }}>
          ← Cultivar list
        </button>

        <section className="hvm-hero-card compact">
          <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>CULTIVAR PASSPORT</div>
          <h2>⊕ {selectedPassport.displayName}</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <span className="hvm-tag-chip" style={{ background: 'rgba(76,175,130,.12)', borderColor: 'rgba(76,175,130,.3)', color: '#4caf82' }}>{selectedPassport.cultivarCategory.replace(/_/g, ' ')}</span>
            {selectedPassport.cannabisCategory && <span className="hvm-tag-chip" style={{ background: 'rgba(212,168,75,.1)', borderColor: 'rgba(212,168,75,.25)', color: '#d4a84b' }}>{selectedPassport.cannabisCategory.replace(/_/g, ' ')}</span>}
            <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.6)' }}>{selectedPassport.claimStatus.replace(/_/g, ' ')}</span>
          </div>
          <p style={{ marginTop: 10, lineHeight: 1.6 }}>{selectedPassport.publicSummary}</p>
        </section>

        {(selectedPassport.originCountryCode || selectedPassport.breederDisplayName || selectedPassport.aliasesPublic.length > 0) && (
          <div className="hvm-card">
            <div className="hvm-kicker">ORIGIN &amp; PROVENANCE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
              {selectedPassport.originCountryCode && (
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.75)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'rgba(245,240,232,.35)', minWidth: 90 }}>Origin</span>
                  <span>{flagEmoji(selectedPassport.originCountryCode)} {selectedPassport.originJurisdictionLabel ?? selectedPassport.originCountryCode}</span>
                </div>
              )}
              {selectedPassport.breederDisplayName && (
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.75)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'rgba(245,240,232,.35)', minWidth: 90 }}>Breeder</span>
                  <span>{selectedPassport.breederDisplayName}</span>
                </div>
              )}
              {selectedPassport.rightsHolderDisplayName && (
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.75)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'rgba(245,240,232,.35)', minWidth: 90 }}>Rights holder</span>
                  <span>{selectedPassport.rightsHolderDisplayName}</span>
                </div>
              )}
              {selectedPassport.aliasesPublic.length > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.75)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'rgba(245,240,232,.35)', minWidth: 90 }}>Aliases</span>
                  <span>{selectedPassport.aliasesPublic.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(selectedPassport.evidenceScoreSummary || selectedPassport.verificationSummary) && (
          <div className="hvm-card">
            <div className="hvm-kicker">VERIFICATION STATUS</div>
            {selectedPassport.evidenceScoreSummary && <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(245,240,232,.75)', lineHeight: 1.6 }}>{selectedPassport.evidenceScoreSummary}</p>}
            {selectedPassport.verificationSummary && <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(245,240,232,.6)', lineHeight: 1.6 }}>{selectedPassport.verificationSummary}</p>}
          </div>
        )}

        {allOpps.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'rgba(245,240,232,.35)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.14em', padding: '4px 16px 6px' }}>COUNTRY OPPORTUNITIES · {allOpps.length}</div>
            <div className="hvm-list-stack">
              {allOpps.map((opp, i) => (
                <div className="hvm-signal-card" key={i}>
                  <div className="hvm-sig-head">
                    <span className="hvm-sig-cat-chip" style={{ '--chip-color': '#4caf82' } as React.CSSProperties}>{opp.opportunityType.replace(/_/g, ' ')}</span>
                    <span className="hvm-sig-market">{opp.status}</span>
                  </div>
                  <div className="hvm-sig-title">{flagEmoji(opp.countryCode)} {opp.jurisdictionLabel ?? opp.countryCode}</div>
                  {opp.publicNote && <p className="hvm-signal-impact">{opp.publicNote}</p>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.5)' }}>MT: {opp.materialTransferStatus.replace(/_/g, ' ')}</span>
                    <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.5)' }}>Gate: {opp.jurisdictionGateStatus.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedPassport.publicEvidenceSummaries.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'rgba(245,240,232,.35)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.14em', padding: '4px 16px 6px' }}>EVIDENCE SUMMARIES · {selectedPassport.publicEvidenceSummaries.length}</div>
            <div className="hvm-list-stack">
              {selectedPassport.publicEvidenceSummaries.map(ev => (
                <div className="hvm-signal-card" key={ev.id}>
                  <div className="hvm-sig-head">
                    <span className="hvm-sig-cat-chip" style={{ '--chip-color': '#5b9bd5' } as React.CSSProperties}>{ev.evidenceType.replace(/_/g, ' ')}</span>
                    <span className="hvm-sig-market">{ev.claimStatus.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="hvm-sig-title">{ev.title}</div>
                  {ev.publicSummary && <p className="hvm-signal-impact">{ev.publicSummary}</p>}
                  {(ev.sourceLabel || ev.sourceDate || ev.jurisdictionLabel) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {ev.sourceLabel && <span className="hvm-tag-chip" style={{ background: 'rgba(91,155,213,.12)', borderColor: 'rgba(91,155,213,.3)', color: '#5b9bd5' }}>{ev.sourceLabel}</span>}
                      {ev.sourceDate && <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.5)' }}>{ev.sourceDate}</span>}
                      {ev.jurisdictionLabel && <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.5)' }}>{ev.jurisdictionLabel}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {selectedPassport.publicCollaborationProjects.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'rgba(245,240,232,.35)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.14em', padding: '4px 16px 6px' }}>COLLABORATION PROJECTS · {selectedPassport.publicCollaborationProjects.length}</div>
            <div className="hvm-list-stack">
              {selectedPassport.publicCollaborationProjects.map(cp => (
                <div className="hvm-signal-card" key={cp.id}>
                  <div className="hvm-sig-head">
                    <span className="hvm-sig-cat-chip" style={{ '--chip-color': '#a78bfa' } as React.CSSProperties}>{cp.projectType.replace(/_/g, ' ')}</span>
                    <span className="hvm-sig-market">{cp.status}</span>
                  </div>
                  <div className="hvm-sig-title">⊗ {cp.title}</div>
                  <p className="hvm-signal-impact">{cp.publicSummary}</p>
                  {cp.evidenceNeeded && <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(245,240,232,.5)', lineHeight: 1.5 }}><span style={{ color: 'rgba(245,240,232,.3)' }}>Evidence needed:</span> {cp.evidenceNeeded}</div>}
                  {(cp.countryCode || cp.jurisdictionLabel) && (
                    <div style={{ marginTop: 6 }}>
                      <span className="hvm-tag-chip" style={{ background: 'rgba(167,139,250,.1)', borderColor: 'rgba(167,139,250,.25)', color: '#a78bfa' }}>
                        {cp.jurisdictionLabel ?? (cp.countryCode ? `${flagEmoji(cp.countryCode)} ${cp.countryCode}` : '')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="hvm-card" style={{ background: 'rgba(212,168,75,.05)', borderColor: 'rgba(212,168,75,.2)' }}>
          <div className="hvm-kicker">ACCESS &amp; LICENSING</div>
          <p style={{ marginTop: 6, fontSize: 13, color: 'rgba(245,240,232,.65)', lineHeight: 1.6 }}>Cultivar data is subject to IP, PVP, and licensing controls. Harbourview passports are public-safe summaries only. Full evidence and commercial terms require a Harbourview-reviewed access request.</p>
          <button type="button" onClick={() => setRequestOpen(true)} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Request access — {selectedPassport.displayName} →
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(245,240,232,.3)', padding: '0 16px 24px', lineHeight: 1.6 }}>{selectedPassport.publicDisclaimer}</p>

        <GeneticsRequestModal open={requestOpen} profileName={selectedPassport.displayName} onClose={() => setRequestOpen(false)} />
      </div>
    )
  }

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>GENETICS INTELLIGENCE</div>
        <h2>Cultivars &amp; Genetics</h2>
        <p>{country.label} · Public cultivar passports, verified service providers, and open collaboration projects{isGlobal ? '' : ` relevant to ${country.label}`}.</p>
      </section>

      <div className="hvm-status-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <SectionCard label="Passports" title={String(displayPassports.length)} tone={displayPassports.length > 0 ? 'ok' : 'neutral'} />
        <SectionCard label="Providers" title={String(displayProviders.length)} />
        <SectionCard label="Projects" title={String(displayProjects.length)} />
      </div>

      <div className="hvm-scroll-tabs" role="tablist" aria-label="Genetics tabs">
        {tabs.map(t => (
          <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}{t.count > 0 ? <span className="hvm-tab-count">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'passports' && (
        displayPassports.length === 0 ? (
          <div className="hvm-empty-card">
            <strong>No public cultivar passports yet.</strong>
            <p>Passports publish when source-backed review is complete.</p>
            <div className="hvm-empty-actions">
              <Link href="/genetics" className="hvm-empty-link">Genetics hub →</Link>
            </div>
          </div>
        ) : (
          <div className="hvm-list-stack">
            {displayPassports.map(p => {
              const countryOpps = isGlobal ? [] : p.countryOpportunitiesPublic.filter(o => o.countryCode === country.iso2)
              return (
                <div className="hvm-signal-card hvm-signal-card--rich" key={p.id}>
                  <div className="hvm-sig-head">
                    <span className="hvm-sig-cat-chip" style={{ '--chip-color': '#4caf82' } as React.CSSProperties}>CULTIVAR</span>
                    {isGlobal && p.countryOpportunitiesPublic?.length > 0 && (
                      <span className="hvm-sig-market">{p.countryOpportunitiesPublic.length} opportunities</span>
                    )}
                    {!isGlobal && countryOpps.length > 0 && (
                      <span className="hvm-sig-market" style={{ color: '#4caf82' }}>{countryOpps.length} {country.label} opp{countryOpps.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="hvm-sig-title">⊕ {p.displayName}</div>
                  <p className="hvm-signal-impact">{p.publicSummary}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    <span className="hvm-tag-chip" style={{ background: 'rgba(76,175,130,.12)', borderColor: 'rgba(76,175,130,.3)', color: '#4caf82' }}>{p.cultivarCategory.replace(/_/g, ' ')}</span>
                    {p.cannabisCategory && <span className="hvm-tag-chip" style={{ background: 'rgba(212,168,75,.1)', borderColor: 'rgba(212,168,75,.25)', color: '#d4a84b' }}>{p.cannabisCategory.replace(/_/g, ' ')}</span>}
                    <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.6)' }}>{p.claimStatus.replace(/_/g, ' ')}</span>
                  </div>
                  {countryOpps.map((opp, i) => (
                    <div key={i} style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(76,175,130,.08)', borderRadius: 4, borderLeft: '2px solid rgba(76,175,130,.4)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4caf82' }}>{opp.opportunityType.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,.6)', marginTop: 2 }}>{opp.status}</div>
                      {opp.publicNote && <div style={{ fontSize: 11, color: 'rgba(245,240,232,.5)', marginTop: 3, lineHeight: 1.4 }}>{opp.publicNote}</div>}
                    </div>
                  ))}
                  {countryOpps.length > 0 ? (
                    <button type="button" onClick={() => setSelectedPassport(p)} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{countryOpps[0].cta} →</button>
                  ) : (
                    <button type="button" onClick={() => setSelectedPassport(p)} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View passport →</button>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'services' && (
        displayProviders.length === 0 ? (
          <div className="hvm-empty-card">
            <strong>No verified service providers listed yet.</strong>
            <p>Providers are listed after Harbourview verification review.</p>
          </div>
        ) : (
          <div className="hvm-list-stack">
            {displayProviders.map(sp => (
              <div className="hvm-signal-card hvm-signal-card--rich" key={sp.id}>
                <div className="hvm-sig-title">◫ {sp.displayName}</div>
                <p className="hvm-signal-impact">{sp.service_summary}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span className="hvm-tag-chip" style={{ background: 'rgba(91,155,213,.12)', borderColor: 'rgba(91,155,213,.3)', color: '#5b9bd5' }}>{sp.service_category.replace(/_/g, ' ')}</span>
                  <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.6)' }}>{sp.verification_level.replace(/_/g, ' ')}</span>
                  {sp.country_code && <span className="hvm-tag-chip" style={{ background: 'rgba(212,168,75,.1)', borderColor: 'rgba(212,168,75,.25)', color: '#d4a84b' }}>{sp.country_code}</span>}
                </div>
                <Link href="/contact" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>Request verification →</Link>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'projects' && (
        displayProjects.length === 0 ? (
          <div className="hvm-empty-card">
            <strong>No open collaboration projects at this time.</strong>
            <p>Check back as projects are added following source review.</p>
          </div>
        ) : (
          <div className="hvm-list-stack">
            {displayProjects.map(cp => (
              <div className="hvm-signal-card hvm-signal-card--rich" key={cp.id}>
                <div className="hvm-sig-title">⊗ {cp.title}</div>
                <p className="hvm-signal-impact">{cp.publicSummary}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span className="hvm-tag-chip" style={{ background: 'rgba(76,175,130,.12)', borderColor: 'rgba(76,175,130,.3)', color: '#4caf82' }}>{cp.projectType.replace(/_/g, ' ')}</span>
                  <span className="hvm-tag-chip" style={{ background: 'rgba(245,240,232,.06)', borderColor: 'rgba(245,240,232,.15)', color: 'rgba(245,240,232,.6)' }}>{cp.status.replace(/_/g, ' ')}</span>
                  {cp.countryCode && <span className="hvm-tag-chip" style={{ background: 'rgba(212,168,75,.1)', borderColor: 'rgba(212,168,75,.25)', color: '#d4a84b' }}>{cp.countryCode}</span>}
                </div>
                <Link href="/contact" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>{cp.cta} →</Link>
              </div>
            ))}
          </div>
        )
      )}

      <div className="hvm-card" style={{ marginTop: 8, background: 'rgba(76,175,130,.06)', borderColor: 'rgba(76,175,130,.2)' }}>
        <div className="hvm-kicker">Access &amp; Licensing</div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(245,240,232,.65)', lineHeight: 1.6 }}>Cultivar data is subject to IP, PVP, and licensing controls. Harbourview passports are public-safe summaries only. Full evidence and commercial terms require an access request.</p>
        <Link href="/genetics" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>Genetics hub →</Link>
      </div>
    </div>
  )
}

// ── Countries directory mobile page ───────────────────────────────────────────

function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🌐'
  const base = 0x1F1E6 - 65
  const chars = iso2.toUpperCase().split('').map(c => String.fromCodePoint(base + c.charCodeAt(0)))
  return chars.join('')
}


function CountriesDirectoryMobile({ signals, onCountrySelect }: { signals: DashboardSignal[]; onCountrySelect: (iso2: string) => void }) {
  const [search, setSearch] = useState('')

  const signalCountByIso2 = useMemo(() => {
    const nameToIso2 = new Map(ALL_COUNTRIES.map(c => [c.displayName.toLowerCase(), c.iso2]))
    const counts: Record<string, number> = {}
    for (const s of signals) {
      if (!s.market) continue
      const iso2 = nameToIso2.get(s.market.toLowerCase())
      if (iso2) counts[iso2] = (counts[iso2] ?? 0) + 1
    }
    return counts
  }, [signals])

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES
    const q = search.toLowerCase()
    return ALL_COUNTRIES.filter(c => c.displayName.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q))
  }, [search])

  const byRegion = useMemo(() => {
    const map = new Map<string, typeof ALL_COUNTRIES>()
    for (const c of filtered) {
      const key = c.region ?? 'Other'
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return map
  }, [filtered])

  const withSignals = Object.keys(signalCountByIso2).length

  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>COUNTRY DIRECTORY</div>
        <h2>Countries &amp; Territories</h2>
        <p>All {ALL_COUNTRIES.length} jurisdictions. Tap any country to load its data into the Command Centre.</p>
      </section>

      <div className="hvm-status-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <SectionCard label="Total countries" title={String(ALL_COUNTRIES.length)} tone="ok" />
        <SectionCard label="With signals" title={String(withSignals)} />
      </div>

      <label className="hvm-search-label">
        <span>Search countries</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Country name or ISO code…" />
      </label>

      {filtered.length === 0 ? (
        <div className="hvm-empty-card">
          <strong>No countries match &ldquo;{search}&rdquo;.</strong>
        </div>
      ) : (
        [...byRegion.entries()].map(([region, countries]) => (
          <MobileAccordion key={region} title={`${region} (${countries.length})`} defaultOpen={countries.length <= 12}>
            <div className="hvm-list-stack">
              {countries.map(c => {
                const sigCount = signalCountByIso2[c.iso2] ?? 0
                return (
                  <div
                    className="hvm-signal-card hvm-signal-card--tap"
                    key={c.iso2}
                    role="button"
                    tabIndex={0}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    onClick={() => onCountrySelect(c.iso2)}
                    onKeyDown={e => e.key === 'Enter' && onCountrySelect(c.iso2)}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{flagEmoji(c.iso2)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(245,240,232,.95)' }}>{c.displayName}</div>
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', marginTop: 2 }}>
                        {c.iso2}
                        {sigCount > 0 && <span style={{ color: '#d4a84b', marginLeft: 6 }}>· {sigCount} signal{sigCount > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <Link
                      href={`/countries/${c.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                      style={{ fontSize: 11, color: '#d4a84b', fontWeight: 600, textDecoration: 'none', flexShrink: 0, padding: '4px 8px', background: 'rgba(212,168,75,.1)', borderRadius: 4 }}
                      onClick={e => e.stopPropagation()}
                    >Profile</Link>
                    {sigCount > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4a84b', flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          </MobileAccordion>
        ))
      )}

      <div className="hvm-card" style={{ marginTop: 8 }}>
        <div className="hvm-kicker">Click to explore</div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(245,240,232,.65)', lineHeight: 1.6 }}>Select any country to load its briefing, market data, and access pathway into the Command Centre panels.</p>
        <Link href="/countries" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>Full country profiles →</Link>
      </div>
    </div>
  )
}

// ── Compliance mobile page (per-country) ──────────────────────────────────────

function countryToComplianceSlug(region?: string, subregion?: string): string {
  const r = (region ?? '').toLowerCase()
  const s = (subregion ?? '').toLowerCase()
  if (r === 'europe') return 'europe'
  if (r === 'africa') return 'africa'
  if (r === 'oceania') return 'asia-pacific'
  if (r === 'asia') return s.includes('western') ? 'middle-east' : 'asia-pacific'
  if (r === 'americas') {
    if (s.includes('north')) return 'north-america'
    if (s.includes('caribbean')) return 'caribbean'
    return 'latin-america'
  }
  return 'europe'
}

function ComplianceMobile({ country, countryIntel, jurisdictionPlaybook }: { country: CountryOption; countryIntel?: CountryIntelProfile | null; jurisdictionPlaybook?: JurisdictionPlaybook }) {
  const fullCountry = useMemo(() => ALL_COUNTRIES.find(c => c.iso2 === country.iso2), [country.iso2])
  const regionContext = useMemo(() => {
    const slug = countryToComplianceSlug(fullCountry?.region, fullCountry?.subregion)
    return complianceRegions.find(r => r.slug === slug) ?? null
  }, [fullCountry])
  return (
    <div className="hvm-page-stack">
      <section className="hvm-hero-card compact">
        <div style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.12em', marginBottom: 8 }}>COMPLIANCE</div>
        <h2>{country.label}</h2>
        <p>Regulatory status, market access controls, and compliance framework for this jurisdiction.</p>
      </section>

      {countryIntel ? (
        <div className="hvm-status-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <SectionCard label="Opp. score" title={formatOpportunityScore(countryIntel.opportunity_score)} tone={opportunityScoreTone(countryIntel.opportunity_score)} />
          <SectionCard label="Import" title={countryIntel.import_status ?? '—'} />
          <SectionCard label="Export" title={countryIntel.export_status ?? '—'} />
          <SectionCard label="Medical" title={countryIntel.medical_status ?? '—'} />
        </div>
      ) : (
        <div className="hvm-status-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <SectionCard label="Regions covered" title={String(complianceRegions.length)} tone="ok" />
          <SectionCard label="Specialist review" title="Required" tone="warn" />
        </div>
      )}

      {countryIntel && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">{country.label.toUpperCase()} — JURISDICTION STATUS</div>
          {countryIntel.briefing_last_reviewed && (() => { const [y, m, day] = countryIntel.briefing_last_reviewed.split('-'); const d = new Date(+y, +m - 1, +day); return isNaN(d.getTime()) ? null : <div style={{ fontSize: 11, color: 'rgba(245,240,232,.35)', marginBottom: 4 }}>Briefing reviewed {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div> })()}
          <div className="hvm-sig-title">{countryIntel.briefing_regulatory_body ?? countryIntel.regulator_label ?? 'Regulatory Authority'}</div>
          {(countryIntel.briefing_regulatory_outlook ?? countryIntel.public_summary) && (
            <p className="hvm-signal-impact" style={{ marginTop: 6 }}>{countryIntel.briefing_regulatory_outlook ?? countryIntel.public_summary}</p>
          )}
          {countryIntel.trade_roles && countryIntel.trade_roles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 0 8px' }}>
              <span style={{ fontSize: 10, color: 'rgba(245,240,232,.38)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.1em', width: '100%', marginBottom: 2 }}>TRADE ROLES</span>
              {countryIntel.trade_roles.map(r => (
                <span key={r} style={{ fontSize: 11, fontWeight: 600, color: '#d4a84b', background: 'rgba(212,168,75,.1)', border: '1px solid rgba(212,168,75,.2)', borderRadius: 4, padding: '3px 7px' }}>
                  {r.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {jurisdictionPlaybook && (
            <div className="hvm-ledger-table" role="table" style={{ marginTop: 10 }}>
              {jurisdictionPlaybook.difficulty && <div role="row"><strong>Entry difficulty</strong><span>{jurisdictionPlaybook.difficulty}</span></div>}
              {jurisdictionPlaybook.typical_timeline_months && <div role="row"><strong>Timeline</strong><span>{jurisdictionPlaybook.typical_timeline_months} months</span></div>}
              {jurisdictionPlaybook.estimated_cost_range && <div role="row"><strong>Est. cost</strong><span>{jurisdictionPlaybook.estimated_cost_range}</span></div>}
            </div>
          )}
          {([
            { label: 'Program status', value: countryIntel.briefing_program_status },
            { label: 'Market dynamics', value: countryIntel.briefing_market_dynamics },
            { label: 'Patient access', value: countryIntel.briefing_patient_access },
            { label: 'Physician access', value: countryIntel.briefing_physician_access },
          ] as { label: string; value: string | null | undefined }[]).filter(f => f.value).map(f => (
            <div key={f.label} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,240,232,.38)', letterSpacing: '.08em', marginBottom: 3 }}>{f.label.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.72)', lineHeight: 1.5 }}>{f.value}</div>
            </div>
          ))}
          <Link href="/contact" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>Get compliance support →</Link>
        </div>
      )}
      {jurisdictionPlaybook?.steps && jurisdictionPlaybook.steps.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">MARKET ENTRY STEPS</div>
          {jurisdictionPlaybook.steps.slice(0, 5).map(s => (
            <div key={s.step} style={{ marginTop: s.step === 1 ? 4 : 10, paddingTop: s.step === 1 ? 0 : 10, borderTop: s.step === 1 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d4a84b' }}>Step {s.step}: {s.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.6)', marginTop: 3, lineHeight: 1.5 }}>{s.description}</div>
            </div>
          ))}
        </div>
      )}
      {jurisdictionPlaybook?.key_regulators && jurisdictionPlaybook.key_regulators.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich">
          <div className="hvm-kicker">KEY REGULATORS</div>
          {jurisdictionPlaybook.key_regulators.map((r, i) => (
            <div key={r.name} style={{ marginTop: i === 0 ? 4 : 8, paddingTop: i === 0 ? 0 : 8, borderTop: i === 0 ? 'none' : '1px solid rgba(245,240,232,.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', marginTop: 2 }}>{r.role}</div>
            </div>
          ))}
        </div>
      )}
      {jurisdictionPlaybook?.common_pitfalls && jurisdictionPlaybook.common_pitfalls.length > 0 && (
        <div className="hvm-signal-card hvm-signal-card--rich" style={{ borderColor: 'rgba(229,115,115,.2)' }}>
          <div className="hvm-kicker" style={{ color: 'rgba(229,115,115,.7)' }}>COMMON PITFALLS</div>
          {jurisdictionPlaybook.common_pitfalls.map((pitfall, i) => (
            <div key={i} style={{ marginTop: i === 0 ? 6 : 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'rgba(229,115,115,.7)', flexShrink: 0, fontSize: 12, marginTop: 1 }}>⚠</span>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.65)', lineHeight: 1.5 }}>{pitfall}</div>
            </div>
          ))}
        </div>
      )}

      {regionContext && (
        <MobileAccordion title={`${regionContext.name} compliance context`} defaultOpen>
          <p className="hvm-briefing-body">{regionContext.summary}</p>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: 'rgba(245,240,232,.55)', lineHeight: 1.55 }}>{regionContext.commercialFocus}</p>
        </MobileAccordion>
      )}

      {countryIntel?.briefing_regulatory_body && (
        <div className="hvm-regulator-row">
          <span className="hvm-kicker">Competent authority</span>
          <span>{countryIntel.briefing_regulatory_body}</span>
        </div>
      )}

      {countryIntel?.briefing_regulatory_outlook && (
        <MobileAccordion title="Regulatory outlook">
          <p className="hvm-briefing-body">{countryIntel.briefing_regulatory_outlook}</p>
        </MobileAccordion>
      )}

      {countryIntel?.commercial_pathway_summary && (
        <MobileAccordion title="Commercial pathway summary">
          <p className="hvm-briefing-body">{countryIntel.commercial_pathway_summary}</p>
        </MobileAccordion>
      )}

      <div className="hvm-card" style={{ background: 'rgba(212,168,75,.06)', borderColor: 'rgba(212,168,75,.2)' }}>
        <div className="hvm-kicker">Specialist review required</div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(245,240,232,.65)', lineHeight: 1.6 }}>Compliance data is provided for general awareness only. Specialist legal and regulatory review is required before commercial reliance on any jurisdiction-specific compliance framework.</p>
        <Link href="/contact" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#d4a84b', fontWeight: 600, textDecoration: 'none' }}>Request compliance review →</Link>
      </div>
    </div>
  )
}

function SettingsMobile({ country, role, roleLabel, countryOptions, roleOptions, onCountryChange, onRoleChange, userEmail }: { country: CountryOption; role: string; roleLabel: string; countryOptions: SelectOption[]; roleOptions: SelectOption[]; onCountryChange: (iso2: string) => void; onRoleChange: (r: string) => void; userEmail?: string | null }) {
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

      <MobileAccordion title="Saved view presets">
        <div className="hvm-list-stack">
          <div className="hvm-signal-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{country.label} · {roleLabel}</strong>
              <small>Current context</small>
            </div>
            <span style={{ fontSize: 11, color: '#4caf82', fontWeight: 700, flexShrink: 0 }}>Active</span>
          </div>
          <div className="hvm-signal-card" style={{ color: 'rgba(245,240,232,.38)' }}>
            <strong style={{ fontSize: 14, color: 'rgba(245,240,232,.38)' }}>Save current context as preset</strong>
            <small>Presets restore your jurisdiction + role selection in one tap.</small>
          </div>
        </div>
      </MobileAccordion>

      <MobileAccordion title="Display &amp; accessibility">
        <div className="hvm-list-stack">
          <div className="hvm-signal-card hvm-trigger-row">
            <span style={{ fontSize: 14 }}>Compact signal cards</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontWeight: 700 }}>Off</span>
          </div>
          <div className="hvm-signal-card hvm-trigger-row">
            <span style={{ fontSize: 14 }}>High contrast mode</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontWeight: 700 }}>Off</span>
          </div>
          <div className="hvm-signal-card hvm-trigger-row">
            <span style={{ fontSize: 14 }}>Reduce motion</span>
            <span style={{ fontSize: 11, color: 'rgba(245,240,232,.38)', fontWeight: 700 }}>Off</span>
          </div>
        </div>
      </MobileAccordion>

      <div className="hvm-meta-grid">
        <SectionCard label="Session" title="Active" detail={`Started ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} tone="ok" />
        <SectionCard label="Data as of" title={today} detail="Live source cadence depends on configured watchers and review state." />
      </div>

      {userEmail ? (
        <>
          <div className="hvm-account-row">
            <span className="hvm-account-email">{userEmail}</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="hvm-signout-btn">Sign out</button>
          </form>
        </>
      ) : (
        <a href="/login" className="hvm-signin-btn">Sign in to your account</a>
      )}
    </div>
  )
}

export default function MobileCommandCentre({
  signals,
  digestSignals,
  digestWindow,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  initialPage,
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
  countryEducationOverlays,
  jurisdictionPlaybook,
  educationTracks = [],
  marketMetrics = [],
  tradeFlows = [],
  professionals = [],
  cannabisOperators = [],
  pipeline,
  userEmail,
  cultivarPassports = [],
  serviceProviders = [],
  collaborationProjects = [],
}: Props) {
  const router = useRouter()
  const initialCountry = useMemo(() => COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? { iso2: 'GLOBAL', label: 'Global Market' }, [initialCountryIso2])
  const [country, setCountry] = useState<CountryOption>(initialCountry)
  const [role, setRole] = useState(initialRoleId ?? '')
  // Some valid CommandPage ids (shared with desktop via app/dashboard/page.tsx's
  // VALID_COMMAND_PAGES) live as sub-tabs on mobile rather than top-level bottom-nav
  // pages. Without this map, a deep link like ?page=watchlist or ?page=compliance
  // would silently fall back to 'briefing' > Overview instead of landing on the
  // correct tab, and ?page=settings (not in MOBILE_NAV at all) wouldn't resolve.
  const HIDDEN_PAGE_ROUTES: Partial<Record<string, { page: CommandPage; briefingSub?: BriefingSub; signalsSub?: SignalSub; educationSub?: EduSub }>> = {
    watchlist:        { page: 'signals',  signalsSub: 'watchlist' },
    regulatory:       { page: 'signals',  signalsSub: 'regulatory' },
    evidence:         { page: 'education', educationSub: 'research' },
    compliance:       { page: 'briefing', briefingSub: 'compliance' },
    'local-intel':    { page: 'briefing', briefingSub: 'local-intel' },
    'access-pathway': { page: 'briefing', briefingSub: 'access-pathway' },
    settings:         { page: 'settings' },
  }
  const redirected = initialPage ? HIDDEN_PAGE_ROUTES[initialPage] : undefined
  const [activePage, setActivePage] = useState<CommandPage>(() => {
    if (redirected) return redirected.page
    const valid = MOBILE_NAV.some(item => item.id === initialPage)
    return valid ? (initialPage as CommandPage) : 'briefing'
  })
  const [contextOpen, setContextOpen] = useState(false)
  const [briefingSub, setBriefingSub] = useState<BriefingSub>(redirected?.briefingSub ?? 'overview')
  const [signalsSub, setSignalsSub] = useState<SignalSub>(redirected?.signalsSub ?? 'feed')
  const educationInitialSub = redirected?.educationSub ?? 'modules'

  const countryOptions = useMemo<SelectOption[]>(() => COUNTRIES.map(c => ({ value: c.iso2, label: c.label })), [])
  const roleOptions = useMemo<SelectOption[]>(() => Object.entries(ROLE_PROFILES).map(([value, profile]) => ({ value, label: profile.label })), [])
  const roleLabel = roleDisplay(role)
  const pageTitle = MOBILE_NAV.find(item => item.id === activePage)?.label ?? 'Briefing'

  // Applies country/role context immediately on selection — mirrors the
  // desktop CommandCentre pattern. Previously this only ran on an explicit
  // "Apply context" tap, while the Country/Role <select>s (here AND in
  // SettingsMobile, which shares these same handlers) updated the visible
  // label/"Active" badge instantly — so the header could show a country
  // whose data was never actually fetched.
  const applyContext = (iso2: string, roleVal: string, pageVal: CommandPage) => {
    const params = new URLSearchParams()
    if (iso2 && iso2 !== 'GLOBAL') params.set('country', iso2)
    if (roleVal) params.set('role', roleVal)
    // 'briefing' is the default (no param needed); 'signals' is excluded to
    // prevent the browser restoring a stale "stuck on Intel" URL on next visit.
    if (pageVal !== 'briefing' && pageVal !== 'signals') params.set('page', pageVal)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '/dashboard')
  }

  // The URL is the source of truth for the CURRENT session, but for a signed-in
  // user we also persist role/country to user_dashboard_preferences so the next
  // fresh session (new tab, reopened app, no query params) restores it instead
  // of silently reverting to no role at all. This API already existed and works
  // — UniversalDashboard.tsx (a separate, unrelated dashboard component) was the
  // only caller; the actual Command Centre never wired into it.
  const heatmapLayerRef = useRef<string>('none')
  const preferencesLoadedRef = useRef(false)
  useEffect(() => {
    if (!userEmail) return
    fetch('/api/dashboard/preferences')
      .then(r => r.json())
      .then(d => { heatmapLayerRef.current = d?.preferences?.heatmap_layer ?? 'none' })
      .catch(() => { heatmapLayerRef.current = 'none' })
      .finally(() => { preferencesLoadedRef.current = true })
  }, [userEmail])

  const persistDashboardPreferences = (next: { country_iso2?: string; role_id?: string }) => {
    // Dont persist until the initial GET above has resolved otherwise heatmapLayerRef
    // is still stuck at its none initial value and this PATCH would clobber whatever
    // heatmap_layer the user actually has saved (table default is marketplace_activity).
    if (!userEmail || !preferencesLoadedRef.current) return
    void fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        country_iso2: next.country_iso2 ?? country.iso2,
        role_id: next.role_id ?? role,
        heatmap_layer: heatmapLayerRef.current,
      }),
    }).catch(() => undefined)
  }

  const handleCountryChange = (iso2: string) => {
    const nextCountry = COUNTRIES.find(c => c.iso2 === iso2)
    if (nextCountry) {
      setCountry(nextCountry)
      applyContext(iso2, role, activePage)
      persistDashboardPreferences({ country_iso2: iso2 })
    }
  }

  const handleRoleChange = (roleVal: string) => {
    setRole(roleVal)
    applyContext(country.iso2, roleVal, activePage)
    persistDashboardPreferences({ role_id: roleVal })
  }

  const handlePageChange = (pageVal: CommandPage) => {
    setActivePage(pageVal)
    applyContext(country.iso2, role, pageVal)
  }

  const titlebartabs = (() => {
    if (activePage === 'briefing') return { tabs: BRIEF_TABS, activeId: briefingSub, onSelect: (id: string) => setBriefingSub(id as BriefingSub) }
    if (activePage === 'signals')  return { tabs: SIGNALS_TABS, activeId: signalsSub, onSelect: (id: string) => setSignalsSub(id as SignalSub) }
    return null
  })()

  const page = (() => {
    switch (activePage) {
      case 'briefing':
        return (
          <BriefingMobile
            country={country} roleLabel={roleLabel} roleId={role}
            countryIntel={countryIntel} signals={signals}
            pathwayData={pathwayData} localIntel={localIntel}
            countryOptions={countryOptions} roleOptions={roleOptions}
            marketMetrics={marketMetrics} tradeFlows={tradeFlows}
            jurisdictionPlaybook={jurisdictionPlaybook}
            onCountryChange={handleCountryChange} onRoleChange={handleRoleChange}
            onOpenSettings={() => handlePageChange('settings')}
            sub={briefingSub} userEmail={userEmail}
          />
        )
      case 'marketplace':
        return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} cannabisOperators={cannabisOperators} pipeline={pipeline} />
      case 'digest':
        return <DigestMobile country={country} roleLabel={roleLabel} digestSignals={digestSignals} digestWindow={digestWindow} signals={signals} />
      case 'signals':
        return <SignalsMobile country={country} signals={signals} watchlistData={watchlistData} countryIntel={countryIntel} sourceCoverage={sourceCoverage} sub={signalsSub} />
      case 'education':
        return (
          <EducationMobile
            country={country} roleLabel={roleLabel}
            eduCategories={eduCategories} liveTiles={liveTiles}
            recentEduModules={recentEduModules}
            educationTracks={educationTracks}
            evidenceData={evidenceData} sourceCoverage={sourceCoverage}
            countryEducationOverlays={countryEducationOverlays}
            professionals={professionals}
            initialSub={educationInitialSub}
          />
        )
      case 'genetics':
        return <GeneticsMobile country={country} cultivarPassports={cultivarPassports} serviceProviders={serviceProviders} collaborationProjects={collaborationProjects} />
      case 'settings':
        return <SettingsMobile country={country} role={role} roleLabel={roleLabel} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountryChange} onRoleChange={handleRoleChange} userEmail={userEmail} />
      case 'countries':
        return <CountriesDirectoryMobile signals={signals} onCountrySelect={handleCountryChange} />
      default:
        return null
    }
  })()

  return (
    <div className="hvm-app">
      {/* dangerouslySetInnerHTML bypasses React 19 style-tag hoisting */}
      <style dangerouslySetInnerHTML={{ __html: MOBILE_CSS }} />

      <section className="hvm-titlebar">
        <div className="hvm-titlebar-top">
          <div className="hvm-titlebar-text">
            <span className="hvm-title-kicker">{country.label} · {roleLabel}</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="hvm-titlebar-actions">
            <button type="button" onClick={() => setContextOpen(true)} aria-label="Switch market">Market</button>
            <button
              type="button"
              className="hvm-titlebar-settings"
              aria-label="Settings"
              aria-current={activePage === 'settings' ? 'page' : undefined}
              onClick={() => handlePageChange('settings')}
            >⚙</button>
            {userEmail ? (
              <a href="/account" className="hvm-titlebar-account" aria-label="Account">
                {userEmail.slice(0, 2).toUpperCase()}
              </a>
            ) : (
              <a href="/login" className="hvm-titlebar-signin" aria-label="Sign in">Sign In</a>
            )}
          </div>
        </div>
        {titlebartabs && (
          <div className="hvm-scroll-tabs" role="tablist" aria-label={`${pageTitle} sections`}>
            {titlebartabs.tabs.map(tab => (
              <button key={tab.id} type="button" className={titlebartabs.activeId === tab.id ? 'active' : ''} onClick={() => titlebartabs.onSelect(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <main className="hvm-main">{page}</main>

      <nav className="hvm-bottom-nav" aria-label="Mobile command centre navigation">
        {MOBILE_NAV.map(item => (
          <button key={item.id} type="button" className={activePage === item.id ? 'active' : ''} onClick={() => handlePageChange(item.id)}>
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
            <button className="hvm-sheet-apply" type="button" onClick={() => setContextOpen(false)}>Done</button>
            <div className="hvm-sheet-divider" />
            {userEmail ? (
              <div className="hvm-sheet-account">
                <span className="hvm-sheet-account-email">{userEmail}</span>
                <form action="/api/auth/signout" method="post" style={{ margin: 0 }}>
                  <button type="submit" className="hvm-sheet-signout">Sign out</button>
                </form>
              </div>
            ) : (
              <>
                <a href="/login" className="hvm-sheet-signin">Sign in to your account</a>
                <a href="/login?mode=signup" className="hvm-sheet-signin" style={{ marginTop: 8, background: 'rgba(198,165,90,0.12)', borderColor: 'rgba(198,165,90,0.4)', color: '#F0D39A' }}>Create an account</a>
              </>
            )}
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
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  background: rgba(3,7,17,.97);
  border-bottom: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
}
.hvm-titlebar-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 12px;
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
.hvm-titlebar-signin, .hvm-titlebar-account {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  font: 700 13px/1 Inter, system-ui, sans-serif;
  text-decoration: none;
  cursor: pointer;
}
.hvm-titlebar-signin {
  padding: 0 14px;
  border: 1px solid rgba(198,165,90,0.4);
  background: rgba(198,165,90,0.12);
  color: #F0D39A;
}
.hvm-titlebar-account {
  width: 44px;
  padding: 0;
  border: 1px solid rgba(198,165,90,0.25);
  background: rgba(198,165,90,0.1);
  color: #F0D39A;
  font-size: 11px;
}
.hvm-titlebar-settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.72);
  font-size: 16px;
  cursor: pointer;
}
.hvm-titlebar-settings[aria-current="page"] {
  border-color: rgba(198,165,90,0.5);
  background: rgba(198,165,90,0.14);
  color: #F0D39A;
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
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 8px 16px 10px;
  margin: 0 -16px;
  max-width: calc(100% + 32px);
  scrollbar-width: none;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.hvm-titlebar .hvm-scroll-tabs {
  margin: 0;
  padding: 0 16px 12px;
  max-width: 100%;
  border-bottom: none;
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
.hvm-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background: rgba(212,168,75,.22);
  color: #d4a84b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}
.hvm-scroll-tabs button.active .hvm-tab-count {
  background: rgba(212,168,75,.4);
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
.hvm-market-rating { color: rgba(245,240,232,.7); font-size: 11px; white-space: nowrap; }
.hvm-sort-toggle {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 999px;
  background: rgba(255,255,255,.05);
  color: rgba(245,240,232,.62);
  font-size: 11px; font-weight: 700; letter-spacing: .04em;
  padding: 7px 14px; cursor: pointer; margin: -4px 0 4px;
}
.hvm-sort-toggle.active { border-color: rgba(212,168,75,.4); color: #d4a84b; background: rgba(212,168,75,.08); }
.hvm-empty-card { padding: 16px; }
.hvm-empty-card p { margin: 8px 0 0; color: rgba(245,240,232,.58); line-height: 1.45; }
.hvm-empty-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.hvm-empty-link { font-size: 12px; font-weight: 600; color: rgba(245,240,232,.55); text-decoration: none; letter-spacing: .03em; }
.hvm-empty-link--primary { color: #d4a84b; }
.hvm-empty-link:hover { opacity: .75; }
.hvm-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.hvm-hero-link { font-size: 12px; font-weight: 600; color: rgba(245,240,232,.55); text-decoration: none; letter-spacing: .03em; }
.hvm-hero-link--gold { color: #d4a84b; }
.hvm-hero-link:hover { opacity: .75; }
.hvm-supplier-cta {
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid rgba(212,168,75,.22);
  background: rgba(212,168,75,.05);
}
.hvm-supplier-cta-kicker { font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 8px; }
.hvm-supplier-cta-title { font-size: 15px; font-weight: 600; color: #f5f0e8; line-height: 1.35; margin-bottom: 8px; }
.hvm-supplier-cta-body { font-size: 12px; color: rgba(245,240,232,.55); line-height: 1.55; margin: 0 0 14px; }
.hvm-supplier-cta-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.hvm-supplier-cta-btn {
  display: inline-block; padding: 9px 16px;
  background: #d4a84b; color: #050c18;
  border-radius: 8px; font-size: 13px; font-weight: 700;
  text-decoration: none; letter-spacing: .01em;
}
.hvm-supplier-cta-btn:hover { background: #e8c17a; }
.hvm-supplier-cta-link { font-size: 12px; font-weight: 600; color: rgba(245,240,232,.55); text-decoration: none; }
.hvm-supplier-cta-link:hover { opacity: .75; }
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
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  gap: 0;
  width: 100%;
  max-width: 100%;
  padding: 7px 6px calc(7px + env(safe-area-inset-bottom, 0px));
  background: rgba(3,7,17,.97);
  border-top: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(16px);
}
.hvm-bottom-nav::-webkit-scrollbar { display: none; }
.hvm-bottom-nav button {
  flex: 0 0 auto;
  min-width: 64px;
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
.hvm-program-badge {
  display: inline-block; margin-top: 10px;
  padding: 5px 12px; border-radius: 999px;
  background: rgba(96,165,250,.12); border: 1px solid rgba(96,165,250,.3);
  color: rgba(96,165,250,.9); font-size: 12px; font-weight: 600;
}
.hvm-briefing-body {
  font-size: 14px; line-height: 1.65; color: rgba(245,240,232,.78);
  margin: 0; padding: 0;
}
.hvm-regulator-row {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px 16px; border-radius: 14px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  font-size: 13px; color: rgba(245,240,232,.65);
}
.hvm-cta-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 18px 20px; border-radius: 16px;
  background: rgba(96,165,250,.08); border: 1px solid rgba(96,165,250,.25);
  text-decoration: none; color: inherit;
}
.hvm-cta-card strong { font-size: 16px; color: rgba(245,240,232,.94); }
.hvm-cta-arrow { font-size: 13px; color: rgba(96,165,250,.9); font-weight: 600; }
.hvm-signin-btn {
  display: block; width: 100%; min-height: 50px; border-radius: 14px;
  border: 1px solid rgba(96,165,250,.4); background: rgba(96,165,250,.1);
  color: rgba(96,165,250,.95); font-size: 15px; font-weight: 700; cursor: pointer;
  text-align: center; line-height: 50px; text-decoration: none;
}
.hvm-account-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 12px;
  background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.08);
  margin-bottom: 10px;
}
.hvm-account-email {
  flex: 1; font-size: 13px; color: rgba(245,240,232,.6);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hvm-sheet-divider {
  height: 1px; background: rgba(255,255,255,.08); margin: 14px 0;
}
.hvm-sheet-account {
  display: flex; flex-direction: column; gap: 8px;
}
.hvm-sheet-account-email {
  font-size: 12px; color: rgba(245,240,232,.48);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding: 0 2px;
}
.hvm-sheet-signout {
  width: 100%; min-height: 44px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.045);
  color: rgba(245,240,232,.65); font-size: 14px; font-weight: 600; cursor: pointer;
}
.hvm-sheet-signin {
  display: block; width: 100%; min-height: 44px; border-radius: 12px;
  border: 1px solid rgba(96,165,250,.35); background: rgba(96,165,250,.08);
  color: rgba(96,165,250,.9); font-size: 14px; font-weight: 600; cursor: pointer;
  text-align: center; line-height: 44px; text-decoration: none;
}
@media (orientation: landscape) and (max-width: 767px) {
  .hvm-titlebar-top { padding-top: calc(8px + env(safe-area-inset-top, 0px)); padding-bottom: 8px; }
  .hvm-titlebar h1 { font-size: clamp(24px, 6vw, 34px); }
  .hvm-status-grid, .hvm-meta-grid, .hvm-source-ledger { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hvm-bottom-nav button { min-height: 54px; }
}

/* ── Intelligence signals redesign ──────────────────────────────────────── */
.hvm-live-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: rgba(212,168,75,.35);
  box-shadow: 0 0 0 0 rgba(212,168,75,.4);
  animation: hvmPulse 2s ease-in-out infinite;
}
.hvm-live-dot.active {
  background: #4caf82;
  box-shadow: 0 0 6px rgba(76,175,130,.6);
  animation: hvmPulseGreen 2s ease-in-out infinite;
}
.hvm-live-dot.small { width: 6px; height: 6px; }
@keyframes hvmPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,75,.5); }
  50%       { box-shadow: 0 0 0 5px rgba(212,168,75,0); }
}
@keyframes hvmPulseGreen {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76,175,130,.5); }
  50%       { box-shadow: 0 0 0 5px rgba(76,175,130,0); }
}

.hvm-cat-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;
}
.hvm-cat-cell {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 6px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.03);
  cursor: pointer; transition: all .15s;
  color: rgba(245,240,232,.55);
}
.hvm-cat-cell:hover { background: rgba(255,255,255,.07); color: rgba(245,240,232,.85); }
.hvm-cat-cell.active {
  border-color: color-mix(in srgb, var(--cat-color) 50%, transparent);
  background: color-mix(in srgb, var(--cat-color) 10%, transparent);
}
.hvm-cat-count {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 18px; font-weight: 700;
  color: var(--cat-color, rgba(245,240,232,.8));
  line-height: 1;
}
.hvm-cat-label { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: inherit; }
.hvm-cat-cell.active .hvm-cat-label { color: var(--cat-color); }

.hvm-signal-card--rich { padding: 14px; border-radius: 14px; }
.hvm-sig-head {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;
}
.hvm-sig-cat-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 8px; font-weight: 700; letter-spacing: .16em;
  padding: 2px 6px; border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--chip-color) 40%, transparent);
  color: var(--chip-color, #d4a84b);
  background: color-mix(in srgb, var(--chip-color) 10%, transparent);
}
.hvm-sig-market { font-size: 11px; color: rgba(245,240,232,.5); }
.hvm-sig-time { font-size: 10px; color: rgba(245,240,232,.3); margin-left: auto; white-space: nowrap; }
.hvm-sig-title { font-size: 14px; font-weight: 600; color: #f5f0e8; line-height: 1.4; margin-bottom: 6px; }
.hvm-sig-footer {
  display: flex; align-items: center; gap: 6px; margin-top: 10px;
}
.hvm-sig-conf-bar {
  flex: 1; height: 3px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden;
}
.hvm-sig-conf-fill { height: 100%; border-radius: 2px; transition: width .3s; }
.hvm-sig-conf-val {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.hvm-tag-chip {
  font-size: 9px; padding: 2px 7px; border-radius: 4px;
  border: 1px solid; font-weight: 600; flex-shrink: 0; white-space: nowrap;
}

.hvm-sig-detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.hvm-sig-detail-cell {
  padding: 14px; border-radius: 14px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
}
.hvm-sig-conf-big {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 28px; font-weight: 700; line-height: 1.1; margin: 4px 0 8px;
}
.hvm-conf-bar-wrap {
  position: relative; height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden;
}
.hvm-conf-bar-fill { height: 100%; border-radius: 2px; transition: width .4s; }

.hvm-monitor-panel {
  padding: 24px 20px; border-radius: 16px;
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02);
}
.hvm-monitor-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.hvm-monitor-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 10px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
  font-size: 11px; color: rgba(245,240,232,.55);
}

/* ── Regulatory redesign ─────────────────────────────────────────────────── */
.hvm-opp-badge {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 68px; height: 68px; border-radius: 14px; flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--opp-color) 35%, transparent);
  background: color-mix(in srgb, var(--opp-color) 10%, transparent);
}
.hvm-opp-score {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 26px; font-weight: 700; line-height: 1;
  color: var(--opp-color, #d4a84b);
}
.hvm-opp-label { font-size: 10px; color: rgba(245,240,232,.38); margin-top: 1px; }
.hvm-opp-sub {
  font-size: 8px; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(245,240,232,.3); margin-top: 3px;
}

.hvm-reg-matrix-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.hvm-reg-matrix-cell {
  padding: 12px; border-radius: 12px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; gap: 4px;
}
.hvm-reg-matrix-icon { font-size: 14px; opacity: .5; }
.hvm-reg-matrix-label { font-size: 10px; color: rgba(245,240,232,.42); letter-spacing: .06em; text-transform: uppercase; }
.hvm-reg-matrix-val { font-size: 12px; font-weight: 700; line-height: 1.3; }

.hvm-timeline { display: flex; flex-direction: column; gap: 0; }
.hvm-timeline-item {
  display: flex; gap: 12px; align-items: flex-start; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.hvm-timeline-item:last-child { border-bottom: none; }
.hvm-timeline-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
}
.hvm-timeline-body { flex: 1; min-width: 0; }

.hvm-trigger-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  transition: background .2s;
}

.hvm-authority-card {
  padding: 16px; border-radius: 14px;
  background: rgba(91,155,213,.06); border: 1px solid rgba(91,155,213,.2);
}

/* ── Watchlist redesign ──────────────────────────────────────────────────── */
.hvm-alert-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(224,85,85,.15); border: 1px solid rgba(224,85,85,.3);
  color: #e05555; font-size: 10px; font-weight: 700;
}
.hvm-notif-row-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px;
}
.hvm-notif-cell {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 10px 6px; border-radius: 10px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
}
.hvm-notif-cell--warn { border-color: rgba(224,85,85,.25); background: rgba(224,85,85,.07); }
.hvm-notif-cell--ok   { border-color: rgba(76,175,130,.25); background: rgba(76,175,130,.07); }
.hvm-notif-val {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 22px; font-weight: 700; color: #f5f0e8; line-height: 1;
}
.hvm-notif-cell--warn .hvm-notif-val { color: #e05555; }
.hvm-notif-cell--ok   .hvm-notif-val { color: #4caf82; }
.hvm-notif-lbl { font-size: 10px; color: rgba(245,240,232,.42); text-transform: uppercase; letter-spacing: .08em; }

.hvm-current-market-card {
  padding: 14px 16px; border-radius: 14px;
  background: rgba(212,168,75,.06); border: 1px solid rgba(212,168,75,.2);
}
.hvm-add-watch-btn {
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid rgba(212,168,75,.45); background: rgba(212,168,75,.1);
  color: #d4a84b; font-size: 12px; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .12s;
}
.hvm-add-watch-btn:hover { background: rgba(212,168,75,.2); }

.hvm-wl-empty-panel {
  padding: 28px 20px; border-radius: 16px; text-align: center;
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02);
}

.hvm-radar-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.hvm-radar-cell {
  padding: 12px; border-radius: 12px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  display: grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto auto;
  gap: 3px 8px; align-items: center;
}
.hvm-radar-iso {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px; font-weight: 700; color: #5b9bd5; grid-row: 1;
}
.hvm-radar-name { font-size: 11px; color: rgba(245,240,232,.75); grid-row: 1; font-weight: 600; }
.hvm-radar-status { font-size: 10px; color: rgba(245,240,232,.42); grid-column: 1 / 3; grid-row: 2; }
.hvm-radar-trend { font-size: 14px; font-weight: 700; grid-row: 1; text-align: right; }
.hvm-radar-add {
  grid-column: 3; grid-row: 2;
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid rgba(212,168,75,.4); background: rgba(212,168,75,.08);
  color: #d4a84b; font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.hvm-watch-types { display: flex; flex-direction: column; gap: 8px; }
.hvm-watch-type-card {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: 12px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  transition: background .12s;
}
.hvm-watch-type-card:hover { background: rgba(255,255,255,.06); }
.hvm-watch-type-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }

.hvm-hist-bar-wrap {
  display: flex; align-items: flex-end; gap: 8px; height: 64px;
}
.hvm-conf-bar-col {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%;
}
.hvm-conf-bar-track {
  flex: 1; width: 100%; border-radius: 4px;
  background: rgba(255,255,255,.08); position: relative; overflow: hidden;
}
.hvm-hist-bar-fill {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(180deg, #d4a84b, rgba(212,168,75,.45));
  border-radius: 4px 4px 0 0; transition: height .3s;
}
.hvm-conf-bar-col > span {
  font-size: 9px; color: rgba(245,240,232,.38);
  font-family: "JetBrains Mono", ui-monospace, monospace; letter-spacing: .04em;
}
.hvm-filter-row {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
}
.hvm-filter-sel {
  flex: 1 1 120px; min-height: 40px; border: 1px solid rgba(255,255,255,.13);
  border-radius: 10px; background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.88); padding: 0 10px; font-size: 14px; outline: none;
}
.hvm-filter-sel option { color: #07111d; }
.hvm-clear-filters {
  flex: 0 0 auto; min-height: 40px; padding: 0 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.055);
  color: rgba(245,240,232,.65); font-size: 13px; font-weight: 700; cursor: pointer;
}
.hvm-clear-filters:hover { background: rgba(255,255,255,.1); }
.hvm-imp-badge {
  flex-shrink: 0; padding: 2px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
}
.hvm-imp-badge--high   { background: rgba(76,175,130,.18); color: #4caf82; }
.hvm-imp-badge--medium { background: rgba(212,168,75,.15); color: #d4a84b; }
.hvm-imp-badge--low    { background: rgba(255,255,255,.07); color: rgba(245,240,232,.46); }
`
