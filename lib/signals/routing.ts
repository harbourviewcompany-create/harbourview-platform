import { isoRegionRows } from '@/lib/country-data/generated-iso-region-rows'
import { roleFamilies } from '@/lib/roles/role-families'
import type { RoleFamily } from '@/lib/roles/types'
import { resolveCountry, type SignalQualityRow } from './quality'

/**
 * Canonical relevance layer for `public.signals` — "does this signal affect
 * *this* operator?"
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * As of 2026-07-31 the ingestion side is healthy: ~330 signals/day across 133
 * countries, classified and promoted daily. The demand side is not — 7
 * `user_profiles`, 0 `subscriptions`, 6 `cc_watchlist_items`, 2 `cc_watch_rules`.
 *
 * The structural reason is that the only join key between a signal and an
 * operator was `country`. "Something happened in Germany" could never become
 * "your EU-GMP import lane is affected", because `signals` carried no dimension
 * describing *what kind of operator* a story is about. Nobody subscribes to an
 * unfiltered global firehose; they subscribe to the three items that touch their
 * licence.
 *
 * WHY ROLE FAMILIES, AND NOT A NEW VOCABULARY
 * -------------------------------------------
 * `lib/roles/` already models the operator dimension in depth: 15 role families
 * over ~250 roles, each carrying documents, counterparty types, evidence
 * requirements and an operating question, already driving the live
 * `app/country/[country]/role/[role]` surface.
 *
 * Introducing a parallel `licence_classes`/`product_forms` vocabulary would have
 * been a second implementation of an existing concept — the exact failure
 * `INTELLIGENCE_ARCHITECTURE_SPEC.md` §9 guardrail #10 names. So routing reuses
 * `roleFamilies` as its vocabulary.
 *
 * Families, not roles: 14 routable families is a tractable classifier output
 * with a defensible per-item explanation. 250 roles is neither.
 *
 * KNOWN VOCABULARY DRIFT (not fixed here, deliberately)
 * -----------------------------------------------------
 * `cc_pathway_templates.role_id` uses an incompatible vocabulary — its only live
 * value is `cultivator_producer`, where `role-profiles.ts` has
 * `licensed_cultivator` and `licensed_producer`. Reconciling the Compliance
 * Centre's pathway vocabulary is real work with its own blast radius and is
 * tracked separately; this module does not silently pick a winner.
 */

// ── Vocabulary ────────────────────────────────────────────────────────────────

/**
 * Role family reserved for Harbourview's own review queues. It is a legitimate
 * member of `roleFamilies` (it orders admin surfaces) but must never be a
 * routing target — routing it would mean classifying customer-facing signals
 * into an internal bucket and, worse, offering it as a subscribable audience.
 */
export const INTERNAL_ROLE_FAMILY = 'harbourview_admin_operator' satisfies RoleFamily

/**
 * The families a signal may be routed to, derived from `roleFamilies` so the two
 * can never drift. Order follows the canonical list.
 */
export const ROUTABLE_ROLE_FAMILIES = roleFamilies
  .map((family) => family.key)
  .filter((key): key is Exclude<RoleFamily, typeof INTERNAL_ROLE_FAMILY> => key !== INTERNAL_ROLE_FAMILY)

export type RoutableRoleFamily = (typeof ROUTABLE_ROLE_FAMILIES)[number]

const ROUTABLE_SET: ReadonlySet<string> = new Set(ROUTABLE_ROLE_FAMILIES)

const FAMILY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  roleFamilies.map((family) => [family.key, family.label]),
)

/** Human-readable family name, e.g. "Trade & distribution". */
export function roleFamilyLabel(key: string): string {
  return FAMILY_LABELS[key] ?? key
}

// ── Column set ────────────────────────────────────────────────────────────────

/**
 * PostgREST `select=` fragment for the routing columns.
 *
 * Declared as a single literal for the same reason as `SIGNAL_QUALITY_SELECT` —
 * supabase-js infers row shape from the select string as a template literal
 * type, and a runtime-built string collapses that inference.
 */
