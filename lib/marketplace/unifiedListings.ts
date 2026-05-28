import { z } from 'zod'

export const listingTypeSchema = z.enum(['supply', 'equipment'])
export const listingStatusSchema = z.enum(['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'])
export const listingVisibilitySchema = z.enum(['private', 'public'])

const nullableText = z.string().trim().max(500).nullable().optional()
const nullableLongText = z.string().trim().max(5000).nullable().optional()
const timestampText = z.string().trim().nullable().optional()

export const canonicalListingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().min(1).max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  listing_type: listingTypeSchema,
  category: nullableText,
  subcategory: nullableText,
  status: listingStatusSchema.default('draft'),
  visibility: listingVisibilitySchema.default('private'),
  summary: nullableLongText,
  description: nullableLongText,
  location_country: nullableText,
  location_region: nullableText,
  published_at: timestampText,
  created_at: timestampText,
  updated_at: timestampText,
}).passthrough()

export const listingSupplyDetailsSchema = z.object({
  listing_id: z.string().uuid(),
  product_form: nullableText,
  material: nullableText,
  minimum_order_quantity: nullableText,
  pack_size: nullableText,
  origin_country: nullableText,
  certifications: z.array(z.string().trim().min(1).max(160)).nullable().optional(),
  lead_time: nullableText,
  created_at: timestampText,
  updated_at: timestampText,
}).passthrough()

export const listingEquipmentDetailsSchema = z.object({
  listing_id: z.string().uuid(),
  manufacturer: nullableText,
  model: nullableText,
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  condition: nullableText,
  hours_used: z.number().int().min(0).nullable().optional(),
  capacity: nullableText,
  voltage: nullableText,
  dimensions: nullableText,
  asset_location: nullableText,
  created_at: timestampText,
  updated_at: timestampText,
}).passthrough()

export type CanonicalListingRow = z.infer<typeof canonicalListingSchema>
export type ListingSupplyDetailsRow = z.infer<typeof listingSupplyDetailsSchema>
export type ListingEquipmentDetailsRow = z.infer<typeof listingEquipmentDetailsSchema>

export type UnifiedListingRecord = {
  listing: unknown
  supplyDetails?: unknown | null
  equipmentDetails?: unknown | null
}

export const PUBLIC_LISTING_DTO_KEYS = [
  'id',
  'slug',
  'title',
  'listingType',
  'category',
  'subcategory',
  'summary',
  'locationCountry',
  'locationRegion',
  'publishedAt',
  'details',
] as const

export const PUBLIC_SUPPLY_DETAIL_DTO_KEYS = [
  'productForm',
  'material',
  'minimumOrderQuantity',
  'packSize',
  'originCountry',
  'certifications',
  'leadTime',
] as const

export const PUBLIC_EQUIPMENT_DETAIL_DTO_KEYS = [
  'manufacturer',
  'model',
  'year',
  'condition',
  'capacity',
  'voltage',
  'assetLocation',
] as const

export const FORBIDDEN_PUBLIC_LISTING_KEYS = [
  'sourceUrl',
  'source_url',
  'sourceName',
  'source_name',
  'sourceType',
  'source_type',
  'sourceEvidence',
  'source_evidence',
  'provenanceSummary',
  'provenance_summary',
  'verificationStatus',
  'verification_status',
  'availabilityStatus',
  'availability_status',
  'sellerAuthorizationStatus',
  'seller_authorization_status',
  'internalReviewNotes',
  'internal_review_notes',
  'reviewedBy',
  'reviewed_by',
  'lastReviewedAt',
  'last_reviewed_at',
  'nextReviewDueAt',
  'next_review_due_at',
  'contactEmail',
  'contact_email',
  'seller',
  'contact',
  'counterparty',
  'monetizationPath',
  'monetization_path',
  'confidenceScore',
  'confidence_score',
  'visibility',
  'status',
  'created_at',
  'updated_at',
] as const

type PublicSupplyDetailsDto = Partial<Record<(typeof PUBLIC_SUPPLY_DETAIL_DTO_KEYS)[number], string | string[] | null>>
type PublicEquipmentDetailsDto = Partial<Record<(typeof PUBLIC_EQUIPMENT_DETAIL_DTO_KEYS)[number], string | number | null>>

