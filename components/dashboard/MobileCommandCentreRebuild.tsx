'use client'

import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { MobileCommandCentreProps } from './mobile-command/props'
import { PRIMARY_NAV, SECTION_NAV, readString, type SectionId } from './mobile-command/contracts'
import { useMobileCommandModel } from './mobile-command/useMobileCommandModel'
import CommandOverviewOperator from './mobile-command/CommandOverviewOperator'
import {
  ClinicalSection,
  ComplianceSection,
  DealRoomsSection,
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
  PersonalBriefingSection,
  ReviewGatesSection,
  SearchSection,
  SettingsSection,
  SupplySection,
  TalentSection,
  WeeklySignalsSection,
  RegulatoryWatchSection,
  LocalIntelSection,
} from './mobile-command/Sections'
import { MyBriefingsPanel } from './MyBriefingsPanel'
import SignalSemanticSearch from './SignalSemanticSearch'
import { CultivarPassportModal } from './CultivarPassportModal'
import './MobileCommandCentreRebuild.css'
import './mobile-command/MobileCommandOperatorFirst.css'
// cc-* classes used by DealRoomsPanel, MyBriefingsPanel, SignalSemanticSearch,
// and the new SettingsSection below — reused as-is from the desktop shell
// rather than duplicated, since prefixes don't collide with hvm2-*.
import './CommandCentre.css'

