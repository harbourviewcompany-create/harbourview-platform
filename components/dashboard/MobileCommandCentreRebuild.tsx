'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { JOB_LISTINGS } from './data/jobsBoard'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { MarketView } from './CommandCentre'
import type { MobileCommandCentreProps } from './mobile-command/props'
import {
  MARKET_TABS,
  PAGE_TO_SECTION,
  PRIMARY_NAV,
  SECTION_IDS,
  SECTION_NAV,
  clampPercent,
  formatStatus,
  matchesQuery,
  normalizeListing,
  readString,
  titleCase,
  type DirectoryRecord,
  type NextAction,
  type NormalizedListing,
  type SectionId,
  type SubmissionRecord,
} from './mobile-command/contracts'
import {
  ClinicalSection,
  ComplianceSection,
  DirectoriesSection,
  EducationSection,
  FinancingSection,
  GeneticsSection,
  JurisdictionSection,
  LiveStatusSection,
  MarketIntelligenceSection,
  MarketplaceSection,
  MarketStatusSection,
  NetworkSection,
  NextActionsSection,
  OverviewSection,
  PersonalBriefingSection,
  ReviewGatesSection,
  SearchSection,
  SupplySection,
  TalentSection,
  WeeklySignalsSection,
} from './mobile-command/Sections'
import './MobileCommandCentreRebuild.css'

