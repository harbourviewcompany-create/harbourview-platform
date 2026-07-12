import { assertPublicSafe } from '@/lib/intelligence-os/publicSafety'
import { getMarketplaceCategory } from './taxonomy'
import type { PrivateMarketplaceListing, PublicMarketplaceListing } from './marketplaceTypes'

const ALLOWED_SPEC_KEYS = new Set([
  'cta_label',
  'format',
  'asset_class',
  'equipment_class',
  'supply_class',
  'service_class',
  'minimum_order_quantity',
  'availability_window',
  'region_available',
  'condition_summary',
  'request_requirements',
])

function sanitizePublicText(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function filterPublicSpecs(specs: unknown): Record<string, unknown> {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return {}

  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
    if (!ALLOWED_SPEC_KEYS.has(key)) continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      output[key] = value
    }
  }
  return output
}

export function toPublicMarketplaceListing(input: PrivateMarketplaceListing): PublicMarketplaceListing {
  const category = getMarketplaceCategory(input.category)
  const output: PublicMarketplaceListing = {
    id: input.id,
    slug: input.slug ?? null,
    title: sanitizePublicText(input.title, 'Marketplace opportunity'),
    description: sanitizePublicText(input.public_summary ?? input.summary ?? input.description),
    category: input.category,
    subcategory: input.subcategory ?? null,
    marketplace_section: input.marketplace_section || category?.marketplaceSection || 'supply',
    product_type: input.product_type ?? null,
    region: input.region || 'global',
    condition: input.condition ?? null,
    location_country: input.location_country ?? null,
    location_region: input.location_region ?? null,
    price_amount: input.price_amount != null ? Number(input.price_amount) : null,
    price_currency: input.price_currency || 'USD',
    price_display: input.price_display ?? 'Request qualification',
    seller_type: input.seller_type || 'controlled_review',
    is_featured: Boolean(input.is_featured),
    high_level_specs: filterPublicSpecs(input.high_level_specs),
    created_at: input.created_at,
  }

  assertPublicSafe(output)
  return output
}

export function assertMarketplacePublicPayload(value: unknown) {
  assertPublicSafe(value)
}
