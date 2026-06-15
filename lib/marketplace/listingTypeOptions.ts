export const MARKETPLACE_LISTING_TYPE_OPTIONS = [
  'New Product',
  'Used / Surplus Equipment',
  'Cannabis Inventory',
  'Wanted Request',
  'Service',
  'Business Opportunity',
  'Featured Network Opportunity',
  'Consumables',
  'Cultivation Equipment',
  'Processing Equipment',
  'Distressed Inventory',
  'Distressed Businesses',
  'Genetics Program',
  'Qualified Access Request',
  'Education Resource',
  // Vision-plan additions
  'Licensing Opportunity',
  'Facility / Real Estate',
  'Technology & Software',
  'Investment Opportunity',
  'Research Asset',
] as const

export type MarketplaceListingTypeOption = (typeof MARKETPLACE_LISTING_TYPE_OPTIONS)[number]

const LISTING_TYPE_ALIASES: Record<string, MarketplaceListingTypeOption> = {
  new: 'New Product',
  new_product: 'New Product',
  new_products: 'New Product',
  product: 'New Product',
  products: 'New Product',
  used: 'Used / Surplus Equipment',
  used_surplus: 'Used / Surplus Equipment',
  surplus: 'Used / Surplus Equipment',
  equipment: 'Used / Surplus Equipment',
  cannabis: 'Cannabis Inventory',
  cannabis_inventory: 'Cannabis Inventory',
  inventory: 'Cannabis Inventory',
  wanted: 'Wanted Request',
  wanted_request: 'Wanted Request',
  service: 'Service',
  services: 'Service',
  business: 'Business Opportunity',
  business_opportunity: 'Business Opportunity',
  business_opportunities: 'Business Opportunity',
  featured: 'Featured Network Opportunity',
  featured_network_opportunity: 'Featured Network Opportunity',
  consumable: 'Consumables',
  consumables: 'Consumables',
  cultivation: 'Cultivation Equipment',
  cultivation_equipment: 'Cultivation Equipment',
  processing: 'Processing Equipment',
  processing_equipment: 'Processing Equipment',
  distressed: 'Distressed Inventory',
  distressed_inventory: 'Distressed Inventory',
  distressed_business: 'Distressed Businesses',
  distressed_businesses: 'Distressed Businesses',
  genetics: 'Genetics Program',
  genetics_program: 'Genetics Program',
  qualified: 'Qualified Access Request',
  qualified_access: 'Qualified Access Request',
  qualified_access_request: 'Qualified Access Request',
  education: 'Education Resource',
  education_resource: 'Education Resource',
  // Vision-plan aliases
  licensing: 'Licensing Opportunity',
  licensing_opportunity: 'Licensing Opportunity',
  licensing_opportunities: 'Licensing Opportunity',
  facility: 'Facility / Real Estate',
  real_estate: 'Facility / Real Estate',
  real_estate_facility: 'Facility / Real Estate',
  real_estate_facilities: 'Facility / Real Estate',
  technology: 'Technology & Software',
  tech: 'Technology & Software',
  software: 'Technology & Software',
  technology_software: 'Technology & Software',
  investment: 'Investment Opportunity',
  investment_opportunity: 'Investment Opportunity',
  investment_opportunities: 'Investment Opportunity',
  research: 'Research Asset',
  research_asset: 'Research Asset',
  research_assets: 'Research Asset',
}

function normalizeTypeInput(value: string) {
  return value.trim().toLowerCase().replace(/[\s/-]+/g, '_')
}

export function resolveMarketplaceListingTypeOption(
  value: string | null | undefined,
): MarketplaceListingTypeOption | undefined {
  if (!value) return undefined

  const exactMatch = MARKETPLACE_LISTING_TYPE_OPTIONS.find((option) => option === value.trim())
  if (exactMatch) return exactMatch

  return LISTING_TYPE_ALIASES[normalizeTypeInput(value)]
}
