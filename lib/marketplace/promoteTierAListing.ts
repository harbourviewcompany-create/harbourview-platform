/**
 * Promote a Tier A auto-published candidate into public.listings
 * so it appears in marketplace_public_listings_v1 and the Market UI.
 */

import { getMarketplaceCategory } from './taxonomy'
import type { SupabaseClient } from '@supabase/supabase-js'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export type PromoteTierAInput = {
  candidateId: string
  categoryKey: string
  title: string
  description: string
  country?: string | null
  priceRaw?: string | null
  listingTypeLabel?: string | null
  submittedBy?: string | null
  sellerEmail?: string | null
}

export type PromoteTierAResult =
  | { ok: true; listingId: string; slug: string }
  | { ok: false; error: string }

function parsePrice(priceRaw: string | null | undefined): number | null {
  if (!priceRaw?.trim()) return null
  const cleaned = priceRaw.replace(/[^0-9.,]/g, '').replace(/,/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Insert a public-approved listing row for an auto-published Tier A candidate.
 */
export async function promoteTierACandidateToListing(
  svc: SupabaseClient,
  input: PromoteTierAInput,
): Promise<PromoteTierAResult> {
  const category = getMarketplaceCategory(input.categoryKey)
  const section = category?.marketplaceSection ?? input.categoryKey
  const title = input.title.trim()
  const description = (input.description || title).trim()
  if (title.length < 3) {
    return { ok: false, error: 'title_too_short' }
  }

  const slug = `${slugify(title)}-${Date.now().toString(36)}`
  const priceAmount = parsePrice(input.priceRaw)

  const row: Record<string, unknown> = {
    title,
    slug,
    description,
    summary: description.slice(0, 280),
    public_summary: description.slice(0, 480),
    category: input.categoryKey,
    marketplace_section: section,
    listing_type: input.listingTypeLabel || category?.allowedListingTypes[0] || input.categoryKey,
    status: 'approved',
    public_visibility: true,
    visibility: 'public',
    seller_type: 'self_serve',
    region: input.country || 'global',
    location_country: input.country || null,
    price_amount: priceAmount,
    price_currency: 'USD',
    price_display: priceAmount != null ? `USD ${priceAmount}` : 'Request quote',
    is_featured: false,
    high_level_specs: {
      cta_label: category?.defaultCtaLabel ?? 'Contact seller',
      auto_published: true,
      source_candidate_id: input.candidateId,
      ...(input.sellerEmail ? { seller_email: input.sellerEmail } : {}),
      ...(input.submittedBy ? { submitted_by: input.submittedBy } : {}),
    },
    published_at: new Date().toISOString(),
  }

  const { data, error } = await svc
    .from('listings')
    .insert(row)
    .select('id, slug')
    .single()

  if (error || !data?.id) {
    return {
      ok: false,
      error: error?.message?.slice(0, 240) || 'listing_insert_failed',
    }
  }

  return { ok: true, listingId: data.id as string, slug: data.slug as string }
}
