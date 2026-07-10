import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getGenericPathwayTemplate } from './genericPathways'

// ── 1. Pipeline counts from marketplace_inquiries ────────────────────────────────────────────
export type PipelineCounts = {
  wanted: number
  matched: number
  proof_review: number
  inquiry: number
  deal_room: number
}

export async function getPipelineCounts(): Promise<PipelineCounts> {
  // Returns platform-wide aggregate counts (not scoped to the current user).
  // Access is gated by the /dashboard auth middleware.
  // Uses HEAD count queries — zero row data transfer, one DB round-trip per
  // status bucket. Replaces the previous full table scan + in-memory reduce.
  const fallback: PipelineCounts = { wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }
  try {
    const supabase = await createClient()

    const [inquiryRes, proofRes, matchedRes, dealRes] = await Promise.all([
      supabase
        .from('marketplace_inquiries')
        .select('*', { count: 'exact', head: true })
        .in('review_status', ['received', 'reviewing']),
      supabase
        .from('marketplace_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'contacted'),
      supabase
        .from('marketplace_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'qualified'),
      supabase
        .from('marketplace_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'closed'),
    ])

    return {
      wanted:       0, // wanted_requests are tracked in listings, not inquiries
      inquiry:      inquiryRes.count   ?? 0,
      proof_review: proofRes.count     ?? 0,
      matched:      matchedRes.count   ?? 0,
      deal_room:    dealRes.count      ?? 0,
    }
  } catch { return fallback }
}

// ── 2. Wanted listings (full rows) ─────────────────────────────────────────────────────
export type WantedListing = {
  id: string
  title: string
  summary: string | null
  location_country: string | null
  location_region: string | null
  created_at: string
}

export async function getWantedListings(countryIso2?: string | null): Promise<WantedListing[]> {
  try {
    const supabase = await createClient()

    // Try country-filtered first; fall back to all if empty
    const buildQuery = (country?: string | null) => {
      let q = supabase
        .from('listings')
        .select('id, title, description, location_country, created_at')
        .eq('marketplace_section', 'wanted_requests')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12)
      if (country) q = q.eq('location_country', country.toUpperCase())
      return q
    }

    // listings has no summary/location_region columns (real column is
    // description, no geo-region breakdown) - map onto the WantedListing
    // shape so callers keep the same field names/types.
    const toWantedListing = (row: { id: string; title: string; description: string | null; location_country: string | null; created_at: string }): WantedListing => ({
      id: row.id,
      title: row.title,
      summary: row.description,
      location_country: row.location_country,
      location_region: null,
      created_at: row.created_at,
    })

    if (countryIso2) {
      const { data: countryData, error: countryErr } = await buildQuery(countryIso2)
      if (!countryErr && countryData && countryData.length > 0) return countryData.map(toWantedListing)
    }

    // Global fallback
    const { data, error } = await buildQuery()
    if (error || !data) return []
    return data.map(toWantedListing)
  } catch { return [] }
}

// ── 3. Education tiles from DB ───────────────────────────────────────────────────────
export type LiveEduTile = {
  icon: string
  title: string
  desc: string
  slug: string
  sections?: { heading: string; body: string }[]
}

const AUDIENCE_ICON: Record<string, string> = {
  doctor_prescriber: '🩺', pharmacist: '💊', lab_qa: '🧪',
  gmp_quality: '📋', cultivator_producer: '🌿', importer: '📦',
  exporter: '✈️', investor_operator: '📈', regulatory_compliance: '⚖️',
  patient_caregiver_education: '🩺', general: '📖',
}

export async function getLiveEduTiles(roleId?: string | null, limit = 6): Promise<LiveEduTile[]> {
  try {
    const supabase = await createClient()

    // Push role filtering to the DB rather than over-fetching 3x and slicing
    // in memory. Try role-specific modules first; fall back to 'general'
    // audience if nothing matches so the tile section is never empty.
    let modules: Array<{ id: string; slug: string; title: string; description: string | null; audience: string[]; sensitivity: string; track_id: string }> | null = null
    let error: unknown = null

    if (roleId) {
      // Postgres array overlap: contains(audience, ARRAY[roleId])
      const res = await supabase
        .from('education_modules')
        .select('id, slug, title, description, audience, sensitivity, track_id')
        .eq('publication_state', 'published')
        .contains('audience', [roleId])
        .limit(limit)
      error = res.error
      modules = res.data
    }

    // Fall back to general if role match returned nothing
    if (!modules || modules.length === 0) {
      const res = await supabase
        .from('education_modules')
        .select('id, slug, title, description, audience, sensitivity, track_id')
        .eq('publication_state', 'published')
        .contains('audience', ['general'])
        .limit(limit)
      error = res.error
      modules = res.data
    }

    if (error || !modules || modules.length === 0) return []

    // No in-memory scoring needed — DB already filtered by role
    const scored = modules

    // One bounded query for real body content across all resolved modules,
    // instead of the client falling back to generic templated text per topic
    // (getModuleContent() in MobileCommandCentre.tsx) when a tile is opened.
    const moduleIds = scored.map((m) => m.id)
    const sectionsByModule = new Map<string, { heading: string; body: string; order: number }[]>()
    if (moduleIds.length > 0) {
      const { data: sectionRows } = await supabase
        .from('education_module_sections')
        .select('module_id, heading, body, section_order')
        .in('module_id', moduleIds)
        .order('section_order', { ascending: true })
      for (const row of sectionRows ?? []) {
        const list = sectionsByModule.get(row.module_id) ?? []
        list.push({ heading: row.heading, body: row.body, order: row.section_order })
        sectionsByModule.set(row.module_id, list)
      }
    }

    const truncateDescription = (description?: string | null): string => {
      const normalized = description?.trim().replace(/\s+/g, ' ') || 'Education module'
      return normalized.length > 120 ? `${normalized.slice(0, 119)}…` : normalized
    }

    return scored.map(m => ({
      icon: (roleId && AUDIENCE_ICON[roleId]) ?? '📖',
      title: m.title,
      desc: m.sensitivity === 'controlled' ? 'Controlled topic — professional access' : truncateDescription(m.description),
      slug: m.slug,
      sections: (sectionsByModule.get(m.id) ?? [])
        .sort((a, b) => a.order - b.order)
        .map(({ heading, body }) => ({ heading, body })),
    }))
  } catch { return [] }
}

// ── 4. Country intelligence profile ────────────────────────────────────────────

export type FieldChange = {
  id: string
  table_name: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  source_label: string | null
}

export type RegulatoryCalendarEvent = {
  id: string
  iso2: string
  event_type: string
  title: string
  summary: string | null
  expected_date: string | null
  confidence: string
  source_url: string | null
  source_label: string | null
  status: string
}
export type CountryIntelProfile = {
  // Core fields — always present
  country_code: string
  country_name: string
  public_summary: string | null
  commercial_pathway_summary: string | null
  review_status: string
  regulatory_tier?: string | null
  confidence_score?: number | null
  // Extended country status fields — present when fetched from public.countries
  region?: string | null
  market_access_status?: string | null
  medical_status?: string | null
  adult_use_status?: string | null
  import_status?: string | null
  export_status?: string | null
  opportunity_score?: number | null
  trade_roles?: string[] | null
  opportunity_categories?: string[] | null
  regulator_label?: string | null
  data_completeness?: string | null
  // Jurisdiction briefing — rich narrative content from cc_jurisdiction_briefings
  briefing_program_status?: string | null
  briefing_patient_access?: string | null
  briefing_physician_access?: string | null
  briefing_market_dynamics?: string | null
  briefing_regulatory_outlook?: string | null
  briefing_regulatory_body?: string | null
  briefing_last_reviewed?: string | null
  // Change tracking — field-level history
  recentChanges?: FieldChange[]
  // Forward-looking regulatory calendar
  calendarEvents?: RegulatoryCalendarEvent[]
}

const _INTEL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const _INTEL_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export type JurisdictionEvidenceStatus = {
  verified: boolean
  lastVerifiedAt: string | null
  confidenceLabel: string | null
}

// Real, differentiated evidence signal for country-role-resolver.ts's evidenceVerified
// field. Backed by jurisdiction_playbooks.status: 'published' rows are editorially
// reviewed pathway guides with real steps/regulators/pitfalls; 'draft' rows (167 of
// 203 as of 2026-07-08) are not yet reviewed and must not be presented as verified.
// Deliberately NOT using cc_jurisdiction_briefings.confidence_score here — verified
// live (2026-07-08) to be a uniform 0.72 across all 203 country rows, i.e. a seeded
// default, not a real per-country signal.
export async function getJurisdictionEvidenceStatus(iso2: string | null): Promise<JurisdictionEvidenceStatus> {
  const fallback: JurisdictionEvidenceStatus = { verified: false, lastVerifiedAt: null, confidenceLabel: null }
  if (!iso2) return fallback
  const safeIso2 = iso2.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (safeIso2.length < 2) return fallback
  if (!_INTEL_SUPABASE_URL || !_INTEL_SUPABASE_KEY) return fallback

  try {
    const res = await fetch(
      `${_INTEL_SUPABASE_URL}/rest/v1/jurisdiction_playbooks?select=status,last_verified_at,confidence_label&country_iso2=eq.${safeIso2}&status=eq.published&limit=1`,
      {
        headers: {
          apikey: _INTEL_SUPABASE_KEY,
          Authorization: `Bearer ${_INTEL_SUPABASE_KEY}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      },
    )
    if (!res.ok) return fallback
    const rows: { status: string; last_verified_at: string | null; confidence_label: string | null }[] = await res.json()
    const row = rows[0]
    if (!row) return fallback
    return { verified: true, lastVerifiedAt: row.last_verified_at, confidenceLabel: row.confidence_label }
  } catch {
    return fallback
  }
}

export async function getCountryIntelProfile(iso2: string | null): Promise<CountryIntelProfile | null> {
  if (!iso2) return null
  const safeIso2 = iso2.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (safeIso2.length < 2) return null
  if (!_INTEL_SUPABASE_URL || !_INTEL_SUPABASE_KEY) return null

  const hdr = {
    apikey: _INTEL_SUPABASE_KEY,
    Authorization: `Bearer ${_INTEL_SUPABASE_KEY}`,
    Accept: 'application/json',
  }

  try {
    // All three queries run in parallel — direct REST so this works for both
    // authenticated and unauthenticated callers (bypasses the cookie-session client).
    const [cdRes, ciRes, jbRes] = await Promise.all([
      fetch(
        `${_INTEL_SUPABASE_URL}/rest/v1/countries?select=country_name,iso_alpha2,region,subregion,market_access_status,medical_status,adult_use_status,import_status,export_status,signals_status,opportunity_score,data_completeness,public_summary,trade_roles,opportunity_categories,regulator_label,last_updated_label&iso_alpha2=eq.${safeIso2}&limit=1`,
        { headers: hdr },
      ),
      fetch(
        `${_INTEL_SUPABASE_URL}/rest/v1/country_intel?select=public_summary,commercial_pathway_summary,review_status,regulatory_tier,last_reviewed_at&country_code=eq.${safeIso2}&review_status=in.(approved,active)&order=last_reviewed_at.desc&limit=1`,
        { headers: hdr },
      ),
      fetch(
        `${_INTEL_SUPABASE_URL}/rest/v1/cc_jurisdiction_briefings?select=program_status,patient_access,physician_access,market_dynamics,regulatory_outlook,regulatory_body,confidence_score,last_reviewed_date&country_iso2=eq.${safeIso2}&jurisdiction_type=eq.country&order=last_reviewed_date.desc&limit=1`,
        { headers: hdr },
      ),
    ])

    if (!cdRes.ok) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cdRows: any[] = await cdRes.json()
    const cd = cdRows[0]
    if (!cd) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ciRows: any[] = ciRes.ok ? await ciRes.json() : []
    const ci = ciRows[0] ?? null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jbRows: any[] = jbRes.ok ? await jbRes.json() : []
    const jb = jbRows[0] ?? null

    // Change tracking + calendar via RPC REST calls (parallel, best-effort)
    const [changesRes, calendarRes] = await Promise.all([
      fetch(`${_INTEL_SUPABASE_URL}/rest/v1/rpc/get_field_changes_for_country`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_iso2: safeIso2, p_limit: 10 }),
      }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${_INTEL_SUPABASE_URL}/rest/v1/rpc/get_regulatory_calendar`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_iso2: safeIso2, p_limit: 10 }),
      }).then(r => r.ok ? r.json() : []).catch(() => []),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentChanges: FieldChange[] = (Array.isArray(changesRes) ? changesRes : []).map((r: any) => ({
      id: r.id, table_name: r.table_name, field_name: r.field_name,
      old_value: r.old_value ?? null, new_value: r.new_value ?? null,
      changed_at: r.changed_at, source_label: r.source_label ?? null,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calendarEvents: RegulatoryCalendarEvent[] = (Array.isArray(calendarRes) ? calendarRes : []).map((r: any) => ({
      id: r.id, iso2: r.iso2, event_type: r.event_type, title: r.title,
      summary: r.summary ?? null, expected_date: r.expected_date ?? null,
      confidence: r.confidence, source_url: r.source_url ?? null,
      source_label: r.source_label ?? null, status: r.status,
    }))

    return {
      country_code:               cd.iso_alpha2,
      country_name:               cd.country_name,
      public_summary:             ci?.public_summary ?? cd.public_summary,
      commercial_pathway_summary: ci?.commercial_pathway_summary ?? null,
      review_status:              ci?.review_status ?? 'active',
      regulatory_tier:            ci?.regulatory_tier ?? null,
      region:                     cd.region,
      market_access_status:       cd.market_access_status,
      medical_status:             cd.medical_status,
      adult_use_status:           cd.adult_use_status,
      import_status:              cd.import_status,
      export_status:              cd.export_status,
      opportunity_score:          cd.opportunity_score,
      trade_roles:                cd.trade_roles,
      opportunity_categories:     cd.opportunity_categories,
      regulator_label:            cd.regulator_label,
      data_completeness:          cd.data_completeness,
      briefing_program_status:    jb?.program_status ?? null,
      briefing_patient_access:    jb?.patient_access ?? null,
      briefing_physician_access:  jb?.physician_access ?? null,
      briefing_market_dynamics:   jb?.market_dynamics ?? null,
      briefing_regulatory_outlook: jb?.regulatory_outlook ?? null,
      briefing_regulatory_body:    jb?.regulatory_body ?? null,
      confidence_score:            jb?.confidence_score != null ? Number(jb.confidence_score) : null, // NOTE: verified 2026-07-08 to be a uniform 0.72 seed value across all 203 countries -- not a real per-country signal, see getJurisdictionEvidenceStatus comment above
      briefing_last_reviewed:      jb?.last_reviewed_date ?? null,
      recentChanges,
      calendarEvents,
    }
  } catch (err) {
    console.error('[getCountryIntelProfile] unexpected error:', err)
    return null
  }
}

// ── getFieldChangesForCountry ─────────────────────────────────────────────────

export async function getFieldChangesForCountry(iso2: string, limit = 20): Promise<FieldChange[]> {
  const url = _INTEL_SUPABASE_URL
  const key = _INTEL_SUPABASE_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/rpc/get_field_changes_for_country`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_iso2: iso2.toUpperCase(), p_limit: limit }),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = res.ok ? await res.json() : []
    return data.map(r => ({
      id: r.id, table_name: r.table_name, field_name: r.field_name,
      old_value: r.old_value ?? null, new_value: r.new_value ?? null,
      changed_at: r.changed_at, source_label: r.source_label ?? null,
    }))
  } catch { return [] }
}

// ── getRegulatoryCalendar ─────────────────────────────────────────────────────

export async function getRegulatoryCalendar(iso2?: string | null, limit = 30): Promise<RegulatoryCalendarEvent[]> {
  const url = _INTEL_SUPABASE_URL
  const key = _INTEL_SUPABASE_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/rpc/get_regulatory_calendar`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_iso2: iso2 ? iso2.toUpperCase() : null, p_limit: limit }),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = res.ok ? await res.json() : []
    return data.map(r => ({
      id: r.id, iso2: r.iso2, event_type: r.event_type, title: r.title,
      summary: r.summary ?? null, expected_date: r.expected_date ?? null,
      confidence: r.confidence, source_url: r.source_url ?? null,
      source_label: r.source_label ?? null, status: r.status,
    }))
  } catch { return [] }
}

// ── getCountryStatusFromDB ────────────────────────────────────────────────────
// Fetches real country status from the countries table (191 countries seeded
// June 2026) for the countryIntel prop in CommandCentre.

export interface CountryStatus {
  country_name: string
  iso_alpha2: string
  region: string | null
  subregion: string | null
  market_access_status: string | null
  medical_status: string | null
  adult_use_status: string | null
  import_status: string | null
  export_status: string | null
  signals_status: string | null
  opportunity_score: number | null
  data_completeness: string | null
  public_summary: string | null
  trade_roles: string[] | null
  opportunity_categories: string[] | null
  regulator_label: string | null
  last_updated_label: string | null
}

export async function getCountryStatusFromDB(
  iso2: string | null | undefined,
): Promise<CountryStatus | null> {
  if (!iso2) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('countries')
      .select(
        'country_name, iso_alpha2, region, subregion, market_access_status, medical_status, adult_use_status, import_status, export_status, signals_status, opportunity_score, data_completeness, public_summary, trade_roles, opportunity_categories, regulator_label, last_updated_label',
      )
      .eq('iso_alpha2', iso2.toUpperCase())
      .single()

    if (error || !data) return null
    return data as unknown as CountryStatus
  } catch {
    return null
  }
}

