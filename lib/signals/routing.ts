import { countryIdentityRows } from '@/lib/country-data/generated-country-identity-rows'
import { countries, getCountryByIso3 } from '@/lib/dashboard/countries'
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
 * Prefers the structured `country_iso2` column, then falls back to resolving the
 * free-text `country` value. The fallback matters: 1,113 of the last 30 days'
 * 9,884 signals have a NULL `country_iso2` while still carrying a usable country
 * string, and dropping them would discard 11% of the feed from every routed
 * query.
 *
 * `resolveCountry` yields ISO-3166-1 alpha-3, so the result is mapped through
 * `getCountryByIso3` rather than truncated — "AUT" is Austria, not Australia.
 *
 * KNOWN, MEASURED LIMIT: `getCountryByIso3` covers the 193-country dashboard
 * set, while `countryIdentityRows` holds 248 canonical identities — 60 have no
 * dashboard match (Singapore, Seychelles, South Sudan, Bermuda, Aruba…), and
 * this fallback returns null for them.
 *
 * Left as-is on evidence, not by oversight. Every row with a NULL
 * `country_iso2` in the last 90 days carries a *region or bloc* value
 * ("Europe", "LATAM", "Africa", "Pacific") — **not one is a country**, because
 * ingestion populates `country_iso2` whenever it identifies a real country.
 * The name-resolution fallback is therefore currently unreachable for those 60,
 * and hand-maintaining a 60-entry alpha-3→alpha-2 table would be dead code with
 * its own drift risk. The real gap those rows exposed was regional scope, which
 * {@link matchesGeography} now handles. Revisit if ingestion ever emits a
 * country name without an iso2.
 */
