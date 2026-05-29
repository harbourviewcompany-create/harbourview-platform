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

  'source_url',
  'raw source URLs',
  'internal provenance',
  'analyst notes',
  'unreviewed counterparty identities',
  'private buyer',
  'private seller',
  'private review status internals',
  'reviewer fields',
  'service role data',
  'admin-only fields',
  'non-public transaction data',
  'sensitive documents',
  'raw intelligence records',
]

export function assertDashboardDtoPublicSafe(dto: unknown) {
  const serialized = JSON.stringify(dto).toLowerCase()
  return DASHBOARD_FORBIDDEN_PUBLIC_STRINGS.filter((forbidden) => serialized.includes(forbidden.toLowerCase()))
}
