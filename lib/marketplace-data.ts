export type ListingStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_clarification'
  | 'approved'
  | 'published'
  | 'paused'
  | 'rejected'
  | 'archived'

export type ListingType = 'New Product' | 'Used & Surplus' | 'Cannabis Inventory' | 'Service' | 'Business Opportunity'
export type ListingCondition = 'New' | 'Used' | 'Refurbished' | 'Surplus' | 'Not applicable'
export type AvailabilityStatus = 'Available' | 'Limited availability' | 'Available by request' | 'Seeking responses'
export type MarketplaceCategory =
  | 'Packaging & Consumables'
  | 'Processing Equipment'
  | 'Cultivation Equipment'
  | 'Lab & Testing'
  | 'Services'
  | 'Business Opportunities'
  | 'Cannabis Inventory'

export interface MarketplaceListing {
  id: string
  slug: string
  title: string
  listingType: ListingType
  category: MarketplaceCategory
  subcategory: string
  location: string
  condition: ListingCondition
  availability: AvailabilityStatus
  status: ListingStatus
  description: string
  tags: string[]
  quantityCapacity?: string
  priceRange?: string
  image?: string
  reviewStatus: string
  confidentialityNote: string
}

export interface WantedRequestRecord {
  id: string
  slug: string
  title: string
  category: MarketplaceCategory
  subcategory: string
  location: string
  requiredQuantityCapacity: string
  preferredCondition: ListingCondition
  complianceRequirements: string
  timing: string
  status: ListingStatus
  description: string
  tags: string[]
  reviewNote: string
  confidentialityNote: string
}

export const categoryImageMap: Record<string, string> = {
  'Packaging & Consumables': '/marketplace/packaging-consumables.webp',
  'Packaging & Consumables:Pre-roll Tubes': '/marketplace/pre-roll-tubes.webp',
  'Packaging & Consumables:Mylar Pouches': '/marketplace/mylar-pouches.webp',
  'Packaging & Consumables:Vape Packaging': '/marketplace/vape-packaging.webp',
  'Packaging & Consumables:Shipping Cartons': '/marketplace/shipping-cartons.webp',
  'Packaging & Consumables:Facility Consumables': '/marketplace/facility-consumables.webp',
  'Processing Equipment': '/marketplace/processing-equipment.webp',
  'Cultivation Equipment': '/marketplace/cultivation-equipment.webp',
  'Lab & Testing': '/marketplace/lab-testing.webp',
  Services: '/marketplace/services.webp',
  'Business Opportunities': '/marketplace/business-opportunities.webp',
  'Cannabis Inventory': '/marketplace/cannabis-inventory.webp',
}

