'use client'

import Link from 'next/link'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { MobileCommandCentreProps } from './mobile-command/props'
import { PRIMARY_NAV, SECTION_NAV, readString } from './mobile-command/contracts'
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

  return (
    <div className="hvm2-root" data-mobile-command-version="2">
      <header className="hvm2-command-header">
        <div className="hvm2-header-row">
          <div><span className="hvm2-wordmark">HARBOURVIEW</span><span className="hvm2-command-label">Mobile Command</span></div>
          <div className="hvm2-live-chip"><i /> Live</div>
        </div>
        <div className="hvm2-command-title">
          <div className="hvm2-country-flag" aria-hidden="true">{flagEmoji(model.countryIso2)}</div>
          <div><span>{model.countryLabel} · {model.roleShort}</span><h1>Operator command centre</h1></div>
          <Link href={model.routeHref('/account')} className="hvm2-account-link" aria-label="Open account">Account</Link>
        </div>
        <div className="hvm2-context-controls" aria-label="Dashboard context">
          <label>
            <span>Jurisdiction</span>
            <select value={model.countryIso2} onChange={event => model.updateContext('country', event.target.value)}>
              {ALL_COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.displayName}</option>)}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select value={props.initialRoleId ?? ''} onChange={event => model.updateContext('role', event.target.value)}>
              <option value="">All roles</option>
              {model.roleEntries.map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <nav className="hvm2-section-rail" aria-label="All mobile command sections">
        {SECTION_NAV.map(section => <button key={section.id} type="button" className={model.activeSection === section.id ? 'active' : ''} aria-current={model.activeSection === section.id ? 'page' : undefined} onClick={() => model.navigateToSection(section.id)}><span aria-hidden="true">{section.icon}</span>{section.label}</button>)}
      </nav>

      <main className="hvm2-main">
        <OverviewSection sectionRef={model.sectionRef('overview')} countryLabel={model.countryLabel} roleLabel={model.roleLabel} publicSummary={props.countryIntel?.public_summary} marketAccessStatus={props.countryIntel?.market_access_status} reviewStatus={model.reviewStatus} dataCompleteness={model.dataCompleteness} firstAction={model.nextActions[0]} onOpenActions={() => model.navigateToSection('next-actions')} />
        <LiveStatusSection sectionRef={model.sectionRef('live-status')} marketplaceCount={model.marketRows.length} wantedCount={props.wantedCount ?? 0} signalCount={props.signals.length} confidence={model.confidence} reviewStatus={model.reviewStatus} sourceCoverageCount={model.sourceCoverageCount} />
        <MarketIntelligenceSection sectionRef={model.sectionRef('market-intelligence')} marketMetrics={props.marketMetrics ?? []} tradeFlows={props.tradeFlows ?? []} />
        <MarketplaceSection sectionRef={model.sectionRef('marketplace')} activeMarketView={model.activeMarketView} marketQuery={model.marketQuery} marketRows={model.marketRows} filteredRows={model.filteredMarketRows} onMarketViewChange={model.setActiveMarketView} onMarketQueryChange={model.setMarketQuery} routeHref={model.routeHref} />
        <SupplySection sectionRef={model.sectionRef('supply')} supplyRows={model.supplyRows} routeHref={model.routeHref} />
        <NextActionsSection sectionRef={model.sectionRef('next-actions')} actions={model.nextActions} />
        <WeeklySignalsSection sectionRef={model.sectionRef('weekly-signals')} signals={model.signals} routeHref={model.routeHref} />
        <PersonalBriefingSection sectionRef={model.sectionRef('personal-briefing')} roleShort={model.roleShort} countryLabel={model.countryLabel} narrative={props.countryIntel?.commercial_pathway_summary?.trim() || props.countryIntel?.public_summary?.trim() || `${model.countryLabel} remains the active commercial-intelligence context.`} marketplaceCount={model.marketRows.length} signalCount={model.signals.length} pipelineTotal={model.pipelineTotal} actionCount={model.nextActions.length} />
        <SearchSection sectionRef={model.sectionRef('search')} searchQuery={model.searchQuery} signalResults={model.searchResults.signals} listingResults={model.searchResults.listings} onQueryChange={model.setSearchQuery} onSignalSelect={() => model.navigateToSection('weekly-signals')} onListingSelect={model.selectListingResult} />
        <EducationSection sectionRef={model.sectionRef('education')} roleShort={model.roleShort} tiles={model.educationTiles} dashboardHref={model.dashboardHref} />
        <JurisdictionSection sectionRef={model.sectionRef('jurisdiction')} countryLabel={model.countryLabel} countryIso2={flagEmoji(model.countryIso2)} region={props.countryIntel?.region} outlook={props.countryIntel?.briefing_regulatory_outlook} pathway={props.countryIntel?.commercial_pathway_summary} importStatus={props.countryIntel?.import_status} exportStatus={props.countryIntel?.export_status} medicalStatus={props.countryIntel?.medical_status} adultUseStatus={props.countryIntel?.adult_use_status} regulator={props.countryIntel?.regulator_label || props.countryIntel?.briefing_regulatory_body} reviewStatus={model.reviewStatus} routeHref={model.routeHref} />
        <MarketStatusSection sectionRef={model.sectionRef('market-status')} wanted={props.wantedCount ?? model.pipeline.wanted} inquiry={model.pipeline.inquiry} proofReview={model.pipeline.proof_review} matched={model.pipeline.matched} dealRoom={model.pipeline.deal_room} submissions={model.submissions} />
        <ReviewGatesSection sectionRef={model.sectionRef('review-gates')} reviewStatus={model.reviewStatus} approved={props.countryIntel?.review_status === 'approved'} dataCompleteness={model.dataCompleteness} sourceCoverageCount={model.sourceCoverageCount} proofReview={model.pipeline.proof_review} submissionCount={model.submissions.length} />
        <DirectoriesSection sectionRef={model.sectionRef('directories')} records={model.directoryRecords} routeHref={model.routeHref} />
        <TalentSection sectionRef={model.sectionRef('talent')} records={model.talentRecords} dashboardHref={model.dashboardHref} />
        <GeneticsSection sectionRef={model.sectionRef('genetics')} records={model.geneticsRecords} dashboardHref={model.dashboardHref} />
        <ClinicalSection sectionRef={model.sectionRef('clinical')} roleShort={model.roleShort} programStatus={props.countryIntel?.briefing_program_status} medicalStatus={props.countryIntel?.medical_status} patientAccess={props.countryIntel?.briefing_patient_access} physicianAccess={props.countryIntel?.briefing_physician_access} routeHref={model.routeHref} />
        <ComplianceSection sectionRef={model.sectionRef('compliance')} regulatoryTier={props.countryIntel?.regulatory_tier} outlook={props.countryIntel?.briefing_regulatory_outlook} dataCompleteness={model.dataCompleteness} playbookStatus={readString(props.jurisdictionPlaybook, ['confidence_label', 'status'], 'Playbook review in progress')} marketAccessStatus={props.countryIntel?.market_access_status} pathway={props.countryIntel?.commercial_pathway_summary} dashboardHref={model.dashboardHref} />
        <NetworkSection sectionRef={model.sectionRef('network')} professionalCount={props.professionals?.length ?? 0} providerCount={props.serviceProviders?.length ?? 0} operatorCount={props.cannabisOperators?.length ?? 0} collaborationCount={props.collaborationProjects?.length ?? 0} routeHref={model.routeHref} />
        <FinancingSection sectionRef={model.sectionRef('financing')} countryLabel={model.countryLabel} roleShort={model.roleShort} routeHref={model.routeHref} />
      </main>

      <nav className="hvm2-bottom-nav" aria-label="Primary mobile command navigation">
        {PRIMARY_NAV.map(item => <button key={item.id} type="button" className={model.activeSection === item.id ? 'active' : ''} onClick={() => model.navigateToSection(item.id)}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
    </div>
  )
}
