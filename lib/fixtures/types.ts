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
  contactEmail: string
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

export interface CannabisInventoryListing extends Listing {
  category: 'cannabis-inventory'
  strain?: string
  weightAvailable: string
  licenseRequired: true
}

export interface WantedRequest extends Listing {
  category: 'wanted-requests'
  budget?: string
  urgency: 'flexible' | 'within-30-days' | 'asap'
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

export interface Supplier {
  id: string
  name: string
  description: string
  categories: string[]
  location: string
  contactEmail: string
  website?: string
}
