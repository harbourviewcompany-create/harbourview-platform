import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Operator licence/certification detail — intel/operator tier
 * ─────────────────────────────────────────────────────────────
 * cannabis_operators (name, type, country) is already live and public —
 * shown today in MarketplacePage's "Verified Operators" sidebar. This adds
 * the layer on top that was built but never exposed: operator_licences
 * (98 rows, real named companies — licence class, GMP/GACP certification,
 * authorized activities per licence). Turns "this company exists" into
 * "this company is a certified match for this exact corridor" — the
 * competitive intelligence a professional actually needs to decide who to
 * approach, not just who's listed.
 *
 * Takes the operator IDs already resolved by getCannabisOperators rather
 * than re-deriving them, so this is a small, targeted addition, not a
 * rewrite of an existing, working function.
 */

export type OperatorLicenceSummary = {
  operatorId: string
  licenceClass: string | null
  issuingRegulator: string | null
  authorizedActivities: string[] | null
  gmpCertified: boolean | null
  gacpCertified: boolean | null
  facilityCity: string | null
  facilityProvinceState: string | null
}

export type OperatorLicenceMatrix =
  | { entitled: false }
  | { entitled: true; byOperatorId: Record<string, OperatorLicenceSummary[]> }

export async function getOperatorLicenceMatrix(operatorIds: string[]): Promise<OperatorLicenceMatrix> {
  if (operatorIds.length === 0) return { entitled: true, byOperatorId: {} }

  const supabase = await createClient()

  const { data: profile } = await supabase.from('user_profiles').select('tier').maybeSingle()
  // Paywall intentionally disabled -- business decision (Jul 2026): nothing is
  // gated behind tier right now, revisit later. Restore the line below to
  // re-enable (kept, not deleted, for exactly that reason).
  void profile
  // const tier = profile?.tier
  // if (tier !== 'intel' && tier !== 'operator') return { entitled: false }

  const { data } = await supabase
    .from('operator_licences')
    .select(
      'operator_id, licence_class, issuing_regulator, authorized_activities, gmp_certified, gacp_certified, facility_city, facility_province_state',
    )
    .in('operator_id', operatorIds)
    .eq('licence_status', 'active')

  const byOperatorId: Record<string, OperatorLicenceSummary[]> = {}
  for (const row of data ?? []) {
    const entry: OperatorLicenceSummary = {
      operatorId: row.operator_id,
      licenceClass: row.licence_class,
      issuingRegulator: row.issuing_regulator,
      authorizedActivities: row.authorized_activities,
      gmpCertified: row.gmp_certified,
      gacpCertified: row.gacp_certified,
      facilityCity: row.facility_city,
      facilityProvinceState: row.facility_province_state,
    }
    if (!byOperatorId[row.operator_id]) byOperatorId[row.operator_id] = []
    byOperatorId[row.operator_id].push(entry)
  }

  return { entitled: true, byOperatorId }
}
