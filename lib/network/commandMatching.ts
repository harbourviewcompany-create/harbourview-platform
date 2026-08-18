import type {
  NetworkCandidateDTO,
  NetworkFitDTO,
  NetworkMissionDTO,
  NetworkRequirementDTO,
  NetworkSourceCandidate,
} from './types'

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function expectedString(requirement: NetworkRequirementDTO, keys: string[]): string | null {
  for (const key of keys) {
    const value = requirement.expectedValue[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

type RequirementResult = 'meets' | 'blocked' | 'unknown'

export function evaluateNetworkRequirement(
  candidate: NetworkSourceCandidate,
  requirement: NetworkRequirementDTO,
): RequirementResult {
  if (requirement.status !== 'active') return 'meets'

  const type = normalize(requirement.requirementType)

  if (type === 'jurisdiction' || type === 'country') {
    const requiredCountry = normalize(requirement.countryIso2 ?? expectedString(requirement, ['countryIso2', 'country', 'value']))
    if (!requiredCountry) return 'unknown'
    if (!candidate.countryIso2) return 'unknown'
    return normalize(candidate.countryIso2) === requiredCountry ? 'meets' : 'blocked'
  }

  if (type === 'candidate_kind' || type === 'entity_kind' || type === 'kind') {
    const requiredKind = normalize(expectedString(requirement, ['kind', 'entityKind', 'value']))
    if (!requiredKind) return 'unknown'
    return normalize(candidate.kind) === requiredKind ? 'meets' : 'blocked'
  }

  if (type === 'capability') {
    const requiredCapability = normalize(
      requirement.capabilityCode ?? expectedString(requirement, ['capability', 'capabilityCode', 'value']),
    )
    if (!requiredCapability) return 'unknown'
    return candidate.capabilities.some(capability => normalize(capability) === requiredCapability)
      ? 'meets'
      : 'unknown'
  }

  if (type === 'licence_activity' || type === 'license_activity') {
    const requiredActivity = normalize(
      requirement.licenceActivity ?? expectedString(requirement, ['licenceActivity', 'licenseActivity', 'activity', 'value']),
    )
    if (!requiredActivity) return 'unknown'
    const activities = candidate.licences.flatMap(licence => licence.authorizedActivities).map(normalize)
    if (activities.length === 0) return 'unknown'
    return activities.includes(requiredActivity) ? 'meets' : 'unknown'
  }

  if (type === 'gmp' || type === 'gmp_certified') {
    if (candidate.licences.length === 0) return 'unknown'
    if (candidate.licences.some(licence => licence.gmpCertified === true)) return 'meets'
    if (candidate.licences.every(licence => licence.gmpCertified === false)) return 'blocked'
    return 'unknown'
  }

  if (type === 'gacp' || type === 'gacp_certified') {
    if (candidate.licences.length === 0) return 'unknown'
    if (candidate.licences.some(licence => licence.gacpCertified === true)) return 'meets'
    if (candidate.licences.every(licence => licence.gacpCertified === false)) return 'blocked'
    return 'unknown'
  }

  if (type === 'consultation_available') {
    if (!candidate.availability) return 'unknown'
    if (candidate.availability.consultation === true) return 'meets'
    if (candidate.availability.consultation === false) return 'blocked'
    return 'unknown'
  }

  if (type === 'accepts_referrals') {
    if (!candidate.availability) return 'unknown'
    if (candidate.availability.referrals === true) return 'meets'
    if (candidate.availability.referrals === false) return 'blocked'
    return 'unknown'
  }

  return 'unknown'
}

export function evaluateNetworkFit(
  candidate: NetworkSourceCandidate,
  mission: NetworkMissionDTO | null,
): NetworkFitDTO {
  const requirements = (mission?.requirements ?? []).filter(requirement => requirement.status === 'active')
  if (requirements.length === 0) {
    return {
      verdict: 'unknown',
      satisfiedCount: 0,
      totalRequirements: 0,
      satisfied: [],
      blocked: [],
      unknown: [],
    }
  }

  const satisfied: string[] = []
  const blocked: string[] = []
  const unknown: string[] = []

  for (const requirement of requirements) {
    const result = evaluateNetworkRequirement(candidate, requirement)
    if (result === 'meets') satisfied.push(requirement.label)
    else if (result === 'blocked') blocked.push(requirement.label)
    else unknown.push(requirement.label)
  }

  const hardBlocked = requirements.some(requirement =>
    requirement.hardRequirement
    && blocked.includes(requirement.label),
  )

  const verdict: NetworkFitDTO['verdict'] = hardBlocked
    ? 'blocked'
    : satisfied.length === requirements.length
      ? 'meets'
      : satisfied.length > 0
        ? 'partial'
        : 'unknown'

  return {
    verdict,
    satisfiedCount: satisfied.length,
    totalRequirements: requirements.length,
    satisfied,
    blocked,
    unknown,
  }
}

export function attachNetworkFit(
  candidate: Omit<NetworkCandidateDTO, 'fit'>,
  mission: NetworkMissionDTO | null,
): NetworkCandidateDTO {
  return {
    ...candidate,
    fit: evaluateNetworkFit(candidate, mission),
  }
}

export function sortNetworkCandidates(candidates: NetworkCandidateDTO[]): NetworkCandidateDTO[] {
  const verdictRank: Record<NetworkCandidateDTO['fit']['verdict'], number> = {
    meets: 0,
    partial: 1,
    unknown: 2,
    blocked: 3,
  }

  return candidates.slice().sort((a, b) => {
    const verdictDelta = verdictRank[a.fit.verdict] - verdictRank[b.fit.verdict]
    if (verdictDelta !== 0) return verdictDelta
    const satisfiedDelta = b.fit.satisfiedCount - a.fit.satisfiedCount
    if (satisfiedDelta !== 0) return satisfiedDelta
    const verifiedA = normalize(a.verificationStatus).includes('verified') ? 1 : 0
    const verifiedB = normalize(b.verificationStatus).includes('verified') ? 1 : 0
    if (verifiedA !== verifiedB) return verifiedB - verifiedA
    return a.name.localeCompare(b.name)
  })
}
