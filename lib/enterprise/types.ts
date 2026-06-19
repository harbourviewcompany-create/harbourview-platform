export type EcosystemVertical = {
  id: string
  name: string
  vertical_type: 'licensed_producer' | 'processor' | 'extractor' | 'importer' | 'distributor' | 'lab' | 'gmp_consultant' | 'qa_compliance' | 'packaging_supplier' | 'equipment_vendor' | 'logistics' | 'legal_compliance' | 'insurance' | 'financier' | 'ma_distressed' | 'market_access_partner' | 'route_to_market' | 'white_label' | 'service_provider'
  record_count: number
  markets_covered: string[]
  categories_covered: string[]
  high_value_count: number
  status: 'active' | 'building' | 'underbuilt'
}

export type OperatorWorkflowItem = {
  id: string
  title: string
  owner: string
  status: 'my_queue' | 'team_queue' | 'review' | 'approval' | 'follow_up' | 'handoff'
  priority: 'high' | 'medium' | 'low'
  market: string
  category: string
  due_date: string | null
  created_at: string
  notes: string
}

export type EnterpriseDealRoom = {
  id: string
  room_type: 'buyer_seller' | 'importer_introduction' | 'distributor_review' | 'market_access_review' | 'documentation_review' | 'equipment_surplus' | 'packaging_supplier' | 'services_coordination' | 'ma_distressed_asset'
  title: string
  participants: string[]
  market: string
  category: string
  status: 'active' | 'waiting_counterparty' | 'waiting_documents' | 'ready_for_intro' | 'stalled' | 'complete'
  next_action: string
  created_at: string
}

export type IntroPacket = {
  id: string
  packet_type: 'buyer_seller' | 'importer' | 'distributor' | 'supplier' | 'service_provider' | 'market_access' | 'equipment' | 'packaging_supplier'
  title: string
  counterparties: string[]
  market: string
  category: string
  fit_score: number
  trust_score: number
  documentation_status: 'complete' | 'partial' | 'missing'
  status: 'draft' | 'ready_for_review' | 'sent' | 'follow_up_needed' | 'outcome_captured'
  owner: string
  created_at: string
}

export type DocumentReadinessPacket = {
  id: string
  packet_category: 'coa' | 'licence' | 'gacp' | 'eu_gmp' | 'spec_sheet' | 'product_photos' | 'export_docs' | 'import_docs' | 'buyer_requirement' | 'seller_supply_package' | 'market_access_package' | 'distributor_review_package' | 'importer_review_package'
  title: string
  entity_label: string
  market: string
  status: 'ready' | 'missing_documents' | 'in_review' | 'approved'
  completeness_pct: number
  missing_items: string[]
  created_at: string
}

export type EnterpriseDashboardMetric = {
  id: string
  category: 'market_coverage' | 'category_coverage' | 'ecosystem_coverage' | 'operator_workload' | 'deal_velocity' | 'introduction_success' | 'document_readiness' | 'trust_reputation' | 'prediction_accuracy' | 'automation_throughput' | 'revenue_opportunity' | 'follow_up_load' | 'source_freshness' | 'network_growth'
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target: number
}

export type StrategicIntegrationPlaceholder = {
  id: string
  integration_category: 'email' | 'calendar' | 'document_storage' | 'crm_export' | 'regulatory_feeds' | 'web_crawlers' | 'secure_file_intake' | 'data_providers' | 'contact_enrichment' | 'spreadsheet' | 'notification' | 'task_project' | 'accounting'
  name: string
  description: string
  status: 'ready_to_connect' | 'in_development' | 'planned'
  data_flow: string
  priority: 'high' | 'medium' | 'low'
}

export type ReputationRecord = {
  id: string
  entity_label: string
  entity_type: 'counterparty' | 'ecosystem' | 'vertical'
  market: string
  category: string
  trust_score: number
  responsiveness: number
  document_quality: number
  intro_quality: number
  reliability: number
  relationship_value: number
  status: 'priority' | 'watch_carefully' | 'reengage_later' | 'standard'
}

export type DataFlywheelEvent = {
  id: string
  event_type: 'new_intake' | 'new_buyer_demand' | 'new_supply' | 'new_source' | 'new_signal' | 'new_document' | 'new_intro' | 'new_outcome' | 'new_relationship_note' | 'new_deal_movement' | 'new_pathway_review' | 'new_trust_update' | 'new_prediction_feedback'
  description: string
  impact: 'high' | 'medium' | 'low'
  market: string
  category: string
  dataset_enriched: string
  created_at: string
}

export type CommercialCoordinationWorkflow = {
  id: string
  workflow_type: 'supply_to_buyer' | 'buyer_demand_to_supplier' | 'source_signal_to_opportunity' | 'opportunity_to_intro_packet' | 'document_packet_to_market_access' | 'importer_need_to_supplier' | 'distributor_need_to_product' | 'equipment_lead_to_buyer' | 'stale_deal_reactivation' | 'prediction_to_operator_action'
  title: string
  market: string
  category: string
  status: 'ready_for_action' | 'waiting_counterparty' | 'waiting_documents' | 'ready_for_intro' | 'stalled' | 'complete'
  next_action: string
  owner: string
  created_at: string
}
