export type WatcherType =
  | 'licence_registry' | 'regulator_notice' | 'recall_safety'
  | 'importer_distributor' | 'buyer_demand' | 'supplier_directory'
  | 'equipment_surplus' | 'conference_exhibitor' | 'public_company_update'
  | 'packaging_supplier' | 'market_access_pathway' | 'manual_relationship'

export type WatcherStatus = 'active' | 'paused' | 'failed' | 'scheduled'

export interface IntelligenceWatcher {
  id: string; name: string; type: WatcherType; markets: string[]
  categories: string[]; status: WatcherStatus; lastRun: string
  nextRun: string; yieldCount: number; runCount: number; notes?: string
}

export type AdapterType =
  | 'registry' | 'regulator_page' | 'rss_feed' | 'sitemap'
  | 'structured_html' | 'pdf_notice' | 'table_extraction' | 'manual_source'
  | 'event_exhibitor' | 'auction_surplus' | 'supplier_directory'

export type AdapterHealth = 'healthy' | 'degraded' | 'error' | 'not_tested'

export interface SourceAdapterDefinition {
  id: string; name: string; type: AdapterType; health: AdapterHealth
  outputFormat: string; markets: string[]; lastOutput?: string; notes?: string
}

export type ExtractedSignalConfidence = 'high' | 'medium' | 'low' | 'uncertain'

export interface ExtractedCommercialSignal {
  id: string; watcherId: string; watcherName: string; title: string
  market: string; category: string; confidence: ExtractedSignalConfidence
  commercialImpact: 'high' | 'medium' | 'low'; extractedAt: string
  reviewStatus: 'pending' | 'accepted' | 'rejected' | 'escalated'; summary: string
}

export type AgentType =
  | 'source_watcher' | 'regulatory_signal' | 'market_analyst'
  | 'opportunity_qualifier' | 'document_reviewer' | 'buyer_seller_matcher'
  | 'importer_distributor_router' | 'counterparty_scoring' | 'follow_up'
  | 'public_card_generator' | 'deal_flow_copilot' | 'evidence_to_action'

export interface AgentQueueItem {
  id: string; agentType: AgentType; title: string; market: string; category: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'escalated' | 'deferred'
  suggestedAction: string; rationale: string; nextAction: string; createdAt: string
}

export interface ScoringUpdateSuggestion {
  id: string; counterpartyName: string; scoreType: string
  currentValue: number; suggestedValue: number; driver: string
  confidence: 'high' | 'medium' | 'low'; suggestedAt: string
  status: 'pending' | 'applied' | 'rejected'
}

export interface RelationshipMemoryUpdate {
  id: string; counterpartyName: string; updateType: string
  previousValue?: string; suggestedValue: string; source: string
  suggestedAt: string; status: 'pending' | 'applied' | 'rejected'
}

export interface PredictiveRoutingSuggestion {
  id: string; type: string; title: string; market: string; category: string
  confidenceScore: number; rationale: string; suggestedAction: string
  priority: 'urgent' | 'high' | 'medium' | 'low'; createdAt: string
}

export interface ExecutionAutomationTask {
  id: string; taskType: string; title: string; market: string; category: string
  status: 'ready' | 'waiting_on_docs' | 'waiting_on_counterparty' | 'completed' | 'deferred'
  priority: 'urgent' | 'high' | 'medium' | 'low'; dueDate?: string; notes?: string
}

export interface EvidenceActionTrigger {
  id: string; evidenceType: string; counterpartyName?: string
  triggerAction: string; market: string
  status: 'triggered' | 'pending' | 'completed'; triggeredAt: string
}

export interface AgentRunRecord {
  id: string; agentType: AgentType; watcherName?: string; runAt: string
  duration: string; status: 'success' | 'partial' | 'failed'
  signalsExtracted: number; tasksCreated: number; notes?: string
}
