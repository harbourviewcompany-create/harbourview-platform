export const FORBIDDEN_PUBLIC_FIELD_NAMES = [
  'sourceUrl',
  'source_url',
  'sourceName',
  'source_name',
  'sourceCandidateId',
  'source_candidate_id',
  'contactEmail',
  'contact_email',
  'email',
  'sellerContactPrivate',
  'seller_contact_private',
  'sellerUrlPrivate',
  'seller_url_private',
  'sellerNamePrivate',
  'seller_name_private',
  'privateSpecs',
  'private_specs',
  'linkedinUrl',
  'linkedin_url',
  'provenance',
  'provenanceSummary',
  'sourceEvidence',
  'evidence',
  'evidenceHash',
  'evidenceSummaryPrivate',
  'evidence_summary_private',
  'licenceEvidence',
  'licenseEvidence',
  'diligenceStatus',
  'internalNotes',
  'internal_notes',
  'privateNotes',
  'private_notes',
  'analystAssessment',
  'privateAssessment',
  'rawScrapedText',
  'raw_scraped_text',
  'rawHtml',
  'raw_html',
  'rawText',
  'raw_text',
  'gatekeepers',
  'redFlags',
  'relationshipContext',
  'lastContactedAt',
  'nextFollowUpAt',
  'nextAction',
  'next_operator_action',
  'fitScore',
  'riskScore',
  // confidence_score is the public-safe Pipeline B instrument (0–100 from
  // signals.quality_confidence). See docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md.
  // Do not re-add it here.
  'commercial_relevance_score',
  'compliance_risk_score',
  'supportingSignals',
  'recommendedAction',
  // Legacy inverted keyword-density scorer — never project publicly under this key.
  'score',
  // Internal column name; public DTOs must expose confidence_score instead.
  'quality_confidence',
] as const

export const FORBIDDEN_PUBLIC_STRING_PATTERNS = [
  /sourceUrl/i,
  /source_url/i,
  /sourceName/i,
  /source_name/i,
  /sourceCandidateId/i,
  /source_candidate_id/i,
  /contactEmail/i,
  /contact_email/i,
  /sellerContactPrivate/i,
  /seller_contact_private/i,
  /sellerUrlPrivate/i,
  /seller_url_private/i,
  /sellerNamePrivate/i,
  /seller_name_private/i,
  /privateSpecs/i,
  /private_specs/i,
  /linkedin_url/i,
  /provenance/i,
  /sourceEvidence/i,
  /evidenceHash/i,
  /evidenceSummaryPrivate/i,
  /evidence_summary_private/i,
  /licen[cs]e evidence/i,
  /diligenceStatus/i,
  /internalNotes/i,
  /internal_notes/i,
  /privateNotes/i,
  /private_notes/i,
  /analystAssessment/i,
  /privateAssessment/i,
  /raw scraped text/i,
  /rawScrapedText/i,
  /raw_html/i,
  /rawText/i,
  /gatekeepers/i,
  /redFlags/i,
  /relationshipContext/i,
  /lastContactedAt/i,
  /nextFollowUpAt/i,
  /nextAction/i,
  /next_operator_action/i,
  /fitScore/i,
  /riskScore/i,
  // confidence_score intentionally omitted — public-safe.
  /commercial_relevance_score/i,
  /compliance_risk_score/i,
  /supportingSignals/i,
  /recommendedAction/i,
] as const

export function findForbiddenPublicFieldNames(value: unknown): string[] {
  const found = new Set<string>()

  function visit(input: unknown): void {
    if (!input || typeof input !== 'object') return

    if (Array.isArray(input)) {
      for (const item of input) visit(item)
      return
    }

    for (const [key, nested] of Object.entries(input as Record<string, unknown>)) {
      if ((FORBIDDEN_PUBLIC_FIELD_NAMES as readonly string[]).includes(key)) {
        found.add(key)
      }
      visit(nested)
    }
  }

  visit(value)
  return [...found].sort()
}

export function findForbiddenPublicStrings(value: unknown): string[] {
  const body = typeof value === 'string' ? value : JSON.stringify(value)
  return FORBIDDEN_PUBLIC_STRING_PATTERNS.filter((pattern) => pattern.test(body)).map((pattern) =>
    String(pattern),
  )
}

export function assertPublicSafe(value: unknown): void {
  const fields = findForbiddenPublicFieldNames(value)
  const strings = findForbiddenPublicStrings(value)
  if (fields.length || strings.length) {
    throw new Error(
      `Public projection contains forbidden content: fields=${fields.join(',')} patterns=${strings.join(',')}`,
    )
  }
}
