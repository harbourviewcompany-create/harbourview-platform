export type MarketplaceListingTypeOption = {
  label: string
  value: string
  aliases: readonly string[]
}

export const MARKETPLACE_LISTING_TYPE_OPTIONS = [
  { label: 'New Product', value: 'new_products', aliases: ['new', 'new-product', 'new_product', 'new-products'] },
  { label: 'Used / Surplus Equipment', value: 'used_surplus', aliases: ['used', 'surplus', 'used-surplus', 'used_surplus_equipment'] },
  { label: 'Cannabis Inventory', value: 'cannabis_inventory', aliases: ['inventory', 'cannabis-inventory'] },
  { label: 'Wanted Request', value: 'wanted_request', aliases: ['wanted', 'wanted-request', 'wanted_requests'] },
  { label: 'Service', value: 'services', aliases: ['service', 'services'] },
  { label: 'Business Opportunity', value: 'business_opportunity', aliases: ['business', 'business-opportunity', 'business-opportunities'] },
  { label: 'Featured Network Opportunity', value: 'featured_network_opportunity', aliases: ['featured', 'featured-network-opportunity'] },
  { label: 'Consumables', value: 'consumables', aliases: ['consumable'] },
  { label: 'Cultivation Equipment', value: 'cultivation_equipment', aliases: ['cultivation', 'cultivation-equipment'] },
  { label: 'Distressed Inventory', value: 'distressed_inventory', aliases: ['distressed-inventory'] },
  { label: 'Distressed Businesses', value: 'distressed_businesses', aliases: ['distressed-businesses', 'distressed_business'] },
  { label: 'Genetics Program', value: 'genetics_program', aliases: ['genetics', 'genetics-program'] },
  { label: 'Qualified Access Request', value: 'qualified_access_request', aliases: ['qualified-access', 'qualified_access'] },
] as const satisfies readonly MarketplaceListingTypeOption[]

export function resolveMarketplaceListingTypeOption(type: string | null | undefined) {
  const normalized = type?.trim().toLowerCase()
  if (!normalized) return null

  return (
    MARKETPLACE_LISTING_TYPE_OPTIONS.find((option) => {
      const candidates = [option.label, option.value, ...option.aliases]
      return candidates.some((candidate) => candidate.toLowerCase() === normalized)
    }) ?? null
  )
}