// ── 5. Access Pathway data ────────────────────────────────────────────────────────────
export type PathwayData = {
  template:            { id: string; name: string; total_steps: number } | null
  steps:               { id: string; step_number: number; title: string; description: string | null; unlock_condition: string }[]
  requirements:        { id: string; step_id: string; title: string; description: string | null; evidence_type: string; is_required: boolean; sort_order: number }[]
  progress:            { current_step: number; status: string; last_action_at: string } | null
  requirementStatuses: { requirement_id: string; status: 'pending'|'in_review'|'verified'|'rejected'|'waived'; submitted_at: string | null; reviewed_at: string | null }[]
}

export async function getOrgPathwayProgress(
  userId:      string | null,
  countryIso2: string | null,
  roleId:      string | null,
): Promise<PathwayData> {
  const empty: PathwayData = {
    template: null, steps: [], requirements: [], progress: null, requirementStatuses: [],
  }
  if (!userId || !countryIso2 || !roleId) return empty
  try {
    const supabase = await createClient()

    // Resolve org
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    const orgId = membership?.workspace_id
    if (!orgId) return empty

    // Pathway template for this country + role
    const { data: template } = await supabase
      .from('cc_pathway_templates')
      .select('id, name, total_steps')
      .eq('country_iso2', countryIso2.toUpperCase())
      .eq('role_id', roleId)
      .maybeSingle()
    if (!template) return empty

    // Steps
    const { data: steps } = await supabase
      .from('cc_pathway_steps')
      .select('id, step_number, title, description, unlock_condition')
      .eq('template_id', template.id)
      .order('step_number')

    const stepIds = (steps ?? []).map(s => s.id)

    // Requirements
    const { data: requirements } = stepIds.length
      ? await supabase
          .from('cc_pathway_step_requirements')
          .select('id, step_id, title, description, evidence_type, is_required, sort_order')
          .in('step_id', stepIds)
          .order('sort_order')
      : { data: [] }

    const reqIds = (requirements ?? []).map(r => r.id)

    // Org-level progress
    const { data: progress } = await supabase
      .from('cc_org_pathway_progress')
      .select('current_step, status, last_action_at')
      .eq('org_id', orgId)
      .eq('template_id', template.id)
      .single()

    // Per-requirement statuses
    const { data: requirementStatuses } = reqIds.length
      ? await supabase
          .from('cc_org_requirement_status')
          .select('requirement_id, status, submitted_at, reviewed_at')
          .eq('org_id', orgId)
          .in('requirement_id', reqIds)
      : { data: [] }

    return {
      template,
      steps: steps ?? [],
      requirements: requirements ?? [],
      progress: progress ?? null,
      requirementStatuses: requirementStatuses ?? [],
    }
  } catch {
    return empty
  }
}

