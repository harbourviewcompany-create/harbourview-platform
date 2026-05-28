export const DASHBOARD_FORBIDDEN_PUBLIC_STRINGS = [
  'sourceUrl',
  'sourceName',
  'sourceEvidence',
  'provenanceSummary',
  'internalReviewNotes',
  'reviewerNotes',
  'supplierContact',
  'supplierName',
  'privateEvidence',
  'rawSource',
  'adminOnly',
  'unpublished',
  'counterpartyNotes',
  'buyerIdentity',
  'sellerIdentity',
  'dealTerms',
  'confidential',
  'private COA',
  'inventory available',
  'verified buyer',
  'verified seller',
]

export function assertDashboardDtoPublicSafe(dto: unknown) {
  const serialized = JSON.stringify(dto)
  return DASHBOARD_FORBIDDEN_PUBLIC_STRINGS.filter((forbidden) => serialized.includes(forbidden))
}
