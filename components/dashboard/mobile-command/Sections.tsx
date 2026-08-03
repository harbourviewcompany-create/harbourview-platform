import type { ComponentProps } from 'react'
import { JurisdictionSection as JurisdictionSectionBase } from './sections/OperationsSections'

export {
  OverviewSection,
  LiveStatusSection,
  MarketIntelligenceSection,
  MarketplaceSection,
  SupplySection,
} from './sections/CoreSections'

export {
  NextActionsSection,
  WeeklySignalsSection,
  PersonalBriefingSection,
  SearchSection,
  EducationSection,
} from './sections/IntelligenceSections'

export {
  MarketStatusSection,
  ReviewGatesSection,
  DirectoriesSection,
  TalentSection,
} from './sections/OperationsSections'

export function JurisdictionSection({
  countryIso2,
  ...props
}: Omit<ComponentProps<typeof JurisdictionSectionBase>, 'flag'> & { countryIso2: string }) {
  return <JurisdictionSectionBase {...props} flag={countryIso2} />
}

export {
  GeneticsSection,
  ClinicalSection,
  ComplianceSection,
  NetworkSection,
  FinancingSection,
} from './sections/DomainSections'