// ── 6. Watchlist data ────────────────────────────────────────────────────────────────
export type WatchlistItem = {
  id: string; item_type: string; ref_id: string | null
  title: string; subtitle: string | null; tags: string[]
  jurisdiction: string | null; confidence_pct: number | null
  latest_change_at: string | null; latest_change_note: string | null
  next_action: string | null; watch_status: string
  created_at: string; updated_at: string
}

export type WatchRule = {
  id: string; rule_type: string; keywords: string[]; is_active: boolean
}

export type NotificationSummary = {
  total_alerts: number; awaiting_review: number; resolved: number; snoozed: number
}

export type WatchlistData = {
  items:         WatchlistItem[]
  rules:         WatchRule[]
  notifications: NotificationSummary
}

export async function getWatchlistData(
  userId: string | null,
): Promise<WatchlistData> {
  const empty: WatchlistData = {
    items: [], rules: [],
    notifications: { total_alerts: 0, awaiting_review: 0, resolved: 0, snoozed: 0 },
  }
  if (!userId) return empty
  try {
    const supabase = await createClient()

    // Resolve org
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    const orgId = membership?.workspace_id
    if (!orgId) return empty

    const [itemsRes, rulesRes, notifsRes] = await Promise.all([
      supabase
        .from('cc_watchlist_items')
        .select('id, item_type, ref_id, title, subtitle, tags, jurisdiction, confidence_pct, latest_change_at, latest_change_note, next_action, watch_status, created_at, updated_at')
        .eq('org_id', orgId)
        .or('watch_status.eq.active,and(watch_status.eq.snoozed,snoozed_until.lt.' + new Date().toISOString() + ')')
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('cc_watch_rules')
        .select('id, rule_type, keywords, is_active')
        .eq('org_id', orgId),
      supabase
        .from('cc_watchlist_notifications')
        .select('is_read, is_snoozed')
        .eq('user_id', userId),
    ])

    const notifs = notifsRes.data ?? []
    return {
      items: itemsRes.data ?? [],
      rules: rulesRes.data ?? [],
      notifications: {
        total_alerts:    notifs.filter(n => !n.is_read && !n.is_snoozed).length,
        awaiting_review: notifs.filter(n => !n.is_read && !n.is_snoozed).length,
        resolved:        notifs.filter(n =>  n.is_read).length,
        snoozed:         notifs.filter(n =>  n.is_snoozed).length,
      },
    }
  } catch {
    return empty
  }
}

