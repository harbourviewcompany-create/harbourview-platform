'use client'

import { Fragment, type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { MobileCommandCentreProps } from './mobile-command/props'
import { PRIMARY_NAV, SECTION_NAV, readString, type SectionId } from './mobile-command/contracts'
import { buildCommandSearchIndex, searchCommandRecords } from './mobile-command/intelSearch'
import { useMobileCommandModel } from './mobile-command/useMobileCommandModel'
import CommandOverviewOperator from './mobile-command/CommandOverviewOperator'
import { matchWatchRuleHits, type WatchRuleLike } from './mobile-command/watchRuleHits'
import { buildCommandDelta } from '@/lib/dashboard/commandDelta'
import dynamic from 'next/dynamic'
import MarketplaceMediaStatus from './MarketplaceMediaStatus'
import OrganizationContextControl from './OrganizationContextControl'
import './MobileCommandCentreRebuild.css'
import './mobile-command/MobileCommandOperatorFirst.css'
import './mobile-command/MobileIntelInstitutional.css'
import './mobile-command/MobileCommandNavigation.css'
import './CommandCentre.css'
import './mobile-command/MobileCommandSurfaceAlignment.css'

const MarketIntelligenceSection = dynamic(
  () => import('./mobile-command/sections/CoreSections').then(m => ({ default: m.MarketIntelligenceSection })),
  { loading: () => <CommandBootSection label="Loading market intelligence" /> },
)
const MarketplaceSection = dynamic(
  () => import('./mobile-command/sections/MarketplaceSections').then(m => ({ default: m.MarketplaceSection })),
  { loading: () => <CommandBootSection label="Loading marketplace" /> },
)
const SupplySection = dynamic(
  () => import('./mobile-command/sections/MarketplaceSections').then(m => ({ default: m.SupplySection })),
  { loading: () => <CommandBootSection label="Loading supply" /> },
)
const NextActionsSection = dynamic(
  () => import('./mobile-command/sections/IntelligenceSections').then(m => ({ default: m.NextActionsSection })),
  { loading: () => <CommandBootSection label="Loading actions" /> },
)
const SearchSection = dynamic(
  () => import('./mobile-command/sections/IntelligenceSections').then(m => ({ default: m.SearchSection })),
  { loading: () => <CommandBootSection label="Loading search" /> },
)
const LocalIntelSection = dynamic(
  () => import('./mobile-command/sections/IntelligenceSections').then(m => ({ default: m.LocalIntelSection })),
  { loading: () => <CommandBootSection label="Loading local intelligence" /> },
)
const PersonalBriefingSection = dynamic(
  () => import('./mobile-command/sections/PersonalBriefingLiveSection').then(m => ({ default: m.PersonalBriefingSection })),
  { loading: () => <CommandBootSection label="Loading briefing" /> },
)
const WeeklySignalsSection = dynamic(
  () => import('./mobile-command/sections/DecisionSignalsSection').then(m => ({ default: m.WeeklySignalsSection })),
  { loading: () => <CommandBootSection label="Loading signals" /> },
)
const EducationSection = dynamic(
  () => import('./mobile-command/sections/EducationCommandSection').then(m => ({ default: m.EducationSection })),
  { loading: () => <CommandBootSection label="Loading education" /> },
)
const RegulatoryWatchSection = dynamic(
  () => import('./mobile-command/sections/RegulatoryWatchWithCorpus').then(m => ({ default: m.RegulatoryWatchSection })),
  { loading: () => <CommandBootSection label="Loading regulatory watch" /> },
)
const JurisdictionSection = dynamic(
  () => import('./mobile-command/sections/JurisdictionCommandSection').then(m => ({ default: m.JurisdictionSection })),
  { loading: () => <CommandBootSection label="Loading jurisdiction" /> },
)
const NetworkSection = dynamic(
  () => import('./mobile-command/sections/NetworkCommandSection').then(m => ({ default: m.NetworkSection })),
  { loading: () => <CommandBootSection label="Loading network" /> },
)
const MarketStatusSection = dynamic(
  () => import('./mobile-command/sections/OperationsSections').then(m => ({ default: m.MarketStatusSection })),
  { loading: () => <CommandBootSection label="Loading market status" /> },
)
const ReviewGatesSection = dynamic(
  () => import('./mobile-command/sections/OperationsSections').then(m => ({ default: m.ReviewGatesSection })),
  { loading: () => <CommandBootSection label="Loading review gates" /> },
)
const TalentSection = dynamic(
  () => import('./mobile-command/sections/OperationsSections').then(m => ({ default: m.TalentSection })),
  { loading: () => <CommandBootSection label="Loading talent" /> },
)
const GeneticsSection = dynamic(
  () => import('./mobile-command/sections/DomainSections').then(m => ({ default: m.GeneticsSection })),
  { loading: () => <CommandBootSection label="Loading genetics" /> },
)
const ComplianceSection = dynamic(
  () => import('./mobile-command/sections/DomainSections').then(m => ({ default: m.ComplianceSection })),
  { loading: () => <CommandBootSection label="Loading compliance" /> },
)
const FinancingSection = dynamic(
  () => import('./mobile-command/sections/DomainSections').then(m => ({ default: m.FinancingSection })),
  { loading: () => <CommandBootSection label="Loading financing" /> },
)
const ClinicalSection = dynamic(
  () => import('./mobile-command/sections/ClinicalSection').then(m => ({ default: m.ClinicalSection })),
  { loading: () => <CommandBootSection label="Loading clinical" /> },
)
const SettingsSection = dynamic(
  () => import('./mobile-command/sections/AccountSections').then(m => ({ default: m.SettingsSection })),
  { loading: () => <CommandBootSection label="Loading settings" /> },
)
const DealRoomsSection = dynamic(
  () => import('./mobile-command/sections/AccountSections').then(m => ({ default: m.DealRoomsSection })),
  { loading: () => <CommandBootSection label="Loading deal rooms" /> },
)
const SignalSemanticSearch = dynamic(() => import('./SignalSemanticSearch'), { ssr: false })
const CultivarPassportModal = dynamic(
  () => import('./CultivarPassportModal').then(m => ({ default: m.CultivarPassportModal })),
  { ssr: false },
)

type Props = MobileCommandCentreProps & { decisionIntelAccess?: FeatureAccess }

function CommandBootSection({ label }: { label: string }) {
  return (
    <div className="hvm2-section" aria-busy="true" aria-label={label}>
      <div className="hvm2-section-heading">
        <div>
          <span>Harbourview</span>
          <h2>{label}</h2>
          <p>Preparing the active command surface…</p>
        </div>
      </div>
    </div>
  )
}

export default function MobileCommandCentreRebuild(props: Props) {
  const model = useMobileCommandModel(props)
  const deferredSearchQuery = useDeferredValue(model.searchQuery)
  const [contextOpen, setContextOpen] = useState(false)
  const [passportModalOpen, setPassportModalOpen] = useState(false)
  const contextCloseRef = useRef<HTMLButtonElement | null>(null)
  const contextTriggerRef = useRef<HTMLButtonElement | null>(null)
  const secondaryNavRef = useRef<HTMLElement | null>(null)
  const secondaryButtonRefs = useRef(new Map<SectionId, HTMLButtonElement>())

  // Tool launchers are always present and never role-specific, so they are not
  // "requires attention" — excluding them lets a real exception reach the two
  // priority slots (docs/COMMAND_SURFACE_SPEC.md 4.2).
  const attentionItems = model.nextActions.filter(
    item => item.kind !== 'tool' && (item.tone === 'warn' || item.tone === 'gold'),
  )
  const corridorTools = model.nextActions.filter(item => item.kind === 'tool')
  const opportunityRows = model.marketRows.filter(row => row.view === 'opportunities')

  // Watch-rule hits are the strongest personalization signal available and were
  // previously confined to the Intel and Regulatory sections (spec 4.4). Rules
  // are org-scoped, so this is empty for users without a workspace.
  const watchRuleHits = useMemo(
    () => matchWatchRuleHits(
      model.signals,
      (props.watchlistData?.rules ?? []) as WatchRuleLike[],
      6,
    ),
    [model.signals, props.watchlistData?.rules],
  )

  const commandDelta = useMemo(
    () => buildCommandDelta({
      signals: model.signals,
      watchRuleHits: watchRuleHits.length,
      lastViewedAt: props.commandLastViewedAt,
    }),
    [model.signals, watchRuleHits.length, props.commandLastViewedAt],
  )

  // Stamp the visit only once the operator is actually on the Command overview.
  //
  // Two things this deliberately gets right:
  //  - It is gated on activeSection, not on mount. Landing deep-linked into
  //    Market or Intel must not consume a delta the operator never saw.
  //  - It runs after the delta above is computed from the *previous* stamp, so
  //    the view being looked at still reports what changed rather than zeroing
  //    itself on arrival.
  // Once per mount; failure is silent, because a missed stamp only means the
  // next delta covers a slightly longer window.
  const viewStampedRef = useRef(false)
  useEffect(() => {
    if (viewStampedRef.current || model.activeSection !== 'overview') return
    viewStampedRef.current = true
    void fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command_last_viewed_at: true }),
    }).catch(() => undefined)
  }, [model.activeSection])
  const activeDestination = PRIMARY_NAV.find(item => item.id === model.activeGroup)
  const showSecondaryNav = model.groupSections.length > 1
  const secondaryNavLabel = model.activeGroup === 'overview'
    ? 'Command domains and operating controls'
    : `${activeDestination?.label ?? 'Command'} sections`

  // Build the semantic search index only when Search is actually active.
  // The index is expensive compared with filtering a prebuilt record set, so
  // query keystrokes must never rebuild the whole command corpus.
  const searchIndex = useMemo(() => {
    if (model.activeSection !== 'search' || !deferredSearchQuery.trim()) return []
    return buildCommandSearchIndex({
      signals: model.signals,
      listings: model.marketRows,
      watchItems: props.watchlistData?.items ?? [],
      localIntel: props.localIntel ?? null,
      countryLabel: model.countryLabel,
      countryIntel: props.countryIntel,
      directories: model.directoryRecords,
      genetics: model.geneticsRecords,
      actions: model.nextActions,
      evidenceDocuments: model.evidenceDocuments,
      talent: model.talentRecords,
    })
  }, [
    deferredSearchQuery,
    model.activeSection,
    model.signals,
    model.marketRows,
    props.watchlistData?.items,
    props.localIntel,
    model.countryLabel,
    props.countryIntel,
    model.directoryRecords,
    model.geneticsRecords,
    model.nextActions,
    model.evidenceDocuments,
    model.talentRecords,
  ])

  const searchRecords = useMemo(() => {
    if (!deferredSearchQuery.trim()) return []
    return searchCommandRecords(searchIndex, deferredSearchQuery, model.countryLabel)
  }, [deferredSearchQuery, model.countryLabel, searchIndex])

  useEffect(() => {
    if (!contextOpen) return
    contextCloseRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextOpen(false)
        window.requestAnimationFrame(() => contextTriggerRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [contextOpen])

  useEffect(() => {
    if (!showSecondaryNav) return

    let frame = 0
    const revealActiveSection = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        secondaryButtonRefs.current
          .get(model.highlightedSection)
          ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' })
      })
    }

    revealActiveSection()
    window.addEventListener('resize', revealActiveSection)
    window.visualViewport?.addEventListener('resize', revealActiveSection)

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(revealActiveSection)
    const secondaryNav = secondaryNavRef.current
    const activeButton = secondaryButtonRefs.current.get(model.highlightedSection)
    if (secondaryNav) resizeObserver?.observe(secondaryNav)
    if (activeButton) resizeObserver?.observe(activeButton)

    return () => {
      window.removeEventListener('resize', revealActiveSection)
      window.visualViewport?.removeEventListener('resize', revealActiveSection)
      resizeObserver?.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [model.highlightedSection, showSecondaryNav])

  function closeContext() {
    setContextOpen(false)
    window.requestAnimationFrame(() => contextTriggerRef.current?.focus())
  }

  function updateContext(key: 'country' | 'role', value: string) {
    setContextOpen(false)
    void fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key === 'country'
        ? { country_iso2: value }
        : { role_id: value || null }),
    }).catch(() => undefined)
    model.updateContext(key, value)
  }

  const sectionElements: Record<SectionId, ReactNode> = {
    overview: (
      <CommandOverviewOperator
        sectionRef={model.sectionRef('overview')}
        countryLabel={model.countryLabel}
        roleLabel={model.roleLabel}
        attentionItems={attentionItems}
        corridorTools={corridorTools}
        signals={model.signals}
        opportunities={opportunityRows}
        watchRuleHits={watchRuleHits}
        delta={commandDelta}
        lastViewedAt={props.commandLastViewedAt}
        operatingPicture={props.countryIntel?.public_summary}
        onOpenActions={() => model.navigateToSection('next-actions')}
        onOpenIntel={() => model.navigateToSection('weekly-signals')}
        onOpenOpportunities={() => model.selectMarketView('opportunities')}
        onOpenContext={() => model.navigateToSection('jurisdiction')}
      />
    ),
    'market-intelligence': <MarketIntelligenceSection sectionRef={model.sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />,
    marketplace: <MarketplaceSection sectionRef={model.sectionRef('marketplace')} activeMarketView={model.activeMarketView} marketQuery={model.marketQuery} marketRows={model.marketRows} filteredRows={model.filteredMarketRows} activeTool={model.activeTool} selectedListing={model.selectedListing} onMarketViewChange={model.selectMarketView} onMarketQueryChange={model.setMarketQuery} onOpenTool={model.openTool} onCloseTool={model.closeTool} onViewSubmissions={model.viewSubmissions} commandHref={model.commandHref} />,
    supply: <SupplySection sectionRef={model.sectionRef('supply')} supplyRows={model.supplyRows} onOpenTool={model.openTool} />,
    'next-actions': <NextActionsSection sectionRef={model.sectionRef('next-actions')} actions={model.nextActions} />,
    'weekly-signals': <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} countryLabel={model.countryLabel} access={props.decisionIntelAccess} />,
    'personal-briefing': (
      <PersonalBriefingSection
        sectionRef={model.sectionRef('personal-briefing')}
        roleShort={model.roleShort}
        countryLabel={model.countryLabel}
        narrative={
          props.countryIntel?.commercial_pathway_summary?.trim()
          || props.countryIntel?.public_summary?.trim()
          || `${model.countryLabel} remains the active commercial-intelligence context.`
        }
        marketplaceCount={model.marketRows.length}
        signalCount={model.signals.length}
        pipelineTotal={model.pipelineTotal}
        actionCount={model.nextActions.length}
        signals={model.signals}
        reviewStatus={model.reviewStatus}
        sourceCoverageCount={model.sourceCoverageCount}
        nextAction={model.nextActions[0]}
      />
    ),
    search: (
      <>
        <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} searchRecords={searchRecords} countryLabel={model.countryLabel} onQueryChange={model.setSearchQuery} onNavigate={model.navigateToSection} onListingSelect={model.selectListingResult} />
        <div className="hvm2-section">
          <SignalSemanticSearch />
        </div>
      </>
    ),
    education: <EducationSection sectionRef={model.sectionRef('education')} roleShort={model.roleShort} tiles={model.educationTiles} commandHref={model.commandHref} />,
    jurisdiction: <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} flag={flagEmoji(model.countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={model.reviewStatus} pathwaySteps={model.pathwaySteps} pathwayIsGeneric={model.pathwayIsGeneric} commandHref={model.commandHref} />,
    'market-status': <MarketStatusSection sectionRef={model.sectionRef('market-status')} wanted={props.wantedCount ?? model.pipeline.wanted} inquiry={model.pipeline.inquiry} proofReview={model.pipeline.proof_review} matched={model.pipeline.matched} dealRoom={model.pipeline.deal_room} submissions={model.submissions} />,
    'review-gates': <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} reviewStatus={model.reviewStatus} approved={props.countryIntel?.review_status === 'approved'} sourceCoverageCount={model.sourceCoverageCount} proofReview={model.pipeline.proof_review} submissionCount={model.submissions.length} evidenceDocuments={model.evidenceDocuments} />,
    talent: <TalentSection sectionRef={model.sectionRef('talent')} records={model.talentRecords} commandHref={model.commandHref} jurisdiction={model.countryIso2} />,
    genetics: (
      <>
        <GeneticsSection sectionRef={model.sectionRef('genetics')} records={model.geneticsRecords} commandHref={model.commandHref} />
        <div className="hvm2-section">
          <button type="button" className="cc-sub-upgrade-btn" onClick={() => setPassportModalOpen(true)}>
            Register cultivar →
          </button>
        </div>
        <CultivarPassportModal open={passportModalOpen} onClose={() => setPassportModalOpen(false)} />
      </>
    ),
    clinical: <ClinicalSection sectionRef={model.sectionRef('clinical')} roleShort={model.roleShort} programStatus={props.countryIntel?.briefing_program_status} medicalStatus={props.countryIntel?.medical_status} patientAccess={props.countryIntel?.briefing_patient_access} physicianAccess={props.countryIntel?.briefing_physician_access} commandHref={model.commandHref} />,
    compliance: <ComplianceSection sectionRef={model.sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} playbookSourcing={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], '')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} commandHref={model.commandHref} />,
    regulatory: <RegulatoryWatchSection sectionRef={model.sectionRef('regulatory')} items={props.watchlistData?.items ?? []} activeRules={(props.watchlistData?.rules ?? []).filter(rule => rule.is_active).length} rules={props.watchlistData?.rules ?? []} signals={model.signals} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} sourceCoverageCount={model.sourceCoverageCount} commandHref={model.commandHref} />,
    'local-intel': <LocalIntelSection sectionRef={model.sectionRef('local-intel')} localIntel={props.localIntel ?? null} countryLabel={model.countryLabel} />,
    network: <NetworkSection sectionRef={model.sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} commandHref={model.commandHref} />,
    financing: <FinancingSection sectionRef={model.sectionRef('financing')} countryLabel={model.countryLabel} roleShort={model.roleShort} activeTool={model.activeTool} onOpenTool={model.openTool} onCloseTool={model.closeTool} />,
    settings: <SettingsSection sectionRef={model.sectionRef('settings')} userTier={props.userTier} />,
    'deal-rooms': <DealRoomsSection sectionRef={model.sectionRef('deal-rooms')} />,
  }

  return (
    <div className="hvm2-root" data-mobile-command-version="2" data-active-destination={model.activeGroup}>
      <header className="hvm-op-header">
        <div className="hvm-op-header-top">
          <div className="hvm-op-brand">
            <span className="hvm-op-wordmark">HARBOURVIEW</span>
            <h1 className="hvm-op-page-title">{activeDestination?.label ?? 'Command'}</h1>
          </div>
          <span className="hvm-op-current-chip" aria-label="Current command context">Current</span>
        </div>

        <button
          ref={contextTriggerRef}
          type="button"
          className="hvm-op-context-trigger"
          aria-haspopup="dialog"
          aria-expanded={contextOpen}
          aria-label={`Change operating context. ${model.countryLabel}, ${model.roleLabel}`}
          onClick={() => setContextOpen(true)}
        >
          <span>{flagEmoji(model.countryIso2)} {model.countryLabel} · {model.roleLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </header>

      {showSecondaryNav && (
        <nav ref={secondaryNavRef} className="hvm-op-secondary-nav" aria-label={secondaryNavLabel}>
          {model.groupSections.map(id => {
            const section = SECTION_NAV.find(entry => entry.id === id)
            if (!section) return null
            const isActive = model.highlightedSection === section.id
            return (
              <button
                ref={node => {
                  if (node) secondaryButtonRefs.current.set(section.id, node)
                  else secondaryButtonRefs.current.delete(section.id)
                }}
                key={section.id}
                type="button"
                className={isActive ? 'active' : ''}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => model.navigateToSection(section.id)}
              >
                {section.label}
              </button>
            )
          })}
        </nav>
      )}

      <main className="hvm2-main hvm-op-main">
        {model.activeGroup === 'marketplace' && <MarketplaceMediaStatus mediaStatus={props.marketplaceMediaStatus ?? 'live'} />}
        {model.visibleSections.map(id => <Fragment key={id}>{sectionElements[id]}</Fragment>)}
      </main>

      <nav className="hvm2-bottom-nav hvm-op-bottom-nav" aria-label="Primary mobile command navigation">
        {PRIMARY_NAV.map(item => {
          const isActive = model.activeGroup === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => model.navigateToSection(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
            </button>
          )
        })}
      </nav>

      {contextOpen && (
        <div className="hvm-op-dialog-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) closeContext()
        }}>
          <div className="hvm-op-context-dialog" role="dialog" aria-modal="true" aria-labelledby="hvm-op-context-title">
            <div className="hvm-op-dialog-heading">
              <div>
                <span className="hvm-op-eyebrow">Active context</span>
                <h2 id="hvm-op-context-title">Operating context</h2>
              </div>
              <button ref={contextCloseRef} type="button" aria-label="Close context switcher" onClick={closeContext}>×</button>
            </div>

            <div className="hvm-op-context-form">
              <label>
                <span>Jurisdiction</span>
                <select value={model.currentCountry ?? ''} onChange={event => updateContext('country', event.target.value)}>
                  {ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}
                </select>
              </label>
              <label>
                <span>Role</span>
                <select value={model.currentRole ?? ''} onChange={event => updateContext('role', event.target.value)}>
                  <option value="">All roles</option>
                  {model.roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
                </select>
              </label>
              <OrganizationContextControl onDone={() => setContextOpen(false)} />
              <Link href="/account" onClick={() => setContextOpen(false)}>
                <span>Account</span><span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
