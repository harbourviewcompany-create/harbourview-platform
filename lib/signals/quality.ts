import { countryIdentityRows } from '@/lib/country-data/generated-country-identity-rows'

/**
 * Canonical read-side quality layer for `public.signals`.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * `signals.score` is the legacy keyword-density scorer. It is KNOWN INVERTED —
 * it rates nav chrome and SEO boilerplate ~99 and genuine one-line headlines <40
 * (see `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` §2.5). It was retired as a
 * *promotion* instrument, but was still reaching users two ways:
 *
 *   1. `lib/regulatory-signals/public.ts` derived the customer-visible
 *      `confidence` and `impact_level` badges directly from it.
 *   2. Several readers still ordered feeds by `score desc`, so it continued to
 *      decide *which* signals surfaced and in what order.
 *
 * Separately, `lib/dashboard/dashboardServerData.ts` correctly avoided `score`
 * for confidence but sourced the real number from `signal_classifications` —
 * Pipeline A's table, formally deprecated 2026-07-22, which covers only ~23% of
 * reviewed signals. The remaining ~77% fell back to a flat, fabricated `90`.
 *
 * The canonical instrument is Pipeline B's `signals.quality_confidence`, written
 * by `hv_classify_corpus_harvest` and measured at signal_precision 1.000 against
 * the 202-row hand-labeled eval set (`public.classifier_validation`). It covers
 * ~97% of reviewed signals.
 *
 * Every read path that shows a signal to a user should go through this module so
 * there is exactly one definition of "how good is this signal".
 */

// ── Column sets ───────────────────────────────────────────────────────────────

/**
 * Every quality/display column a signal read needs. Kept as one constant so a
 * reader cannot silently omit a field and fall back to legacy behaviour.
 */
/**
 * PostgREST `select=` fragment for the quality columns.
 *
 * Declared as a single literal (not `[...].join(',')`) because supabase-js
 * parses the select string as a *template literal type* to infer row shape —
 * a runtime-built string collapses the inference to `GenericStringError[]`.
 * Callers must likewise compose it with a `as const` template literal.
 */
export const SIGNAL_QUALITY_SELECT =
  'quality_label,quality_confidence,content_type,impact,title_en,summary_en,lang_detected,is_representative,cluster_rep_id' as const

/** The same columns as an array, derived so the two can never drift. */
export const SIGNAL_QUALITY_COLUMNS = SIGNAL_QUALITY_SELECT.split(',') as readonly string[]

// ── Exclusion ─────────────────────────────────────────────────────────────────

/**
 * Classifier verdicts that must never reach a user surface, per
 * `INTELLIGENCE_ARCHITECTURE_SPEC.md` §4.3 ("quality_label != 'signal' → never
 * surfaced anywhere").
 *
 * This is enforced at read time rather than by mutating rows, because a
 * pre-gate promotion batch left a small number of `spam`/`boilerplate` rows with
 * `reviewed=true` in the live feed. Filtering on read fixes the symptom for
 * every consumer at once and does not touch data a human may own.
 */
export const EXCLUDED_QUALITY_LABELS = ['spam', 'boilerplate', 'nav', 'duplicate'] as const

/**
 * PostgREST filter value excluding the labels above.
 *
 * Deliberately `not.in` rather than `eq.signal`: rows classified before Pipeline
 * B existed have a NULL `quality_label`, and `eq.signal` would silently drop
 * them. `not.in` keeps NULLs — PostgREST's `not.in` is NULL-safe here because
 * the underlying `NOT (col = ANY(...))` is applied only to non-NULL values.
 */
export const QUALITY_LABEL_NOT_IN = `(${EXCLUDED_QUALITY_LABELS.join(',')})`

