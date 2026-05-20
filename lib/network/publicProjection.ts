import type { PublicNetworkCountryDTO } from './types'
import type { NetworkPublicProjectionRow, NetworkReviewItemRow } from './serverTypes'

export type NetworkPublicProjectionDTO = PublicNetworkCountryDTO & {
  objectType: NetworkPublicProjectionRow['object_type']
  countryLabel: string | null
  categoryLabel: string | null
  publishedAt: string
  version: number
}

export function toNetworkPublicProjectionDTO(row: NetworkPublicProjectionRow): NetworkPublicProjectionDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    publicSummary: row.public_summary,
    objectType: row.object_type,
    countryLabel: row.country_label,
    categoryLabel: row.category_label,
    publishedAt: row.published_at,
    version: row.version,
  }
}

export function hasPrivateReviewFields(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const serialized = JSON.stringify(value)
  return ['private_analyst_notes', 'title_internal', 'suppressed_fields', 'reviewed_by'].some((key) => serialized.includes(key))
}

export function assertNoPrivateReviewFieldExposure(value: unknown) {
  if (hasPrivateReviewFields(value)) {
    throw new Error('Network public projection payload leaked private review fields.')
  }
}

export function toSafePublicDTOFromReviewProjection(review: NetworkReviewItemRow, projection: NetworkPublicProjectionRow): NetworkPublicProjectionDTO {
  const dto = toNetworkPublicProjectionDTO(projection)
  assertNoPrivateReviewFieldExposure({ dto, reviewItemId: review.id })
  return dto
}
