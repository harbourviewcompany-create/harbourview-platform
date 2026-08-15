export type EducationCommandView = 'now' | 'paths' | 'qualifications' | 'practice' | 'library'

export type EducationEvidenceState = 'current' | 'stale' | 'conflicting' | 'review_required' | 'unknown'

export type EducationGoal = 'learn' | 'market_access' | 'quality' | 'clinical' | 'regulatory'

export type EducationCommandModule = {
  id: string
  slug: string
  title: string
  description: string
  trackId: string
  trackLabel: string
  audience: string[]
  sensitivity: string
  updatedAt: string | null
  goal: EducationGoal
  roleMatch: boolean
  generalAudience: boolean
  jurisdictionMatch: boolean
  evidenceState: EducationEvidenceState
  reviewStatus: string | null
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  publicationConfidence: string | null
  controlledTopic: boolean
  overlayTopics: string[]
  overlayActionLabel: string | null
  sections: Array<{
    heading: string
    body: string
    blockType: string | null
  }>
}

export type EducationImpact = {
  id: string
  kind: 'regulatory_change' | 'signal'
  title: string
  whatChanged: string
  whyItMatters: string | null
  recommendedAction: string | null
  occurredAt: string | null
  sourceLabel: string | null
  confidence: number | null
  moduleSlug: string | null
  moduleMatchBasis: 'verified_overlay' | 'topic_match' | null
}

export type EducationCommandPath = {
  id: string
  title: string
  kind: 'education_track' | 'operational_pathway'
  description: string | null
  goal: EducationGoal
  modules: string[]
  steps: Array<{
    id: string
    order: number
    title: string
    description: string | null
    state: 'verified' | 'in_review' | 'pending' | 'rejected' | 'waived' | 'unknown'
    requirements: Array<{
      id: string
      title: string
      description: string | null
      evidenceType: string | null
      required: boolean
      state: 'verified' | 'in_review' | 'pending' | 'rejected' | 'waived' | 'unknown'
    }>
  }>
}

export type EducationPracticeItem = {
  id: string
  moduleSlug: string
  moduleTitle: string
  heading: string
  body: string
  kind: 'scenario' | 'exercise' | 'checklist' | 'assessment' | 'practice'
}

export type EducationCapabilityState = {
  learnerProgress: boolean
  assessmentAttempts: boolean
  qualificationRecords: boolean
  credentialRecords: boolean
  scenarioEngine: boolean
  teamQualificationMatrix: boolean
  organizationPathwayProgress: boolean
  explanation: string
}

export type EducationCommandResponse = {
  sourceState: 'loaded' | 'degraded' | 'empty'
  generatedAt: string
  context: {
    countryIso2: string
    countryLabel: string
    roleId: string | null
    roleLabel: string
    allRoles: boolean
  }
  impacts: EducationImpact[]
  paths: EducationCommandPath[]
  modules: EducationCommandModule[]
  practice: EducationPracticeItem[]
  capabilities: EducationCapabilityState
  limitations: string[]
}

const ROLE_ALIASES: Record<string, string[]> = {
  distributor_wholesaler: ['wholesaler_distributor'],
  wholesaler_distributor: ['distributor_wholesaler'],
}

export function moduleMatchesRole(audience: string[], roleId: string | null): boolean {
  if (!roleId) return true
  const accepted = new Set([roleId, ...(ROLE_ALIASES[roleId] ?? [])])
  return audience.some(value => accepted.has(value)) || audience.includes('general')
}

export function educationGoalForTrack(trackId: string): EducationGoal {
  const normalized = trackId.toLowerCase()
  if (normalized.includes('clinical')) return 'clinical'
  if (normalized.includes('quality') || normalized.includes('compliance') || normalized.includes('lab')) return 'quality'
  if (normalized.includes('regulatory')) return 'regulatory'
  if (normalized.includes('market') || normalized.includes('export') || normalized.includes('import') || normalized.includes('logistics')) return 'market_access'
  return 'learn'
}

export function educationEvidenceState(statuses: Array<string | null | undefined>): EducationEvidenceState {
  const normalized = statuses.filter((value): value is string => Boolean(value)).map(value => value.toLowerCase())
  if (normalized.some(value => value.includes('conflict'))) return 'conflicting'
  if (normalized.some(value => value.includes('stale'))) return 'stale'
  if (normalized.some(value => value.includes('review_required') || value.includes('review-required') || value.includes('review_pending') || value.includes('review-pending') || value.includes('legal_review') || value.includes('clinical_review'))) return 'review_required'
  if (normalized.some(value => value.startsWith('verified_') || value === 'published_source_backed' || value === 'approved' || value === 'published')) return 'current'
  return 'unknown'
}

export function practiceKind(heading: string): EducationPracticeItem['kind'] | null {
  const normalized = heading.toLowerCase()
  if (normalized.includes('scenario') || normalized.includes('case study')) return 'scenario'
  if (normalized.includes('exercise')) return 'exercise'
  if (normalized.includes('checklist')) return 'checklist'
  if (normalized.includes('assessment') || normalized.includes('quiz')) return 'assessment'
  if (normalized.includes('practice') || normalized.includes('how this plays out')) return 'practice'
  return null
}