/**
 * PostgREST `or=` filter reproducing `public.signals_quality`'s own editorial gate.
 *
 * WHY CALLERS NEED THIS
 * ---------------------
 * Every read in this module's vocabulary now targets `signals`, not
 * `signals_quality`, because the nine quality columns above have never existed
 * on `signals_quality` in either schema — a query naming them 400s, `data`
 * comes back null, and the caller cannot tell that apart from an empty table.
 *
 * `public.signals_quality` is defined as
 *   (action is null or action <> 'rejected') and (reviewed = true or <score gates>)
 * so a reader that pins `reviewed = true` and then repoints to `signals` must
 * carry the action gate across or it silently readmits rejected rows.
 * Measured on production 2026-08-08: `signals` reviewed = 3,747;
 * reviewed and not rejected = 3,745 — exactly `signals_quality`'s reviewed
 * population. The score gates are unreachable under `reviewed = true` and are
 * therefore deliberately not reproduced (they are the legacy inverted scorer,
 * spec §2.5).
 *
 * Mirrors the view's own `action is null or action <> 'rejected'` rather than a
 * bare `not.eq.rejected`, because `action` is nullable and SQL's
 * `NOT (NULL = 'rejected')` evaluates to NULL, not TRUE — a bare `not.eq` would
 * silently drop every NULL-action row. Measured on production 2026-08-08 there
 * are currently zero NULL-action rows, so the two forms happen to agree today;
 * the `or` is kept because it is what the view guarantees and the column can go
 * back to NULL at any time. Same three-valued-logic trap as
 * {@link SIGNALS_FEED_CONTENT_TYPE_OR_FILTER}.
 */
export const NOT_REJECTED_OR_FILTER = 'action.is.null,action.neq.rejected' as const

export function isSurfaceable(row: SignalQualityRow): boolean {
  const label = typeof row.quality_label === 'string' ? row.quality_label.toLowerCase() : null
  if (label === null) return true
  return !(EXCLUDED_QUALITY_LABELS as readonly string[]).includes(label)
}

// ── Ordering ──────────────────────────────────────────────────────────────────

/**
 * Replacement for `order=score.desc`. Ranks by the validated classifier
 * confidence, then recency. `nullslast` keeps unclassified legacy rows below
 * classified ones rather than at the top (which is what `score.desc` did).
 */
export const SIGNAL_QUALITY_ORDER = 'quality_confidence.desc.nullslast,date.desc'

/** supabase-js equivalent of {@link SIGNAL_QUALITY_ORDER}. */
export const SIGNAL_QUALITY_ORDER_JS = [
  { column: 'quality_confidence', ascending: false, nullsFirst: false },
  { column: 'date', ascending: false, nullsFirst: false },
] as const

// ── Row shape ─────────────────────────────────────────────────────────────────

export type SignalQualityRow = {
  quality_label?: unknown
  quality_confidence?: unknown
  content_type?: unknown
  impact?: unknown
  title_en?: unknown
  summary_en?: unknown
  lang_detected?: unknown
  is_representative?: unknown
  cluster_rep_id?: unknown
  headline?: unknown
  summary?: unknown
  country?: unknown
  reviewed?: unknown
}

export type SignalContentType = 'regulatory' | 'market' | 'story' | 'research' | 'noise'
export type SignalConfidenceBand = 'low' | 'medium' | 'high' | 'verified'
export type SignalImpactLevel = 'low' | 'moderate' | 'high' | 'critical'

// ── Confidence ────────────────────────────────────────────────────────────────

/**
 * Confidence assigned to a row that was promoted before Pipeline B classified
 * it. These passed the earlier human-review pass, which is a real — if
 * different-in-kind — quality signal. Deliberately below the classifier's own
 * high band so an unmeasured row never outranks a measured one.
 */
const HUMAN_REVIEWED_FALLBACK = 90

/**
 * Confidence as a 0–100 integer, or `null` when nothing trustworthy is known.
 *
 * Never derived from `signals.score`. A row with neither a classifier verdict
 * nor human review returns `null` so callers can render "unrated" instead of
 * inventing a number.
 */
export function resolveConfidence(row: SignalQualityRow): number | null {
  const qc = row.quality_confidence
  if (typeof qc === 'number' && Number.isFinite(qc)) {
    return Math.max(0, Math.min(100, Math.round(qc * 100)))
  }
  // Some PostgREST numeric columns arrive as strings.
  if (typeof qc === 'string' && qc.trim() !== '') {
    const parsed = Number(qc)
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, Math.round(parsed * 100)))
  }
  if (row.reviewed === true) return HUMAN_REVIEWED_FALLBACK
  return null
}

