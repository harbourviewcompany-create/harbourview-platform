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
import OrganizationContextControl from './OrganizationContextControl'
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
import { CorridorPlanWorkspace } from './command-workspace/CorridorPlanWorkspace'
import { LandedCostWorkspace } from './command-workspace/LandedCostWorkspace'
import './command-workspace/CorridorWorkspace.css'
import './MobileCommandCentreRebuild.css'
import './mobile-command/MobileCommandOperatorFirst.css'
import './mobile-command/MobileIntelInstitutional.css'
import './mobile-command/MobileCommandNavigation.css'
// cc-* classes used by DealRoomsPanel, MyBriefingsPanel, SignalSemanticSearch,
// and SettingsSection — reused as-is from the desktop shell rather than
// duplicated; prefixes (cc-*) don't collide with this file's (hvm2-*).
import './CommandCentre.css'

type Props = MobileCommandCentreProps & { decisionIntelAccess?: FeatureAccess }

export default function MobileCommandCentreRebuild(props: Props) {
  const model = useMobileCommandModel(props)
  const [contextOpen, setContextOpen] = useState(false)
  const [passportModalOpen, setPassportModalOpen] = useState(false)
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
        event.preventDefault()
        setContextOpen(false)
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [contextOpen])

  useEffect(() => {
    if (!contextOpen) return
    const trigger = contextTriggerRef.current
    return () => {
      window.requestAnimationFrame(() => trigger?.focus())
    }
  }, [contextOpen])

  const closeContext = () => setContextOpen(false)

  const updateContext = (key: 'country' | 'role', value: string) => {
    model.updateContext(key, value)
  }

  const sectionElements: Record<SectionId, ReactNode> = {
    overview: (
      <CommandOverviewOperator
        sectionRef={model.sectionRef('overview')}
        countryLabel={model.countryLabel}
        roleShort={model.roleShort}
        attentionItems={attentionItems}
        opportunityRows={opportunityRows}
        nextActions={model.nextActions}
        signals={model.signals}
        marketRows={model.marketRows}
        confidence={model.confidence}
        reviewStatus={model.reviewStatus}
        sourceCoverageCount={model.sourceCoverageCount}
        pipelineTotal={model.pipelineTotal}
        commandHref={model.commandHref}
        onOpenPassport={() => setPassportModalOpen(true)}
      />
    ),
    'live-status': <LiveStatusSection sectionRef={model.sectionRef('live-status')} marketplaceCount={model.marketRows.length} wantedCount={props.wantedCount ?? 0} signalCount={model.signals.length} confidence={model.confidence} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} />,
    'market-intelligence': <MarketIntelligenceSection sectionRef={model.sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />,
    marketplace: <MarketplaceSection sectionRef={model.sectionRef('marketplace')} activeMarketView={model.activeMarketView} marketQuery={model.marketQuery} marketRows={model.marketRows} filteredRows={model.filteredMarketRows} activeTool={model.activeTool} selectedListing={model.selectedListing} onMarketViewChange={model.selectMarketView} onMarketQueryChange={model.setMarketQuery} onOpenTool={model.openTool} onCloseTool={model.closeTool} onViewSubmissions={model.viewSubmissions} commandHref={model.commandHref} />,
    supply: <SupplySection sectionRef={model.sectionRef('supply')} supplyRows={model.supplyRows} onOpenTool={model.openTool} />,
    'next-actions': <NextActionsSection sectionRef={model.sectionRef('next-actions')} actions={model.nextActions} />,
    'weekly-signals': <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} countryLabel={model.countryLabel} access={props.decisionIntelAccess} />,
    'personal-briefing': (
      <>
        <PersonalBriefingSection sectionRef={model.sectionRef('personal-briefing')} roleShort={model.roleShort} countryLabel={model.countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${model.countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={model.marketRows.length} signalCount={model.signals.length} pipelineTotal={model.pipelineTotal} actionCount={model.nextActions.length} signals={model.signals} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} nextAction={model.nextActions[0]} />
        <MyBriefingsPanel />
      </>
    ),
    search: (
      <div className="hvm2-section">
        <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} searchRecords={searchRecords} countryLabel={model.countryLabel} onSearchQueryChange={model.setSearchQuery} commandHref={model.commandHref} />
        <SignalSemanticSearch />
      </div>
    ),
    education: <EducationSection sectionRef={model.sectionRef('education')} eduCategories={props.eduCategories} liveTiles={props.liveTiles} recentModules={props.recentEduModules} tracks={props.educationTracks} commandHref={model.commandHref} />,
    jurisdiction: <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} countryIntel={props.countryIntel} pathwayData={props.pathwayData} playbook={props.jurisdictionPlaybook} pathwayMatrix={props.pathwayMatrix} commandHref={model.commandHref} />,
    'market-status': <MarketStatusSection sectionRef={model.sectionRef('market-status')} marketRows={model.marketRows} wantedCount={props.wantedCount ?? 0} pipeline={props.pipeline} />,
    'review-gates': <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} evidenceData={props.evidenceData} evidenceDocuments={model.evidenceDocuments} mySubmissions={props.mySubmissions} pipeline={props.pipeline} commandHref={model.commandHref} />,
    directories: <DirectoriesSection sectionRef={model.sectionRef('directories')} professionals={props.professionals ?? []} serviceProviders={props.serviceProviders ?? []} operators={props.cannabisOperators ?? []} commandHref={model.commandHref} />,
    talent: <TalentSection sectionRef={model.sectionRef('talent')} talentRecords={model.talentRecords} commandHref={model.commandHref} />,
    genetics: <GeneticsSection sectionRef={model.sectionRef('genetics')} geneticsRecords={model.geneticsRecords} onOpenPassport={() => setPassportModalOpen(true)} commandHref={model.commandHref} />,
    clinical: <ClinicalSection sectionRef={model.sectionRef('clinical')} physicianAccess={props.countryIntel?.briefing_physician_access} commandHref={model.commandHref} />,
    compliance: <ComplianceSection sectionRef={model.sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} playbookSourcing={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], '')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} commandHref={model.commandHref} />,
    regulatory: <RegulatoryWatchSection sectionRef={model.sectionRef('regulatory')} items={props.watchlistData?.items ?? []} activeRules={(props.watchlistData?.rules ?? []).filter(rule => rule.is_active).length} rules={props.watchlistData?.rules ?? []} signals={model.signals} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} sourceCoverageCount={model.sourceCoverageCount} commandHref={model.commandHref} />,
    'local-intel': <LocalIntelSection sectionRef={model.sectionRef('local-intel')} localIntel={props.localIntel ?? null} countryLabel={model.countryLabel} />,
    network: <NetworkSection sectionRef={model.sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} commandHref={model.commandHref} />,
    financing: <FinancingSection sectionRef={model.sectionRef('financing')} countryLabel={model.countryLabel} roleShort={model.roleShort} activeTool={model.activeTool} onOpenTool={model.openTool} onCloseTool={model.closeTool} />,
    settings: <SettingsSection sectionRef={model.sectionRef('settings')} userTier={props.userTier} />,
    'deal-rooms': <DealRoomsSection sectionRef={model.sectionRef('deal-rooms')} />,
  }

  return (
    <div className="hvm-op-shell" data-mobile-command-centre="rebuild">
      <header className="hvm-op-topbar">
        <div className="hvm-op-topbar-main">
          <h1 className="hvm-op-title">{activeDestination?.label ?? 'Command'}</h1>
          <button
            ref={contextTriggerRef}
            type="button"
            className="hvm-op-context-trigger"
            onClick={() => setContextOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={contextOpen}
          >
            <span>{flagEmoji(model.currentCountry)} {model.countryLabel} · {model.roleShort}</span>
            <span aria-hidden="true">▾</span>
          </button>
        </div>
      </header>

      {showSecondaryNav && (
        <nav className="hvm-op-secondary" ref={secondaryNavRef} aria-label={secondaryNavLabel}>
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
                className={isActive ? 'is-active' : undefined}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => model.navigateToSection(section.id)}
              >
                {section.label}
              </button>
            )
          })}
        </nav>
      )}

      <main className="hvm-op-main">
        {model.visibleSections.map(id => <Fragment key={id}>{sectionElements[id]}</Fragment>)}
      </main>

      <nav className="hvm-op-primary" aria-label="Primary command navigation">
        {PRIMARY_NAV.map(item => {
          const isActive = model.activeGroup === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'is-active' : undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => model.navigateToGroup(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {(model.activeTool === 'corridor-plan' || model.activeTool === 'landed-cost') && (
        <div className="hvm-op-dialog-backdrop hvm-corridor-tool-layer" role="presentation">
          {model.activeTool === 'corridor-plan' ? (
            <CorridorPlanWorkspace onClose={model.closeTool} />
          ) : (
            <LandedCostWorkspace onClose={model.closeTool} />
          )}
        </div>
      )}

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

      <CultivarPassportModal open={passportModalOpen} onClose={() => setPassportModalOpen(false)} />
    </div>
  )
}