// ── 7. Evidence & Sources data ──────────────────────────────────────────────────────────
export type EvidenceSource = {
  id:           string
  name:         string
  category:     string
  markets:      string[]
  reliability:  string
  last_checked: string | null
  status:       string
  notes:        string | null
}

export type OrgEvidenceDoc = {
  id:                  string
  display_name:        string
  document_type:       string
  verification_status: string
  expiry_date:         string | null
  created_at:          string
}

export type EvidenceData = {
  sources: EvidenceSource[]
  orgDocs: OrgEvidenceDoc[]
}

export async function getEvidenceData(
  userId:      string | null,
  countryIso2: string | null,
): Promise<EvidenceData> {
  const empty: EvidenceData = { sources: [], orgDocs: [] }
  try {
    const supabase = await createClient()

    // Platform sources — filter by country market when provided.
    // ia_sources.markets is a text[] of display names (not ISO2), so resolve
    // countryIso2 -> country_name first, same pattern as getGenericFallbackPathway.
    let countryName: string | null = null
    if (countryIso2) {
      const { data: c } = await supabase
        .from('countries')
        .select('country_name')
        .eq('iso_alpha2', countryIso2.toUpperCase())
        .single()
      countryName = c?.country_name ?? null
    }

    const sourcesQuery = supabase
      .from('ia_sources')
      .select('id, name, category, markets, reliability, last_checked, status, notes')
      .eq('status', 'active')
      .order('last_checked', { ascending: false })
      .limit(50)

    // Fall back to all sources only when country is unknown — page handles
    // empty state per tab when a real country filter returns zero rows.
    const { data: sources } = countryName
      ? await sourcesQuery.overlaps('markets', [countryName])
      : await sourcesQuery

    // Org evidence documents
    let orgDocs: OrgEvidenceDoc[] = []
    if (userId) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (membership?.workspace_id) {
        const { data: docs } = await supabase
          .from('hv_evidence_documents')
          .select('id, display_name, document_type, verification_status, expiry_date, created_at')
          .eq('org_id', membership.workspace_id)
          .order('created_at', { ascending: false })
          .limit(25)
        orgDocs = docs ?? []
      }
    }

    return { sources: sources ?? [], orgDocs }
  } catch {
    return empty
  }
}