/** Banded confidence for badge rendering. */
export function resolveConfidenceBand(row: SignalQualityRow): SignalConfidenceBand | null {
  const score = resolveConfidence(row)
  if (score === null) return null
  if (score >= 90) return 'verified'
  if (score >= 75) return 'high'
  if (score >= 55) return 'medium'
  return 'low'
}

// ── Impact ────────────────────────────────────────────────────────────────────

/**
 * Impact from the classifier's own `impact` verdict (`high`/`medium`/`low`),
 * mapped onto the public `RegulatoryImpactLevel` vocabulary.
 *
 * `critical` is reserved for a high-impact call the classifier is also highly
 * confident about — the classifier itself has no `critical` band, so inventing
 * one from `impact` alone would overstate it.
 */
export function resolveImpact(row: SignalQualityRow): SignalImpactLevel | null {
  const raw = typeof row.impact === 'string' ? row.impact.toLowerCase() : null
  if (!raw) return null
  const confidence = resolveConfidence(row) ?? 0
  if (raw === 'high') return confidence >= 85 ? 'critical' : 'high'
  if (raw === 'medium') return 'moderate'
  if (raw === 'low') return 'low'
  return null
}

// ── Content type ──────────────────────────────────────────────────────────────

const CONTENT_TYPES: readonly SignalContentType[] = ['regulatory', 'market', 'story', 'research', 'noise']

export function resolveContentType(row: SignalQualityRow): SignalContentType | null {
  const raw = typeof row.content_type === 'string' ? row.content_type.toLowerCase() : null
  if (!raw) return null
  return (CONTENT_TYPES as readonly string[]).includes(raw) ? (raw as SignalContentType) : null
}

/**
 * Destination surfaces for a signal, per spec §4.3. Returned as a list because
 * `market` legitimately belongs on both.
 */
export function routeContentType(row: SignalQualityRow): Array<'signals' | 'digest'> {
  switch (resolveContentType(row)) {
    case 'regulatory': return ['signals']
    case 'market':     return ['signals', 'digest']
    case 'story':      return ['digest']
    case 'research':   return ['digest']
    // `noise` routes nowhere. Returning ['signals'] from the default branch — as an
    // earlier revision did — would have surfaced it, which a test caught.
    case 'noise':      return []
    // NULL only: rows promoted before Pipeline B classified them predate the
    // taxonomy and default to the Signals feed rather than disappearing.
    default:           return ['signals']
  }
}

/**
 * Content types the Signals feed carries.
 *
 * `story` and `research` belong on the Digest (spec §4.3) and are bridged there by
 * `hv_route_signals_to_digest()`. Until 2026-07-30 nothing enforced this in either
 * direction: 395 promoted story/research signals were presenting as regulatory
 * intelligence in the Signals feed while the Digest starved for candidates.
 *
 * NULL `content_type` is retained — rows promoted before Pipeline B classified them
 * predate the taxonomy, and dropping them would silently shrink the feed.
 */
export const SIGNALS_FEED_CONTENT_TYPES = ['regulatory', 'market'] as const

/** The content types that must not appear on the Signals feed. */
export const SIGNALS_FEED_CONTENT_TYPE_NOT_IN = "(story,research,noise)"

/**
 * PostgREST filter enforcing the above server-side.
 *
 * Must be an explicit `or` against `is.null` rather than a bare
 * `content_type=not.in.(...)`. SQL three-valued logic makes `NULL NOT IN (...)`
 * evaluate to NULL, not TRUE, so a bare `not.in` silently drops every row with
 * no content_type — 40 legacy reviewed rows at the time of writing. That is the
 * exact silent shrink `belongsOnSignalsFeed` exists to prevent, and it would
 * have made the query and the mapper disagree about the same rows.
 */
export const SIGNALS_FEED_CONTENT_TYPE_OR_FILTER =
  `(content_type.is.null,content_type.not.in.${SIGNALS_FEED_CONTENT_TYPE_NOT_IN})` as const

export function belongsOnSignalsFeed(row: SignalQualityRow): boolean {
  const ct = resolveContentType(row)
  if (ct === null) return true
  return routeContentType(row).includes('signals')
}

// ── Translation ───────────────────────────────────────────────────────────────

function nonEmpty(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}

