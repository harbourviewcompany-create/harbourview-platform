export type MarketplaceSection =
  | 'Used & Surplus'
  | 'New Products'
  | 'Cannabis Inventory'
  | 'Wanted Requests'
  | 'Services'
  | 'Business Opportunities'
  | 'Supplier Directory'
  | 'Lab & Testing Equipment';

export type VerificationStatus =
  | 'source_verified'
  | 'availability_unverified'
  | 'seller_contact_required'
  | 'sold_or_expired_source';

export type SourceType =
  | 'seller_listing'
  | 'auction_source'
  | 'supplier_catalog'
  | 'supplier_website'
  | 'marketplace_source';

export type AvailabilityStatus =
  | 'available_on_source'
  | 'availability_unconfirmed'
  | 'auction_dependent'
  | 'catalog_or_quote_based'
  | 'source_lead_only'
  | 'sold_or_expired';

export type SellerAuthorizationStatus =
  | 'not_contacted'
  | 'contact_required'
  | 'authorization_requested'
  | 'authorized'
  | 'declined'
  | 'not_applicable';

export type MonetizationPath =
  | 'seller_verification'
  | 'buyer_sourcing_mandate'
  | 'supplier_referral'
  | 'auction_screening'
  | 'directory_onboarding'
  | 'quote_routing';

export type ReviewCadence = 'daily' | 'weekly' | 'monthly' | 'before_introduction';

export type MarketplaceListing = {
  slug: string;
  title: string;
  section: MarketplaceSection;
  category: string;
  listingType: string;
  condition?: 'Used' | 'New' | 'Supplier Lead' | 'Auction';
  price?: string;
  location?: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  seller?: string;
  contact?: string;
  summary: string;
  buyerFit: string[];
  verificationStatus: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  sellerAuthorizationStatus: SellerAuthorizationStatus;
  monetizationPath: MonetizationPath;
  confidenceScore: number;
  lastReviewedAt: string;
  nextReviewDueAt: string;
  reviewCadence: ReviewCadence;
  reviewedBy: 'Harbourview sourcing desk';
  provenanceSummary: string;
  sourceEvidence: string[];
  verificationNote: string;
  complianceNote: string;
  internalReviewNotes: string;
  ctaLabel: string;
  priority: 'High' | 'Medium' | 'Low';
};

export const marketplaceListings: MarketplaceListing[] = [];

export const featuredMarketplaceListings = marketplaceListings.filter(
  listing => listing.priority === 'High'
);

export function getMarketplaceListing(slug: string) {
  return marketplaceListings.find(listing => listing.slug === slug);
}
