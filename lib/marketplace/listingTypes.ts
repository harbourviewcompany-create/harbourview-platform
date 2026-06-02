// Shared listing types for marketplace lib/server code.
// These mirror the types in lib/fixtures/types.ts so production code
// does not need to import from the fixtures directory.

export type ListingCategory =
  | 'new-products'
  | 'used-surplus'
  | 'cannabis-inventory'
  | 'wanted-requests'
  | 'services'
  | 'business-opportunities'

export type ListingImageStatus = 'representative' | 'supplier-provided' | 'verified'

export interface ListingImage {
  src?: string
  alt: string
  status: ListingImageStatus
  caption?: string
  assetSource?: 'generated' | 'supplier_provided' | 'licensed_stock' | 'internal_photo'
}

export interface Listing {
  id: string
  title: string
  description: string
  price?: string
  location: string
  tags: string[]
  postedDate: string
  image?: ListingImage
}

export interface NewProductListing extends Listing {
  category: 'new-products'
  vendor: string
  condition: 'new'
}

export interface UsedSurplusListing extends Listing {
  category: 'used-surplus'
  condition: 'used' | 'refurbished' | 'surplus'
  hoursUsed?: string
}

export interface ServiceListing extends Listing {
  category: 'services'
  serviceType: string
  deliveryMethod: 'on-site' | 'remote' | 'both'
}

export interface BusinessOpportunity extends Listing {
  category: 'business-opportunities'
  opportunityType: 'acquisition' | 'partnership' | 'lease' | 'license-transfer'
  licenseType?: string
  state: string
}