/**
 * Display headline, preferring the translated title.
 *
 * `hv_translate_harvest` writes `title_en` for non-English signals. Nothing read
 * it, so a Portuguese gazette entry rendered its original-language headline to
 * an English-reading user — which is what made the platform's non-English
 * coverage illegible rather than valuable.
 */
export function displayHeadline(row: SignalQualityRow): string | null {
  return nonEmpty(row.title_en) ?? nonEmpty(row.headline)
}

/** Display summary, preferring the translated summary. */
export function displaySummary(row: SignalQualityRow): string | null {
  return nonEmpty(row.summary_en) ?? nonEmpty(row.summary)
}

/** ISO-639-1 code of the source document when it was not English. */
export function originalLanguage(row: SignalQualityRow): string | null {
  const lang = nonEmpty(row.lang_detected)?.toLowerCase() ?? null
  if (!lang || lang === 'en') return null
  return lang
}

/** True when the displayed headline/summary is machine-translated. */
export function isTranslated(row: SignalQualityRow): boolean {
  return originalLanguage(row) !== null && nonEmpty(row.title_en) !== null
}

const LANGUAGE_LABELS: Record<string, string> = {
  ar: 'Arabic',   cs: 'Czech',      da: 'Danish',     de: 'German',
  el: 'Greek',    es: 'Spanish',    fi: 'Finnish',    fr: 'French',
  he: 'Hebrew',   hi: 'Hindi',      hr: 'Croatian',   hu: 'Hungarian',
  id: 'Indonesian', it: 'Italian',  ja: 'Japanese',   ko: 'Korean',
  nl: 'Dutch',    no: 'Norwegian',  pl: 'Polish',     pt: 'Portuguese',
  ro: 'Romanian', ru: 'Russian',    sk: 'Slovak',     sv: 'Swedish',
  th: 'Thai',     tr: 'Turkish',    uk: 'Ukrainian',  vi: 'Vietnamese',
  zh: 'Chinese',
}

/** Human-readable source language, e.g. "Portuguese". Falls back to the code. */
export function originalLanguageLabel(row: SignalQualityRow): string | null {
  const code = originalLanguage(row)
  if (!code) return null
  return LANGUAGE_LABELS[code] ?? code.toUpperCase()
}

// ── Corroboration ─────────────────────────────────────────────────────────────

/**
 * Count how many signals in `rows` belong to each dedup cluster, then report
 * per-signal corroboration.
 *
 * `hv_dedup_assign` clusters near-identical reports at cosine >= 0.90 and marks
 * one row `is_representative`. That clustering was computed on every run and
 * displayed nowhere. "Reported by N sources" is the most defensible thing this
 * data can say and no comparable product offers it.
 *
 * Scope caveat, deliberately honest: this counts only cluster members present in
 * the rows handed to it (i.e. the current feed window), so it is a lower bound
 * on true corroboration. Callers should phrase it as "in this feed" or pass the
 * widest set they have. A DB-side count over the whole corpus would need a view;
 * that is intentionally not introduced here.
 */