export type PublicListingDto = Record<(typeof PUBLIC_LISTING_DTO_KEYS)[number], unknown> & {
  id: string
  slug: string
  title: string
  listingType: z.infer<typeof listingTypeSchema>
  category: string | null
  subcategory: string | null
  summary: string | null
  locationCountry: string | null
  locationRegion: string | null
  publishedAt: string | null
  details: PublicSupplyDetailsDto | PublicEquipmentDetailsDto | null
}

function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== ''
}

function publicSupplyDetails(details: ListingSupplyDetailsRow | null): PublicSupplyDetailsDto | null {
  if (!details) return null
  const dto: PublicSupplyDetailsDto = {
    productForm: details.product_form ?? null,
    material: details.material ?? null,
    minimumOrderQuantity: details.minimum_order_quantity ?? null,
    packSize: details.pack_size ?? null,
    originCountry: details.origin_country ?? null,
    certifications: details.certifications ?? null,
    leadTime: details.lead_time ?? null,
  }

  return Object.values(dto).some(hasValue) ? dto : null
}

function publicEquipmentDetails(details: ListingEquipmentDetailsRow | null): PublicEquipmentDetailsDto | null {
  if (!details) return null
  const dto: PublicEquipmentDetailsDto = {
    manufacturer: details.manufacturer ?? null,
    model: details.model ?? null,
    year: details.year ?? null,
    condition: details.condition ?? null,
    capacity: details.capacity ?? null,
    voltage: details.voltage ?? null,
    assetLocation: details.asset_location ?? null,
  }

  return Object.values(dto).some(hasValue) ? dto : null
}

function assertNoMismatchedDetails(
  listing: CanonicalListingRow,
  supplyDetails: ListingSupplyDetailsRow | null,
  equipmentDetails: ListingEquipmentDetailsRow | null,
) {
  if (supplyDetails && supplyDetails.listing_id !== listing.id) {
    throw new Error('Supply detail row does not belong to listing.')
  }
  if (equipmentDetails && equipmentDetails.listing_id !== listing.id) {
    throw new Error('Equipment detail row does not belong to listing.')
  }
  if (listing.listing_type === 'supply' && equipmentDetails) {
    throw new Error('Supply listings must not project equipment detail rows.')
  }
  if (listing.listing_type === 'equipment' && supplyDetails) {
    throw new Error('Equipment listings must not project supply detail rows.')
  }
}

function parseNullableDetails<T>(schema: z.ZodType<T>, value: unknown | null | undefined): T | null {
  if (value === null || value === undefined) return null
  return schema.parse(value)
}

export function parseUnifiedListingRecord(record: UnifiedListingRecord) {
  const listing = canonicalListingSchema.parse(record.listing)
  const supplyDetails = parseNullableDetails(listingSupplyDetailsSchema, record.supplyDetails)
  const equipmentDetails = parseNullableDetails(listingEquipmentDetailsSchema, record.equipmentDetails)

  assertNoMismatchedDetails(listing, supplyDetails, equipmentDetails)

  return {
    listing,
    supplyDetails,
    equipmentDetails,
  }
}

export function toPublicListingDto(record: UnifiedListingRecord): PublicListingDto {
  const { listing, supplyDetails, equipmentDetails } = parseUnifiedListingRecord(record)
  const dto: PublicListingDto = {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    listingType: listing.listing_type,
    category: listing.category ?? null,
    subcategory: listing.subcategory ?? null,
    summary: listing.summary ?? null,
    locationCountry: listing.location_country ?? null,
    locationRegion: listing.location_region ?? null,
    publishedAt: listing.published_at ?? null,
    details: listing.listing_type === 'supply'
      ? publicSupplyDetails(supplyDetails)
      : publicEquipmentDetails(equipmentDetails),
  }

  assertPublicListingDtoNoForbiddenKeys(dto)
  return dto
}

export function assertPublicListingDtoNoForbiddenKeys(value: unknown) {
  const stack: unknown[] = [value]
  const forbidden = new Set<string>(FORBIDDEN_PUBLIC_LISTING_KEYS)

  while (stack.length) {
    const current = stack.pop()
    if (!current || typeof current !== 'object') continue
    if (Array.isArray(current)) {
      stack.push(...current)
      continue
    }

    for (const [key, nestedValue] of Object.entries(current)) {
      if (forbidden.has(key)) {
        throw new Error(`Public listing DTO includes forbidden key: ${key}`)
      }
      stack.push(nestedValue)
    }
  }
}
