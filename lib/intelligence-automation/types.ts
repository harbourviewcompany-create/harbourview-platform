export type SourceCategory =
  | 'cannabis_licence_database'
  | 'importer_distributor_list'
  | 'regulator_updates'
  | 'government_notices'
  | 'recall_safety'
  | 'public_company_updates'
  | 'conference_exhibitor'
  | 'auction_surplus'
  | 'equipment_supplier'
  | 'packaging_supplier'
  | 'service_provider'
  | 'buyer_demand'
  | 'manual_relationship'

export type SourceReliability = 'high' | 'medium' | 'low' | 'unverified'
export type SourceStatus = 'active' | 'paused' | 'needs_review' | 'deprecated'

export interface AutomationSource {
  id: string
  name: string
  category: SourceCategory
  markets: string[]
  reliability: SourceReliability
  lastChecked: string
  nextCheck: string
  signalYield: number
  status: SourceStatus
  notes?: string
}

export type SignalType =
  | 'regulatory_change'
  | 'licence_change'
  | 'importer_activity'
  | 'distributor_activity'
  | 'buyer_demand'
  | 'seller_supplier_activity'
  | 'facility_expansion'
  | 'new_product_category'
  | 'equipment_surplus'
  | 'recall_safety'
  | 'pricing_availability'
  | 'documentation_readiness'
  | 'market_entry_opportunity'
  | 'relationship_opportunity'
  | 'distressed_asset'

export type SignalStage =
  | 'new'
  | 'needs_review'
  | 'qualified'
  | 'converted_to_opportunity'
  | 'linked_to_counterparty'
  | 'linked_to_market_pathway'
  | 'archived'

export interface AutomationSignal {
  id: string
  title: string
  type: SignalType
  stage: SignalStage
  sourceId: string
  sourceName: string
  market: string
  category: string
  confidence: number
  commercialImpact: 'high' | 'medium' | 'low'
  summary: string
  detectedAt: string
  reviewedAt?: string
}

export type CounterpartyRole =
  | 'buyer'
  | 'seller'
  | 'importer'
  | 'distributor'
  | 'supplier'
  | 'consultant'
  | 'equipment_vendor'
  | 'packaging_supplier'
  | 'logistics_provider'
  | 'market_access_partner'

export interface RelationshipMemoryRecord {
  id: string
  name: string
  role: CounterpartyRole
  markets: string[]
  categories: string[]
  needsProfile?: string
  supplyProfile?: string
  interactionCount: number
  lastInteraction: string
  introductionCount: number
  documentationStatus: 'complete' | 'partial' | 'missing'
  notes?: string
}

export interface ScoringRecord {
  id: string
  counterpartyId: string
  counterpartyName: string
  counterpartyRole: CounterpartyRole
  fitScore: number
  readinessScore: number
  trustScore: number
  routingPriority: 'high' | 'medium' | 'low'
  followUpPriority: 'urgent' | 'soon' | 'when_ready' | 'dormant'
  introductionPriority: 'high' | 'medium' | 'low' | 'not_ready'
  marketAccessRelevance: string[]
  scoredAt: string
  scoreDrivers: string[]
}

export type AgentQueueType =
  | 'source_watcher'
  | 'signal_analyst'
  | 'opportunity_qualifier'
  | 'document_reviewer'
  | 'buyer_seller_matcher'
  | 'importer_distributor_router'
  | 'follow_up_assistant'
  | 'public_card_generator'
  | 'deal_flow_copilot'

export type AgentTaskStatus = 'pending' | 'in_progress' | 'completed' | 'escalated' | 'deferred'

export interface AgentWorkItem {
  id: string
  queue: AgentQueueType
  title: string
  objectType: string
  objectLabel: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  suggestedAction: string
  rationale: string
  status: AgentTaskStatus
  agentLabel: string
  nextAction: string
  createdAt: string
}

export type EvidenceType =
  | 'coa'
  | 'licence_document'
  | 'gacp_document'
  | 'eu_gmp_document'
  | 'product_photo'
  | 'spec_sheet'
  | 'export_document'
  | 'import_document'
  | 'source_screenshot'
  | 'regulator_notice'
  | 'meeting_note'
  | 'email_note'
  | 'commercial_note'
  | 'counterparty_note'

export interface EvidenceVaultEntry {
  id: string
  title: string
  type: EvidenceType
  linkedCounterpartyName?: string
  linkedMarket?: string
  reviewStatus: 'pending' | 'reviewed' | 'needs_action' | 'archived'
  addedAt: string
  tags: string[]
  notes?: string
}

export type GraphEntityType =
  | 'market'
  | 'country'
  | 'pathway'
  | 'opportunity'
  | 'signal'
  | 'counterparty'
  | 'buyer'
  | 'seller'
  | 'importer'
  | 'distributor'
  | 'supplier'
  | 'service_provider'
  | 'consultant'
  | 'document_packet'
  | 'category'
  | 'source'

export interface GraphEntity {
  id: string
  type: GraphEntityType
  label: string
  market?: string
  category?: string
  connectionCount: number
  signalCount: number
  lastActivity?: string
}

export type GraphEdgeType =
  | 'active_in'
  | 'supplies'
  | 'buys'
  | 'imports_to'
  | 'exports_from'
  | 'distributes_in'
  | 'requires_document'
  | 'has_evidence'
  | 'generated_signal'
  | 'relevant_to_market'
  | 'matched_to'
  | 'introduced_to'
  | 'converted_to_opportunity'
  | 'belongs_to_pathway'
  | 'scored_for'
  | 'resulted_in'

export interface GraphEdge {
  id: string
  type: GraphEdgeType
  fromLabel: string
  toLabel: string
  strength: 'strong' | 'medium' | 'weak'
  evidenced: boolean
  createdAt: string
}

export type FeedbackOutcome =
  | 'ignored'
  | 'reviewed'
  | 'qualified'
  | 'docs_requested'
  | 'docs_received'
  | 'buyer_passed'
  | 'seller_passed'
  | 'unresponsive'
  | 'intro_proposed'
  | 'intro_sent'
  | 'in_discussion'
  | 'won'
  | 'lost'
  | 'dormant'
  | 'valuable_relationship'
  | 'weak_fit'
  | 'needs_future_follow_up'
  | 'converted_to_opportunity'

export interface FeedbackEvent {
  id: string
  outcomeType: FeedbackOutcome
  counterpartyName?: string
  market: string
  category: string
  scoreImpact: 'positive' | 'negative' | 'neutral'
  routingImpact: string
  notes?: string
  loggedAt: string
}