export const SIGNAL_ROUTING_SELECT =
  'role_families,routing_version,routed_at,country_iso2,geo_scope,geo_region' as const

/** The same columns as an array, derived so the two can never drift. */
export const SIGNAL_ROUTING_COLUMNS = SIGNAL_ROUTING_SELECT.split(',') as readonly string[]

/**
 * Bumped whenever the routing prompt or normalisation changes meaning, so a
 * backfill can find rows routed by an older definition. Mirrors the
 * `classifier_version` convention in `hv_classify_corpus_harvest`.
 */
export const ROUTING_VERSION = 'hv-route/role-families/v1'

// ── Row shape ─────────────────────────────────────────────────────────────────

export type SignalRoutingRow = SignalQualityRow & {
  role_families?: unknown
  routing_version?: unknown
  routed_at?: unknown
  country_iso2?: unknown
  geo_scope?: unknown
  geo_region?: unknown
}

/**
 * How broadly a signal applies, from `signals.geo_scope`.
 *
 * Measured over the last 90 days: `country` 10,767 · `region` 846 · `global`
 * 517 · `unknown` 332. The last three carry no `country_iso2` at all, so an
 * iso2-only matcher discards **1,363 signals (10.6% of the corpus)** for every
 * operator who declares a geography — including EU-wide and treaty-level
 * changes, which are among the most consequential things an exporter can be
 * told about. Scope-aware matching exists to stop that.
 */
export type SignalGeoScope = 'country' | 'region' | 'global' | 'unknown'

export function signalGeoScope(row: SignalRoutingRow): SignalGeoScope {
  const raw = typeof row.geo_scope === 'string' ? row.geo_scope.trim().toLowerCase() : null
  if (raw === 'country' || raw === 'region' || raw === 'global') return raw
  // Any scope value that is not usable — missing, empty, or outside the
  // vocabulary — falls back to the country the row actually carries. Requiring
  // `raw === null` meant a row with `geo_scope = ''` and a perfectly good
  // `country_iso2` was classified `unknown`, and `matchesGeography` fails open
  // on `unknown`, so it was delivered to every operator including those who
  // declared a different country. Trusting the country code is both more precise
  // and strictly less over-delivering than treating the row as ungeocoded.
  if (normaliseIso2(row.country_iso2)) return 'country'
  return 'unknown'
}

/**
 * An operator's declared profile, as captured at intake and persisted across
 * `operator_countries` (jurisdictions) and `operator_licences` (licence detail).
 *
 * `countryIso2` is uppercase ISO-3166-1 alpha-2.
 */
export type OperatorProfile = {
  countryIso2: readonly string[]
  roleFamilies: readonly string[]
  /** Export destinations. Matched the same way as home jurisdictions. */
  destinationIso2?: readonly string[]
  /** Drop signals below this impact. Defaults to no floor. */
  minImpact?: 'low' | 'medium' | 'high'
}

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * Role families on a signal, filtered to the routable vocabulary.
 *
 * Unknown values are dropped rather than passed through: the classifier is an
 * LLM and will occasionally invent a family, and an invented family that reaches
 * a subscription query would silently widen someone's digest.
 *
 * Returns `[]` for an unrouted row. Callers must distinguish "routed to nothing"
 * from "not yet routed" via {@link isRouted} — they mean different things and
 * only the latter should fall back to country-only matching.
 */
export function resolveRoleFamilies(row: SignalRoutingRow): RoutableRoleFamily[] {
  const raw = row.role_families
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: RoutableRoleFamily[] = []
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const key = entry.trim().toLowerCase()
    if (!ROUTABLE_SET.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push(key as RoutableRoleFamily)
  }
  return out
}

/** True once the routing stage has processed this row, whatever the outcome. */
export function isRouted(row: SignalRoutingRow): boolean {
  return typeof row.routing_version === 'string' && row.routing_version.trim() !== ''
}

// ── Matching ──────────────────────────────────────────────────────────────────

