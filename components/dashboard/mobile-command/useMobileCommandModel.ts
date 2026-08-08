'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { JOB_LISTINGS } from '../data/jobsBoard'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import type { MarketView } from '../CommandCentre'
import type { MobileCommandCentreProps } from './props'
import {
  MARKET_TABS,
  NON_SUPPLY_VIEWS,
  PAGE_TO_SECTION,
  SECTION_IDS,
  SECTION_NAV,
  SECTION_TO_DESKTOP_PAGE,
  clampPercent,
  confidenceFractionToPercent,
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
  SECTION_GROUPS,
  SECTION_TO_GROUP,
  type PrimarySectionId,
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

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Which section is *mounted* is derived from the committed URL further down,
  // never from local state. `props` are supplied by the server component and
  // only change when a navigation commits, so mounting a section the instant it
  // is tapped renders it against the previous page's data -- Genetics would show
  // its "no records" state, then fill in once the route landed. That is the very
  // failure this surface exists to remove, so it must not reappear as a flash.
  //
  // `pendingSection` is the optimistic target: it lights the nav immediately so
  // the tap feels answered, while the content stays put until its data arrives.
  const [pendingSection, setPendingSection] = useState<SectionId | null>(null)
  const [isNavigating, startNavigation] = useTransition()
  const [activeMarketView, setActiveMarketView] = useState<MarketView>('cannabis')
  const [marketQuery, setMarketQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTool, setActiveTool] = useState<MobileCommandTool | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const sectionNodes = useRef(new Map<SectionId, HTMLElement>())
  const lastUrlSection = useRef<SectionId | null>(null)

  // Still tracked so the section that mounts can be scrolled under the header.
  const sectionRefs = useMemo(() => {
    const refs = new Map<SectionId, (node: HTMLElement | null) => void>()
    for (const section of SECTION_NAV) {
      refs.set(section.id, (node) => {
        if (node) {
          sectionNodes.current.set(section.id, node)
        } else {
          sectionNodes.current.delete(section.id)
        }
      })
    }
    return refs
  }, [])

  const sectionRef = useCallback((id: SectionId) => sectionRefs.get(id)!, [sectionRefs])

  const requestedCountry = searchParams.get('country') || props.initialCountryIso2
  const country = useMemo(() => {
    const match = ALL_COUNTRIES.find(item => item.iso2 === requestedCountry)
    return match ?? ALL_COUNTRIES.find(item => item.iso2 === 'CA') ?? ALL_COUNTRIES[0]
  }, [requestedCountry])
  const currentCountry = country?.iso2 ?? 'CA'

  const requestedRole = searchParams.get('role') || props.initialRoleId
  const role = requestedRole
    ? ROLE_PROFILES[requestedRole as keyof typeof ROLE_PROFILES]
    : null
  const currentRole = role ? requestedRole : null

  const roleEntries = useMemo(
    () => Object.entries(ROLE_PROFILES)
      .filter((entry): entry is [string, { label: string; short: string }] => Boolean(entry[1]))
      .sort((a, b) => a[1].label.localeCompare(b[1].label)),
    [],
  )

  const roleLabel = role?.label ?? (currentRole ? titleCase(currentRole) : 'All roles')
  const roleShort = role?.short ?? roleLabel
  const countryLabel = country?.displayName ?? 'Global'
  const countryIso2 = currentCountry

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
    return marketRows.filter(row => row.view === activeMarketView && matchesQuery(marketQuery, [row.title, row.summary, row.category, row.jurisdiction, row.status]))
  }, [activeMarketView, marketQuery, marketRows])

  const supplyRows = useMemo(
    () => marketRows.filter(row => !NON_SUPPLY_VIEWS.has(row.view)),
    [marketRows],
  )

  const selectedListing = useMemo(
    () => selectedListingId ? marketRows.find(row => row.id === selectedListingId) ?? null : null,
    [marketRows, selectedListingId],
  )

  const signals = props.digestSignals?.length ? props.digestSignals : props.signals
  const educationTiles = props.liveTiles?.length ? props.liveTiles : props.eduCategories
  const confidence = props.countryIntel?.confidence_score != null
    ? (props.countryIntel.confidence_score <= 1
        ? confidenceFractionToPercent(props.countryIntel.confidence_score)
        : clampPercent(props.countryIntel.confidence_score))
    : clampPercent(props.countryIntel?.opportunity_score)
  const pipeline = props.pipeline ?? { wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }
  const pipelineTotal = pipeline.wanted + pipeline.matched + pipeline.proof_review + pipeline.inquiry + pipeline.deal_room
  const sourceCoverageCount = props.sourceCoverage?.length ?? 0
  const reviewStatus = formatStatus(props.countryIntel?.review_status, 'Pending review')
  // `countries.data_completeness` was resolved here and handed to three
  // sections. It is a three-value enum (stub / seed / partial) that was printed
  // raw and does not describe the data it names -- `stub` countries average 142
  // characters of written summary and all carry a published playbook, while 33
  // of the 50 `partial` countries are boilerplate. It is no longer derived at
  // all, so it cannot reach a customer-facing string by accident.

  // Steps for the active jurisdiction/role access pathway. `template.id` is
  // prefixed `generic-` when getPublicPathwayTemplate substituted the
  // country-agnostic role fallback, which is the case for the 169 countries
  // with no cc_pathway_templates row.
  const pathwaySteps = props.pathwayData?.steps ?? []
  const pathwayIsGeneric = (props.pathwayData?.template?.id ?? '').startsWith('generic-')
  const evidenceDocuments = props.evidenceData?.orgDocs ?? []

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
    kind: readString(item, ['passport_type', 'record_type'], 'Cultivar passport'),
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
    const roleTokens = (currentRole ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean)
    const contextual = JOB_LISTINGS.filter(job =>
      job.country === countryIso2 || job.roles.some(jobRole => roleTokens.includes(jobRole.toLowerCase())),
    )
    return contextual.length > 0 ? contextual : JOB_LISTINGS
  }, [countryIso2, currentRole])

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
      // Every other action here states what to do in one line. This one used to
      // substitute `commercial_pathway_summary`, which is market analysis, not
      // an instruction -- it averages 404 characters and reaches 1,551, so the
      // card grew into a wall of prose that buried the button under it. The
      // same summary already renders in full in the Jurisdiction section this
      // action links to, so nothing is lost by stating the task instead.
      detail: 'Confirm licence, import/export, quality and evidence requirements for the selected role.',
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
    if (!searchQuery.trim()) return { signals, listings: marketRows }
    return {
      signals: signals.filter(signal => matchesQuery(searchQuery, [signal.title, signal.market, signal.type, signal.commercialImpact])),
      listings: marketRows.filter(row => matchesQuery(searchQuery, [row.title, row.summary, row.category, row.jurisdiction])),
    }
  }, [marketRows, searchQuery, signals])

  const resolvedUrlSection = useMemo(() => {
    const requested = searchParams.get('section')
    return requested && SECTION_IDS.has(requested as SectionId)
      ? requested as SectionId
      : PAGE_TO_SECTION[props.initialPage ?? 'briefing'] ?? 'overview'
  }, [props.initialPage, searchParams])

  // The committed section: this is what mounts. It moves only when the route
  // lands, which is also when `props` carry that section's data.
  const activeSection = resolvedUrlSection

  // What the navigation highlights. Falls forward to the tapped target so the
  // rail and bottom nav answer the touch rather than waiting for the round trip.
  // Gated on the transition being in flight, so a settled or abandoned target
  // cannot leave the nav pointing somewhere the content never went -- and so
  // this needs no effect to clear it.
  const highlightedSection = isNavigating && pendingSection ? pendingSection : resolvedUrlSection

  useEffect(() => {
    if (lastUrlSection.current === resolvedUrlSection) return
    lastUrlSection.current = resolvedUrlSection
    // One section is on screen, so there is nothing to scroll *to* -- only the
    // top of the new section to scroll back to.
    window.scrollTo({ top: 0, behavior: preferredScrollBehavior() })
  }, [resolvedUrlSection])

  useEffect(() => {
    const tool = parseMobileCommandTool(searchParams.get('tool'))
    const requestedView = searchParams.get('marketView')
    setActiveTool(tool)
    setSelectedListingId(tool === 'introduction' ? searchParams.get('listing') : null)
    if (isMarketView(requestedView)) setActiveMarketView(requestedView)
    if (tool === 'wanted-intake') setActiveMarketView('wanted')
  }, [searchParams])

  // The scroll-spy that used to live here is gone. It existed to track which of
  // twenty stacked sections was under the reader and rewrite the active section
  // from scroll position. With a single section mounted it can only ever report
  // that same section, re-setting state it already holds and clearing
  // `lastUrlSection`, which lets the URL effect re-fire and re-scroll. The rail
  // is now the only thing that changes sections, and it navigates.

  const navigateToSection = useCallback((id: SectionId) => {
    setPendingSection(id)
    setActiveTool(null)
    setSelectedListingId(null)
    // Inside a transition so React keeps the current section on screen until the
    // new route's data has arrived, instead of swapping to a section whose props
    // have not loaded yet.
    startNavigation(() => {
      router.replace(commandHref(id, {
        marketView: activeMarketView,
        tool: null,
        listing: null,
      }), { scroll: false })
    })
  }, [activeMarketView, commandHref, router])

  const selectMarketView = useCallback((view: MarketView) => {
    setActiveMarketView(view)
    setActiveTool(null)
    setSelectedListingId(null)
    setPendingSection('marketplace')
    startNavigation(() => {
      router.replace(commandHref('marketplace', {
        marketView: view,
        tool: null,
        listing: null,
      }), { scroll: false })
    })
  }, [commandHref, router])

  const openTool = useCallback((tool: MobileCommandTool, options: { listing?: NormalizedListing; marketView?: MarketView } = {}) => {
    const section: SectionId = tool === 'financing-intake' ? 'financing' : 'marketplace'
    const nextView = tool === 'wanted-intake' ? 'wanted' : options.marketView ?? options.listing?.view ?? activeMarketView
    setActiveTool(tool)
    setSelectedListingId(options.listing?.id ?? null)
    setActiveMarketView(nextView)
    setPendingSection(section)
    startNavigation(() => {
      router.replace(commandHref(section, {
        tool,
        marketView: nextView,
        listing: options.listing?.id ?? null,
      }), { scroll: false })
    })
  }, [activeMarketView, commandHref, router])

  const closeTool = useCallback(() => {
    const returnSection: SectionId = activeTool === 'financing-intake'
      ? 'financing'
      : activeTool
        ? 'marketplace'
        : activeSection
    setActiveTool(null)
    setSelectedListingId(null)
    setPendingSection(returnSection)
    startNavigation(() => {
      router.replace(commandHref(returnSection, {
        marketView: activeMarketView,
        tool: null,
        listing: null,
      }), { scroll: false })
    })
  }, [activeMarketView, activeSection, activeTool, commandHref, router])

  const viewSubmissions = useCallback(() => {
    setActiveTool(null)
    setSelectedListingId(null)
    setPendingSection('market-status')
    router.replace(commandHref('market-status', {
      marketView: activeMarketView,
      tool: null,
      listing: null,
    }), { scroll: false })
    window.requestAnimationFrame(() => sectionNodes.current.get('market-status')?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' }))
  }, [activeMarketView, commandHref, router])

  const updateContext = useCallback((key: 'country' | 'role', value: string) => {
    setActiveTool(null)
    setSelectedListingId(null)

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
        nextParams.delete('tool')
        nextParams.delete('listing')
        const query = nextParams.toString()
        router.push(`/country/${nextCountry.slug}/role/${nextRole}${query ? `?${query}` : ''}`)
        return
      }
    }

    router.push(buildHref('/dashboard', new URLSearchParams(), {
      country: nextCountryIso2 || null,
      role: nextRole || null,
      page: SECTION_TO_DESKTOP_PAGE[activeSection],
      section: activeSection,
      marketView: activeMarketView,
      tool: null,
      listing: null,
    }))
  }, [activeMarketView, activeSection, currentCountry, currentRole, pathname, router, searchParams])

  const selectListingResult = useCallback((row: NormalizedListing) => {
    setMarketQuery(searchQuery)
    selectMarketView(row.view)
    window.requestAnimationFrame(() => sectionNodes.current.get('marketplace')?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' }))
  }, [searchQuery, selectMarketView])

  // The destination that owns the active section. `groupSections` is the rail --
  // the sections you can reach from here. `visibleSections` is what actually
  // mounts, and it is exactly one.
  //
  // Mounting the whole group looked right but could not work: data is fetched
  // per desktop page, and a group's sections map to different pages. Landing on
  // a destination loaded one page's sources, so every section in the group that
  // belonged to another page rendered an empty shell -- Genetics, Clinical,
  // Network, Directories, Market intelligence, Education, Search,
  // Personal briefing and Review gates, all against populated tables. Rendering
  // one section at a time means the section on screen is the one whose data was
  // actually requested, because the rail navigates rather than scrolls.
  // The nav highlights the optimistic target; the content follows the committed
  // one. A tap lights up instantly, the section swaps when its data is there.
  const activeGroup: PrimarySectionId = SECTION_TO_GROUP[highlightedSection] ?? 'overview'
  const groupSections = SECTION_GROUPS[activeGroup]
  const visibleSections: SectionId[] = [activeSection]

  return {
    activeSection,
    highlightedSection,
    isNavigating,
    activeGroup,
    groupSections,
    visibleSections,
    activeMarketView,
    marketQuery,
    searchQuery,
    activeTool,
    selectedListing,
    currentCountry,
    currentRole,
    selectMarketView,
    setMarketQuery,
    setSearchQuery,
    sectionRef,
    navigateToSection,
    openTool,
    closeTool,
    viewSubmissions,
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
    pathwaySteps,
    pathwayIsGeneric,
    evidenceDocuments,
    directoryRecords,
    geneticsRecords,
    submissions,
    talentRecords,
    nextActions,
    searchResults,
    selectListingResult,
  }
}
