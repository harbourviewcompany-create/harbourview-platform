'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CommandPage, MarketRow, MarketView } from './CommandCentre'
import { JOB_LISTINGS, JOB_SECTOR_LABELS, JOB_TYPE_LABELS } from './data/jobsBoard'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import './MobileCommandCentreV2.css'

type Props = React.ComponentProps<typeof import('./CommandCentre').default>

type SectionId =
  | 'overview'
  | 'live-status'
  | 'market-intelligence'
  | 'marketplace'
  | 'supply'
  | 'next-actions'
  | 'weekly-signals'
  | 'personal-briefing'
  | 'search'
  | 'education'
  | 'jurisdiction'
  | 'market-status'
  | 'review-gates'
  | 'directories'
  | 'talent'
  | 'genetics'
  | 'clinical'
  | 'compliance'
  | 'network'
  | 'financing'

type PrimaryDestination = {
  id: SectionId
  label: string
  icon: string
}

type SectionDestination = {
  id: SectionId
  label: string
  icon: string
}

type NormalizedListing = {
  id: string
  title: string
  summary: string
  jurisdiction: string
  category: string
  status: string
  channel: string
  confidence: number | null
  view: MarketView
}

type DirectoryRecord = {
  id: string
  kind: string
  title: string
  subtitle: string
  status: string
}

const MARKET_TABS: Array<{ id: MarketView; label: string }> = [
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'wanted', label: 'Wanted' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'services', label: 'Services' },
  { id: 'new-products', label: 'New products' },
]

const PRIMARY_NAV: PrimaryDestination[] = [
  { id: 'overview', label: 'Command', icon: '◎' },
  { id: 'marketplace', label: 'Market', icon: '⊞' },
  { id: 'weekly-signals', label: 'Intel', icon: '≋' },
  { id: 'next-actions', label: 'Actions', icon: '→' },
  { id: 'jurisdiction', label: 'Context', icon: '◉' },
]

const SECTION_NAV: SectionDestination[] = [
  { id: 'overview', label: 'Command brief', icon: '◎' },
  { id: 'live-status', label: 'Live status', icon: '◷' },
  { id: 'market-intelligence', label: 'Market intelligence', icon: '≈' },
  { id: 'marketplace', label: 'Marketplace control', icon: '⊞' },
  { id: 'supply', label: 'Supply', icon: '▤' },
  { id: 'next-actions', label: 'Next actions', icon: '→' },
  { id: 'weekly-signals', label: 'Weekly signals', icon: '≋' },
  { id: 'personal-briefing', label: 'Personal briefing', icon: '❑' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'education', label: 'Education path', icon: '◇' },
  { id: 'jurisdiction', label: 'Jurisdiction context', icon: '◉' },
  { id: 'market-status', label: 'Marketplace status', icon: '◫' },
  { id: 'review-gates', label: 'Review gates', icon: '◆' },
  { id: 'directories', label: 'Directories', icon: '⊚' },
  { id: 'talent', label: 'Talent', icon: '✦' },
  { id: 'genetics', label: 'Genetics', icon: '⊕' },
  { id: 'clinical', label: 'Clinical', icon: '⚕' },
  { id: 'compliance', label: 'Compliance', icon: '▣' },
  { id: 'network', label: 'Network', icon: '◎' },
  { id: 'financing', label: 'Trade financing', icon: '¤' },
]

const PAGE_TO_SECTION: Partial<Record<CommandPage, SectionId>> = {
  briefing: 'overview',
  digest: 'personal-briefing',
  marketplace: 'marketplace',
  signals: 'weekly-signals',
  watchlist: 'weekly-signals',
  education: 'education',
  'access-pathway': 'jurisdiction',
  regulatory: 'jurisdiction',
  'local-intel': 'jurisdiction',
  countries: 'jurisdiction',
  evidence: 'review-gates',
  prices: 'market-intelligence',
  logistics: 'supply',
  talent: 'talent',
  jobs: 'talent',
  genetics: 'genetics',
  clinical: 'clinical',
  compliance: 'compliance',
  licences: 'compliance',
  experts: 'directories',
  banking: 'financing',
  'trade-calc': 'financing',
}