export function buildCorroborationIndex(
  rows: Array<SignalQualityRow & { id?: unknown }>,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = nonEmpty(row.cluster_rep_id)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/** Corroborating-source count for one row, given an index. Minimum 1 (itself). */
export function corroborationCount(
  row: SignalQualityRow,
  index: Map<string, number>,
): number {
  const key = nonEmpty(row.cluster_rep_id)
  if (!key) return 1
  return Math.max(1, index.get(key) ?? 1)
}

// ── Country resolution ────────────────────────────────────────────────────────

type CountryIdentity = { code: string; slug: string; name: string; region: string | null }

function normaliseCountryKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Common short forms and historical names that appear in scraped `country`
 * values but not in the canonical UN identity list.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  'united states':          'united-states-of-america',
  'usa':                    'united-states-of-america',
  'us':                     'united-states-of-america',
  'united kingdom':         'united-kingdom-of-great-britain-and-northern-ireland',
  'uk':                     'united-kingdom-of-great-britain-and-northern-ireland',
  'great britain':          'united-kingdom-of-great-britain-and-northern-ireland',
  'britain':                'united-kingdom-of-great-britain-and-northern-ireland',
  'england':                'united-kingdom-of-great-britain-and-northern-ireland',
  'scotland':               'united-kingdom-of-great-britain-and-northern-ireland',
  'wales':                  'united-kingdom-of-great-britain-and-northern-ireland',
  'russia':                 'russian-federation',
  'south korea':            'republic-of-korea',
  'north korea':            'democratic-peoples-republic-of-korea',
  'korea':                  'republic-of-korea',
  'iran':                   'iran-islamic-republic-of',
  'bolivia':                'bolivia-plurinational-state-of',
  'venezuela':              'venezuela-bolivarian-republic-of',
  'tanzania':               'united-republic-of-tanzania',
  'moldova':                'republic-of-moldova',
  'netherlands':            'netherlands-kingdom-of-the',
  'holland':                'netherlands-kingdom-of-the',
  'turkey':                 'turkiye',
  'vietnam':                'viet-nam',
  'laos':                   'lao-peoples-democratic-republic',
  'syria':                  'syrian-arab-republic',
  'palestine':              'state-of-palestine',
  'czech republic':         'czechia',
  'cape verde':             'cabo-verde',
  'ivory coast':            'cote-divoire',
  'drc':                    'democratic-republic-of-the-congo',
  'dr congo':               'democratic-republic-of-the-congo',
  'congo kinshasa':         'democratic-republic-of-the-congo',
  'macedonia':              'north-macedonia',
  'swaziland':              'eswatini',
  'burma':                  'myanmar',
  'east timor':             'timor-leste',
  'brunei':                 'brunei-darussalam',
  'micronesia':             'micronesia-federated-states-of',
  'saint martin':           'saint-martin-french-part',
  'sint maarten':           'sint-maarten-dutch-part',
  'vatican':                'holy-see',
  'vatican city':           'holy-see',
}

const BY_KEY: Map<string, CountryIdentity> = (() => {
  const map = new Map<string, CountryIdentity>()
  const bySlug = new Map<string, CountryIdentity>()

  for (const row of countryIdentityRows) {
    const [id, slug, name, region] = row as unknown as [string, string, string, string | null, string | null, string]
    const identity: CountryIdentity = {
      // `country_area:USA` → `USA` (ISO-3166-1 alpha-3)
      code: id.split(':')[1] ?? '',
      slug,
      name,
      region: region ?? null,
    }
    bySlug.set(slug, identity)
    map.set(normaliseCountryKey(name), identity)
    map.set(normaliseCountryKey(slug), identity)
  }

  for (const [alias, slug] of Object.entries(COUNTRY_ALIASES)) {
    const identity = bySlug.get(slug)
    if (identity) map.set(normaliseCountryKey(alias), identity)
  }

  return map
})()

/**
 * Resolve a free-text country value from `signals.country` into canonical
 * identity. Returns `null` for values like "Global" that are not countries.
 *
 * `lib/regulatory-signals/public.ts` previously hard-coded `country_code: null`
 * and `region: null` on every signal from `public.signals`, which meant the
 * feed whose entire differentiator is geographic breadth could not be filtered
 * or grouped geographically.
 */
export function resolveCountry(value: unknown): CountryIdentity | null {
  const raw = nonEmpty(value)
  if (!raw) return null
  return BY_KEY.get(normaliseCountryKey(raw)) ?? null
}

// ── Freshness ─────────────────────────────────────────────────────────────────

/**
 * Age of the newest item in a feed, in hours, or `null` if unknown.
 *
 * Surfaced so a stale feed is never *silently* stale. The Intel feed went nine
 * days without a new promotion while every monitor reported green; the UI gave
 * a reader no way to tell.
 */
export function feedAgeHours(dates: Array<string | null | undefined>): number | null {
  let newest = Number.NEGATIVE_INFINITY
  for (const d of dates) {
    if (!d) continue
    const t = Date.parse(d)
    if (Number.isFinite(t) && t > newest) newest = t
  }
  if (!Number.isFinite(newest)) return null
  return Math.max(0, (Date.now() - newest) / 36e5)
}

/** Staleness banding for a feed. Thresholds chosen against a daily-ingest cadence. */
export function freshnessBand(ageHours: number | null): 'live' | 'recent' | 'stale' | 'unknown' {
  if (ageHours === null) return 'unknown'
  if (ageHours <= 36) return 'live'
  if (ageHours <= 24 * 5) return 'recent'
  return 'stale'
}
