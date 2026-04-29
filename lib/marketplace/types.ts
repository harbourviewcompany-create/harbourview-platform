// ============================================================
// HARBOURVIEW MARKETPLACE v1 — PUBLIC TYPES (REVENUE FOCUSED)
// ============================================================

export type MarketplaceSection =
  | 'equipment'
  | 'consumables'
  | 'wanted_requests'
  | 'supplier_directory';

export interface PublicListing {
  id: string;
  section: MarketplaceSection;
  title: string;
  slug: string;
  description: string;
  price_amount: number | null;
  price_currency: string | null;
  location_country: string | null;
  is_featured: boolean;
  created_at: string;

  // NEW: critical fields for selling
  condition?: string | null;
  brand?: string | null;
  model?: string | null;
  quantity?: number | null;
  unit?: string | null;
}

export interface ListingSubmissionInput {
  section: MarketplaceSection;
  title: string;
  description: string;

  // CORE COMMERCIAL FIELDS
  price_amount?: number;
  price_currency?: string;
  location_country?: string;

  // EQUIPMENT / CONSUMABLE DETAIL
  condition?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  unit?: string;
}
