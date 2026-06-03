import type { MarketplaceListing } from './listings';

export type PublicMarketplaceListing = {
  slug: string;
  title: string;
  section: string;
  category: string;
  listingType: string;
  condition?: 'Used' | 'New' | 'Supplier Lead' | 'Auction';
  price?: string;
  location?: string;
  publicSummary: string;
  buyerFit: string[];
  complianceNote: string;
  ctaLabel: string;
};

export function toPublicMarketplaceListing(listing: MarketplaceListing): PublicMarketplaceListing {
  return {
    slug: listing.slug,
    title: listing.title,
    section: listing.section,
    category: listing.category,
    listingType: listing.listingType,
    condition: listing.condition,
    price: listing.price,
    location: listing.location,
    publicSummary: listing.summary,
    buyerFit: listing.buyerFit,
    complianceNote: listing.complianceNote,
    ctaLabel: listing.ctaLabel,
  };
}

// All live listings come from Supabase via lib/server/listingsQuery.ts.
// This array is intentionally empty — no static placeholder data.
export const publicMarketplaceListings: PublicMarketplaceListing[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getPublicMarketplaceListing(_slug: string): PublicMarketplaceListing | undefined {
  return undefined;
}
