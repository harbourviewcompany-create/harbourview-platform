export type CapabilityVisibility = 'public' | 'private' | 'admin-only' | 'mixed'

export type CapabilityCriticality = 'launch-critical' | 'later-enabled'

export type CapabilityStatus =
  | 'built'
  | 'partial'
  | 'missing'
  | 'request-only'
  | 'admin-backed'
  | 'static-orientation'
  | 'draft-orientation'
  | 'fallback-backed'
  | 'later-enabled'

export type ContentOrigin =
  | 'live-approved'
  | 'admin-reviewed'
  | 'static-fixture'
  | 'fallback-fixture'
  | 'draft-orientation'
  | 'request-only'
  | 'later-enabled'

export type ReviewSensitivity =
  | 'standard'
  | 'medical'
  | 'clinical'
  | 'regulatory'
  | 'legal'
  | 'quality-gmp'
  | 'commercial'
  | 'counterparty'
  | 'intelligence'

export function isFallbackOrigin(origin: ContentOrigin) {
  return origin === 'fallback-fixture' || origin === 'static-fixture' || origin === 'draft-orientation'
}

export function getCapabilityStatusLabel(status: CapabilityStatus) {
  switch (status) {
    case 'built':
      return 'Built and evidence-backed'
    case 'partial':
      return 'Partial capability — review required'
    case 'request-only':
      return 'Request only — reviewed routing required'
    case 'admin-backed':
      return 'Admin reviewed before publication'
    case 'static-orientation':
      return 'Static orientation — not live intelligence'
    case 'draft-orientation':
      return 'Draft orientation — source review required'
    case 'fallback-backed':
      return 'Fallback orientation — live records not currently shown'
    case 'later-enabled':
      return 'Later enabled — not publicly active'
    case 'missing':
    default:
      return 'Missing required capability'
  }
}
