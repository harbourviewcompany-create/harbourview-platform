export type MonetizationAccessProduct = {
  id: string
  product_type: 'qualified_buyer_access' | 'seller_listing_intake' | 'market_access_review' | 'importer_introduction' | 'distributor_introduction' | 'documentation_readiness_review' | 'intelligence_subscription' | 'enterprise_operator_seat' | 'deal_room_access' | 'partner_directory_access' | 'market_brief_access' | 'custom_opportunity_memo' | 'success_fee_introduction'
  name: string
  description: string
  price_usd: number | null
  delivery_workflow: string
  eligibility_criteria: string[]
  linked_ctas: string[]
  revenue_potential: 'high' | 'medium' | 'low'
  conversion_funnel: string
  status: 'active' | 'in_development' | 'planned'
}

export type PartnerEcosystemRecord = {
  id: string
  partner_type: 'importer' | 'distributor' | 'gmp_consultant' | 'lab' | 'legal_compliance' | 'logistics' | 'packaging_supplier' | 'equipment_vendor' | 'insurer' | 'financier' | 'ma_advisor' | 'country_market_advisor' | 'white_label' | 'route_to_market' | 'data_intelligence' | 'enterprise_client'
  name: string
  markets: string[]
  categories: string[]
  relationship_stage: 'identified' | 'contacted' | 'engaged' | 'active' | 'strategic'
  opportunity_mapping: string[]
  status: 'active' | 'prospective' | 'inactive'
}

export type RevenueIntelligenceItem = {
  id: string
  revenue_type: 'access_product' | 'market_access_review' | 'importer_introduction' | 'distributor_introduction' | 'deal_room' | 'intelligence_subscription' | 'enterprise_seat' | 'success_fee' | 'partner_referral' | 'stale_opportunity'
  title: string
  entity_label: string
  market: string
  category: string
  expected_revenue: number
  estimated_deal_value: number
  success_fee_potential: number
  conversion_probability: number
  stage: 'identified' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  next_action: string
  owner: string
  created_at: string
}

export type InstitutionalReport = {
  id: string
  report_type: 'market_brief' | 'buyer_demand_report' | 'market_pathway_report' | 'counterparty_brief' | 'opportunity_memo' | 'document_readiness_summary' | 'deal_flow_report' | 'executive_dashboard' | 'partner_ecosystem_report' | 'source_freshness_report' | 'intelligence_coverage_report' | 'revenue_opportunity_report'
  title: string
  market: string
  category: string
  status: 'draft' | 'ready_for_review' | 'published' | 'shared'
  completeness_pct: number
  sections: string[]
  created_at: string
  last_updated: string
}

export type GlobalExpansionCoverage = {
  id: string
  market: string
  region: string
  pathway_coverage: number
  partner_coverage: number
  buyer_demand_coverage: number
  supply_relevance: number
  documentation_requirements: string[]
  source_coverage: number
  signal_freshness_days: number
  route_to_market_readiness: 'ready' | 'partial' | 'building' | 'gap'
  revenue_potential: 'high' | 'medium' | 'low'
  priority: 'tier_1' | 'tier_2' | 'tier_3'
}

export type GovernanceQualityItem = {
  id: string
  quality_dimension: 'source_confidence' | 'evidence_quality' | 'report_readiness' | 'analyst_review' | 'operator_approval' | 'recommendation_status' | 'outcome_capture' | 'score_update_history' | 'data_freshness' | 'partner_quality' | 'document_readiness' | 'report_quality' | 'commercial_action_status'
  title: string
  entity_label: string
  market: string
  score: number
  status: 'approved' | 'pending_review' | 'flagged' | 'incomplete'
  reviewer: string
  created_at: string
}

export type SuccessFeeOpportunity = {
  id: string
  title: string
  entity_label: string
  market: string
  category: string
  fee_basis: string
  estimated_fee: number
  deal_value: number
  probability: number
  status: 'identified' | 'tracking' | 'negotiating' | 'closed_won' | 'closed_lost'
  owner: string
  created_at: string
}

export type SubscriptionTier = {
  id: string
  name: string
  tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  price_usd: number
  billing_period: 'monthly' | 'annual'
  features: string[]
  markets_included: string[]
  status: 'active' | 'draft' | 'deprecated'
  subscriber_count: number
}