// ── Public pathway template (no org context) ─────────────────────────────────────────────────
// Returns the step/requirement structure for a country+role without requiring
// an authenticated user. progress is always null; requirementStatuses is always [].

export async function getPublicPathwayTemplate(
  countryIso2: string | null,
  roleId:      string | null,
): Promise<PathwayData> {
  const empty: PathwayData = {
    template: null, steps: [], requirements: [], progress: null, requirementStatuses: [],
  }
  if (!countryIso2 || !roleId) return empty
  try {
    const supabase = await createClient()

    const { data: template } = await supabase
      .from('cc_pathway_templates')
      .select('id, name, total_steps')
      .eq('country_iso2', countryIso2.toUpperCase())
      .eq('role_id', roleId)
      .maybeSingle()

    if (!template) return getGenericFallbackPathway(supabase, countryIso2, roleId)

    const { data: steps } = await supabase
      .from('cc_pathway_steps')
      .select('id, step_number, title, description, unlock_condition')
      .eq('template_id', template.id)
      .order('step_number')

    const stepIds = (steps ?? []).map(s => s.id)
    const { data: requirements } = stepIds.length
      ? await supabase
          .from('cc_pathway_step_requirements')
          .select('id, step_id, title, description, evidence_type, is_required, sort_order')
          .in('step_id', stepIds)
          .order('sort_order')
      : { data: [] }

    return {
      template,
      steps:               steps        ?? [],
      requirements:        requirements ?? [],
      progress:            null,
      requirementStatuses: [],
    }
  } catch { return getGenericFallbackPathway(undefined, countryIso2, roleId) }
}

// ── Generic pathway fallback ────────────────────────────────────────────────────────────────
// Used by getPublicPathwayTemplate whenever no hand-curated row exists in
// cc_pathway_templates for the given country/role. Looks up the country's
// display name and regulator label (when available) so the generic pathway
// reads naturally for every country, then delegates to getGenericPathwayTemplate.

