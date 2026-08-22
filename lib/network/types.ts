export type NetworkReviewStatus = 'draft' | 'submitted' | 'under_review' | 'approved_public_summary' | 'rejected'

export type NetworkCountry = {
  id: string
  slug: string
  name: string
  publicSummary: string
  privateAnalystNotes?: string
}

export type PublicNetworkCountryDTO = Pick<NetworkCountry, 'id' | 'slug' | 'name' | 'publicSummary'>

export type NetworkCandidateKind = 'professional' | 'operator' | 'service_provider' | 'collaboration'
export type NetworkFitVerdict = 'meets' | 'partial' | 'blocked' | 'unknown'
export type NetworkDataState = 'live' | 'partial' | 'empty' | 'permission_required' | 'error'

/** Re-export P1-A introduction status union for DTO consumers. */
export type { NetworkIntroductionStatus } from './introductionStatus'

export type NetworkRequirementDTO = {
  id: string
  requirementType: string
  label: string
  description: string | null
  hardRequirement: boolean
  capabilityCode: string | null
  licenceActivity: string | null
  countryIso2: string | null
  expectedValue: Record<string, unknown>
  status: string
  sortOrder: number
}

export type NetworkMissionDTO = {
  id: string
  name: string
  objective: string
  status: string
  countryIso2: string | null
  targetCountryIso2s: string[]
  targetDate: string | null
  confidentiality: 'workspace' | 'restricted'
  requirements: NetworkRequirementDTO[]
  createdAt: string
  updatedAt: string
}

export type NetworkLicenceDTO = {
  licenceClass: string | null
  issuingRegulator: string | null
  authorizedActivities: string[]
  status: 'active'
  gmpCertified: boolean | null
  gacpCertified: boolean | null
  facilityCity: string | null
  facilityProvinceState: string | null
  lastVerifiedAt: string | null
}

export type NetworkRelationshipDTO = {
  state: 'recorded' | 'no_recorded_relationship'
  interactionCount: number
  lastInteractionAt: string | null
  lastOutcome: string | null
}

export type NetworkWatchDTO = {
  watched: boolean
  watchId: string | null
}

export type NetworkIntroductionSummaryDTO = {
  introductionId: string | null
  status: string | null
}

export type NetworkFitDTO = {
  verdict: NetworkFitVerdict
  satisfiedCount: number
  totalRequirements: number
  satisfied: string[]
  blocked: string[]
  unknown: string[]
}

export type NetworkCandidateDTO = {
  id: string
  entityId: string | null
  sourceKind: string
  sourceId: string
  kind: NetworkCandidateKind
  name: string
  subtitle: string | null
  countryIso2: string | null
  jurisdictionLabel: string | null
  capabilities: string[]
  verificationStatus: string
  lastVerifiedAt: string | null
  summary: string | null
  availability: {
    referrals: boolean | null
    consultation: boolean | null
  } | null
  licences: NetworkLicenceDTO[]
  relationship: NetworkRelationshipDTO
  watch: NetworkWatchDTO
  introduction: NetworkIntroductionSummaryDTO
  fit: NetworkFitDTO
  evidenceSummary: Array<{
    label: string
    status: string
    verifiedAt: string | null
  }>
  unknowns: string[]
  warnings: string[]
  availableActions: Array<'view' | 'watch' | 'unwatch' | 'request_introduction' | 'log_interaction' | 'advance_introduction'>
}

export type NetworkCoverageDTO = {
  professionals: number
  serviceProviders: number
  licensedOperators: number
  collaborations: number
  totalCandidates: number
  unresolvedIdentityCount: number
}

export type NetworkActivityDTO = {
  id: string
  kind: 'interaction' | 'introduction'
  subjectId: string | null
  summary: string
  status: string | null
  occurredAt: string
}

export type NetworkCommandDTO = {
  version: 'network-command-p0'
  context: {
    countryIso2: string | null
    roleId: string | null
    workspaceId: string | null
    hasActiveWorkspace: boolean
  }
  permissions: {
    canCreateMission: boolean
    canWatch: boolean
    canRequestIntroduction: boolean
    canLogInteraction: boolean
  }
  dataState: NetworkDataState
  dataWarnings: string[]
  missions: NetworkMissionDTO[]
  activeMissionId: string | null
  candidates: NetworkCandidateDTO[]
  coverage: NetworkCoverageDTO
  activity: NetworkActivityDTO[]
}

export type NetworkSourceCandidate = Omit<
  NetworkCandidateDTO,
  'relationship' | 'watch' | 'introduction' | 'fit' | 'availableActions'
>

export type NetworkInteractionRecord = {
  id: string
  entityId: string | null
  sourceKind: string | null
  sourceId: string | null
  occurredAt: string
  summary: string
  outcome: string | null
}

export type NetworkIntroductionRecord = {
  id: string
  targetEntityId: string | null
  targetSourceKind: string | null
  targetSourceId: string | null
  status: string
  updatedAt: string
}

export type NetworkWatchRecord = {
  id: string
  refId: string | null
  watchStatus: string
}