const IMPACT_RANK: Readonly<Record<string, number>> = { low: 0, medium: 1, high: 2 }

function normaliseIso2(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null
}

/**
 * ISO-3166-1 alpha-2 for a signal.
 *
 * Prefers the structured `country_iso2` column, then resolves a free-text
 * country through the deterministic 248-country ISO-3/ISO-2 bridge generated
 * from the checked-in Harbourview identity table. Region and bloc labels still
 * return null here and are handled by the regional audience matcher.
 */
export function signalCountryIso2(row: SignalRoutingRow): string | null {
  const direct = normaliseIso2(row.country_iso2)
  if (direct) return direct
  const resolved = resolveCountry(row.country)
  if (!resolved) return null
  return ISO2_BY_ISO3.get(resolved.code.toUpperCase()) ?? null
}

/** Every ISO-3166-1 alpha-2 an operator cares about: home plus destinations. */
function profileCountries(profile: OperatorProfile): Set<string> {
  return new Set(
    [...profile.countryIso2, ...(profile.destinationIso2 ?? [])]
      .map(normaliseIso2)
      .filter((code): code is string => code !== null),
  )
}

/**
 * Deterministic ISO and UN M49 geography bridge for all 248 checked identities.
 * The generated rows are static runtime data; regeneration is pinned and checked
 * in CI so production does not depend on Python or an external lookup service.
 */
type RegionMetadata = { region: string; subregion: string }

const ISO2_BY_ISO3: ReadonlyMap<string, string> = new Map(
  isoRegionRows.map(([iso2, iso3]) => [iso3, iso2]),
)

const REGION_METADATA_BY_ISO2: ReadonlyMap<string, RegionMetadata> = new Map(
  isoRegionRows.map(([iso2, , region, subregion]) => [
    iso2,
    { region: region.toLowerCase(), subregion: subregion.toLowerCase() },
  ]),
)

/** Current 27-member European Union set, verified against the official EU list on 2026-08-02. */
const EU_MEMBER_ISO2 = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
])

const LATAM_SUBREGIONS = new Set(['caribbean', 'central america', 'south america'])
const UN_MACRO_REGIONS = new Set(['africa', 'americas', 'asia', 'europe', 'oceania'])

function normaliseRegionalLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const label = value.trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ')
  return label || null
}

