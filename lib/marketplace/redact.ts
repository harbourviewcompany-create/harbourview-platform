import type { ListingRow, BuyerRequestRow, SupplierProfileRow } from '@/lib/supabase/types'

/**
 * Fields that must NEVER appear in public API responses.
 * Extend this list if new private fields are added to any entity.
 */
export const LISTING_PRIVATE_FIELDS = [
  'legal_entity_name',
  'contact_name',
  'contact_email',
  'contact_phone',
  'private_notes',
  'internal_score',
  'archived_at',
  'superseded_by',
] as const

export const BUYER_REQUEST_PRIVATE_FIELDS = [
  'legal_entity_name',
  'contact_name',
  'contact_email',
  'contact_phone',
  'private_notes',
  'archived_at',
] as const

export const SUPPLIER_PRIVATE_FIELDS = [
  'legal_entity_name',
  'contact_name',
  'contact_email',
  'archived_at',
] as const

/**
 * Public-safe listing shape.
 * Only approved listings should be passed to this function.
 */
export type PublicListing = Omit<
  ListingRow,
  (typeof LISTING_PRIVATE_FIELDS)[number]
>

export type PublicBuyerRequest = Omit<
  BuyerRequestRow,
  (typeof BUYER_REQUEST_PRIVATE_FIELDS)[number]
>

export type PublicSupplierProfile = Omit<
  SupplierProfileRow,
  (typeof SUPPLIER_PRIVATE_FIELDS)[number]
>

export function redactListing(listing: ListingRow): PublicListing {
  const result = { ...listing } as Record<string, unknown>
  for (const field of LISTING_PRIVATE_FIELDS) {
    delete result[field]
  }
  return result as PublicListing
}

export function redactBuyerRequest(req: BuyerRequestRow): PublicBuyerRequest {
  const result = { ...req } as Record<string, unknown>
  for (const field of BUYER_REQUEST_PRIVATE_FIELDS) {
    delete result[field]
  }
  return result as PublicBuyerRequest
}

export function redactSupplierProfile(profile: SupplierProfileRow): PublicSupplierProfile {
  const result = { ...profile } as Record<string, unknown>
  for (const field of SUPPLIER_PRIVATE_FIELDS) {
    delete result[field]
  }
  return result as PublicSupplierProfile
}

/**
 * Assert that a public response object contains none of the private fields.
 * Use in tests and runtime guard calls.
 */
export function assertNoPrivateFields(
  obj: Record<string, unknown>,
  privateFields: readonly string[]
): void {
  for (const field of privateFields) {
    if (field in obj) {
      throw new Error(`Private field "${field}" found in public response. Redaction failure.`)
    }
  }
}
