'use client'

import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import CommandCentreModuleRail from './CommandCentreModuleRail'
import type { MobileCommandCentreProps } from './mobile-command/props'
import { PRIMARY_NAV, SECTION_NAV, readString, type SectionId } from './mobile-command/contracts'
import { useMobileCommandModel } from './mobile-command/useMobileCommandModel'
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

export default function MobileCommandCentreRebuild(props: MobileCommandCentreProps) {
  const model = useMobileCommandModel(props)

  // Every section, keyed by id. Only the ids in `model.visibleSections` are
  // rendered, so four of the five destinations never reach the DOM.
  //
  // This file previously mounted all twenty at once and the bottom nav merely
  // called scrollIntoView, which made the whole command centre one endless
  // scroll with anchor links instead of five surfaces. The desktop renderer has
  // always switched on activePage and rendered a single page; this is the same
  // model.
  const sectionElements: Record<SectionId, ReactNode> = {
    overview: <OverviewSection sectionRef={model.sectionRef('overview')} countryLabel={model.countryLabel} roleLabel={model.roleLabel} publicSummary={props.countryIntel?.public_summary} marketAccessStatus={props.countryIntel?.market_access_status} reviewStatus={model.reviewStatus} firstAction={model.nextActions[0]} onOpenActions={() => model.navigateToSection('next-actions')} />,
    'live-status': <LiveStatusSection sectionRef={model.sectionRef('live-status')} marketplaceCount={model.marketRows.length} wantedCount={props.wantedCount ?? 0} signalCount={model.signals.length} confidence={model.confidence} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} />,
    'market-intelligence': <MarketIntelligenceSection sectionRef={model.sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />,
    marketplace: <MarketplaceSection sectionRef={model.sectionRef('marketplace')} activeMarketView={model.activeMarketView} marketQuery={model.marketQuery} marketRows={model.marketRows} filteredRows={model.filteredMarketRows} activeTool={model.activeTool} selectedListing={model.selectedListing} onMarketViewChange={model.selectMarketView} onMarketQueryChange={model.setMarketQuery} onOpenTool={model.openTool} onCloseTool={model.closeTool} onViewSubmissions={model.viewSubmissions} commandHref={model.commandHref} />,
    supply: <SupplySection sectionRef={model.sectionRef('supply')} supplyRows={model.supplyRows} onOpenTool={model.openTool} />,
    'next-actions': <NextActionsSection sectionRef={model.sectionRef('next-actions')} actions={model.nextActions} />,
    'weekly-signals': <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} />,
    'personal-briefing': <PersonalBriefingSection sectionRef={model.sectionRef('personal-briefing')} roleShort={model.roleShort} countryLabel={model.countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${model.countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={model.marketRows.length} signalCount={model.signals.length} pipelineTotal={model.pipelineTotal} actionCount={model.nextActions.length} />,
    search: <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} signalResults={model.searchResults.signals} listingResults={model.searchResults.listings} onQueryChange={model.setSearchQuery} onSignalSelect={() => model.navigateToSection('weekly-signals')} onListingSelect={model.selectListingResult} />,
    education: <EducationSection sectionRef={model.sectionRef('education')} roleShort={model.roleShort} tiles={model.educationTiles} commandHref={model.commandHref} />,
    jurisdiction: <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} flag={flagEmoji(model.countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={model.reviewStatus} pathwaySteps={model.pathwaySteps} pathwayIsGeneric={model.pathwayIsGeneric} commandHref={model.commandHref} />,
    'market-status': <MarketStatusSection sectionRef={model.sectionRef('market-status')} wanted={props.wantedCount ?? model.pipeline.wanted} inquiry={model.pipeline.inquiry} proofReview={model.pipeline.proof_review} matched={model.pipeline.matched} dealRoom={model.pipeline.deal_room} submissions={model.submissions} />,
    'review-gates': <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} reviewStatus={model.reviewStatus} approved={props.countryIntel?.review_status === 'approved'} sourceCoverageCount={model.sourceCoverageCount} proofReview={model.pipeline.proof_review} submissionCount={model.submissions.length} evidenceDocuments={model.evidenceDocuments} />,
    directories: <DirectoriesSection sectionRef={model.sectionRef('directories')} records={model.directoryRecords} commandHref={model.commandHref} />,
    talent: <TalentSection sectionRef={model.sectionRef('talent')} records={model.talentRecords} commandHref={model.commandHref} />,
    genetics: <GeneticsSection sectionRef={model.sectionRef('genetics')} records={model.geneticsRecords} commandHref={model.commandHref} />,
    clinical: <ClinicalSection sectionRef={model.sectionRef('clinical')} roleShort={model.roleShort} programStatus={props.countryIntel?.briefing_program_status} medicalStatus={props.countryIntel?.medical_status} patientAccess={props.countryIntel?.briefing_patient_access} physicianAccess={props.countryIntel?.briefing_physician_access} commandHref={model.commandHref} />,
    // `confidence_label` is not selected by every query that feeds this shell,
    // so the read stays a `readString` lookup with a fallback. The fallback is
    // now an empty string: the section itself owns the "none recorded" copy,
    // which lets it say what the note is and when it gets written rather than
    // printing a status-shaped placeholder in a prose slot.
    compliance: <ComplianceSection sectionRef={model.sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} playbookSourcing={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], '')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} commandHref={model.commandHref} />,
    network: <NetworkSection sectionRef={model.sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} commandHref={model.commandHref} />,
    financing: <FinancingSection sectionRef={model.sectionRef('financing')} countryLabel={model.countryLabel} roleShort={model.roleShort} activeTool={model.activeTool} onOpenTool={model.openTool} onCloseTool={model.closeTool} />,
  }

  const activeDestination = PRIMARY_NAV.find(item => item.id === model.activeGroup)

  return (
    <div className="hvm2-root" data-mobile-command-version="2" data-active-destination={model.activeGroup}>
      <header className="hvm2-command-header">
        <div className="hvm2-header-row">
          <div><span className="hvm2-wordmark">HARBOURVIEW</span><span className="hvm2-command-label">Mobile Command</span></div>
          <div className="hvm2-live-chip"><i /> Live</div>
        </div>
        <div className="hvm2-command-title">
          <div className="hvm2-country-flag" aria-hidden="true">{flagEmoji(model.countryIso2)}</div>
          <div><span>{model.countryLabel} · {model.roleShort}</span><h1>Operator command centre</h1></div>
          <Link href={model.commandHref('overview', { page: 'organization' })} className="hvm2-account-link" aria-label="Open organization in Command Centre">Organization</Link>
        </div>
        <div className="hvm2-context-controls" role="group" aria-label="Dashboard context">
          <label>
            <span>Jurisdiction</span>
            <select value={model.currentCountry} onChange={event => model.updateContext('country', event.target.value)}>
              {ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select value={model.currentRole ?? ''} onChange={event => model.updateContext('role', event.target.value)}>
              {model.roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {/* Sub-navigation for the active destination only. This listed all twenty
          sections regardless of where you were, which is most of what made the
          surface feel piled on. Each chip navigates, so the section it opens
          arrives with its own data already fetched. */}
      <nav className="hvm2-section-rail" aria-label={`${activeDestination?.label ?? 'Command'} sections`}>
        {model.groupSections.map(id => {
          const section = SECTION_NAV.find(entry => entry.id === id)
          if (!section) return null
          const isActive = model.activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => model.navigateToSection(section.id)}
            >
              <span aria-hidden="true">{section.icon}</span>{section.label}
            </button>
          )
        })}
      </nav>

      <CommandCentreModuleRail country={model.currentCountry} role={model.currentRole ?? null} />

      <main className="hvm2-main">
        {model.visibleSections.map(id => <Fragment key={id}>{sectionElements[id]}</Fragment>)}
      </main>

      <nav className="hvm2-bottom-nav" aria-label="Primary mobile command navigation">
        {PRIMARY_NAV.map(item => {
          // Highlights the destination that owns the active section, so a deep
          // link into a folded section still lights up the right tab.
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
    </div>
  )
}