function regionalAudienceDisplayLabel(row: SignalRoutingRow): string | null {
  for (const value of [row.country, row.geo_region]) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function matchesRegionalAudience(row: SignalRoutingRow, profileIso2: Set<string>): boolean {
  const explicitCountryLabel = normaliseRegionalLabel(row.country)
  const label = explicitCountryLabel ?? normaliseRegionalLabel(row.geo_region)
  if (!label) return false

  return [...profileIso2].some((iso2) => {
    const metadata = REGION_METADATA_BY_ISO2.get(iso2)
    if (!metadata) return false

    switch (label) {
      case 'eu':
      case 'european union':
        return EU_MEMBER_ISO2.has(iso2)
      case 'latam':
      case 'latin america':
      case 'latin america and the caribbean':
      case 'latin america & caribbean':
      case 'latin america and caribbean':
        return LATAM_SUBREGIONS.has(metadata.subregion)
      case 'caribbean':
        return metadata.subregion === 'caribbean'
      case 'middle east':
        // Controlled Harbourview definition: UN M49 Western Asia plus Egypt.
        // It deliberately does not widen to all Asia or all MENA.
        return metadata.subregion === 'western asia' || iso2 === 'EG'
      case 'pacific':
      case 'pacific islands':
        return metadata.region === 'oceania'
      default:
        // A retained but unknown bloc label must fail closed rather than widen
        // to the signal's coarser macro-region. Macro-regions remain explicit.
        return !explicitCountryLabel && UN_MACRO_REGIONS.has(label)
          ? metadata.region === label
          : UN_MACRO_REGIONS.has(label) && metadata.region === label
    }
  })
}

function matchesGeography(row: SignalRoutingRow, profile: OperatorProfile): boolean {
  const wanted = profileCountries(profile)
  // An operator who declared no geography is not filtered by geography.
  if (wanted.size === 0) return true

  switch (signalGeoScope(row)) {
    case 'country': {
      const country = signalCountryIso2(row)
      return country !== null && wanted.has(country)
    }
    case 'region':
      return matchesRegionalAudience(row, wanted)
    case 'global':
      return true
    default:
      return true
  }
}

/**
 * Does this signal belong in this operator's feed?
 *
 * Geography and role family are ANDed: an operator in Lesotho doing cultivation
 * wants Lesotho cultivation news, not German pharmacy news *and* not Lesotho
 * pharmacy news. Within each dimension, values are ORed.
 *
 * Two deliberate "empty means no filter" rules, one on each dimension:
 * - no declared geography → not filtered by geography;
 * - no declared role families → not filtered by role family.
 *
 * The second was missing in the first revision, and both review bots caught it.
 * The migration documents an empty `role_families` watch rule as geography-only,
 * so omitting the guard made the code contradict its own schema comment — and
 * would have silently emptied every geography-only feed the moment the backfill
 * stamped `routing_version`. That is the exact failure `isRouted()` exists to
 * prevent, so leaving it one line below would have been indefensible.
 *
 * An **unrouted** signal (pre-dating the routing stage) matches on geography
 * alone, for the same reason.
 */
export function matchesOperatorProfile(row: SignalRoutingRow, profile: OperatorProfile): boolean {
  const floor = profile.minImpact ? IMPACT_RANK[profile.minImpact] ?? 0 : null
  if (floor !== null) {
    const impact = typeof row.impact === 'string' ? IMPACT_RANK[row.impact.toLowerCase()] : undefined
    if (impact === undefined || impact < floor) return false
  }

  if (!matchesGeography(row, profile)) return false

  if (!isRouted(row)) return true

  // Routed-to-nothing is checked BEFORE the roleless-profile shortcut. With the
  // order reversed, a signal the classifier explicitly rejected for every
  // audience (`role_families = []`) still reached geography-only operators —
  // contradicting both the schema comment and this module's own
  // "sends a routed-to-nothing signal to nobody" test.
  const families = resolveRoleFamilies(row)
  if (families.length === 0) return false

  if (profile.roleFamilies.length === 0) return true
  return families.some((family) => profile.roleFamilies.includes(family))
}

/**
 * Why this signal reached this operator, as one plain sentence.
 *
 * This is the point of the whole module. A digest line that says "affects your
 * Lesotho cultivation licence" is a product; the same line without it is a link
 * dump. Returns `null` when the row does not match, so a caller cannot render an
 * explanation for something it should not have sent.
 */
export function explainMatch(row: SignalRoutingRow, profile: OperatorProfile): string | null {
  if (!matchesOperatorProfile(row, profile)) return null

  const families = resolveRoleFamilies(row).filter((family) => profile.roleFamilies.includes(family))
  const familyPart = families.length > 0 ? roleFamilyLabel(families[0]).toLowerCase() : null
  const suffix = familyPart ? ` (${familyPart})` : ''

  switch (signalGeoScope(row)) {
    case 'region': {
      const audience = regionalAudienceDisplayLabel(row)
      return audience
        ? `Affects ${audience}, a region or bloc you cover${suffix}`
        : `Matches your watch profile${suffix}`
    }
    case 'global':
      return `Global change affecting all markets${suffix}`
    case 'country': {
      const country = signalCountryIso2(row)
      if (country === null) break
      const isDestination =
        !profile.countryIso2.some((c) => normaliseIso2(c) === country) &&
        (profile.destinationIso2 ?? []).some((c) => normaliseIso2(c) === country)
      if (isDestination) return `Affects your ${country} export lane${suffix}`
      return familyPart
        ? `Affects your ${country} ${familyPart} operations`
        : `Affects your ${country} operations`
    }
    default:
      break
  }

  return familyPart ? `Affects your ${familyPart} operations` : 'Matches your watch profile'
}