function buildHref(path: string, source: URLSearchParams, changes: Record<string, string | null>) {
  const params = new URLSearchParams(source.toString())
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export default function MobileCommandCentreRebuild(props: MobileCommandCentreProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [activeMarketView, setActiveMarketView] = useState<MarketView>('cannabis')
  const [marketQuery, setMarketQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const sectionNodes = useRef(new Map<SectionId, HTMLElement>())
  const lastAppliedSection = useRef<SectionId | null>(null)

  const sectionRefs = useMemo(() => {
    const refs = new Map<SectionId, (node: HTMLElement | null) => void>()
    for (const section of SECTION_NAV) {
      refs.set(section.id, (node) => {
        if (node) sectionNodes.current.set(section.id, node)
        else sectionNodes.current.delete(section.id)
      })
    }
    return refs
  }, [])

  const sectionRef = useCallback((id: SectionId) => {
    const callback = sectionRefs.get(id)
    if (!callback) throw new Error(`Missing mobile command section ref: ${id}`)
    return callback
  }, [sectionRefs])

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

  const dashboardHref = useCallback((changes: Record<string, string>) => {
    return buildHref(pathname, searchParams, changes)
  }, [pathname, searchParams])

  const routeHref = useCallback((path: string, changes: Record<string, string> = {}) => {
    const context = new URLSearchParams()
    const countryValue = searchParams.get('country') || props.initialCountryIso2
    const roleValue = searchParams.get('role') || props.initialRoleId
    if (countryValue) context.set('country', countryValue)
    if (roleValue) context.set('role', roleValue)
    return buildHref(path, context, changes)
  }, [props.initialCountryIso2, props.initialRoleId, searchParams])

  const marketRows = useMemo(
    () => MARKET_TABS.flatMap(tab => (props.marketplaceRows?.[tab.id] ?? [])
      .map((row, index) => normalizeListing(row, index, tab.id, countryLabel))),
    [props.marketplaceRows, countryLabel],
  )

  const filteredMarketRows = useMemo(() => {
    const query = marketQuery.trim().toLowerCase()
    return marketRows.filter(row => row.view === activeMarketView && (!query || matchesQuery(query, [row.title, row.summary, row.category, row.jurisdiction, row.status])))
  }, [activeMarketView, marketQuery, marketRows])

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
  const reviewStatus = formatStatus(props.countryIntel?.review_status, 'Pending review')
  const dataCompleteness = formatStatus(props.countryIntel?.data_completeness, 'Coverage pending')

  const directoryRecords = useMemo<DirectoryRecord[]>(() => {
    const professionals = (props.professionals ?? []).map((item, index) => ({
      id: readString(item, ['id', 'slug'], `professional-${index}`),
      kind: 'Professional',
      title: readString(item, ['displayName', 'display_name', 'name'], 'Reviewed professional'),
      subtitle: readString(item, ['service_summary', 'public_summary', 'specialty', 'description'], 'Professional profile available through Harbourview.'),
      status: readString(item, ['verification_level', 'verification_status', 'status'], 'Reviewed'),
    }))
    const providers = (props.serviceProviders ?? []).map((item, index) => ({
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
    return [...professionals, ...providers, ...operators]
  }, [props.professionals, props.serviceProviders, props.cannabisOperators])

  const geneticsRecords = useMemo<DirectoryRecord[]>(() => (props.cultivarPassports ?? []).map((item, index) => ({
    id: readString(item, ['id', 'slug', 'cultivar_id'], `cultivar-${index}`),
    kind: 'Cultivar passport',
    title: readString(item, ['cultivar_name', 'name', 'display_name', 'title'], 'Cultivar passport'),
    subtitle: readString(item, ['public_summary', 'description', 'breeder_name', 'origin'], 'Reviewed genetics record.'),
    status: readString(item, ['verification_status', 'review_status', 'status'], 'Reviewed'),
  })), [props.cultivarPassports])

  const submissions = useMemo<SubmissionRecord[]>(() => (props.mySubmissions ?? []).map((item, index) => ({
    id: readString(item, ['id', 'submission_id'], `submission-${index}`),
    title: readString(item, ['title', 'headline', 'listing_title'], 'Marketplace submission'),
    status: readString(item, ['status', 'review_status', 'publication_state'], 'Received'),
  })), [props.mySubmissions])

  const talentRecords = useMemo(() => {
    const roleTokens = (props.initialRoleId ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean)
    const contextual = JOB_LISTINGS.filter(job =>
      job.country === countryIso2 || job.roles.some(jobRole => roleTokens.includes(jobRole.toLowerCase())),
    )
    return contextual.length > 0 ? contextual : JOB_LISTINGS
  }, [countryIso2, props.initialRoleId])

  const nextActions = useMemo<NextAction[]>(() => {
    const actions: NextAction[] = []
    if (pipeline.inquiry > 0) actions.push({
      id: 'inquiries',
      label: `Review ${pipeline.inquiry} active ${pipeline.inquiry === 1 ? 'inquiry' : 'inquiries'}`,
      detail: 'Qualify intent and decide whether the request should advance to controlled review.',
      href: dashboardHref({ section: 'market-status' }),
      tone: 'gold',
    })
    if (pipeline.proof_review > 0) actions.push({
      id: 'proof',
      label: `${pipeline.proof_review} proof ${pipeline.proof_review === 1 ? 'gate' : 'gates'} require review`,
      detail: 'Check authorization, evidence and counterparty readiness before an introduction is released.',
      href: dashboardHref({ section: 'review-gates' }),
      tone: 'warn',
    })
    if ((props.wantedCount ?? 0) > 0) actions.push({
      id: 'wanted',
      label: `Assess ${props.wantedCount} wanted ${props.wantedCount === 1 ? 'request' : 'requests'}`,
      detail: 'Match verified demand against approved supply and service capacity.',
      href: routeHref('/marketplace/wanted'),
      tone: 'gold',
    })
    actions.push({
      id: 'pathway',
      label: `Validate the ${countryLabel} access pathway`,
      detail: props.countryIntel?.commercial_pathway_summary?.trim() || 'Confirm licence, import/export, quality and evidence requirements for the selected role.',
      href: dashboardHref({ section: 'jurisdiction' }),
      tone: props.countryIntel?.review_status === 'approved' ? 'ok' : 'neutral',
    })
    if (!props.hasOrg) actions.push({
      id: 'organization',
      label: 'Connect an organization profile',
      detail: 'Add the operating entity used for marketplace submissions, evidence and reviewed introductions.',
      href: routeHref('/account'),
      tone: 'warn',
    })
    if (educationTiles.length > 0) actions.push({
      id: 'education',
      label: `Continue the ${roleShort} education path`,
      detail: `${educationTiles.length} role-relevant modules are available in the current context.`,
      href: dashboardHref({ section: 'education' }),
      tone: 'neutral',
    })
    return actions
  }, [countryLabel, dashboardHref, educationTiles.length, pipeline.inquiry, pipeline.proof_review, props.countryIntel, props.hasOrg, props.wantedCount, roleShort, routeHref])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return { signals: props.signals, listings: marketRows }
    return {
      signals: props.signals.filter(signal => matchesQuery(query, [signal.title, signal.market, signal.type, signal.commercialImpact])),
      listings: marketRows.filter(row => matchesQuery(query, [row.title, row.summary, row.category, row.jurisdiction])),
    }
  }, [marketRows, props.signals, searchQuery])

  useEffect(() => {
    const requested = searchParams.get('section')
    const initial = requested && SECTION_IDS.has(requested)
      ? requested as SectionId
      : PAGE_TO_SECTION[props.initialPage ?? 'briefing'] ?? 'overview'
    if (lastAppliedSection.current === initial) return
    lastAppliedSection.current = initial
    setActiveSection(initial)
    if (initial !== 'overview') {
      const timer = window.setTimeout(() => sectionNodes.current.get(initial)?.scrollIntoView({ block: 'start' }), 120)
      return () => window.clearTimeout(timer)
    }
  }, [props.initialPage, searchParams])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id as SectionId)
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0.05, 0.2, 0.5] })
    sectionNodes.current.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const navigateToSection = useCallback((id: SectionId) => {
    setActiveSection(id)
    lastAppliedSection.current = id
    router.replace(dashboardHref({ section: id }), { scroll: false })
    window.requestAnimationFrame(() => sectionNodes.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [dashboardHref, router])

  const updateContext = useCallback((key: 'country' | 'role', value: string) => {
    const changes: Record<string, string | null> = { section: activeSection, [key]: value || null }
    router.push(buildHref(pathname, searchParams, changes))
  }, [activeSection, pathname, router, searchParams])

  const selectListingResult = useCallback((row: NormalizedListing) => {
    setActiveMarketView(row.view)
    setMarketQuery(searchQuery)
    navigateToSection('marketplace')
  }, [navigateToSection, searchQuery])

  return (
    <div className="hvm2-root" data-mobile-command-version="2">
      <header className="hvm2-command-header">
        <div className="hvm2-header-row">
          <div><span className="hvm2-wordmark">HARBOURVIEW</span><span className="hvm2-command-label">Mobile Command</span></div>
          <div className="hvm2-live-chip"><i /> Live</div>
        </div>
        <div className="hvm2-command-title">
          <div className="hvm2-country-flag" aria-hidden="true">{flagEmoji(countryIso2)}</div>
          <div><span>{countryLabel} · {roleShort}</span><h1>Operator command centre</h1></div>
          <Link href={routeHref('/account')} className="hvm2-account-link" aria-label="Open account">Account</Link>
        </div>
        <div className="hvm2-context-controls" aria-label="Dashboard context">
          <label><span>Jurisdiction</span><select value={countryIso2} onChange={event => updateContext('country', event.target.value)}>{ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}</select></label>
          <label><span>Role</span><select value={props.initialRoleId ?? ''} onChange={event => updateContext('role', event.target.value)}><option value="">All roles</option>{roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}</select></label>
        </div>
      </header>

      <nav className="hvm2-section-rail" aria-label="All mobile command sections">
        {SECTION_NAV.map(section => <button key={section.id} type="button" className={activeSection === section.id ? 'active' : ''} aria-current={activeSection === section.id ? 'page' : undefined} onClick={() => navigateToSection(section.id)}><span aria-hidden="true">{section.icon}</span>{section.label}</button>)}
      </nav>

      <main className="hvm2-main">
        <OverviewSection sectionRef={sectionRef('overview')} countryLabel={countryLabel} roleLabel={roleLabel} publicSummary={props.countryIntel?.public_summary} marketAccessStatus={props.countryIntel?.market_access_status} reviewStatus={reviewStatus} dataCompleteness={dataCompleteness} firstAction={nextActions[0]} onOpenActions={() => navigateToSection('next-actions')} />
        <LiveStatusSection sectionRef={sectionRef('live-status')} marketplaceCount={marketRows.length} wantedCount={props.wantedCount ?? 0} signalCount={props.signals.length} confidence={confidence} reviewStatus={reviewStatus} sourceCoverageCount={sourceCoverageCount} />
        <MarketIntelligenceSection sectionRef={sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />
        <MarketplaceSection sectionRef={sectionRef('marketplace')} activeMarketView={activeMarketView} marketQuery={marketQuery} marketRows={marketRows} filteredRows={filteredMarketRows} onMarketViewChange={setActiveMarketView} onMarketQueryChange={setMarketQuery} routeHref={routeHref} />
        <SupplySection sectionRef={sectionRef('supply')} supplyRows={supplyRows} routeHref={routeHref} />
        <NextActionsSection sectionRef={sectionRef('next-actions')} actions={nextActions} />
        <WeeklySignalsSection sectionRef={sectionRef('weekly-signals')} signals={signals} routeHref={routeHref} />
        <PersonalBriefingSection sectionRef={sectionRef('personal-briefing')} roleShort={roleShort} countryLabel={countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={marketRows.length} signalCount={signals.length} pipelineTotal={pipelineTotal} actionCount={nextActions.length} />
        <SearchSection sectionRef={sectionRef('search')} searchQuery={searchQuery} signalResults={searchResults.signals} listingResults={searchResults.listings} onQueryChange={setSearchQuery} onSignalSelect={() => navigateToSection('weekly-signals')} onListingSelect={selectListingResult} />
        <EducationSection sectionRef={sectionRef('education')} roleShort={roleShort} tiles={educationTiles} dashboardHref={dashboardHref} />
        <JurisdictionSection sectionRef={sectionRef('jurisdiction')} countryLabel={countryLabel} countryIso2={flagEmoji(countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={reviewStatus} routeHref={routeHref} />
        <MarketStatusSection sectionRef={sectionRef('market-status')} wanted={props.wantedCount ?? pipeline.wanted} inquiry={pipeline.inquiry} proofReview={pipeline.proof_review} matched={pipeline.matched} dealRoom={pipeline.deal_room} submissions={submissions} />
        <ReviewGatesSection sectionRef={sectionRef('review-gates')} reviewStatus={reviewStatus} approved={props.countryIntel?.review_status === 'approved'} dataCompleteness={dataCompleteness} sourceCoverageCount={sourceCoverageCount} proofReview={pipeline.proof_review} submissionCount={submissions.length} />
        <DirectoriesSection sectionRef={sectionRef('directories')} records={directoryRecords} routeHref={routeHref} />
        <TalentSection sectionRef={sectionRef('talent')} records={talentRecords} dashboardHref={dashboardHref} />
        <GeneticsSection sectionRef={sectionRef('genetics')} records={geneticsRecords} dashboardHref={dashboardHref} />
        <ClinicalSection sectionRef={sectionRef('clinical')} roleShort={roleShort} programStatus={props.countryIntel?.briefing_program_status} medicalStatus={props.countryIntel?.medical_status} patientAccess={props.countryIntel?.briefing_patient_access} physicianAccess={props.countryIntel?.briefing_physician_access} routeHref={routeHref} />
        <ComplianceSection sectionRef={sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} dataCompleteness={dataCompleteness} playbookStatus={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], 'Playbook review in progress')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} dashboardHref={dashboardHref} />
        <NetworkSection sectionRef={sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} routeHref={routeHref} />
        <FinancingSection sectionRef={sectionRef('financing')} countryLabel={countryLabel} roleShort={roleShort} routeHref={routeHref} />
      </main>

      <nav className="hvm2-bottom-nav" aria-label="Primary mobile command navigation">
        {PRIMARY_NAV.map(item => <button key={item.id} type="button" className={activeSection === item.id ? 'active' : ''} onClick={() => navigateToSection(item.id)}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
    </div>
  )
}
