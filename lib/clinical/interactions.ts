export type ClinicalInteractionState = 'loaded' | 'empty' | 'review-required' | 'fixture' | 'error'

export type ClinicalInteractionDTO = {
  id: string
  medicationIngredient: string
  cannabinoid: string
  mechanism: string | null
  clinicalSignificance: 'minor' | 'moderate' | 'major' | 'unknown'
  evidenceCertainty: 'high' | 'moderate' | 'low' | 'very-low' | 'ungraded' | 'conflicted'
  uncertainty: string | null
  monitoringConsideration: string | null
  primarySourceTitle: string
  primarySourceUrl: string
  sourceLocator: string | null
  verifiedAt: string
  provenanceState: 'inspectable'
}

export type ClinicalInteractionQueryResult = {
  state: ClinicalInteractionState
  interactions: ClinicalInteractionDTO[]
  rejectedForProvenance: number
  error?: string
}
