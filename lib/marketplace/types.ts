// ============================================================
// HARBOURVIEW MARKETPLACE v1 — PUBLIC TYPES
// CRITICAL: These types must NEVER include private fields.
// Private fields live in types-admin.ts only.
// ============================================================

export type MarketplaceSection =
  | 'new_products'
  | 'used_surplus'
  | 'cannabis_inventory'
  | 'wanted_requests'
  | 'services'
  | 'business_opportunities'
  | 'supplier_directory';

export type MarketplaceReviewStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type MarketplaceContactVisibility = 'hidden' | 'on_inquiry' | 'public';
export type MarketplaceVerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'suspended';
export type MarketplaceInquiryStatus = 'pending' | 'read' | 'responded' | 'closed';

// ── PUBLIC LISTING (safe for API responses and client components) ──
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
}

// ── PUBLIC SUPPLIER ──
export interface PublicSupplier {
  id: string;
  company_name: string;
  slug: string;
  description: string | null;
  is_featured: boolean;
  created_at: string;
}

// ── PUBLIC WANTED REQUEST ──
export interface PublicWantedRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budget_range: string | null;
  created_at: string;
}

// ── SUBMISSION SCHEMAS ──
export interface ListingSubmissionInput {
  section: MarketplaceSection;
  title: string;
  description: string;
  price_amount?: number;
  price_currency?: string;
  location_country?: string;
}

export interface InquirySubmissionInput {
  listing_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_company?: string;
  message: string;
}

export interface WantedRequestSubmissionInput {
  title: string;
  description: string;
  category?: string;
  budget_range?: string;
}

// ── SUBMISSION RESPONSES ──
export interface SubmissionResult {
  id: string;
  review_status: 'pending';
  public_visibility: false;
  created_at: string;
}

export interface InquiryResult {
  id: string;
  status: 'pending';
  created_at: string;
}

// ── Sanitizer functions (added by OT) ─────────────────────────────────────
// Strip private fields before returning rows to public API responses.
// Use these in every public route handler — never pass raw DB rows.

export function toPublicListing(row: Record<string, unknown>): PublicListing {
  return {
    id: row.id as string,
    section: row.section as MarketplaceSection,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    price_amount: (row.price_amount as number) ?? null,
    price_currency: (row.price_currency as string) ?? null,
    location_country: (row.location_country as string) ?? null,
    is_featured: row.is_featured as boolean,
    created_at: row.created_at as string,
  };
}

export function toPublicSupplier(row: Record<string, unknown>): PublicSupplier {
  return {
    id: row.id as string,
    company_name: row.company_name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? null,
    is_featured: row.is_featured as boolean,
    created_at: row.created_at as string,
  };
}

export function toPublicWantedRequest(row: Record<string, unknown>): PublicWantedRequest {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    category: (row.category as string) ?? null,
    budget_range: (row.budget_range as string) ?? null,
    created_at: row.created_at as string,
  };
}
