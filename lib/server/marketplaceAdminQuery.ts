import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
import type { AdminDataResult } from '@/lib/supabase/adminDataClient'

export type MarketplaceAdminQueueItem = {
  id: string
  created_at: string
  category_key: string | null
  subcategory_key: string | null
  record_type: string | null
  listing_type_key: string | null
  title: string | null
  title_public_draft?: string | null
  description_internal?: string | null
  description_public_draft?: string | null
  seller_name_private?: string | null
  source_type?: string | null
  country?: string | null
  region?: string | null
  condition?: string | null
  verification_status?: string | null
  seller_authorization_status?: string | null
  publication_status?: string | null
  monetization_path?: string | null
  confidence_score?: number | null
  commercial_relevance_score?: number | null
  compliance_risk_score?: number | null
  review_due_at?: string | null
  expires_at?: string | null
  status?: string | null
  restricted_item?: boolean | null
  requires_license_review?: boolean | null
}

export type AdminPublishedListing = {
  id: string
  slug: string | null
  title: string
  description: string
  category: string
  marketplace_section: string
  product_type: string | null
  region: string
  condition: string | null
  location_country: string | null
  price_display: string | null
  seller_type: string
  is_featured: boolean
  created_at: string
}

const CANDIDATE_COLUMNS = [
  'id', 'created_at', 'candidate_type', 'marketplace_category', 'subcategory',
  'listing_type', 'title_internal', 'title_public_draft',
  'description_internal', 'description_public_draft',
  'jurisdiction', 'country', 'region', 'source_type', 'condition',
  'confidence_score', 'commercial_relevance_score', 'compliance_risk_score',
  'restricted_item', 'requires_license_review', 'status',
  'rejection_reason', 'reviewed_by', 'reviewed_at', 'updated_at',
].join(',')

export async function listAdminCandidatesByStatus(
  status?: string
): Promise<AdminDataResult<MarketplaceAdminQueueItem[]>> {
  const filter = status ? `&status=eq.${encodeURIComponent(status)}` : ''
  return fetchAdminSupabaseJson<MarketplaceAdminQueueItem[]>(
    `/rest/v1/marketplace_candidates?select=${CANDIDATE_COLUMNS}&order=created_at.desc&limit=200${filter}`
  )
}

export async function listAdminPublishedListings(): Promise<AdminDataResult<AdminPublishedListing[]>> {
  const cols = 'id,slug,title,description,category,marketplace_section,product_type,region,condition,location_country,price_display,seller_type,is_featured,created_at'
  return fetchAdminSupabaseJson<AdminPublishedListing[]>(
    `/rest/v1/marketplace_public_listings_v1?select=${cols}&order=created_at.desc&limit=200`
  )
}

export async function publishCandidate(id: string): Promise<AdminDataResult<null>> {
  // Move candidate to approved_draft + create a live listing record via the publication status path
  const result = await fetchAdminSupabaseJson<unknown>(
    `/rest/v1/marketplace_candidates?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ publication_status: 'published', status: 'approved_draft' }),
    } as RequestInit
  )
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}

export async function rejectCandidate(id: string, reason: string): Promise<AdminDataResult<null>> {
  const result = await fetchAdminSupabaseJson<unknown>(
    `/rest/v1/marketplace_candidates?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
    } as RequestInit
  )
  if (!result.ok) return result as AdminDataResult<null>
  return { ok: true, data: null }
}

export function summarizeQueue(items: MarketplaceAdminQueueItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.status || item.publication_status || 'unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}
