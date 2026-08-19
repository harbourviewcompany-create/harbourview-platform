import type { ClinicalStructuredObject } from '@/lib/clinical/prescriber'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'
import type { ClinicalInteractionDTO, ClinicalInteractionState } from '@/lib/clinical/interactions'

export type ClinicalWorkspaceState = 'loaded' | 'empty' | 'review-required' | 'permission' | 'error'

export type ClinicalWorkspaceSafetyDTO = {
  id: string
  kind: 'contraindication' | 'precaution' | 'special-population' | 'interaction'
  subject: string
  severity: 'info' | 'caution' | 'major' | 'contraindicated' | 'unknown'
  rationale: string
  actionText: string | null
  primarySourceUrl: string
  sourceLocator: string
  reviewedAt: string | null
}

export type ClinicalWorkspaceRegimenDTO = {
  id: string
  formularyProductId: string
  formularySkuId: string | null
  jurisdiction: string
  population: string | null
  indication: string
  regimenStructured: ClinicalStructuredObject
  titrationStructured: ClinicalStructuredObject
  administrationInstructions: string[]
  monitoringRequirements: string[]
  stoppingRules: string[]
  primarySourceUrl: string
  sourceLocator: string
  sourceVersion: string | null
}

export type ClinicalWorkspaceMonitoringDTO = {
  id: string
  protocolName: string
  context: string
  cannabinoid: string | null
  jurisdiction: string | null
  baselineRequirements: string[]
  therapeuticObjectives: string[]
  efficacyMeasures: string[]
  safetyMeasures: string[]
  laboratoryMonitoring: string[]
  reassessmentSchedule: string[]
  stoppingRules: string[]
  primarySourceTitle: string
  primarySourceUrl: string
  sourceLocator: string
  verifiedAt: string
}

export type ClinicalWorkspaceGuidelineDTO = {
  id: string
  jurisdiction: string
  authority: string
  title: string
  recommendationText: string
  recommendationStrength: string | null
  population: string | null
  intervention: string | null
  outcome: string | null
  effectiveDate: string | null
  primarySourceUrl: string
  sourceLocator: string
}

export type ClinicalProfessionalAuthorityDTO = {
  state: 'loaded' | 'unknown' | 'permission' | 'error'
  verifiedClinician: boolean
  jurisdiction: string
  professional: {
    id: string
    fullName: string
    role: string | null
    licenceNumber: string | null
    licenceJurisdiction: string | null
    verificationStatus: string | null
  } | null
  capabilities: {
    recommend: boolean | null
    prescribe: boolean | null
    dispense: boolean | null
    claimAppropriateness: boolean | null
  }
  evidenceVersion: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  notes: string | null
  error?: string
}

export type ClinicalPrescriberWorkspaceDTO = {
  state: ClinicalWorkspaceState
  jurisdiction: string
  safety: ClinicalWorkspaceSafetyDTO[]
  regimens: ClinicalWorkspaceRegimenDTO[]
  monitoring: ClinicalWorkspaceMonitoringDTO[]
  guidelines: ClinicalWorkspaceGuidelineDTO[]
  interactions: ClinicalInteractionDTO[]
  interactionState: ClinicalInteractionState
  interactionProvenanceRejected: number
  formulary: FormularyProductDTO[]
  authority: ClinicalProfessionalAuthorityDTO
  diagnostics: string[]
}