async function getGenericFallbackPathway(
  supabase: Awaited<ReturnType<typeof createClient>> | undefined,
  countryIso2: string,
  roleId: string,
): Promise<PathwayData> {
  let countryName = countryIso2.toUpperCase()
  let regulatorLabel: string | null = null
  try {
    const client = supabase ?? await createClient()
    const { data } = await client
      .from('countries')
      .select('country_name, regulator_label')
      .eq('iso_alpha2', countryIso2.toUpperCase())
      .single()
    if (data?.country_name) countryName = data.country_name
    regulatorLabel = data?.regulator_label ?? null
  } catch {
    // fall through with iso2 as the display name
  }
  return getGenericPathwayTemplate(countryName, roleId, regulatorLabel)
}

// ── Recently updated education modules ───────────────────────────────────────────────────────
export type RecentEduModule = {
  title:      string
  detail:     string
  updated_at: string
}

export async function getRecentEduModules(limit = 3): Promise<RecentEduModule[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('education_modules')
      .select('title, description, updated_at')
      .eq('publication_state', 'published')
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data.map(m => ({
      title:      m.title,
      detail:     (m.description as string | null) ?? 'Updated module content',
      updated_at: (m.updated_at  as string | null) ?? '',
    }))
  } catch { return [] }
}

// ── getLocalIntel ──────────────────────────────────────────────────────────────────────────────
// Fetches subnational/local regulatory intel (authorities org chart, municipal
// status, operating constraints/supply routes, evidence coverage, open
// questions) from the local_intel_v1 tables. Returns coverageStatus so the UI
// can honestly show "research pending" for countries not yet covered instead
// of fabricated placeholder content.

export type LocalAuthorityNode = { name: string; role: string; type: 'primary' | 'oversight' | 'enforcement' }

export type LocalIntelAuthorities = {
  top: LocalAuthorityNode | null
  mid: LocalAuthorityNode[]
  bot: LocalAuthorityNode[]
  keyList: { name: string; role: string }[]
}

export type LocalIntelNote = { icon: string | null; label: string; text: string }
export type LocalSubdivision = { name: string; status: 'high' | 'medium' | 'low'; note: string | null }
export type LocalCoverageItem = { label: string; level: 'high' | 'medium' | 'low' }

export type LocalIntelData = {
  coverageStatus: 'available' | 'pending_research' | 'not_applicable'
  authorities: LocalIntelAuthorities | null
  municipalities: LocalSubdivision[]
  constraints: LocalIntelNote[]
  routes: LocalIntelNote[]
  coverage: LocalCoverageItem[]
  openQuestions: string[]
}

export async function getLocalIntel(iso2: string | null | undefined): Promise<LocalIntelData | null> {
  if (!iso2) return null
  const code = iso2.toUpperCase()
  try {
    const supabase = await createClient()
    const [coverageRes, authRes, subRes, notesRes, covLevelsRes, qRes] = await Promise.all([
      supabase.from('local_intel_coverage').select('coverage_status').eq('country_code', code).maybeSingle(),
      supabase.from('local_authorities').select('org_tier, authority_type, authority_name, authority_role')
        .eq('country_code', code).order('display_order'),
      supabase.from('local_subdivisions_intel').select('subdivision_name, status_level, note')
        .eq('country_code', code).order('display_order'),
      supabase.from('local_operating_notes').select('note_category, icon, label, body_text')
        .eq('country_code', code).order('display_order'),
      supabase.from('local_evidence_coverage').select('category_label, coverage_level')
        .eq('country_code', code).order('display_order'),
      supabase.from('local_open_questions').select('question_text')
        .eq('country_code', code).eq('status', 'open'),
    ])

    const coverageStatus = (coverageRes.data?.coverage_status as LocalIntelData['coverageStatus'] | undefined) ?? 'pending_research'

    const authRows = authRes.data ?? []
    const top = authRows.find(a => a.org_tier === 'top')
    const toNode = (a: NonNullable<typeof top>): LocalAuthorityNode =>
      ({ name: a.authority_name, role: a.authority_role, type: a.authority_type as LocalAuthorityNode['type'] })
    const mid = authRows.filter(a => a.org_tier === 'mid')
    const bot = authRows.filter(a => a.org_tier === 'bot')

    const authorities: LocalIntelAuthorities | null = top ? {
      top: toNode(top),
      mid: mid.map(toNode),
      bot: bot.map(toNode),
      keyList: [top, ...mid].slice(0, 4).map(a => ({ name: a.authority_name, role: a.authority_role })),
    } : null

    const notes = notesRes.data ?? []

    return {
      coverageStatus,
      authorities,
      municipalities: (subRes.data ?? []).map(m => ({
        name:   m.subdivision_name,
        status: m.status_level as LocalSubdivision['status'],
        note:   m.note,
      })),
      constraints: notes.filter(n => n.note_category === 'constraint')
        .map(n => ({ icon: n.icon, label: n.label, text: n.body_text })),
      routes: notes.filter(n => n.note_category === 'supply_route')
        .map(n => ({ icon: n.icon, label: n.label, text: n.body_text })),
      coverage: (covLevelsRes.data ?? []).map(c => ({ label: c.category_label, level: c.coverage_level as LocalCoverageItem['level'] })),
      openQuestions: (qRes.data ?? []).map(q => q.question_text),
    }
  } catch {
    return null
  }
}

