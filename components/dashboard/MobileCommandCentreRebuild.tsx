'use client'

import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { MobileCommandCentreProps } from './mobile-command/props'
import { PRIMARY_NAV, SECTION_NAV, readString, type SectionId } from './mobile-command/contracts'
import { buildCommandSearchIndex } from './mobile-command/intelSearch'
import { useMobileCommandModel } from './mobile-command/useMobileCommandModel'
import CommandOverviewOperator from './mobile-command/CommandOverviewOperator'
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
  PersonalBriefingSection,
  ReviewGatesSection,
  SearchSection,
  SupplySection,
  TalentSection,
  WeeklySignalsSection,
  RegulatoryWatchSection,
  LocalIntelSection,
} from './mobile-command/Sections'
import './MobileCommandCentreRebuild.css'
import './mobile-command/MobileCommandOperatorFirst.css'
import './mobile-command/MobileIntelInstitutional.css'
import './mobile-command/MobileCommandNavigation.css'

type Props = MobileCommandCentreProps & { decisionIntelAccess?: FeatureAccess }

export default function MobileCommandCentreRebuild(props: Props) {
  const model = useMobileCommandModel(props)
  const [contextOpen, setContextOpen] = useState(false)
  const contextCloseRef = useRef<HTMLButtonElement | null>(null)
  const contextTriggerRef = useRef<HTMLButtonElement | null>(null)
  const secondaryNavRef = useRef<HTMLElement | null>(null)
  const secondaryButtonRefs = useRef(new Map<SectionId, HTMLButtonElement>())

  const attentionItems = model.nextActions.filter(item => item.tone === 'warn' || item.tone === 'gold')
  const opportunityRows = model.marketRows.filter(row => row.view === 'opportunities')
  const activeDestination = PRIMARY_NAV.find(item => item.id === model.activeGroup)
  const showSecondaryNav = model.groupSections.length > 1
  const secondaryNavLabel = model.activeGroup === 'overview'
    ? 'Command domains and operating controls'
    : `${activeDestination?.label ?? 'Command'} sections`

  const searchRecords = useMemo(() => buildCommandSearchIndex({
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
  }), [
    model.signals,
    model.marketRows,
    props.watchlistData,
    props.localIntel,
    model.countryLabel,
    props.countryIntel,
    model.directoryRecords,
    model.geneticsRecords,
    model.nextActions,
    model.evidenceDocuments,
    model.talentRecords,
  ])

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
    'weekly-signals': <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} countryLabel={model.countryLabel} access={props.decisionIntelAccess} />,
    'personal-briefing': <PersonalBriefingSection sectionRef={model.sectionRef('personal-briefing')} roleShort={model.roleShort} countryLabel={model.countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${model.countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={model.marketRows.length} signalCount={model.signals.length} pipelineTotal={model.pipelineTotal} actionCount={model.nextActions.length} signals={model.signals} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} nextAction={model.nextActions[0]} />,
    search: <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} searchRecords={searchRecords} countryLabel={model.countryLabel} onQueryChange={model.setSearchQuery} onNavigate={model.navigateToSection} onListingSelect={model.selectListingResult} />,
    education: <EducationSection sectionRef={model.sectionRef('education')} roleShort={model.roleShort} tiles={model.educationTiles} commandHref={model.commandHref} />,
    jurisdiction: <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} flag={flagEmoji(model.countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={model.reviewStatus} pathwaySteps={model.pathwaySteps} pathwayIsGeneric={model.pathwayIsGeneric} commandHref={model.commandHref} />,
    'market-status': <MarketStatusSection sectionRef={model.sectionRef('market-status')} wanted={props.wantedCount ?? model.pipeline.wanted} inquiry={model.pipeline.inquiry} proofReview={model.pipeline.proof_review} matched={model.pipeline.matched} dealRoom={model.pipeline.deal_room} submissions={model.submissions} />,
    'review-gates': <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} reviewStatus={model.reviewStatus} approved={props.countryIntel?.review_status === 'approved'} sourceCoverageCount={model.sourceCoverageCount} proofReview={model.pipeline.proof_review} submissionCount={model.submissions.length} evidenceDocuments={model.evidenceDocuments} />,
    directories: <DirectoriesSection sectionRef={model.sectionRef('directories')} records={model.directoryRecords} commandHref={model.commandHref} />,
    talent: <TalentSection sectionRef={model.sectionRef('talent')} records={model.talentRecords} commandHref={model.commandHref} />,
    genetics: <GeneticsSection sectionRef={model.sectionRef('genetics')} records={model.geneticsRecords} commandHref={model.commandHref} />,
    clinical: <ClinicalSection sectionRef={model.sectionRef('clinical')} roleShort={model.roleShort} programStatus={props.countryIntel?.briefing_program_status} medicalStatus={props.countryIntel?.medical_status} patientAccess={props.countryIntel?.briefing_patient_access} physicianAccess={props.countryIntel?.briefing_physician_access} commandHref={model.commandHref} />,
    compliance: <ComplianceSection sectionRef={model.sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} playbookSourcing={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], '')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} commandHref={model.commandHref} />,
    regulatory: <RegulatoryWatchSection sectionRef={model.sectionRef('regulatory')} items={props.watchlistData?.items ?? []} activeRules={(props.watchlistData?.rules ?? []).filter(rule => rule.is_active).length} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} sourceCoverageCount={model.sourceCoverageCount} commandHref={model.commandHref} />,
    'local-intel': <LocalIntelSection sectionRef={model.sectionRef('local-intel')} localIntel={props.localIntel ?? null} countryLabel={model.countryLabel} />,
    network: <NetworkSection sectionRef={model.sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} commandHref={model.commandHref} />,
    financing: <FinancingSection sectionRef={model.sectionRef('financing')} countryLabel={model.countryLabel} roleShort={model.roleShort} activeTool={model.activeTool} onOpenTool={model.openTool} onCloseTool={model.closeTool} />,
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