export default function MobileCommandCentreRebuild(props: MobileCommandCentreProps) {
  const model = useMobileCommandModel(props)
  const [contextOpen, setContextOpen] = useState(false)
  const [passportModalOpen, setPassportModalOpen] = useState(false)
  const contextCloseRef = useRef<HTMLButtonElement | null>(null)
  const contextTriggerRef = useRef<HTMLButtonElement | null>(null)

  const attentionItems = model.nextActions.filter(item => item.tone === 'warn' || item.tone === 'gold')
  const opportunityRows = model.marketRows.filter(row => row.view === 'opportunities')
  const activeDestination = PRIMARY_NAV.find(item => item.id === model.activeGroup)
  // The Command landing stays chrome-free: the operator dashboard is the whole
  // surface, and a rail above it just pushes the first real content below the
  // fold. Its siblings — jurisdiction, compliance, genetics, network,
  // directories, talent, education — are reached from "Read operating picture",
  // and the rail appears once you are in one of them so you can move between
  // them and back. Keyed off the committed section rather than the group, so
  // every other destination still gets its rail immediately.
  const showSecondaryNav = model.groupSections.length > 1 && model.highlightedSection !== 'overview'

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

  function closeContext() {
    setContextOpen(false)
    window.requestAnimationFrame(() => contextTriggerRef.current?.focus())
  }

  function updateContext(key: 'country' | 'role', value: string) {
    setContextOpen(false)
    model.updateContext(key, value)
  }

  const sectionElements: Record<SectionId, ReactNode> = {
    overview: (
      <CommandOverviewOperator
        sectionRef={model.sectionRef('overview')}
        countryLabel={model.countryLabel}
        roleLabel={model.roleLabel}
        attentionItems={attentionItems}
        signals={model.signals}
        opportunities={opportunityRows}
        operatingPicture={props.countryIntel?.public_summary}
        onOpenActions={() => model.navigateToSection('next-actions')}
        onOpenIntel={() => model.navigateToSection('weekly-signals')}
        onOpenOpportunities={() => model.selectMarketView('opportunities')}
        onOpenContext={() => model.navigateToSection('jurisdiction')}
      />
    ),
    'live-status': <LiveStatusSection sectionRef={model.sectionRef('live-status')} marketplaceCount={model.marketRows.length} wantedCount={props.wantedCount ?? 0} signalCount={model.signals.length} confidence={model.confidence} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} />,
    'market-intelligence': <MarketIntelligenceSection sectionRef={model.sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />,
    marketplace: <MarketplaceSection sectionRef={model.sectionRef('marketplace')} activeMarketView={model.activeMarketView} marketQuery={model.marketQuery} marketRows={model.marketRows} filteredRows={model.filteredMarketRows} activeTool={model.activeTool} selectedListing={model.selectedListing} onMarketViewChange={model.selectMarketView} onMarketQueryChange={model.setMarketQuery} onOpenTool={model.openTool} onCloseTool={model.closeTool} onViewSubmissions={model.viewSubmissions} commandHref={model.commandHref} />,
    supply: <SupplySection sectionRef={model.sectionRef('supply')} supplyRows={model.supplyRows} onOpenTool={model.openTool} />,
    'next-actions': <NextActionsSection sectionRef={model.sectionRef('next-actions')} actions={model.nextActions} />,
    'weekly-signals': <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} />,
    'personal-briefing': (
      <>
        <PersonalBriefingSection sectionRef={model.sectionRef('personal-briefing')} roleShort={model.roleShort} countryLabel={model.countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${model.countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={model.marketRows.length} signalCount={model.signals.length} pipelineTotal={model.pipelineTotal} actionCount={model.nextActions.length} />
        {/* Deterministic summary above is a quick-glance snapshot; real LLM
            synthesis + watch-rule-driven briefings below — this had no mobile
            (or desktop, before this session) home at all previously. */}
        <div className="hvm2-section">
          <MyBriefingsPanel onOpenWatchlist={() => model.navigateToSection('weekly-signals')} />
        </div>
      </>
    ),
    search: (
      <>
        <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} signalResults={model.searchResults.signals} listingResults={model.searchResults.listings} onQueryChange={model.setSearchQuery} onSignalSelect={() => model.navigateToSection('weekly-signals')} onListingSelect={model.selectListingResult} />
        {/* Above filters only records already loaded into this session; below
            hits /api/signals/search for real semantic/keyword search. */}
        <div className="hvm2-section">
          <SignalSemanticSearch />
        </div>
      </>
    ),
    education: <EducationSection sectionRef={model.sectionRef('education')} roleShort={model.roleShort} tiles={model.educationTiles} commandHref={model.commandHref} />,
    jurisdiction: <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} flag={flagEmoji(model.countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={model.reviewStatus} pathwaySteps={model.pathwaySteps} pathwayIsGeneric={model.pathwayIsGeneric} commandHref={model.commandHref} />,
    'market-status': <MarketStatusSection sectionRef={model.sectionRef('market-status')} wanted={props.wantedCount ?? model.pipeline.wanted} inquiry={model.pipeline.inquiry} proofReview={model.pipeline.proof_review} matched={model.pipeline.matched} dealRoom={model.pipeline.deal_room} submissions={model.submissions} />,
    'review-gates': <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} reviewStatus={model.reviewStatus} approved={props.countryIntel?.review_status === 'approved'} sourceCoverageCount={model.sourceCoverageCount} proofReview={model.pipeline.proof_review} submissionCount={model.submissions.length} evidenceDocuments={model.evidenceDocuments} />,
    directories: <DirectoriesSection sectionRef={model.sectionRef('directories')} records={model.directoryRecords} commandHref={model.commandHref} />,
    talent: <TalentSection sectionRef={model.sectionRef('talent')} records={model.talentRecords} commandHref={model.commandHref} />,
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
    regulatory: <RegulatoryWatchSection sectionRef={model.sectionRef('regulatory')} items={props.watchlistData?.items ?? []} activeRules={(props.watchlistData?.rules ?? []).filter(rule => rule.is_active).length} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} sourceCoverageCount={model.sourceCoverageCount} commandHref={model.commandHref} />,
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
          <span className="hvm-op-current-chip">Current</span>
        </div>

        <button
          ref={contextTriggerRef}
          type="button"
          className="hvm-op-context-trigger"
          aria-haspopup="dialog"
          aria-expanded={contextOpen}
          onClick={() => setContextOpen(true)}
        >
          <span>{flagEmoji(model.countryIso2)} {model.countryLabel} · {model.roleLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </header>

      {showSecondaryNav && (
        <nav className="hvm-op-secondary-nav" aria-label={`${activeDestination?.label ?? 'Command'} sections`}>
          {model.groupSections.map(id => {
            const section = SECTION_NAV.find(entry => entry.id === id)
            if (!section) return null
            const isActive = model.highlightedSection === section.id
            return (
              <button
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
                <select value={model.currentCountry} onChange={event => updateContext('country', event.target.value)}>
                  {ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}
                </select>
              </label>
              <label>
                <span>Role</span>
                <select value={model.currentRole ?? ''} onChange={event => updateContext('role', event.target.value)}>
                  {model.roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
                </select>
              </label>
              <Link href={model.commandHref('overview', { page: 'organization' })} onClick={() => setContextOpen(false)}>
                <span>Organization</span><span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
