import 'server-only'
import { networkAdminRequest } from './serverAccess'
import type { NetworkPublicProjectionRow, NetworkReviewItemRow } from './serverTypes'
import { toNetworkPublicProjectionDTO, type NetworkPublicProjectionDTO } from './publicProjection'

export async function listNetworkReviewItems(limit = 50) {
  const query = [
    'select=*',
    'order=created_at.desc',
    `limit=${Math.max(1, Math.min(limit, 200))}`,
  ].join('&')
  return networkAdminRequest<NetworkReviewItemRow[]>(`/rest/v1/network_review_items?${query}`)
}

export async function listPublishedNetworkPublicProjections(limit = 100) {
  const query = [
    'select=id,slug,name,public_summary,object_type,country_label,category_label,published_at,version',
    'published_state=eq.published',
    'is_active=eq.true',
    'order=published_at.desc',
    `limit=${Math.max(1, Math.min(limit, 200))}`,
  ].join('&')

  const result = await networkAdminRequest<NetworkPublicProjectionRow[]>(`/rest/v1/network_public_projections?${query}`)
  if (!result.ok) return result

  return {
    ok: true as const,
    data: result.data.map((row) => toNetworkPublicProjectionDTO(row)),
  }
}

export function projectPublicSummaries(rows: NetworkPublicProjectionRow[]): NetworkPublicProjectionDTO[] {
  return rows.map((row) => toNetworkPublicProjectionDTO(row))
}
