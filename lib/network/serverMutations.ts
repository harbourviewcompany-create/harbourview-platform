import 'server-only'
import { networkAdminRequest } from './serverAccess'
import type { NetworkPublicProjectionRow, NetworkReviewItemRow, NetworkReviewStatus } from './serverTypes'

export async function updateNetworkReviewStatus(reviewId: string, reviewStatus: NetworkReviewStatus) {
  const path = `/rest/v1/network_review_items?id=eq.${encodeURIComponent(reviewId)}&select=*`
  return networkAdminRequest<NetworkReviewItemRow[]>(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ review_status: reviewStatus, reviewed_at: new Date().toISOString() }),
  })
}

export async function publishNetworkPublicProjection(input: {
  reviewItemId: string
  objectType: NetworkPublicProjectionRow['object_type']
  slug: string
  name: string
  publicSummary: string
  countryLabel?: string | null
  categoryLabel?: string | null
  publishedBy?: string | null
}) {
  return networkAdminRequest<NetworkPublicProjectionRow[]>('/rest/v1/network_public_projections?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      review_item_id: input.reviewItemId,
      object_type: input.objectType,
      slug: input.slug,
      name: input.name,
      public_summary: input.publicSummary,
      country_label: input.countryLabel ?? null,
      category_label: input.categoryLabel ?? null,
      published_by: input.publishedBy ?? null,
      published_state: 'published',
      is_active: true,
    }),
  })
}