export function signalCountryIso2(row: SignalRoutingRow): string | null {
  const direct = normaliseIso2(row.country_iso2)
  if (direct) return direct
  const resolved = resolveCountry(row.country)
  if (!resolved) return null
  return normaliseIso2(getCountryByIso3(resolved.code)?.iso2)
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
 * ISO-3166-1 alpha-2 → UN macro-region.
 *
 * Deliberately NOT `getCountryByIso2().region`: that field is `'Global'` for all
 * but a handful of hand-overridden entries (Lesotho, Germany and Australia all
 * report `'Global'`/`'Unspecified'`), so joining on it silently matched nothing.
 * A test caught this.
 *
 * `countryIdentityRows` carries the real UN region for 247 of 248 identities, in
 * exactly the five-value vocabulary `signals.geo_region` is normalised to
 * (Africa, Americas, Asia, Europe, Oceania), so the two join with no alias
 * table. The alpha-2 → alpha-3 hop goes through the dashboard set, which is the
 * only place both codes coexist.
 *
 * KNOWN DATA GAP — needs a verified ISO source, not a guess.
 * The repo has no complete alpha-3 → alpha-2 table. `countries.ts` covers 193
 * and `natural-earth-countries.ts` 191; their union is 195, still leaving **60
 * of the 248 canonical identities unmapped — including Singapore, South Sudan,
 * Seychelles, Barbados and Grenada**, i.e. disproportionately the small-island
 * and African states this platform's coverage is meant to be strongest in.
 *
 * Unlike the signal-side name fallback (measurably unreachable — ingestion
 * always sets `country_iso2` for real countries), this path IS reachable: it is
 * driven by operator-declared jurisdictions, and `operator_countries` accepts
 * any alpha-2. {@link matchesGeography} therefore fails open for affected
 * profiles rather than silently withholding regional signals. Writing the 60
 * codes from memory into a compliance-facing product would be exactly the kind
 * of unverified data this codebase forbids; they should come from a checked ISO
 * source in a separate, reviewable data change.
 */
const REGION_BY_ISO2: ReadonlyMap<string, string> = (() => {
  const regionByIso3 = new Map<string, string>()
  for (const row of countryIdentityRows) {
    // `countryIdentityRows` is a generated `as const` tuple list, so a blind
    // destructure-with-cast would silently mis-read every row if the generator
    // ever reorders columns — the map would just come back empty and every
    // regional match would quietly fail open. Read positionally and validate
    // instead, so a shape change is skipped rather than misinterpreted.
    const cells = row as readonly unknown[]
    const id = cells[0]
    const region = cells[3]
    if (typeof id !== 'string' || typeof region !== 'string') continue
    if (!id.startsWith('country_area:')) continue
    const iso3 = id.split(':')[1]
    if (iso3 && region) regionByIso3.set(iso3.toUpperCase(), region)
  }
  const map = new Map<string, string>()
  for (const country of countries) {
    const region = regionByIso3.get(country.iso3.toUpperCase())
    // Case-folded to match the lookup in `matchesGeography`.
    if (region) map.set(country.iso2.toUpperCase(), region.toLowerCase())
  }
  return map
})()

/** UN macro-regions covering an operator's declared countries. */
function profileRegions(profile: OperatorProfile): Set<string> {
  const regions = new Set<string>()
  for (const code of profileCountries(profile)) {
    const region = REGION_BY_ISO2.get(code)
    if (region) regions.add(region)
  }
  return regions
}

/**
 * Does this signal's geography reach this operator?
 *
 * Scope-aware rather than iso2-only (see {@link SignalGeoScope}):
 * - `country` — the country must be one the operator declared.
 * - `region`  — the region must contain at least one declared country. An
 *   EU-wide rule change reaches a German importer.
 *
 *   KNOWN LIMITATION, upstream and not fixable here: `signals.geo_region` holds
 *   only the five UN macro-regions (verified live — Africa, Americas, Asia,
 *   Europe, Oceania). Ingestion collapses supra-national blocs into them, so
 *   "European Union" becomes Europe, "LATAM" and "Caribbean" become Americas,
 *   and "Middle East" becomes Asia. The bloc identity is destroyed before this
 *   module sees the row, which produces two wrong outcomes it cannot detect:
 *   a US operator receives LATAM-wide items (over-delivery), and a Cyprus
 *   operator — UN region **Asia**, confirmed against `countryIdentityRows` —
 *   misses EU-wide rules entirely (under-delivery, the more damaging one).
 *   Fixing this needs the original bloc label preserved at ingestion (e.g. a
 *   `geo_bloc` column) plus real membership data; inventing a bloc table here
 *   would be guessing. Logged as a follow-up rather than papered over.
 * - `global`  — reaches everyone. A treaty-level change is not filtered out by
 *   virtue of belonging to no single country.
 * - `unknown` — geography cannot be established, so it cannot be used to
 *   exclude. Matches, and is then narrowed by role family like any other row.
 */
function matchesGeography(row: SignalRoutingRow, profile: OperatorProfile): boolean {
  const wanted = profileCountries(profile)
  // An operator who declared no geography is not filtered by geography.
  if (wanted.size === 0) return true

  switch (signalGeoScope(row)) {
    case 'country': {
      const country = signalCountryIso2(row)
      return country !== null && wanted.has(country)
    }
    case 'region': {
      // Case-folded on both sides. The two vocabularies agree today (both are
      // Africa/Americas/Asia/Europe/Oceania), but an exact `Set.has` would miss
      // on any future case drift and silently withhold a regional signal from an
      // operator inside that region — the exact silent-drop this matcher exists
      // to prevent, and the fail-open below only covers unmapped countries.
      const region = typeof row.geo_region === 'string' ? row.geo_region.trim().toLowerCase() : null
      if (region === null || region === '') return false
      // If any declared country has no region mapping, this operator's regional
      // coverage cannot be proven either way — see REGION_BY_ISO2's note on the
      // 60 unmapped identities. Deliver rather than drop: for an intelligence
      // product, one extra regional item costs far less than missing an EU-wide
      // rule change, and this degrades to exact behaviour once the codes land.
      //
      // Test per country, NOT by set size. Comparing `profileRegions().size` to
      // `profileCountries().size` compares regions against countries: two
      // countries in one region (LS + ZA) gave 1 < 2 and fired the guard for the
      // common case, widening the very filter it was meant to make safe.
      const countries = profileCountries(profile)
      if ([...countries].some((code) => !REGION_BY_ISO2.has(code))) return true
      return profileRegions(profile).has(region)
    }
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
      // Deliberately does NOT say "where you operate". Two paths reach here
      // without establishing that: the fail-open branch for a country with no
      // region mapping (the operator's region is unknown, not confirmed), and a
      // match via an export destination only (they trade into the region, they
      // do not operate in it). Claiming otherwise would put an assertion in
      // front of a user that the matcher never proved.
      const region = typeof row.geo_region === 'string' ? row.geo_region.trim() : null
      return region ? `Affects ${region}, a region you cover${suffix}` : `Matches your watch profile${suffix}`
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