// ── Source registry coverage ────────────────────────────────────────────────────────────────
// Queries public.source_registry to return active source counts by type + tier
// for the given country ISO2 code. Used by RegulatoryWatchPage SOURCE_GAPS.
export type SourceCoverageRow = {
  source_type: string  // 'news' | 'trade' | 'regulator'
  tier:        number  // 1 (official) | 2 (professional) | 3 (supplementary)
  count:       number
}

export async function getSourceCoverage(countryIso2: string | null): Promise<SourceCoverageRow[]> {
  if (!countryIso2) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('source_registry')
      .select('source_type, tier')
      .eq('iso', countryIso2.toUpperCase())
      .eq('is_active', true)
    if (error || !data || data.length === 0) return []

    // Aggregate counts by source_type + tier
    const agg: Record<string, Record<number, number>> = {}
    for (const r of data) {
      const st  = typeof r.source_type === 'string' ? r.source_type : 'unknown'
      const t   = typeof r.tier === 'number' ? r.tier : 99
      agg[st]       = agg[st] ?? {}
      agg[st][t]    = (agg[st][t] ?? 0) + 1
    }

    return Object.entries(agg).flatMap(([source_type, tiers]) =>
      Object.entries(tiers).map(([tier, count]) => ({
        source_type,
        tier:  Number(tier),
        count,
      })),
    )
  } catch {
    return []
  }
}

// ── Country-specific education overlay ────────────────────────────────────
export type CountryEducationOverlay = {
  moduleKey:    string
  topics:       string[]
  actionLabel:  string
  reviewStatus: string
}

export async function getCountryEducationOverlays(
  countryIso2: string | null,
  roleId:      string | null,
): Promise<CountryEducationOverlay[]> {
  if (!countryIso2) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('country_education_overlay')
      .select('module_key, topics, action_label, review_status, role_id')
      .eq('country_iso2', countryIso2.toUpperCase())
      .in('review_status', [
        'verified_primary_source', 'verified_professional_body',
        'verified_peer_reviewed', 'verified_secondary_source',
      ])

    if (error || !data) return []

    const byModule = new Map<string, CountryEducationOverlay>()
    for (const row of data) {
      const matchesRole = !row.role_id || row.role_id === roleId
      if (!matchesRole) continue
      const existing = byModule.get(row.module_key)
      if (!existing || row.role_id) {
        byModule.set(row.module_key, {
          moduleKey:    row.module_key,
          topics:       Array.isArray(row.topics) ? row.topics : [],
          actionLabel:  row.action_label,
          reviewStatus: row.review_status,
        })
      }
    }
    return Array.from(byModule.values())
  } catch {
    return []
  }
}

// ── New: jurisdiction playbooks ───────────────────────────────────────────────────────────────
export type JurisdictionPlaybook = {
  country_iso2:           string
  country_name:           string
  difficulty:             string | null
  typical_timeline_months: number | null
  estimated_cost_range:   string | null
  legal_framework_summary: string | null
  steps:                  { step: number; title: string; description: string }[]
  key_regulators:         { name: string; role: string }[]
  common_pitfalls:        string[]
}

export async function getJurisdictionPlaybook(iso2: string | null): Promise<JurisdictionPlaybook | null> {
  if (!iso2) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('jurisdiction_playbooks')
      .select('country_iso2,country_name,difficulty,typical_timeline_months,estimated_cost_range,legal_framework_summary,steps,key_regulators,common_pitfalls')
      .eq('country_iso2', iso2.toUpperCase())
      .eq('status', 'published')
      .single()
    if (!data) return null
    return {
      country_iso2:            data.country_iso2,
      country_name:            data.country_name,
      difficulty:              data.difficulty,
      typical_timeline_months: data.typical_timeline_months,
      estimated_cost_range:    data.estimated_cost_range,
      legal_framework_summary: data.legal_framework_summary,
      steps:                   Array.isArray(data.steps)         ? data.steps         : [],
      key_regulators:          Array.isArray(data.key_regulators) ? data.key_regulators : [],
      common_pitfalls:         Array.isArray(data.common_pitfalls) ? data.common_pitfalls : [],
    }
  } catch { return null }
}

// ── New: education tracks ────────────────────────────────────────────────────────────────────
export type EducationTrack = {
  id:          string
  title:       string
  description: string | null
  icon:        string | null
  level:       string | null
  tags:        string[]
}

export async function getEducationTracks(): Promise<EducationTrack[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('education_tracks')
      .select('id,title,description,icon,level,tags')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .limit(12)
    return (data ?? []).map(r => ({
      id:          r.id,
      title:       r.title,
      description: r.description,
      icon:        r.icon,
      level:       r.level,
      tags:        Array.isArray(r.tags) ? r.tags : [],
    }))
  } catch { return [] }
}

// ── New: market metrics ──────────────────────────────────────────────────────────────────────────
export type MarketMetric = {
  metric_name:  string
  metric_value: number
  metric_unit:  string | null
  period_label: string | null
  data_type:    string | null
  source_name:  string | null
}

export async function getMarketMetrics(iso2: string | null): Promise<MarketMetric[]> {
  if (!iso2) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('market_metrics')
      .select('metric_name,metric_value,metric_unit,period_start,period_end,data_type,source_name')
      .eq('country_iso2', iso2.toUpperCase())
      .order('period_end', { ascending: false })
      .limit(20)
    return (data ?? []).map(r => ({
      metric_name:  r.metric_name,
      metric_value: Number(r.metric_value),
      metric_unit:  r.metric_unit,
      period_label: r.period_end ? r.period_end.slice(0, 7) : null,
      data_type:    r.data_type,
      source_name:  r.source_name,
    }))
  } catch { return [] }
}

