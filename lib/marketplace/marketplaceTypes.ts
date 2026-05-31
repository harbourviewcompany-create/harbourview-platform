export type MarketplaceCategoryKey =
  | 'consumables'
  | 'packaging'
  | 'new_products'
  | 'used_surplus'
  | 'cultivation_equipment'
  | 'processing_equipment'
  | 'lab_testing'
  | 'logistics'
  | 'services'
  | 'professional_services'
  | 'distressed_inventory'
  | 'distressed_businesses'
  | 'business_opportunities'
  | 'export_ready'
  | 'import_demand'
  | 'cannabis_inventory'
  | 'genetics'
  | 'wanted_requests'
  | 'qualified_access'
  | 'education'

export type MarketplaceSection =
  | 'supply'
  | 'equipment'
  | 'used_surplus'
  | 'distressed'
  | 'services'
  | 'trade'
  | 'wanted'
  | 'education'
  | 'qualified_access'

export type MarketplaceListingTypeKey =
  | 'new_product'
  | 'used_surplus_equipment'
  | 'cannabis_inventory'
  | 'wanted_request'
  | 'service'
  | 'business_opportunity'
  | 'featured_network_opportunity'
  | 'consumables'
  | 'cultivation_equipment'
  | 'processing_equipment'
  | 'distressed_inventory'
  | 'distressed_businesses'
  | 'genetics_program'
  | 'qualified_access_request'
  | 'education_resource'

export type MarketplaceRecordType =
  | 'equipment'
  | 'consumable'
  | 'service'
  | 'education'
  | 'distressed_asset'
  | 'used_equipment'
  | 'supplier'
  | 'partner'
  | 'software'
  | 'data_signal'
  | 'buyer_demand_signal'
  | 'source_only'

export type MarketplaceVisibilityMode = 'public_allowed' | 'teaser_only' | 'private_gated' | 'admin_only'

export type MarketplaceMonetizationPath =
  | 'seller_commission'
  | 'buyer_sourcing_mandate'
  | 'referral_fee'
  | 'success_fee'
  | 'quote_routing'
  | 'supplier_directory_onboarding'
  | 'auction_screening'
  | 'distressed_asset_mandate'
  | 'service_provider_referral'
  | 'education_to_introduction'
  | 'manual_review'

export type PublicMarketplaceListing = {
  id: string
  slug: string | null
  title: string
  description: string
  category: string
  subcategory?: string | null
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  location_country: string | null
  location_region?: string | null
  price_amount?: number | null
  price_currency: string
  price_display?: string | null
  seller_type: string
  is_featured: boolean
  high_level_specs: Record<string, unknown>
  created_at: string
}

export type PrivateMarketplaceListing = PublicMarketplaceListing & {
  public_summary?: string | null
  summary?: string | null
  private_specs?: Record<string, unknown>
  source_url?: string | null
  source_name?: string | null
  seller_contact_private?: string | null
  seller_url_private?: string | null
  seller_name_private?: string | null
  evidence_summary_private?: string | null
  internal_notes?: string | null
  confidence_score?: number | null
  commercial_relevance_score?: number | null
  compliance_risk_score?: number | null
  next_operator_action?: string | null
}
