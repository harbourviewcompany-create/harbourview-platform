export type CommercialStage =
  | 'new_intake'
  | 'review'
  | 'qualified'
  | 'docs_requested'
  | 'docs_received'
  | 'buyer_matched'
  | 'intro_proposed'
  | 'intro_sent'
  | 'in_discussion'
  | 'won'
  | 'lost'
  | 'dormant'

export type CommercialCategory =
  | 'buyer_demand'
  | 'supplier_pipeline'
  | 'market_access'
  | 'equipment_surplus'
  | 'importer_distributor'
  | 'documentation'
  | 'relationship'
  | 'routing'

export type FixtureConfidence = 'low' | 'medium' | 'high'

export type CommercialSignal = {
  id: string
  type: CommercialCategory
  market: string
  category: string
  confidence: FixtureConfidence
  summary: string
  relatedPathway: string
  relatedCounterparty: string
  nextAction: string
  reviewStatus: 'needs_review' | 'converted' | 'watching'
}

export type SourcingIntake = {
  id: string
  source: string
  category: CommercialCategory
  market: string
  status: 'raw_intake' | 'review' | 'qualified' | 'opportunity_candidate' | 'rejected'
  summary: string
  conversionActions: string[]
}

export type CommercialOpportunity = {
  id: string
  title: string
  stage: CommercialStage
  category: CommercialCategory
  market: string
  summary: string
  relatedCounterparties: string[]
  relatedDocuments: string[]
  relatedPathway: string
  suggestedNextAction: string
  publicCardCandidate: boolean
  updatedLabel: string
}

export type CommercialCounterparty = {
  id: string
  name: string
  counterpartyType: 'buyer' | 'seller' | 'importer' | 'distributor' | 'supplier' | 'service_provider' | 'equipment_vendor' | 'packaging_supplier' | 'logistics_partner' | 'market_access_partner'
  marketsCovered: string[]
  acceptedFormats: string[]
  documentationRequirements: string[]
  relationshipStage: string
  lastContact: string
  nextAction: string
  links: Array<{ label: string; relationship: string }>
}

export type ConfidentialIntroduction = {
  id: string
  match: string
  opportunity: string
  pathway: string
  fitScore: number
  status: 'request_access' | 'qualify_counterparty' | 'match_opportunity' | 'review_docs' | 'approved' | 'intro_sent' | 'follow_up' | 'outcome'
  nextAction: string
  summary: string
}

export type DealFlowItem = {
  id: string
  title: string
  category: CommercialCategory
  market: string
  stage: CommercialStage
  relatedCounterparties: string[]
  nextAction: string
  updatedLabel: string
}

export type DocumentPacket = {
  id: string
  title: string
  packetType: 'coa' | 'licence' | 'gacp' | 'eu_gmp' | 'spec_sheet' | 'photos' | 'export_docs' | 'import_docs' | 'buyer_requirements'
  requiredItems: string[]
  receivedItems: string[]
  missingItems: string[]
  readinessStatus: 'missing_documents' | 'ready_for_review' | 'complete'
  relatedOpportunity: string
  relatedCounterparty: string
  nextAction: string
}

export type CommercialRoutingSuggestion = {
  id: string
  suggestionType: 'match' | 'pathway' | 'missing_document' | 'cta_destination' | 'importer_distributor_category' | 'follow_up_priority' | 'public_card_candidate' | 'intro_candidate' | 'route_to_market'
  title: string
  rationale: string
  priority: 'low' | 'medium' | 'high'
  destination: string
  internalNextAction: string
}
