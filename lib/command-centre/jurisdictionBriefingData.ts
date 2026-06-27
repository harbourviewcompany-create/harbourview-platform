import { createClient } from '@supabase/supabase-js'
import type {
  JurisdictionRouteContract,
  CCResolvedRoute,
  CCReviewState,
  CCWatchRegion,
  CCChangeNote,
} from './jurisdictionRouteContext'
import { buildJurisdictionContract } from './jurisdictionRouteContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ── DB row shape ───────────────────────────────────────────────────────────────

interface CcBriefingRow {
  program_status: string | null
  public_summary: string | null
  patient_access: string | null
  physician_access: string | null
  market_dynamics: string | null
  regulatory_outlook: string | null
  regulatory_body: string | null
  data_source_summary: string | null
  verification_summary: string | null
  update_cadence: string | null
  coverage_summary: string | null
  last_reviewed_date: string | null
  watch_regions: CCWatchRegion[] | null
  change_notes: CCChangeNote[] | null
  review_state: CCReviewState
}

// ── Trajectory fallback ────────────────────────────────────────────────────────

/**
 * Returns a formatted regulatory outlook string from hv_regulatory_trajectory
 * when cc_jurisdiction_briefings has no manual regulatory_outlook for this ISO.
 */
async function fetchTrajectoryFallback(iso2: string): Promise<string | null> {
  const { data } = await supabase
    .from('hv_regulatory_trajectory')
    .select('trajectory, sentiment_score, key_themes, summary_text, period_end')
    .eq('iso', iso2)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data || !data.summary_text) return null

  const TRAJECTORY_LABEL: Record<string, string> = {
    liberalising: 'Liberalising', tightening: 'Tightening',
    stable: 'Stable', uncertain: 'Uncertain', no_data: '',
  }
  const label = TRAJECTORY_LABEL[data.trajectory as string] ?? ''
  const themes = Array.isArray(data.key_themes) && data.key_themes.length > 0
    ? ` Key themes: ${(data.key_themes as string[]).slice(0, 3).join(', ')}.`
    : ''

  return label
    ? `${label}: ${data.summary_text}${themes}`
    : `${data.summary_text}${themes}`
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a jurisdiction briefing row from cc_jurisdiction_briefings.
 * Tries state slug first, falls back to country slug.
 * Returns null if no row found.
 */
async function fetchBriefingRow(
  route: CCResolvedRoute,
): Promise<CcBriefingRow | null> {
  const slug = route.stateSlug ?? route.countrySlug

  const { data, error } = await supabase
    .from('cc_jurisdiction_briefings')
    .select(
      'program_status,public_summary,patient_access,physician_access,market_dynamics,' +
      'regulatory_outlook,regulatory_body,data_source_summary,verification_summary,' +
      'update_cadence,coverage_summary,last_reviewed_date,watch_regions,change_notes,review_state',
    )
    .eq('jurisdiction_slug', slug)
    .eq('country_iso2', route.countryIso2)
    .maybeSingle()

  if (error) {
    console.error('[cc-briefing] DB error:', error.message)
    return null
  }
  return data as CcBriefingRow | null
}

// ── Contract builder ───────────────────────────────────────────────────────────

/**
 * Build a fully populated JurisdictionRouteContract from DB data.
 * Fields missing from the DB row fall back to pending/unavailable states.
 * No fake data. No raw DB enum values in output.
 */
export async function buildLiveJurisdictionContract(
  route: CCResolvedRoute,
): Promise<JurisdictionRouteContract> {
  const [row, trajectoryText] = await Promise.all([
    fetchBriefingRow(route),
    fetchTrajectoryFallback(route.countryIso2),
  ])

  // No DB row — return base contract enriched with live trajectory if available
  if (!row) {
    const base = buildJurisdictionContract(route)
    if (trajectoryText) {
      base.briefing.regulatoryOutlook = trajectoryText
    }
    return base
  }

  const reviewState: CCReviewState = row.review_state ?? 'pending'

  // Watch regions: use DB data if present, else default to current market only
  const watchRegions = row.watch_regions && row.watch_regions.length > 0
    ? { reviewState, isDefaultSuggested: false, regions: row.watch_regions }
    : {
        reviewState: 'pending' as CCReviewState,
        isDefaultSuggested: false,
        regions: [{
          name: route.stateName ?? route.countryName,
          href: `/country/${route.countrySlug}`,
          statusLabel: 'Current market',
          isActive: true,
          isAvailable: true,
        }],
      }

  // Change notes: use DB data if present, else pending
  const changeNotes = row.change_notes && row.change_notes.length > 0
    ? { reviewState, notes: row.change_notes }
    : { reviewState: 'pending' as CCReviewState, notes: [] }

  // Data source label: include regulatory body if available
  const dataSourceSummary = row.data_source_summary
    ?? (row.regulatory_body ? `Source: ${row.regulatory_body}` : null)

  return {
    route,
    briefing: {
      publicSummary: row.public_summary ?? null,
      programStatus: row.program_status ?? null,
      programStatusReviewState: row.program_status ? reviewState : 'pending',
      patientAccess: row.patient_access ?? null,
      physicianAccess: row.physician_access ?? null,
      marketDynamics: row.market_dynamics ?? null,
      regulatoryOutlook: row.regulatory_outlook ?? trajectoryText ?? null,
    },
    evidence: {
      dataSourceSummary,
      verificationSummary: row.verification_summary ?? null,
      updateCadence: row.update_cadence ?? null,
      coverageSummary: row.coverage_summary ?? null,
      lastReviewedDate: row.last_reviewed_date ?? null,
      reviewState: row.data_source_summary ? reviewState : 'pending',
    },
    confidence: {
      overall: null,
      reviewState: 'pending',
      categories: [
        'Regulatory', 'Market Data', 'Access Pathway', 'Local Intel', 'Education Content',
      ].map(label => ({ label, pct: null, reviewState: 'pending' as CCReviewState })),
    },
    watchRegions,
    changeNotes,
    ctas: {
      fullProfileHref: null,
      fullProfileAvailable: false,
      confidenceMethodologyHref: '/source-methodology',
      confidenceMethodologyAvailable: true,
      allJurisdictionsHref: '/dashboard',
      changeActivityHref: null,
      changeActivityAvailable: false,
    },
  }
}
