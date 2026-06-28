import type { MarketplaceListing } from './listings';
import {
  sanitizeMarketplaceField,
  sanitizeMarketplaceBuyerFit,
  SAFE_TITLE_FALLBACK,
  SAFE_SECTION_FALLBACK,
  SAFE_CATEGORY_FALLBACK,
  SAFE_LOCATION_FALLBACK,
  SAFE_PRICE_FALLBACK,
} from './safety';

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
    title: sanitizeMarketplaceField(listing.title, SAFE_TITLE_FALLBACK),
    section: sanitizeMarketplaceField(listing.section, SAFE_SECTION_FALLBACK),
    category: sanitizeMarketplaceField(listing.category, SAFE_CATEGORY_FALLBACK),
    listingType: listing.listingType,
    condition: listing.condition,
    price: listing.price ? sanitizeMarketplaceField(listing.price, SAFE_PRICE_FALLBACK) : listing.price,
    location: listing.location ? sanitizeMarketplaceField(listing.location, SAFE_LOCATION_FALLBACK) : listing.location,
    publicSummary: listing.summary,
    buyerFit: sanitizeMarketplaceBuyerFit(listing.buyerFit),
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
