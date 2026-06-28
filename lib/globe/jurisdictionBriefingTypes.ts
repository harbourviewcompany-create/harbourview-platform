/**
 * Shared type for a cc_jurisdiction_briefings row as consumed by
 * globe-facing components (MarketOverviewSheet) and server actions
 * (getJurisdictionBriefing).
 *
 * Kept intentionally narrower than the full CcBriefingRow in
 * jurisdictionBriefingData.ts — only the fields needed for the
 * globe sheet and public-facing server action are included here.
 * Add columns here when they need to surface in the sheet.
 */
export interface JurisdictionBriefing {
  jurisdiction_slug: string
  program_status: string | null
  public_summary: string | null
  patient_access: string | null
  physician_access: string | null
  market_dynamics: string | null
  regulatory_outlook: string | null
  regulatory_body: string | null
  last_reviewed_date: string | null
  // Confidence — added by migration 20260628000001
  // NULL when not yet scored; number 0-100 when reviewed
  confidence_score: number | null
  // Per-category breakdown. Shape mirrors CCConfidenceContract.categories.
  // [{label: string, pct: number | null, reviewState: 'reviewed'|'pending'}]
  confidence_categories: Array<{
    label: string
    pct: number | null
    reviewState: 'reviewed' | 'pending'
  }> | null
}

export const BRIEFING_SELECT =
  'jurisdiction_slug,program_status,public_summary,patient_access,' +
  'physician_access,market_dynamics,regulatory_outlook,regulatory_body,' +
  'last_reviewed_date,confidence_score,confidence_categories'
