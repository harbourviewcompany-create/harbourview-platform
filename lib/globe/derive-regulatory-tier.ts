/**
 * TypeScript mirror of `api.derive_regulatory_tier(program_status)`.
 *
 * Keep behaviour aligned with:
 *   supabase/migrations/20260819153000_regulatory_tier_classifier_clause_scope_hardening.sql
 *
 * The string passed here may be canonical full briefing text produced by
 * `api.briefing_classifier_text(...)`, which joins fields with ` | `.
 * Used only for unit tests and offline diagnostics — production classification
 * runs in Postgres.
 */

import type { RegulatoryTier } from './globe-materials'

const UNDER_DISCUSSION =
  /(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)/i

const CBD_HEMP =
  /(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)/i

const EXPORT_COMMERCIAL =
  /(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)/i

const EXPORT_NEGATED =
  /(?:no|not|without|never|lack of|lacks?|lacking|absent|does\s+not)\s+(?:longer\s+|currently\s+)?(?:(?:has?|have|operates?|supports?|maintains?)\s+)?(?:(?:a|an|any)\s+)?(?:licensed\s+)?(?:commercial\s+)?(?:export (?:industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)/i

const EXPORT_UNDER_DISCUSSION = /export licensing under (discussion|consideration|review)/i

const IMPORT_COMMERCIAL =
  /(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)/i

const IMPORT_NEGATED =
  /(?:no|not|without|never|lack of|lacks?|lacking|absent|does\s+not)\s+(?:longer\s+|currently\s+)?(?:(?:has?|have|operates?|supports?|maintains?)\s+)?(?:(?:a|an|any)\s+)?(?:licensed\s+)?(?:(?:commercial|medical)\s+)?(?:licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)/i

const IMPORT_UNDER_DISCUSSION = /import licensing under (discussion|consideration|review)/i

const INDUSTRIAL = /industrial (cultivation licensed|legal)/i
const ADULT_USE_FEDERAL = /adult-use legal — federal/i

const DOMESTIC_ADULT =
  /(adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail)/i

const MEDICAL =
  /(medical legal\b|medical\s*(?:—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)/i

const MEDICAL_NEGATED =
  /(no medical programme|no medical program|medical (reform|programme|program|access|legalization|legalisation|licensing)( remains?)? under (active )?(consideration|discussion|review))/i

function classifierClauses(programStatus: string): string[] {
  return programStatus.split(/[.;,|]+|\s+(?:and|but|however)\s+/i)
}

function hasAffirmativeTradeClause(
  programStatus: string,
  affirmative: RegExp,
  negated: RegExp,
  underDiscussion: RegExp,
): boolean {
  return classifierClauses(programStatus).some(
    (segment) =>
      affirmative.test(segment) && !negated.test(segment) && !underDiscussion.test(segment),
  )
}

/**
 * Derive a regulatory tier from canonical jurisdiction briefing text.
 * Returns null only when there is no usable signal.
 */
export function deriveRegulatoryTier(programStatus: string | null | undefined): RegulatoryTier | null {
  const ps = programStatus ?? ''
  if (ps.trim() === '') return null

  const underDiscussion = UNDER_DISCUSSION.test(ps)
  const exportCommercial = hasAffirmativeTradeClause(
    ps,
    EXPORT_COMMERCIAL,
    EXPORT_NEGATED,
    EXPORT_UNDER_DISCUSSION,
  )
  const importCommercial = hasAffirmativeTradeClause(
    ps,
    IMPORT_COMMERCIAL,
    IMPORT_NEGATED,
    IMPORT_UNDER_DISCUSSION,
  )

  if (/prohibited/i.test(ps) && CBD_HEMP.test(ps) && !/(research (interest|developing)|informal)/i.test(ps)) {
    return 'cbd_hemp_only'
  }

  if (exportCommercial || importCommercial) {
    return 'legal_commercial_access'
  }

  if (!underDiscussion) {
    if (INDUSTRIAL.test(ps)) {
      return 'legal_commercial_access'
    }
    if (ADULT_USE_FEDERAL.test(ps)) {
      return 'legal_commercial_access'
    }
  }

  if (DOMESTIC_ADULT.test(ps)) {
    return 'domestic_only'
  }

  if (MEDICAL.test(ps) && !MEDICAL_NEGATED.test(ps)) {
    return 'medical_limited_trade'
  }

  return 'prohibited'
}