export function getCategoryImage(category: MarketplaceCategory, subcategory?: string, explicitImage?: string) {
  if (explicitImage) return explicitImage
  const scoped = subcategory ? `${category}:${subcategory}` : ''
  return categoryImageMap[scoped] || categoryImageMap[category]
}

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: 'lst-preroll-tubes-001',
    slug: 'unbranded-child-resistant-pre-roll-tubes',
    title: 'Unbranded Child-Resistant Pre-Roll Tubes',
    listingType: 'New Product',
    category: 'Packaging & Consumables',
    subcategory: 'Pre-roll Tubes',
    location: 'North America',
    condition: 'New',
    availability: 'Available by request',
    status: 'published',
    quantityCapacity: 'Bulk case quantities available by inquiry',
    priceRange: 'Quoted after specification review',
    description: 'Plain child-resistant tube formats suitable for commercial pre-roll packaging programs. Harbourview can screen fit, documentation requirements and introduction readiness before supplier contact.',
    tags: ['Packaging', 'Pre-roll', 'Child-resistant', 'Bulk supply'],
    reviewStatus: 'Harbourview-reviewed demo listing for commercial fit assessment.',
    confidentialityNote: 'Counterparty details are shared only after Harbourview reviews buyer interest and confirms the request is commercially relevant.',
  },
  {
    id: 'lst-mylar-pouches-001',
    slug: 'blank-stand-up-mylar-pouch-supply',
    title: 'Blank Stand-Up Mylar Pouch Supply',
    listingType: 'New Product',
    category: 'Packaging & Consumables',
    subcategory: 'Mylar Pouches',
    location: 'Canada / United States',
    condition: 'New',
    availability: 'Limited availability',
    status: 'published',
    quantityCapacity: 'Commercial lot sizes by specification',
    priceRange: 'Range available after volume and format review',
    description: 'Unbranded stand-up pouch formats for regulated retail packaging programs. Suitable for buyers evaluating neutral pouch supply, exit-bag style requirements or packaging continuity options.',
    tags: ['Mylar', 'Pouches', 'Retail packaging', 'Unbranded'],
    reviewStatus: 'Published for supplier-discovery and buyer-interest validation.',
    confidentialityNote: 'Harbourview may manage introductions and qualification before any supplier identity or commercial terms are disclosed.',
  },
  {
    id: 'lst-cartons-001',
    slug: 'corrugated-shipping-cartons-packaging-supplies',
    title: 'Corrugated Shipping Cartons and Packaging Supplies',
    listingType: 'New Product',
    category: 'Packaging & Consumables',
    subcategory: 'Shipping Cartons',
    location: 'Ontario, Canada',
    condition: 'New',
    availability: 'Available by request',
    status: 'published',
    quantityCapacity: 'Pallet and case-level supply considered',
    description: 'Commercial carton and packaging supply opportunity for operators seeking plain corrugated master cases, bundled packaging components and fulfillment-ready materials.',
    tags: ['Cartons', 'Packaging', 'Fulfillment', 'Bulk'],
    reviewStatus: 'Reviewed for marketplace presentation. Documentation requirements must be confirmed before introduction.',
    confidentialityNote: 'Buyer interest may be screened to ensure the inquiry is specific, credible and aligned with supplier requirements.',
  },
  {
    id: 'lst-facility-consumables-001',
    slug: 'facility-consumables-production-environments',
    title: 'Facility Consumables for Production Environments',
    listingType: 'New Product',
    category: 'Packaging & Consumables',
    subcategory: 'Facility Consumables',
    location: 'Canada',
    condition: 'New',
    availability: 'Available by request',
    status: 'published',
    quantityCapacity: 'Recurring supply or spot lot inquiries considered',
    description: 'Generic facility consumables for clean production settings, including gloves, wipes and handling materials. Intended for qualified commercial procurement discussions only.',
    tags: ['Consumables', 'Production', 'Sanitation', 'Procurement'],
    reviewStatus: 'Demo-published marketplace record for intake and supplier-response testing.',
    confidentialityNote: 'Harbourview reviews buyer context before facilitating any introduction or supply discussion.',
  },
  {
    id: 'lst-vape-packaging-001',
    slug: 'unbranded-vape-cartridge-packaging-components',
    title: 'Unbranded Vape Cartridge Packaging Components',
    listingType: 'New Product',
    category: 'Packaging & Consumables',
    subcategory: 'Vape Packaging',
    location: 'North America',
    condition: 'New',
    availability: 'Available by request',
    status: 'published',
    quantityCapacity: 'Specification-dependent lot sizes',
    description: 'Blank cartridge box, blister-style and protective insert packaging components for commercial packaging evaluations. No filled products or devices are represented by this listing.',
    tags: ['Vape packaging', 'Cartridge boxes', 'Blister packaging', 'Components'],
    reviewStatus: 'Reviewed for category fit and commercial presentation only.',
    confidentialityNote: 'Harbourview screens commercial intent and documentation fit before managing any introduction.',
  },
  {
    id: 'lst-processing-equipment-001',
    slug: 'surplus-processing-equipment-intake-opportunity',
    title: 'Surplus Processing Equipment Intake Opportunity',
    listingType: 'Used & Surplus',
    category: 'Processing Equipment',
    subcategory: 'General Processing',
    location: 'Canada',
    condition: 'Surplus',
    availability: 'Available by request',
    status: 'published',
    quantityCapacity: 'Asset list required before circulation',
    description: 'Harbourview is collecting surplus processing-equipment opportunities for qualified buyer review. Submitted assets may be screened for condition, documentation, location and buyer fit before publication or private circulation.',
    tags: ['Processing', 'Surplus', 'Equipment', 'Asset recovery'],
    reviewStatus: 'Open marketplace intake category. Specific assets require Harbourview review before circulation.',
    confidentialityNote: 'Seller identity and asset documents can remain confidential until a qualified counterparty is identified.',
  },
]

