export const FORBIDDEN_PUBLIC_FIELD_NAMES = [
  'sourceUrl',
  'source_url',
  'sourceName',
  'source_name',
  'contactEmail',
  'contact_email',
  'email',
  'linkedinUrl',
  'linkedin_url',
  'provenance',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'auditTrail',
  'counterpartyIntelligence',
  'rawEvidenceUrl',
  'privateEvidence',
  'privateSourceUrl',
  'evidence',
  'evidenceHash',
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
  'fitScore',
  'riskScore',
  'supportingSignals',
  'recommendedAction'
] as const;

export const FORBIDDEN_PUBLIC_STRING_PATTERNS = [
  /sourceUrl/i,
  /source_url/i,
  /sourceName/i,
  /source_name/i,
  /contactEmail/i,
  /contact_email/i,
  /linkedin_url/i,
  /provenance/i,
  /sourceEvidence/i,
  /verificationStatus/i,
  /availabilityStatus/i,
  /sellerAuthorizationStatus/i,
  /internalReviewNotes/i,
  /reviewedBy/i,
  /lastReviewedAt/i,
  /nextReviewDueAt/i,
  /audit/i,
  /counterparty intelligence/i,
  /raw evidence url/i,
  /private evidence/i,
  /private source url/i,
  /evidenceHash/i,
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
  /fitScore/i,
  /riskScore/i,
  /supportingSignals/i,
  /recommendedAction/i
] as const;

export function findForbiddenPublicFieldNames(value: unknown): string[] {
  const found = new Set<string>();

  function visit(input: unknown): void {
    if (!input || typeof input !== 'object') return;

    if (Array.isArray(input)) {
      for (const item of input) visit(item);
      return;
    }

    for (const [key, nested] of Object.entries(input as Record<string, unknown>)) {
      if ((FORBIDDEN_PUBLIC_FIELD_NAMES as readonly string[]).includes(key)) {
        found.add(key);
      }
      visit(nested);
    }
  }

  visit(value);
  return [...found].sort();
}

export function findForbiddenPublicStrings(value: unknown): string[] {
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  return FORBIDDEN_PUBLIC_STRING_PATTERNS.filter((pattern) => pattern.test(body)).map((pattern) => String(pattern));
}

export function assertPublicSafe(value: unknown): void {
  const fields = findForbiddenPublicFieldNames(value);
  const strings = findForbiddenPublicStrings(value);
  if (fields.length || strings.length) {
    throw new Error(`Public projection contains forbidden content: fields=${fields.join(',')} patterns=${strings.join(',')}`);
  }
}
