export type ProprietaryDataset = {
  id: string
  name: string
  category: 'counterparty' | 'buyer_demand' | 'seller_supply' | 'importer_distributor' | 'market_pathway' | 'documentation' | 'evidence' | 'signals' | 'source_reliability' | 'introduction_outcomes' | 'deal_flow' | 'relationship_memory' | 'commercial_response' | 'category_coverage' | 'market_coverage'
  record_count: number
  freshness_days: number
  coverage_markets: string[]
  coverage_categories: string[]
  last_updated: string
  completeness_pct: number
  status: 'active' | 'building' | 'stale' | 'gap'
}

export type ReinforcementEvent = {
  id: string
  event_type: 'buyer_responded' | 'buyer_ignored' | 'seller_responded' | 'seller_ignored' | 'docs_requested' | 'docs_received' | 'docs_incomplete' | 'intro_proposed' | 'intro_accepted' | 'intro_rejected' | 'intro_sent' | 'deal_moved_forward' | 'deal_stalled' | 'deal_won' | 'deal_lost' | 'market_pathway_validated' | 'market_pathway_blocked' | 'relationship_upgraded' | 'relationship_downgraded'
  entity_type: string
  entity_label: string
  market: string
  category: string
  score_impact: number
  created_at: string
  operator: string
}

export type CommercialPrediction = {
  id: string
  prediction_type: 'buyer_seller_fit' | 'importer_fit' | 'distributor_fit' | 'market_pathway_fit' | 'deal_probability' | 'response_probability' | 'documentation_readiness' | 'urgency' | 'market_timing' | 'next_best_action' | 'stale_deal_reactivation'
  entity_label: string
  market: string
  category: string
  confidence_score: number
  predicted_value: string
  supporting_factors: string[]
  created_at: string
  status: 'active' | 'expired' | 'validated' | 'invalidated'
}

export type RelationshipTrustScore = {
  id: string
  entity_label: string
  entity_type: 'buyer' | 'seller' | 'importer' | 'distributor' | 'service_provider' | 'advisor'
  market: string
  category: string
  trust_score: number
  responsiveness: number
  document_quality: number
  intro_success: number
  commercial_reliability: number
  relationship_strength: number
  status: 'priority' | 'watch' | 'reengage' | 'standard'
  last_interaction: string
}

export type AICopilotTask = {
  id: string
  copilot: 'sourcing' | 'market_access' | 'deal_flow' | 'document_readiness' | 'counterparty_research' | 'intro_packet' | 'follow_up' | 'public_listing' | 'prediction' | 'operator_command'
  title: string
  summary: string
  market: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'ready' | 'in_progress' | 'pending_review' | 'complete'
  created_at: string
}

export type AutonomousExecutionQueueItem = {
  id: string
  queue_type: 'document_request_draft' | 'intro_brief_draft' | 'buyer_seller_summary' | 'public_listing_draft' | 'follow_up_task' | 'deal_stage_update' | 'stale_opportunity_reactivation' | 'market_access_review_packet' | 'importer_distributor_review_packet' | 'evidence_enrichment' | 'relationship_reactivation'
  title: string
  entity_label: string
  market: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'ready_to_execute' | 'draft_pending_review' | 'follow_up_due' | 'complete'
  due_date: string | null
  created_at: string
}

export type OperatorCommandItem = {
  id: string
  command_type: 'highest_value_action' | 'best_buyer_seller_match' | 'best_importer_match' | 'deal_likely_to_move' | 'missing_document' | 'stale_deal_reactivation' | 'counterparty_to_contact' | 'new_signal' | 'public_card_to_publish' | 'market_access_review' | 'trust_change' | 'prediction_change' | 'follow_up_due'
  title: string
  description: string
  market: string
  category: string
  urgency: 'today' | 'this_week' | 'when_possible'
  entity_label: string
  action_label: string
  created_at: string
}

export type InstitutionalWorkflowRecord = {
  id: string
  title: string
  workflow_steps: {
    key: string
    label: string
    completed: boolean
  }[]
  completeness_pct: number
  market: string
  category: string
  status: 'review_ready' | 'incomplete' | 'approved' | 'flagged'
  analyst_notes: string
  created_at: string
}

export type StrategicDashboardMetric = {
  id: string
  metric_type: 'market_coverage' | 'category_coverage' | 'source_coverage' | 'counterparty_coverage' | 'pathway_coverage' | 'relationship_strength' | 'deal_velocity' | 'intelligence_freshness' | 'prediction_confidence' | 'response_rate' | 'introduction_success' | 'documentation_readiness' | 'revenue_opportunity' | 'follow_up_load' | 'automation_throughput'
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target: number
  market: string | null
}
