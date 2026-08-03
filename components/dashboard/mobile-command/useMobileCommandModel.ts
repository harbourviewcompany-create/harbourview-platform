'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { JOB_LISTINGS } from '../data/jobsBoard'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import type { MarketView } from '../CommandCentre'
import type { MobileCommandCentreProps } from './props'
import {
  MARKET_TABS,
  PAGE_TO_SECTION,
  SECTION_IDS,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  clampPercent,
  formatStatus,
  matchesQuery,
  normalizeListing,
  parseMobileCommandTool,
  readString,
  titleCase,
  type DirectoryRecord,
  type MobileCommandTool,
  type NextAction,
  type NormalizedListing,
  type SectionId,
  type SubmissionRecord,
} from './contracts'

function buildHref(path: string, source: { toString(): string }, changes: Record<string, string | null>) {
  const params = new URLSearchParams(source.toString())
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function contextParams(country: string | null | undefined, role: string | null | undefined) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (role) params.set('role', role)
  return params
}

function isMarketView(value: string | null): value is MarketView {
  return Boolean(value && MARKET_TABS.some(tab => tab.id === value))
}

export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [activeMarketView, setActiveMarketView] = useState<MarketView>('cannabis')
  const [marketQuery, setMarketQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTool, setActiveTool] = useState<MobileCommandTool | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
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

  const currentCountry = searchParams.get('country') || props.initialCountryIso2
  const currentRole = searchParams.get('role') || props.initialRoleId
  const baseContext = useMemo(
    () => contextParams(currentCountry, currentRole),
    [currentCountry, currentRole],
  )

  const dashboardHref = useCallback((changes: Record<string, string | null>) => {
    return buildHref('/dashboard', baseContext, changes)
  }, [baseContext])

  const commandHref = useCallback((section: SectionId, changes: Record<string, string | null> = {}) => {
    return buildHref('/dashboard', baseContext, {
      page: SECTION_TO_DESKTOP_PAGE[section],
      section,
      ...changes,
    })
  }, [baseContext])

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

  const selectedListing = useMemo(
    () => selectedListingId ? marketRows.find(row => row.id === selectedListingId) ?? null : null,
    [marketRows, selectedListingId],
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
      href: commandHref('market-status'),
      tone: 'gold',
    })
    if (pipeline.proof_review > 0) actions.push({
      id: 'proof',
      label: `${pipeline.proof_review} proof ${pipeline.proof_review === 1 ? 'gate' : 'gates'} require review`,
      detail: 'Check authorization, evidence and counterparty readiness before an introduction is released.',
      href: commandHref('review-gates'),
      tone: 'warn',
    })
    if ((props.wantedCount ?? 0) > 0) actions.push({
      id: 'wanted',
      label: `Assess ${props.wantedCount} wanted ${props.wantedCount === 1 ? 'request' : 'requests'}`,
      detail: 'Match verified demand against approved supply and service capacity.',
      href: commandHref('marketplace', { marketView: 'wanted' }),
      tone: 'gold',
    })
    actions.push({
      id: 'pathway',
      label: `Validate the ${countryLabel} access pathway`,
      detail: props.countryIntel?.commercial_pathway_summary?.trim() || 'Confirm licence, import/export, quality and evidence requirements for the selected role.',
      href: commandHref('jurisdiction'),
      tone: props.countryIntel?.review_status === 'approved' ? 'ok' : 'neutral',
    })
    if (!props.hasOrg) actions.push({
      id: 'organization',
      label: 'Connect an organization profile',
      detail: 'Add the operating entity used for marketplace submissions, evidence and reviewed introductions.',
      href: commandHref('overview', { page: 'organization' }),
      tone: 'warn',
    })
    if (educationTiles.length > 0) actions.push({
      id: 'education',
      label: `Continue the ${roleShort} education path`,
      detail: `${educationTiles.length} role-relevant modules are available in the current context.`,
      href: commandHref('education'),
      tone: 'neutral',
    })
    return actions
  }, [commandHref, countryLabel, educationTiles.length, pipeline.inquiry, pipeline.proof_review, props.countryIntel, props.hasOrg, props.wantedCount, roleShort])

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
    if (lastAppliedSection.current !== initial) {
      lastAppliedSection.current = initial
      setActiveSection(initial)
      if (initial !== 'overview') {
        const timer = window.setTimeout(() => sectionNodes.current.get(initial)?.scrollIntoView({ block: 'start' }), 120)
        return () => window.clearTimeout(timer)
      }
    }
  }, [props.initialPage, searchParams])

  useEffect(() => {
    const tool = parseMobileCommandTool(searchParams.get('tool'))
    const requestedView = searchParams.get('marketView')
    setActiveTool(tool)
    setSelectedListingId(tool === 'introduction' ? searchParams.get('listing') : null)
    if (isMarketView(requestedView)) setActiveMarketView(requestedView)
    if (tool === 'wanted-intake') setActiveMarketView('wanted')
  }, [searchParams])

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
    router.replace(commandHref(id), { scroll: false })
    window.requestAnimationFrame(() => sectionNodes.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [commandHref, router])

  const openTool = useCallback((tool: MobileCommandTool, options: { listing?: NormalizedListing; marketView?: MarketView } = {}) => {
    const section: SectionId = tool === 'financing-intake' ? 'financing' : 'marketplace'
    const nextView = tool === 'wanted-intake' ? 'wanted' : options.marketView ?? options.listing?.view ?? activeMarketView
    setActiveTool(tool)
    setSelectedListingId(options.listing?.id ?? null)
    setActiveMarketView(nextView)
    setActiveSection(section)
    lastAppliedSection.current = section
    router.replace(commandHref(section, {
      tool,
      marketView: nextView,
      listing: options.listing?.id ?? null,
    }), { scroll: false })
    window.requestAnimationFrame(() => sectionNodes.current.get(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [activeMarketView, commandHref, router])

  const closeTool = useCallback(() => {
    setActiveTool(null)
    setSelectedListingId(null)
    router.replace(commandHref(activeSection, { tool: null, listing: null }), { scroll: false })
  }, [activeSection, commandHref, router])

  const updateContext = useCallback((key: 'country' | 'role', value: string) => {
    const nextCountryIso2 = key === 'country' ? value : currentCountry
    const nextRole = key === 'role' ? value : currentRole
    const isCountryRoleRoute = /^\/country\/[^/]+\/role\/[^/]+/.test(pathname)

    if (isCountryRoleRoute && nextCountryIso2 && nextRole) {
      const nextCountry = ALL_COUNTRIES.find(item => item.iso2 === nextCountryIso2)
      if (nextCountry?.slug) {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.set('section', activeSection)
        nextParams.delete('country')
        nextParams.delete('role')
        const query = nextParams.toString()
        router.push(`/country/${nextCountry.slug}/role/${nextRole}${query ? `?${query}` : ''}`)
        return
      }
    }

    router.push(buildHref(pathname, searchParams, { section: activeSection, [key]: value || null }))
  }, [activeSection, currentCountry, currentRole, pathname, router, searchParams])

  const selectListingResult = useCallback((row: NormalizedListing) => {
    setActiveMarketView(row.view)
    setMarketQuery(searchQuery)
    navigateToSection('marketplace')
  }, [navigateToSection, searchQuery])

  return {
    activeSection,
    activeMarketView,
    marketQuery,
    searchQuery,
    activeTool,
    selectedListing,
    setActiveMarketView,
    setMarketQuery,
    setSearchQuery,
    sectionRef,
    navigateToSection,
    openTool,
    closeTool,
    updateContext,
    dashboardHref,
    commandHref,
    country,
    countryLabel,
    countryIso2,
    roleEntries,
    roleLabel,
    roleShort,
    marketRows,
    filteredMarketRows,
    supplyRows,
    signals,
    educationTiles,
    confidence,
    pipeline,
    pipelineTotal,
    sourceCoverageCount,
    reviewStatus,
    dataCompleteness,
    directoryRecords,
    geneticsRecords,
    submissions,
    talentRecords,
    nextActions,
    searchResults,
    selectListingResult,
  }
}