const SECTION_IDS = new Set<string>(SECTION_NAV.map(section => section.id))

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function readString(value: unknown, keys: string[], fallback = ''): string {
  const item = asRecord(value)
  for (const key of keys) {
    const candidate = item[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  }
  return fallback
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function formatStatus(value: unknown, fallback = 'Review required'): string {
  return typeof value === 'string' && value.trim() ? titleCase(value) : fallback
}

function clampPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  const normalized = value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

function normalizeListing(row: MarketRow, index: number, view: MarketView, fallbackJurisdiction: string): NormalizedListing {
  return {
    id: String(row[7] || `${view}-${index}`),
    title: String(row[0] || 'Reviewed marketplace record'),
    summary: String(row[1] || 'Commercial detail is available through a controlled Harbourview workflow.'),
    jurisdiction: String(row[2] || fallbackJurisdiction),
    category: String(row[3] || MARKET_TABS.find(tab => tab.id === view)?.label || 'Marketplace'),
    status: String(row[4] || 'Pending review'),
    channel: String(row[5] || 'Harbourview mediated'),
    confidence: Number.isFinite(Number(row[6])) ? clampPercent(Number(row[6])) : null,
    view,
  }
}

function SectionHeading({ eyebrow, title, description, action }: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <header className="hvm2-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

function Metric({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: React.ReactNode
  detail: string
  tone?: 'neutral' | 'gold' | 'ok' | 'warn'
}) {
  return (
    <article className={`hvm2-metric hvm2-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'gold' | 'ok' | 'warn' }) {
  return <span className={`hvm2-pill hvm2-pill-${tone}`}>{children}</span>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="hvm2-empty">
      <span aria-hidden="true">◇</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}

export default function MobileCommandCentreV2(props: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [activeMarketView, setActiveMarketView] = useState<MarketView>('cannabis')
  const [marketQuery, setMarketQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const sectionNodes = useRef(new Map<SectionId, HTMLElement>())

  const country = useMemo(() => {
    const match = ALL_COUNTRIES.find(item => item.iso2 === props.initialCountryIso2)
    return match ?? ALL_COUNTRIES.find(item => item.iso2 === 'CA') ?? ALL_COUNTRIES[0]
  }, [props.initialCountryIso2])

  const roleEntries = useMemo(
    () => Object.entries(ROLE_PROFILES)
      .filter((entry): entry is [string, { label: string; short: string }] => Boolean(entry[1]))
      .sort((a, b) => a[1].label.localeCompare(b[1].label)),
    [],
  )

  const role = ROLE_PROFILES[props.initialRoleId as keyof typeof ROLE_PROFILES]
  const roleLabel = role?.label ?? (props.initialRoleId ? titleCase(props.initialRoleId) : 'All roles')
  const roleShort = role?.short ?? roleLabel
  const countryLabel = country?.displayName ?? 'Global'
  const countryIso2 = country?.iso2 ?? 'GLOBAL'

  const marketRows = useMemo(() => {
    return MARKET_TABS.flatMap(tab => (props.marketplaceRows?.[tab.id] ?? []).map((row, index) => normalizeListing(row, index, tab.id, countryLabel)))
  }, [props.marketplaceRows, countryLabel])

  const filteredMarketRows = useMemo(() => {
    const query = marketQuery.trim().toLowerCase()
    return marketRows.filter(row => {
      if (row.view !== activeMarketView) return false
      if (!query) return true
      return [row.title, row.summary, row.category, row.jurisdiction, row.status]
        .some(value => value.toLowerCase().includes(query))
    })
  }, [marketRows, activeMarketView, marketQuery])

  const supplyRows = useMemo(
    () => marketRows.filter(row => row.view !== 'wanted' && row.view !== 'opportunities'),
    [marketRows],
  )

  const signals = props.digestSignals?.length ? props.digestSignals : props.signals
  const educationTiles = props.liveTiles?.length ? props.liveTiles : props.eduCategories
  const confidence = clampPercent(props.countryIntel?.confidence_score ?? props.countryIntel?.opportunity_score)
  const pipeline = props.pipeline ?? { wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }
  const pipelineTotal = pipeline.wanted + pipeline.matched + pipeline.proof_review + pipeline.inquiry + pipeline.deal_room
  const sourceCoverageCount = props.sourceCoverage?.length ?? 0
  const marketplaceCount = marketRows.length
  const reviewStatus = formatStatus(props.countryIntel?.review_status, 'Pending review')
  const dataCompleteness = formatStatus(props.countryIntel?.data_completeness, 'Coverage pending')
  const marketMetrics = props.marketMetrics ?? []
  const tradeFlows = props.tradeFlows ?? []

  const directoryRecords = useMemo<DirectoryRecord[]>(() => {
    const professionals = (props.professionals ?? []).map((item, index) => ({
      id: readString(item, ['id', 'slug'], `professional-${index}`),
      kind: 'Professional',
      title: readString(item, ['displayName', 'display_name', 'name'], 'Reviewed professional'),
      subtitle: readString(item, ['service_summary', 'public_summary', 'specialty', 'description'], 'Professional profile available through Harbourview.'),
      status: readString(item, ['verification_level', 'verification_status', 'status'], 'Reviewed'),
    }))
    const serviceProviders = (props.serviceProviders ?? []).map((item, index) => ({
      id: readString(item, ['id', 'slug'], `provider-${index}`),
      kind: 'Service provider',
      title: readString(item, ['displayName', 'display_name', 'name'], 'Reviewed service provider'),
      subtitle: readString(item, ['service_summary', 'public_summary', 'description'], 'Service capability available through Harbourview.'),
      status: readString(item, ['verification_level', 'verification_status', 'status'], 'Reviewed'),
    }))
    const operators = (props.cannabisOperators ?? []).map((item, index) => ({
      id: readString(item, ['id', 'slug'], `operator-${index}`),
      kind: 'Licensed operator',
      title: readString(item, ['operator_name', 'legal_name', 'display_name', 'name'], 'Licensed operator'),
      subtitle: readString(item, ['public_summary', 'description', 'licence_type'], 'Operator record available through Harbourview.'),
      status: readString(item, ['verification_status', 'status', 'licence_status'], 'Reviewed'),
    }))
    return [...professionals, ...serviceProviders, ...operators]
  }, [props.professionals, props.serviceProviders, props.cannabisOperators])

  const geneticsRecords = useMemo(() => (props.cultivarPassports ?? []).map((item, index) => ({
    id: readString(item, ['id', 'slug', 'cultivar_id'], `cultivar-${index}`),
    title: readString(item, ['cultivar_name', 'name', 'display_name', 'title'], 'Cultivar passport'),
    subtitle: readString(item, ['public_summary', 'description', 'breeder_name', 'origin'], 'Reviewed genetics record.'),
    status: readString(item, ['verification_status', 'review_status', 'status'], 'Reviewed'),
  })), [props.cultivarPassports])

  const submissionRecords = useMemo(() => (props.mySubmissions ?? []).map((item, index) => ({
    id: readString(item, ['id', 'submission_id'], `submission-${index}`),
    title: readString(item, ['title', 'headline', 'listing_title'], 'Marketplace submission'),
    status: readString(item, ['status', 'review_status', 'publication_state'], 'Received'),
  })), [props.mySubmissions])

  const talentRecords = useMemo(() => {
    const normalizedRole = roleShort.toLowerCase()
    const inContext = JOB_LISTINGS.filter(job =>
      job.country === countryIso2 || job.roles.some(jobRole => normalizedRole.includes(jobRole.toLowerCase())),
    )
    return inContext.length > 0 ? inContext : JOB_LISTINGS
  }, [countryIso2, roleShort])

  const nextActions = useMemo(() => {
    const actions: Array<{ id: string; label: string; detail: string; href: string; tone: 'neutral' | 'gold' | 'ok' | 'warn' }> = []
    if (pipeline.inquiry > 0) actions.push({
      id: 'inquiries',
      label: `Review ${pipeline.inquiry} active ${pipeline.inquiry === 1 ? 'inquiry' : 'inquiries'}`,
      detail: 'Qualify intent and decide whether the request should advance to controlled review.',
      href: '/dashboard?section=market-status',
      tone: 'gold',
    })
    if (pipeline.proof_review > 0) actions.push({
      id: 'proof',
      label: `${pipeline.proof_review} proof ${pipeline.proof_review === 1 ? 'gate' : 'gates'} require review`,
      detail: 'Check authorization, evidence and counterparty readiness before an introduction is released.',
      href: '/dashboard?section=review-gates',
      tone: 'warn',
    })
    if (props.wantedCount && props.wantedCount > 0) actions.push({
      id: 'wanted',
      label: `Assess ${props.wantedCount} wanted ${props.wantedCount === 1 ? 'request' : 'requests'}`,
      detail: 'Match verified demand against approved supply and service capacity.',
      href: '/marketplace/wanted',
      tone: 'gold',
    })
    actions.push({
      id: 'pathway',
      label: `Validate the ${countryLabel} access pathway`,
      detail: props.countryIntel?.commercial_pathway_summary?.trim() || 'Confirm licence, import/export, quality and evidence requirements for the selected role.',
      href: '/dashboard?section=jurisdiction',
      tone: props.countryIntel?.review_status === 'approved' ? 'ok' : 'neutral',
    })
    if (!props.hasOrg) actions.push({
      id: 'organization',
      label: 'Connect an organization profile',
      detail: 'Add the operating entity used for marketplace submissions, evidence and reviewed introductions.',
      href: '/account',
      tone: 'warn',
    })
    if (educationTiles.length > 0) actions.push({
      id: 'education',
      label: `Continue the ${roleShort} education path`,
      detail: `${educationTiles.length} role-relevant modules are available in the current context.`,
      href: '/dashboard?section=education',
      tone: 'neutral',
    })
    return actions
  }, [pipeline.inquiry, pipeline.proof_review, props.wantedCount, props.countryIntel, props.hasOrg, educationTiles.length, countryLabel, roleShort])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return { signals: props.signals, listings: marketRows }
    return {
      signals: props.signals.filter(signal => [signal.title, signal.market, signal.type, signal.commercialImpact]
        .some(value => value.toLowerCase().includes(query))),
      listings: marketRows.filter(row => [row.title, row.summary, row.category, row.jurisdiction]
        .some(value => value.toLowerCase().includes(query))),
    }
  }, [searchQuery, props.signals, marketRows])

  useEffect(() => {
    const requested = searchParams.get('section')
    const initial = requested && SECTION_IDS.has(requested)
      ? requested as SectionId
      : PAGE_TO_SECTION[props.initialPage ?? 'briefing'] ?? 'overview'
    setActiveSection(initial)
    if (initial !== 'overview') {
      const timer = window.setTimeout(() => {
        sectionNodes.current.get(initial)?.scrollIntoView({ block: 'start' })
      }, 120)
      return () => window.clearTimeout(timer)
    }
  }, [props.initialPage, searchParams])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id as SectionId)
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0.05, 0.2, 0.5] })

    sectionNodes.current.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  function registerSection(id: SectionId) {
    return (node: HTMLElement | null) => {
      if (node) sectionNodes.current.set(id, node)
      else sectionNodes.current.delete(id)
    }
  }

  function navigateToSection(id: SectionId) {
    setActiveSection(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', id)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
    window.requestAnimationFrame(() => sectionNodes.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function updateContext(key: 'country' | 'role', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('section', activeSection)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="hvm2-root" data-mobile-command-version="2">
      <header className="hvm2-command-header">
        <div className="hvm2-header-row">
          <div>
            <span className="hvm2-wordmark">HARBOURVIEW</span>
            <span className="hvm2-command-label">Mobile Command</span>
          </div>
          <div className="hvm2-live-chip"><i /> Live</div>
        </div>

        <div className="hvm2-command-title">
          <div className="hvm2-country-flag" aria-hidden="true">{flagEmoji(countryIso2)}</div>
          <div>
            <span>{countryLabel} · {roleShort}</span>
            <h1>Operator command centre</h1>
          </div>
          <Link href="/account" className="hvm2-account-link" aria-label="Open account">Account</Link>
        </div>

        <div className="hvm2-context-controls" aria-label="Dashboard context">
          <label>
            <span>Jurisdiction</span>
            <select value={countryIso2} onChange={event => updateContext('country', event.target.value)}>
              {ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select value={props.initialRoleId ?? ''} onChange={event => updateContext('role', event.target.value)}>
              <option value="">All roles</option>
              {roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <nav className="hvm2-section-rail" aria-label="All mobile command sections">
        {SECTION_NAV.map(section => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? 'active' : ''}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onClick={() => navigateToSection(section.id)}
          >
            <span aria-hidden="true">{section.icon}</span>{section.label}
          </button>
        ))}
      </nav>

      <main className="hvm2-main">
        <section id="overview" ref={registerSection('overview')} className="hvm2-section hvm2-overview">
          <div className="hvm2-hero-grid">
            <article className="hvm2-command-brief">
              <span>Command brief</span>
              <h2>{countryLabel} operating picture</h2>
              <p>{props.countryIntel?.public_summary?.trim() || `${countryLabel} is loaded as the active jurisdiction for ${roleLabel}. Live marketplace, intelligence, pathway and education signals are consolidated below.`}</p>
              <div className="hvm2-brief-tags">
                <StatusPill tone="gold">{formatStatus(props.countryIntel?.market_access_status, 'Market access review')}</StatusPill>
                <StatusPill tone={props.countryIntel?.review_status === 'approved' ? 'ok' : 'neutral'}>{reviewStatus}</StatusPill>
                <StatusPill>{dataCompleteness}</StatusPill>
              </div>
            </article>
            <article className="hvm2-priority-card">
              <span>Immediate priority</span>
              <strong>{nextActions[0]?.label ?? 'Validate the active market context'}</strong>
              <p>{nextActions[0]?.detail ?? 'Review the live operating picture before moving into commercial action.'}</p>
              <button type="button" onClick={() => navigateToSection('next-actions')}>Open action queue</button>
            </article>
          </div>
        </section>

        <section id="live-status" ref={registerSection('live-status')} className="hvm2-section">
          <SectionHeading eyebrow="Metrics / live status" title="Current operating state" description="A compact read on opportunity, demand, evidence and intelligence in the selected jurisdiction-role context." />
          <div className="hvm2-metric-grid">
            <Metric label="Marketplace records" value={marketplaceCount} detail="Across all active categories" tone="gold" />
            <Metric label="Wanted demand" value={props.wantedCount ?? 0} detail="Approved demand records" />
            <Metric label="Live intelligence" value={props.signals.length} detail="Signals in current feed" tone="ok" />
            <Metric label="Evidence confidence" value={confidence == null ? '—' : `${confidence}%`} detail={`${reviewStatus} · ${sourceCoverageCount} source lanes`} tone={confidence != null && confidence >= 75 ? 'ok' : 'neutral'} />
          </div>
        </section>

        <section id="market-intelligence" ref={registerSection('market-intelligence')} className="hvm2-section">
          <SectionHeading eyebrow="Market intelligence" title="Metrics and trade flows" description="Country-context market indicators and reviewed trade corridors are presented separately from marketplace listings." />
          {marketMetrics.length > 0 || tradeFlows.length > 0 ? (
            <div className="hvm2-compliance-grid">
              {marketMetrics.map((metric, index) => (
                <article key={`metric-${readString(metric, ['id'], String(index))}`}>
                  <span>{readString(metric, ['category', 'metric_type', 'label'], 'Market metric')}</span>
                  <strong>{readString(metric, ['metric_name', 'name', 'title'], 'Market indicator')}</strong>
                  <p>{readString(metric, ['display_value', 'value', 'summary'], 'Value under review')}</p>
                </article>
              ))}
              {tradeFlows.map((flow, index) => (
                <article key={`flow-${readString(flow, ['id'], String(index))}`}>
                  <span>{readString(flow, ['origin', 'source_country'], 'Trade')} → {readString(flow, ['destination', 'destination_country'], 'Market')}</span>
                  <strong>{readString(flow, ['product', 'product_type', 'title'], 'Reviewed trade flow')}</strong>
                  <p>{readString(flow, ['summary', 'status', 'volume'], 'Corridor evidence under review')}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState title="Market intelligence is ready for data" detail="No reviewed metrics or trade flows matched the current jurisdiction yet." />}
        </section>

        <section id="marketplace" ref={registerSection('marketplace')} className="hvm2-section hvm2-market-section">
          <SectionHeading
            eyebrow="Marketplace control"
            title="Demand, supply and commercial routes"
            description="Review approved records, search the active category, post demand and move qualified opportunities into controlled Harbourview workflows."
            action={<Link className="hvm2-text-link" href="/marketplace">Open exchange</Link>}
          />
          <div className="hvm2-quick-actions">
            <Link href="/marketplace/wanted"><span>＋</span><strong>Post wanted demand</strong><small>Buyer-led requirement</small></Link>
            <Link href="/marketplace/sell"><span>↗</span><strong>Submit supply</strong><small>Controlled review intake</small></Link>
            <Link href="/marketplace/financing"><span>¤</span><strong>Request financing</strong><small>Trade structure review</small></Link>
          </div>
          <div className="hvm2-market-controls">
            <div className="hvm2-tab-rail" role="tablist" aria-label="Marketplace categories">
              {MARKET_TABS.map(tab => (
                <button key={tab.id} type="button" role="tab" aria-selected={activeMarketView === tab.id} className={activeMarketView === tab.id ? 'active' : ''} onClick={() => setActiveMarketView(tab.id)}>
                  {tab.label}<span>{marketRows.filter(row => row.view === tab.id).length}</span>
                </button>
              ))}
            </div>
            <label className="hvm2-search-field">
              <span aria-hidden="true">⌕</span>
              <input value={marketQuery} onChange={event => setMarketQuery(event.target.value)} placeholder={`Search ${MARKET_TABS.find(tab => tab.id === activeMarketView)?.label.toLowerCase() ?? 'marketplace'}`} />
            </label>
          </div>
          {filteredMarketRows.length > 0 ? (
            <div className="hvm2-listing-grid">
              {filteredMarketRows.map(row => (
                <article className="hvm2-listing-card" key={`${row.view}-${row.id}`}>
                  <div className="hvm2-card-topline"><StatusPill tone="gold">{row.category}</StatusPill><span>{row.jurisdiction}</span></div>
                  <h3>{row.title}</h3>
                  <p>{row.summary}</p>
                  <div className="hvm2-card-meta">
                    <span>{formatStatus(row.status)}</span>
                    <span>{formatStatus(row.channel, 'Harbourview mediated')}</span>
                    {row.confidence != null && <span>{row.confidence}% confidence</span>}
                  </div>
                  <Link href={`/intake?topic=marketplace&listing=${encodeURIComponent(row.id)}`}>Request reviewed introduction</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No records match this view" detail="The category remains available. Adjust the search or post a wanted requirement for Harbourview review." />
          )}
        </section>

        <section id="supply" ref={registerSection('supply')} className="hvm2-section">
          <SectionHeading eyebrow="Supply" title="Products, consumables, equipment and services" description="The complete loaded supply universe remains visible across cannabis, equipment, consumables, services and new products." action={<Link className="hvm2-text-link" href="/supply">Supply catalogue</Link>} />
          <div className="hvm2-metric-grid">
            {MARKET_TABS.filter(tab => !['wanted', 'opportunities'].includes(tab.id)).map(tab => (
              <Metric key={tab.id} label={tab.label} value={supplyRows.filter(row => row.view === tab.id).length} detail="Approved loaded records" />
            ))}
          </div>
          {supplyRows.length > 0 ? (
            <div className="hvm2-horizontal-deck hvm2-deck-spaced">
              {supplyRows.map(row => (
                <article className="hvm2-listing-card" key={`supply-${row.view}-${row.id}`}>
                  <div className="hvm2-card-topline"><StatusPill tone="gold">{row.category}</StatusPill><span>{row.jurisdiction}</span></div>
                  <h3>{row.title}</h3>
                  <p>{row.summary}</p>
                  <div className="hvm2-card-meta"><span>{formatStatus(row.status)}</span><span>{formatStatus(row.channel)}</span></div>
                  <Link href={`/intake?topic=supply&listing=${encodeURIComponent(row.id)}`}>Start controlled supply review</Link>
                </article>
              ))}
            </div>
          ) : <EmptyState title="No reviewed supply records loaded" detail="Post a supply submission or wanted requirement for Harbourview review." />}
        </section>

        <section id="next-actions" ref={registerSection('next-actions')} className="hvm2-section">
          <SectionHeading eyebrow="Context / next actions" title="Operator action queue" description="Actions are derived from the selected jurisdiction, role, marketplace pipeline and current evidence state." />
          <div className="hvm2-action-stack">
            {nextActions.map((action, index) => (
              <Link key={action.id} href={action.href} className={`hvm2-action-card hvm2-tone-${action.tone}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{action.label}</strong><p>{action.detail}</p></div>
                <i aria-hidden="true">→</i>
              </Link>
            ))}
          </div>
        </section>

        <section id="weekly-signals" ref={registerSection('weekly-signals')} className="hvm2-section">
          <SectionHeading eyebrow="Context / weekly signals" title="Intelligence requiring attention" description="All signals loaded into the current dashboard feed remain visible and reviewable here." action={<Link className="hvm2-text-link" href="/signals">Signals workspace</Link>} />
          {signals.length > 0 ? (
            <div className="hvm2-horizontal-deck" aria-label="Weekly intelligence signals">
              {signals.map(signal => (
                <article className="hvm2-signal-card" key={signal.id}>
                  <div className="hvm2-card-topline"><StatusPill>{signal.type}</StatusPill><span>{signal.market}</span></div>
                  <h3>{signal.title}</h3>
                  <p>{signal.analysis?.what_changed || signal.commercialImpact}</p>
                  <div className="hvm2-signal-footer">
                    <span>{signal.confidence}% confidence</span>
                    <span>{signal.timeAgo}</span>
                  </div>
                  {signal.analysis?.recommended_action && <small>{signal.analysis.recommended_action}</small>}
                </article>
              ))}
            </div>
          ) : <EmptyState title="No reviewed signals loaded" detail="The intelligence surface is live but no current signals matched this context." />}
        </section>

        <section id="personal-briefing" ref={registerSection('personal-briefing')} className="hvm2-section">
          <SectionHeading eyebrow="Personal briefing" title={`${roleShort} briefing for ${countryLabel}`} description="A deterministic summary of the active jurisdiction, market pipeline, signal feed and next operational decisions." />
          <article className="hvm2-narrative-card">
            <p>{props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${countryLabel} remains the active commercial-intelligence context.`}</p>
            <div className="hvm2-narrative-grid">
              <div><span>Commercial records</span><strong>{marketplaceCount}</strong></div>
              <div><span>Signals tracked</span><strong>{signals.length}</strong></div>
              <div><span>Pipeline items</span><strong>{pipelineTotal}</strong></div>
              <div><span>Action queue</span><strong>{nextActions.length}</strong></div>
            </div>
          </article>
        </section>

        <section id="search" ref={registerSection('search')} className="hvm2-section">
          <SectionHeading eyebrow="Cross-command search" title="Search intelligence and marketplace records" description="Search operates across every signal and marketplace record already loaded into this authenticated command session." />
          <label className="hvm2-search-field hvm2-search-field-large">
            <span aria-hidden="true">⌕</span>
            <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search markets, products, regulations, operators or actions" />
          </label>
          <div className="hvm2-search-summary"><span>{searchResults.signals.length} signals</span><span>{searchResults.listings.length} marketplace records</span></div>
          {searchQuery.trim() && (
            <div className="hvm2-search-results">
              {searchResults.signals.map(signal => <button type="button" key={`signal-${signal.id}`} onClick={() => navigateToSection('weekly-signals')}><span>Signal</span><strong>{signal.title}</strong><small>{signal.market}</small></button>)}
              {searchResults.listings.map(row => <button type="button" key={`listing-${row.view}-${row.id}`} onClick={() => { setActiveMarketView(row.view); setMarketQuery(searchQuery); navigateToSection('marketplace') }}><span>Marketplace</span><strong>{row.title}</strong><small>{row.category} · {row.jurisdiction}</small></button>)}
              {searchResults.signals.length === 0 && searchResults.listings.length === 0 && <EmptyState title="No command records matched" detail="Try a country, product, regulatory topic or commercial category." />}
            </div>
          )}
        </section>

        <section id="education" ref={registerSection('education')} className="hvm2-section">
          <SectionHeading eyebrow="Context / education path" title={`${roleShort} learning path`} description="Role-relevant education is kept in the same operational context as market, access and compliance work." action={<Link className="hvm2-text-link" href="/dashboard?page=education">Education hub</Link>} />
          {educationTiles.length > 0 ? (
            <div className="hvm2-horizontal-deck">
              {educationTiles.map((tile, index) => (
                <article className="hvm2-education-card" key={`${readString(tile, ['slug', 'title'], String(index))}-${index}`}>
                  <span aria-hidden="true">{readString(tile, ['icon'], '◇')}</span>
                  <h3>{readString(tile, ['title'], 'Education module')}</h3>
                  <p>{readString(tile, ['desc', 'description'], 'Role-relevant education content.')}</p>
                  <Link href={`/dashboard?page=education&module=${encodeURIComponent(readString(tile, ['slug'], 'overview'))}`}>Open module</Link>
                </article>
              ))}
            </div>
          ) : <EmptyState title="Education path pending" detail="No published modules matched the active role yet." />}
        </section>

        <section id="jurisdiction" ref={registerSection('jurisdiction')} className="hvm2-section">
          <SectionHeading eyebrow="Jurisdiction context" title={`${countryLabel} market-access context`} description="Country status, regulator, access posture and commercial pathway remain tied to the selected role." action={<Link className="hvm2-text-link" href="/markets">All markets</Link>} />
          <article className="hvm2-jurisdiction-card">
            <div className="hvm2-jurisdiction-title"><span>{flagEmoji(countryIso2)}</span><div><h3>{countryLabel}</h3><p>{props.countryIntel?.region || 'Global regulated market'}</p></div></div>
            <p>{props.countryIntel?.briefing_regulatory_outlook?.trim() || props.countryIntel?.commercial_pathway_summary?.trim() || 'Regulatory and commercial pathway detail remains subject to controlled evidence review.'}</p>
            <div className="hvm2-status-matrix">
              <div><span>Import</span><strong>{formatStatus(props.countryIntel?.import_status)}</strong></div>
              <div><span>Export</span><strong>{formatStatus(props.countryIntel?.export_status)}</strong></div>
              <div><span>Medical</span><strong>{formatStatus(props.countryIntel?.medical_status)}</strong></div>
              <div><span>Adult use</span><strong>{formatStatus(props.countryIntel?.adult_use_status)}</strong></div>
              <div><span>Regulator</span><strong>{props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body || 'Under review'}</strong></div>
              <div><span>Evidence</span><strong>{reviewStatus}</strong></div>
            </div>
          </article>
        </section>

        <section id="market-status" ref={registerSection('market-status')} className="hvm2-section">
          <SectionHeading eyebrow="Marketplace status" title="Controlled transaction pipeline" description="Harbourview remains the mediated layer between demand, proof review, qualified matches and controlled deal-room access." />
          <div className="hvm2-pipeline" aria-label="Marketplace pipeline">
            {[
              ['Wanted', props.wantedCount ?? pipeline.wanted],
              ['Inquiry', pipeline.inquiry],
              ['Proof review', pipeline.proof_review],
              ['Matched', pipeline.matched],
              ['Deal room', pipeline.deal_room],
            ].map(([label, value], index) => (
              <div key={String(label)}><span>{index + 1}</span><strong>{value}</strong><small>{label}</small></div>
            ))}
          </div>
          {submissionRecords.length > 0 && (
            <div className="hvm2-submission-list">
              {submissionRecords.map(item => <article key={item.id}><div><span>My submission</span><strong>{item.title}</strong></div><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}
            </div>
          )}
        </section>

        <section id="review-gates" ref={registerSection('review-gates')} className="hvm2-section">
          <SectionHeading eyebrow="Review / gate status" title="Evidence and release controls" description="Commercial visibility, introductions and sensitive detail remain controlled by evidence, authorization and operator review." />
          <div className="hvm2-gate-grid">
            <Metric label="Country review" value={reviewStatus} detail="Jurisdiction intelligence state" tone={props.countryIntel?.review_status === 'approved' ? 'ok' : 'warn'} />
            <Metric label="Data coverage" value={dataCompleteness} detail={`${sourceCoverageCount} source coverage lanes`} />
            <Metric label="Proof review" value={pipeline.proof_review} detail="Marketplace records awaiting evidence" tone={pipeline.proof_review > 0 ? 'warn' : 'ok'} />
            <Metric label="My submissions" value={submissionRecords.length} detail="Private records in review workflow" />
          </div>
          <div className="hvm2-control-note"><strong>Controlled by default</strong><p>No supplier identity, private source evidence, internal review notes or counterparty detail is released from this mobile surface.</p></div>
        </section>

        <section id="directories" ref={registerSection('directories')} className="hvm2-section">
          <SectionHeading eyebrow="Directories" title="Reviewed professionals, providers and operators" description="Directory records remain evidence-aware and mediated rather than exposing an open supplier or counterparty directory." action={<Link className="hvm2-text-link" href="/reviewed-connections">Reviewed connections</Link>} />
          {directoryRecords.length > 0 ? (
            <div className="hvm2-horizontal-deck">
              {directoryRecords.map(item => <article className="hvm2-directory-card" key={`${item.kind}-${item.id}`}><span>{item.kind}</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}
            </div>
          ) : <EmptyState title="No reviewed directory records loaded" detail="Professionals, providers and operators will appear after public projection and review requirements are satisfied." />}
        </section>

        <section id="talent" ref={registerSection('talent')} className="hvm2-section">
          <SectionHeading eyebrow="Talent" title="Roles and operating capability" description="Talent opportunities remain separated from counterparty records and are filtered to the active jurisdiction or role where possible." action={<Link className="hvm2-text-link" href="/dashboard?page=jobs">Jobs workspace</Link>} />
          {talentRecords.length > 0 ? (
            <div className="hvm2-horizontal-deck">
              {talentRecords.map(job => (
                <article className="hvm2-directory-card" key={job.id}>
                  <span>{JOB_SECTOR_LABELS[job.sector]} · {job.country}</span>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.city}{job.remote ? ' · Remote' : ''}</p>
                  <div className="hvm2-card-meta"><span>{JOB_TYPE_LABELS[job.type]}</span>{job.salary && <span>{job.salary}</span>}</div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="No talent opportunities loaded" detail="The talent section remains active and will populate from the approved jobs dataset." />}
        </section>

        <section id="genetics" ref={registerSection('genetics')} className="hvm2-section">
          <SectionHeading eyebrow="Genetics" title="Cultivar and program intelligence" description="Reviewed cultivar passports and genetics records remain tied to evidence and controlled requests." action={<Link className="hvm2-text-link" href="/dashboard?page=genetics">Genetics workspace</Link>} />
          {geneticsRecords.length > 0 ? (
            <div className="hvm2-horizontal-deck">
              {geneticsRecords.map(item => <article className="hvm2-directory-card" key={item.id}><span>Cultivar passport</span><h3>{item.title}</h3><p>{item.subtitle}</p><StatusPill>{formatStatus(item.status)}</StatusPill></article>)}
            </div>
          ) : <EmptyState title="No reviewed genetics records loaded" detail="Genetics remains available through controlled program and evidence requests." />}
        </section>

        <section id="clinical" ref={registerSection('clinical')} className="hvm2-section">
          <SectionHeading eyebrow="Clinical" title="Clinical access and education" description="Country-specific patient, prescriber and pharmacy context is kept separate from commercial claims." action={<Link className="hvm2-text-link" href="/network/clinical-education">Clinical education</Link>} />
          <div className="hvm2-two-column">
            <article><span>Patient access</span><h3>{props.countryIntel?.briefing_program_status || formatStatus(props.countryIntel?.medical_status, 'Clinical pathway review')}</h3><p>{props.countryIntel?.briefing_patient_access || 'Patient-access detail is available when supported by reviewed jurisdiction evidence.'}</p></article>
            <article><span>Prescriber access</span><h3>{roleShort}</h3><p>{props.countryIntel?.briefing_physician_access || 'Prescribing, dispensing and professional obligations remain jurisdiction-specific and evidence-gated.'}</p></article>
          </div>
        </section>

        <section id="compliance" ref={registerSection('compliance')} className="hvm2-section">
          <SectionHeading eyebrow="Compliance" title="Regulatory and quality control" description="Import/export, licensing, quality and evidence requirements are consolidated for the active market-role combination." action={<Link className="hvm2-text-link" href="/dashboard?page=compliance">Compliance workspace</Link>} />
          <div className="hvm2-compliance-grid">
            <article><span>Regulatory tier</span><strong>{formatStatus(props.countryIntel?.regulatory_tier)}</strong><p>{props.countryIntel?.briefing_regulatory_outlook || 'Regulatory outlook requires reviewed source support.'}</p></article>
            <article><span>Quality posture</span><strong>{dataCompleteness}</strong><p>{readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], 'Playbook review in progress')}</p></article>
            <article><span>Access pathway</span><strong>{formatStatus(props.countryIntel?.market_access_status)}</strong><p>{props.countryIntel?.commercial_pathway_summary || 'Licence, permit, customs and quality gates remain jurisdiction-specific.'}</p></article>
          </div>
        </section>

        <section id="network" ref={registerSection('network')} className="hvm2-section">
          <SectionHeading eyebrow="Network" title="Reviewed commercial network" description="Professionals, service providers, licensed operators and collaboration projects remain available through controlled Harbourview access paths." action={<Link className="hvm2-text-link" href="/network">Network workspace</Link>} />
          <div className="hvm2-metric-grid">
            <Metric label="Professionals" value={props.professionals?.length ?? 0} detail="Reviewed professional records" />
            <Metric label="Service providers" value={props.serviceProviders?.length ?? 0} detail="Approved capability records" />
            <Metric label="Licensed operators" value={props.cannabisOperators?.length ?? 0} detail="Operator records in context" />
            <Metric label="Collaborations" value={props.collaborationProjects?.length ?? 0} detail="Controlled project opportunities" />
          </div>
        </section>

        <section id="financing" ref={registerSection('financing')} className="hvm2-section">
          <SectionHeading eyebrow="Trade financing" title="Structure the commercial corridor" description="Financing is reviewed alongside jurisdiction, evidence, counterparty and transaction readiness—not as an instant checkout product." action={<Link className="hvm2-text-link" href="/marketplace/financing">Financing intake</Link>} />
          <article className="hvm2-finance-card">
            <div><span>Active corridor</span><strong>{countryLabel} · {roleShort}</strong></div>
            <ol>
              <li><span>1</span><div><strong>Define transaction</strong><p>Product, volume, origin, destination and timing.</p></div></li>
              <li><span>2</span><div><strong>Verify pathway</strong><p>Licences, permits, quality documents and counterparty readiness.</p></div></li>
              <li><span>3</span><div><strong>Review structure</strong><p>Payment, insurance, logistics and financing requirements.</p></div></li>
            </ol>
            <Link href="/marketplace/financing">Start controlled financing review</Link>
          </article>
        </section>
      </main>

      <nav className="hvm2-bottom-nav" aria-label="Primary mobile command navigation">
        {PRIMARY_NAV.map(item => (
          <button key={item.id} type="button" className={activeSection === item.id ? 'active' : ''} onClick={() => navigateToSection(item.id)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}