// ── New: trade flows ───────────────────────────────────────────────────────────────────────────
export type TradeFlow = {
  origin_iso2:       string
  destination_iso2:  string
  flow_direction:    string | null
  product_category:  string | null
  legal_status:      string | null
  permit_required:   boolean | null
  permit_authority:  string | null
}

export async function getTradeFlows(iso2: string | null): Promise<TradeFlow[]> {
  if (!iso2) return []
  try {
    const supabase = await createClient()
    const upper = iso2.toUpperCase()
    const { data } = await supabase
      .from('trade_flows')
      .select('origin_iso2,destination_iso2,flow_direction,product_category,legal_status,permit_required,permit_authority')
      .or(`origin_iso2.eq.${upper},destination_iso2.eq.${upper}`)
      .limit(30)
    return (data ?? []).map(r => ({
      origin_iso2:      r.origin_iso2,
      destination_iso2: r.destination_iso2,
      flow_direction:   r.flow_direction,
      product_category: r.product_category,
      legal_status:     r.legal_status,
      permit_required:  r.permit_required,
      permit_authority: r.permit_authority,
    }))
  } catch { return [] }
}

// ── New: verified professionals ───────────────────────────────────────────────────────────────
export type HvProfessional = {
  id:                      string
  full_name:               string
  title:                   string | null
  credential_type:         string | null
  specialties:             string[]
  countries:               string[]
  institution:             string | null
  accepts_referrals:       boolean | null
  consultation_available:  boolean | null
}

export async function getProfessionals(iso2: string | null): Promise<HvProfessional[]> {
  if (!iso2) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('hv_professionals')
      .select('id,full_name,title,credential_type,specialties,countries,institution,accepts_referrals,consultation_available')
      .eq('verification_status', 'verified')
      .eq('status', 'active')
      .contains('countries', [iso2.toUpperCase()])
      .limit(10)
    return (data ?? []).map(r => ({
      id:                     r.id,
      full_name:              r.full_name,
      title:                  r.title,
      credential_type:        r.credential_type,
      specialties:            Array.isArray(r.specialties) ? r.specialties : [],
      countries:              Array.isArray(r.countries)   ? r.countries   : [],
      institution:            r.institution,
      accepts_referrals:      r.accepts_referrals,
      consultation_available: r.consultation_available,
    }))
  } catch { return [] }
}

// ── New: cannabis operators ──────────────────────────────────────────────────────────────────
export type CannabisOperator = {
  id:                  string
  country_iso2:        string
  legal_name:          string
  operator_type:       string | null
  verification_status: string | null
}

export async function getCannabisOperators(iso2: string | null): Promise<CannabisOperator[]> {
  if (!iso2) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('cannabis_operators')
      .select('id,country_iso2,legal_name,operator_type,verification_status')
      .eq('country_iso2', iso2.toUpperCase())
      .eq('public_status', 'active')
      .limit(20)
    return (data ?? []).map(r => ({
      id:                  r.id,
      country_iso2:        r.country_iso2,
      legal_name:          r.legal_name,
      operator_type:       r.operator_type,
      verification_status: r.verification_status,
    }))
  } catch { return [] }
}

// Restored — deleted by feat(dashboard)/getSourceCoverage commit; still imported
// by app/dashboard/country/[country]/CountryIntelDashboard.tsx
export type ComparisonCountryScore = {
  iso2: string
  name: string
  slug: string
  opportunity_score: number
  market_access_status: string | null
  data_completeness: string | null
}

export async function getComparisonCountryScores(
  excludeIso2?: string | null,
  limit = 10,
): Promise<ComparisonCountryScore[]> {
  try {
    const supabase = await createClient()
    let q = supabase
      .from('countries')
      .select('iso_alpha2,country_name,opportunity_score,market_access_status,data_completeness')
      .not('opportunity_score', 'is', null)
      .order('opportunity_score', { ascending: false })
      .limit(limit + 1)
    if (excludeIso2) q = q.neq('iso_alpha2', excludeIso2.toUpperCase())
    const { data } = await q
    return (data ?? []).slice(0, limit).map(r => ({
      iso2:                r.iso_alpha2,
      name:                r.country_name,
      slug:                r.country_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      opportunity_score:   r.opportunity_score ?? 0,
      market_access_status: r.market_access_status,
      data_completeness:   r.data_completeness,
    }))
  } catch { return [] }
}

// ── My marketplace submissions (for the Command Centre "My Listings" panel) ─────

export type MySubmission = {
  id: string
  title_public_draft: string | null
  marketplace_category: string | null
  listing_type: string | null
  status: string | null
  created_at: string
  submission_images: string[] | null
  country: string | null
}

export async function getUserMarketplaceSubmissions(userId: string | null): Promise<MySubmission[]> {
  if (!userId) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marketplace_candidates')
      .select('id, title_public_draft, marketplace_category, listing_type, status, created_at, submission_images, country')
      .eq('submitted_by', userId)
      .eq('submission_source', 'self_serve')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) { console.error('[getUserMarketplaceSubmissions] query error', error.message); return [] }
    return data ?? []
  } catch { return [] }
}