export const wantedRequests: WantedRequestRecord[] = [
  {
    id: 'wnt-packaging-001',
    slug: 'buyer-seeking-unbranded-packaging-supply',
    title: 'Buyer Seeking Unbranded Packaging Supply',
    category: 'Packaging & Consumables',
    subcategory: 'Mixed Packaging',
    location: 'Canada',
    requiredQuantityCapacity: 'Commercial case or pallet-level supply preferred',
    preferredCondition: 'New',
    complianceRequirements: 'Supplier should be able to provide product specifications and applicable packaging documentation where required.',
    timing: 'Near-term sourcing review',
    status: 'published',
    description: 'A qualified buyer pathway is being developed for unbranded packaging supply across pouches, tubes, cartons and production consumables. Matching suppliers may submit supply details for Harbourview review.',
    tags: ['Wanted', 'Packaging', 'Bulk supply', 'Canada'],
    reviewNote: 'Harbourview reviews supplier responses before any buyer introduction is considered.',
    confidentialityNote: 'Buyer identity is confidential. Supplier information is used only to assess fit and manage a potential introduction.',
  },
  {
    id: 'wnt-surplus-equipment-001',
    slug: 'wanted-surplus-cannabis-facility-equipment',
    title: 'Wanted: Surplus Cannabis Facility Equipment',
    category: 'Processing Equipment',
    subcategory: 'Facility Equipment',
    location: 'Canada / United States',
    requiredQuantityCapacity: 'Single assets, packaged equipment lots or full facility surplus lists considered',
    preferredCondition: 'Used',
    complianceRequirements: 'Asset list, photos, condition notes, location and ownership confirmation required before circulation.',
    timing: 'Ongoing intake',
    status: 'published',
    description: 'Harbourview is accepting matching supply from operators, asset sellers and service providers with surplus facility, processing, packaging or production equipment suitable for qualified commercial buyers.',
    tags: ['Wanted', 'Surplus', 'Equipment', 'Asset recovery'],
    reviewNote: 'Responses are screened for ownership clarity, asset condition and buyer relevance.',
    confidentialityNote: 'Harbourview can keep seller identity private while assessing fit and preparing a controlled introduction path.',
  },
]

export const publishedListings = marketplaceListings.filter((listing) => listing.status === 'published')
export const publishedWantedRequests = wantedRequests.filter((request) => request.status === 'published')

export const marketplaceFilterOptions = {
  categories: Array.from(new Set(publishedListings.map((listing) => listing.category))),
  listingTypes: Array.from(new Set(publishedListings.map((listing) => listing.listingType))),
  locations: Array.from(new Set(publishedListings.map((listing) => listing.location))),
  conditions: Array.from(new Set(publishedListings.map((listing) => listing.condition))),
  availability: Array.from(new Set(publishedListings.map((listing) => listing.availability))),
}

export function getListingBySlug(slug: string) {
  return publishedListings.find((listing) => listing.slug === slug)
}

export function getWantedRequestBySlug(slug: string) {
  return publishedWantedRequests.find((request) => request.slug === slug)
}

export function getRelatedListings(listing: MarketplaceListing) {
  return publishedListings.filter((item) => item.id !== listing.id && item.category === listing.category).slice(0, 3)
}
