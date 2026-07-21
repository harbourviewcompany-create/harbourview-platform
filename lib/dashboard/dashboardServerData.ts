import 'server-only'
import { listIaSignals } from '@/lib/intelligence-automation/db'
import type { AutomationSignal } from '@/lib/intelligence-automation/types'
import type { DashboardSignal } from './dashboardShared'
import { getPublicRegulatorySignalFeed } from '@/lib/regulatory-signals/public'
import type { PublicRegulatorySignal } from '@/lib/regulatory-signals/types'
import { SIGNAL_TAG_MAP, REG_TYPE_TO_TAG, INTEL_TAG_FALLBACK } from '@/lib/regulatory-signals/signalTags'
import { flagEmoji, flagForMarket } from '@/lib/utils/flagEmoji'


// ── HTML stripping for scraper-sourced titles ────────────────────────────────
function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\/?\$[A-Z]{2,8}(?:\.[A-Z]{2,4})?/g, '')
    .replace(/\s{2,}/g, ' ').trim().slice(0, 180)
}

// SIGNAL_TAG_MAP, REG_TYPE_TO_TAG, and INTEL_TAG_FALLBACK are now imported from
// @/lib/regulatory-signals/signalTags (single source of truth).
// flagEmoji and flagForMarket are imported from @/lib/utils/flagEmoji.

// Re-export SIGNAL_TAG_MAP so existing callers that import it from this file continue to work.
export { SIGNAL_TAG_MAP } from '@/lib/regulatory-signals/signalTags'

function confidenceToScore(c: PublicRegulatorySignal['confidence']): number {
  switch (c) {
    case 'verified':           return 99
    case 'high':               return 85
    case 'medium':             return 65
    case 'low':                return 42
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

// See matching comment in app/api/dashboard/digest/route.ts — editorial
// content spans a much wider age range than same-day trade signals, so it
// needs its own age label rather than being shown as "Today" regardless of
// how old the underlying story actually is.
function publishedLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000)
    if (diffDays < 35) return timeAgo(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return 'Recently'
  }
}

// ── Map PublicRegulatorySignal → DashboardSignal ──────────────────────────────
function regulatoryToSignal(s: PublicRegulatorySignal): DashboardSignal {
  const tagKey = REG_TYPE_TO_TAG[s.signal_type] ?? 'regulatory_change'
  const tag    = SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change
  const market = s.country_name ?? s.region ?? ''
  return {
    id:               s.id,
    slug:             s.slug,
    title:            stripHtml(s.headline),
    type:             tagKey,
    market,
    tag,
    timeAgo:          timeAgo(s.published_at ?? s.signal_date),
    confidence:       confidenceToScore(s.confidence),
    commercialImpact: s.public_implication,
    sourceLabel:      s.regulator_name || 'Harbourview Intelligence',
    flag:             flagEmoji(s.country_code),
  }
}

export type { DashboardSignal } from './dashboardShared'

// ── Round-robin signals across countries so the global feed reflects genuinely
// global coverage rather than being dominated by whichever country has the
// most ingested rows (and thus the most recent dates). Within each country,
// original order (most-recent-first) is preserved.
function diversifyByCountry<T>(rows: T[], limit: number, getCountry: (r: T) => string | null | undefined): T[] {
  if (rows.length <= limit) return rows
  const byCountry = new Map<string, T[]>()
  for (const r of rows) {
    const c = getCountry(r) ?? '__none__'
    const list = byCountry.get(c)
    if (list) list.push(r)
    else byCountry.set(c, [r])
  }
  const result: T[] = []
  let round = 0
  while (result.length < limit) {
    let added = false
    for (const list of byCountry.values()) {
      const item = list[round]
      if (item) {
        result.push(item)
        added = true
        if (result.length >= limit) break
      }
    }
    if (!added) break
    round++
  }
  return result
}


// ── Map AutomationSignal → DashboardSignal ────────────────────────────────────
function shapeSignals(signals: AutomationSignal[], limit: number): DashboardSignal[] {
  return signals
    .filter(s => s.stage !== 'archived')
    .slice(0, limit)
    .map(s => ({
      id: s.id,
      slug: undefined,
      title: stripHtml(s.title),
      type: s.type,
      market: s.market,
      tag: SIGNAL_TAG_MAP[s.type] ?? INTEL_TAG_FALLBACK,
      timeAgo: timeAgo(s.detectedAt),
      confidence: s.confidence,
      commercialImpact: s.commercialImpact,
      sourceLabel: 'Harbourview Intelligence',
      flag: flagForMarket(s.market),
    }))
}

type SignalAnalysis = {
  what_changed?: string
  who_is_affected?: string
  deadline?: string | null
  recommended_action?: string
  confidence_rationale?: string
}

type CuratedSignalRow = {
  id: string
  headline: string
  cat: string | null
  top_lane: string | null
  pri: string | null
  score: number | null
  country: string | null
  date: string | null
  created_at: string
  analysis?: SignalAnalysis | null
}

const LANE_TO_TAG: Record<string, string> = {
  regulatory:   'regulatory_change',
  trade:        'new_product_category',
  market:       'importer_activity',
  supply:       'distressed_asset',
  financial:    'facility_expansion',
}

function priToCommercial(pri: string | null, lane: string, country: string): string {
  const p = (pri ?? '').toLowerCase()
  const urgency = p === 'urgent' ? 'Urgent' : p === 'high' ? 'High-priority' : p === 'medium' ? 'Medium-priority' : 'Monitoring-level'
  const laneLabel = lane ? `${lane} signal` : 'signal'
  return `${urgency} ${laneLabel}${country ? ` for ${country}` : ''} -- review for relevance to current operations and pathway status.`
}

// ── Map curated public.signals row → DashboardSignal ──────────────────────────
// confidence: prefers the real Stage-2/3 classifier confidence (signal_classifications.confidence,
// 0-1 scale from an LLM judging actual content) when available. `s.score` is the legacy
// keyword-density scorer from before the classifier rework and is KNOWN INVERTED
// (rates nav/cookie-banner chrome ~99, genuine headlines <40 -- see
// docs/INTELLIGENCE_ARCHITECTURE_SPEC.md) -- it must never be shown to users as a
// confidence figure. Rows with no classifier row (mostly the earlier manually-approved
// batch) get a flat 90: they passed human editorial review, which is a legitimate --
// if different-in-kind -- confidence signal, and is strictly more honest than the old
// inverted score.
function curatedToSignal(s: CuratedSignalRow, classifierConfidence?: number | null): DashboardSignal {
  const laneKey = (s.top_lane ?? s.cat ?? '').toLowerCase()
  const tagKey  = LANE_TO_TAG[laneKey] ?? 'regulatory_change'
  const tag     = laneKey in LANE_TO_TAG ? (SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change)
    : INTEL_TAG_FALLBACK
  const market = s.country ?? ''
  const confidence = typeof classifierConfidence === 'number'
    ? Math.round(classifierConfidence * 100)
    : 90
  return {
    id:               s.id,
    slug:             undefined,    // public.signals has no slug; route uses /signals feed
    title:            stripHtml(s.headline),
    type:             tagKey,
    market,
    tag,
    timeAgo:          timeAgo(s.date ?? s.created_at),
    confidence,
    commercialImpact: priToCommercial(s.pri, laneKey, market),
    sourceLabel:      'Harbourview Regulatory Watch',
    flag:             flagForMarket(market),
    contentType:      'signal',
    analysis:         s.analysis ?? undefined,
  }
}

// ── fetchDashboardSignals ─────────────────────────────────────────────────────
// Priority: regulatory_signals (published + public_safe) → curated public.signals
//           → IA signals → fixtures
//
// When countryName is provided, country-relevant signals are surfaced first,
// with global / other-country signals filling remaining slots.
export async function fetchDashboardSignals(
  limit = 8,
  countryName?: string | null,
): Promise<DashboardSignal[]> {
  // 1. Regulatory signals — the properly reviewed, publication-grade source
  try {
    const feed = await getPublicRegulatorySignalFeed()
    if (feed.source === 'live-approved' && feed.signals.length > 0) {
      const all = feed.signals

      if (countryName) {
        // Prioritise: country match, then genuinely global/multilateral
        // content only (no country set, or explicitly tagged 'Global' --
        // e.g. WHO/INCB signals relevant to every importing country).
        // Deliberately do NOT pad with other NAMED countries' local
        // business news (a Florida dispensary opening, a Missouri research
        // program) just to fill the requested count -- that reads as noise
        // to a user viewing an unrelated country and erodes trust in the
        // feed. Better to show fewer, genuinely relevant signals than pad
        // with irrelevant ones.
        const nameLower = countryName.toLowerCase()
        const countryMatch = all.filter(
          s => s.country_name?.toLowerCase() === nameLower,
        )
        const globallyRelevant = all.filter(
          s => !s.country_name || s.country_name.toLowerCase() === 'global',
        )
        const prioritised = [...countryMatch, ...globallyRelevant]
        return prioritised.slice(0, limit).map(regulatoryToSignal)
      }

      return diversifyByCountry(all, limit, s => s.country_name).map(regulatoryToSignal)
    }
  } catch { /* fall through */ }

  // 2. Curated public.signals — 165+ reviewed rows across 30+ countries,
  //    the output of the global regulatory ingestion + analyst review pass.
  //    This is what powers the "Mexico Importer Signals" etc. country pages.
  //    Tries service-role client first (bypasses RLS); falls back to anon client.
  try {
    const signalQuery = async () => {
      try {
        const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
        const svc = await createSupabaseServiceClient()
        return svc
          .from('signals_quality')
          .select('id, headline, cat, top_lane, pri, score, country, date, created_at, analysis')
          .eq('reviewed', true)
          .order('score', { ascending: false })
          .limit(200)
      } catch {
        const { createClient } = await import('@/lib/supabase/server')
        const anon = await createClient()
        return anon
          .from('signals_quality')
          .select('id, headline, cat, top_lane, pri, score, country, date, created_at, analysis')
          .eq('reviewed', true)
          .order('score', { ascending: false })
          .limit(200)
      }
    }
    const { data, error } = await signalQuery()

    if (!error && data && data.length > 0) {
      const all = data as CuratedSignalRow[]

      // Best-effort fetch of real classifier confidence for these ids. Service-role
      // only (signal_classifications RLS blocks anon reads) -- falls back to an
      // empty map so the anon-client path degrades to the flat-90 default above
      // rather than erroring.
      const confidenceMap = new Map<string, number>()
      try {
        const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
        const svc = await createSupabaseServiceClient()
        const ids = all.map(s => s.id)
        const { data: classifications } = await svc
          .from('signal_classifications')
          .select('signal_id, confidence')
          .in('signal_id', ids)
        for (const row of classifications ?? []) {
          if (typeof row.confidence === 'number') confidenceMap.set(row.signal_id, row.confidence)
        }
      } catch { /* leave confidenceMap empty -- callers fall back to flat 90 */ }

      const toSignal = (s: CuratedSignalRow) => curatedToSignal(s, confidenceMap.get(s.id) ?? null)

      if (countryName) {
        // Same principle as the regulatory feed above: only pad with
        // genuinely global/multilateral content (no country tag, or
        // explicitly 'Global'), never another named country's local news.
        const nameLower = countryName.toLowerCase()
        const countryMatch = all.filter(s => s.country?.toLowerCase() === nameLower)
        const globallyRelevant = all.filter(
          s => !s.country || s.country.toLowerCase() === 'global',
        )
        const prioritised = [...countryMatch, ...globallyRelevant]
        return prioritised.slice(0, limit).map(toSignal)
      }

      return all.slice(0, limit).map(toSignal)
    }
  } catch { /* fall through */ }

  // 3. Intelligence-automation signals table
  try {
    const result = await listIaSignals()
    if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
      const all = result.data.filter(s => s.stage !== 'archived')

      if (countryName) {
        // ia_signals has no global/multilateral concept in its data (every
        // row is tagged to a specific named country) -- so unlike the two
        // feeds above, there's no safe "genuinely relevant" bucket to pad
        // with. Return country matches only, even if fewer than the
        // requested limit, rather than filling with unrelated countries.
        const nameLower = countryName.toLowerCase()
        const countryMatch = all.filter(s => s.market?.toLowerCase().includes(nameLower))
        return shapeSignals(countryMatch, limit)
      }

      return shapeSignals(all, limit)
    }
  } catch { /* fall through */ }

  // 4. No live signals yet — return empty array; dashboard shows empty state
  return []
}

// ── Daily digest ──────────────────────────────────────────────────────────────
// SSR first-paint for the DigestPage. Same public-safe source as the signals
// feed (reviewed rows from signals_quality), but ordered strictly by recency
// and returned alongside the window label the rows actually fall in, so the UI
// can say "New in the last 24h" vs "Most recent — nothing new in 24h" honestly.
//
// The reviewed feed can go quiet for stretches, so this uses a rolling window:
// 24h → 7d → 30d → most-recent-N. The client route (/api/dashboard/digest)
// hydrates with the full country-filtered set on mount; this just gives an
// instant, correctly-labelled first paint.

export type DigestWindow = '24h' | '7d' | '30d' | 'recent'

export type DailyDigest = {
  signals: DashboardSignal[]
  window: DigestWindow
}

type DigestRow = {
  id: string
  headline: string
  cat: string | null
  top_lane: string | null
  pri: string | null
  score: number | null
  country: string | null
  date: string | null
  created_at: string
}

const DIGEST_WINDOWS: { key: DigestWindow; hours: number }[] = [
  { key: '24h', hours: 24 },
  { key: '7d',  hours: 24 * 7 },
  { key: '30d', hours: 24 * 30 },
]

function digestRowRecency(r: DigestRow): number {
  const ref = r.date ?? r.created_at
  return ref ? new Date(ref).getTime() : 0
}

export async function fetchDailyDigest(
  limit = 20,
  countryName?: string | null,
): Promise<DailyDigest> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // ── Editorial edition first ───────────────────────────────────────────────
    // Published daily_digest (same content as the public /daily page). When an
    // edition exists it IS the digest; the rolling window below is fallback.
    const { data: edition, error: editionError } = await supabase
      .from('daily_digest')
      .select('digest_date, headlines, editorial_headlines, generated_at')
      .eq('status', 'published')
      .order('digest_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (editionError) {
      console.error('[fetchDailyDigest] daily_digest edition query failed:', editionError.message)
    }

    type EditorialHeadline = { headline?: string; why_it_matters?: string; market?: string; signal_id?: string }
    type NewsHeadline = { headline?: string; why_it_matters?: string; market?: string; item_id?: string; published_at?: string; source_url?: string; outlet_name?: string }

    const hasSignalEdition    = edition && Array.isArray(edition.headlines) && edition.headlines.length > 0
    const hasEditorialEdition = edition && Array.isArray(edition.editorial_headlines) && edition.editorial_headlines.length > 0

    if (hasSignalEdition || hasEditorialEdition) {
      let signalItems = (hasSignalEdition ? edition!.headlines as EditorialHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)
      let newsItems = (hasEditorialEdition ? edition!.editorial_headlines as NewsHeadline[] : [])
        .filter(h => typeof h?.headline === 'string' && h.headline.length > 0)

      if (countryName) {
        const needle = countryName.toLowerCase()
        const prioritize = <T extends { market?: string }>(items: T[]) => {
          const match = items.filter(h => (h.market ?? '').toLowerCase().includes(needle))
          const rest  = items.filter(h => !(h.market ?? '').toLowerCase().includes(needle))
          return [...match, ...rest]
        }
        signalItems = prioritize(signalItems)
        newsItems   = prioritize(newsItems)
      }

      const todayUtc  = new Date().toISOString().slice(0, 10)
      const editorialTag = { label: 'NEWS', color: '#B8AF9E', bg: 'rgba(184,175,158,0.10)', border: 'rgba(184,175,158,0.25)' }

      // Real per-signal classifier confidence (same source/idiom as curatedToSignal
      // above) instead of a flat 80 for every card regardless of content. Service-role
      // only (signal_classifications RLS blocks anon reads) -- falls back to a flat 90
      // per id (passed human editorial review) if the fetch fails or a signal_id has no
      // classifier row.
      const digestConfidenceMap = new Map<string, number>()
      try {
        const signalIds = signalItems.map(h => h.signal_id).filter((id): id is string => !!id)
        if (signalIds.length > 0) {
          const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
          const svc = await createSupabaseServiceClient()
          const { data: classifications } = await svc
            .from('signal_classifications')
            .select('signal_id, confidence')
            .in('signal_id', signalIds)
          for (const row of classifications ?? []) {
            if (typeof row.confidence === 'number') digestConfidenceMap.set(row.signal_id, row.confidence)
          }
        }
      } catch { /* leave digestConfidenceMap empty -- callers fall back to flat 90 */ }

      const signalSignals: DashboardSignal[] = signalItems.map((h, i) => ({
        id:               h.signal_id ?? `digest-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            h.headline!,
        type:             'regulatory_change',
        market:           h.market ?? 'Global',
        tag:              { label: 'REGULATION', color: '#D9A441', bg: 'rgba(217,164,65,0.15)', border: 'rgba(217,164,65,0.35)' },
        timeAgo:          'Today',
        confidence:       h.signal_id && digestConfidenceMap.has(h.signal_id)
          ? Math.round(digestConfidenceMap.get(h.signal_id)! * 100)
          : 90,
        commercialImpact: h.why_it_matters ?? '',
        sourceLabel:      'Harbourview Daily',
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'signal',
      }))

      const newsSignals: DashboardSignal[] = newsItems.map((h, i) => ({
        id:               h.item_id ?? `editorial-${edition!.digest_date}-${i}`,
        slug:             undefined,
        title:            h.headline!,
        type:             'editorial',
        market:           h.market ?? 'Global',
        tag:              editorialTag,
        timeAgo:          publishedLabel(h.published_at),
        confidence:       0,
        commercialImpact: h.why_it_matters ?? '',
        sourceLabel:      h.outlet_name ?? 'Global Cannabis News',
        sourceUrl:        h.source_url,
        flag:             flagForMarket(h.market ?? 'Global'),
        contentType:      'editorial',
      }))

      return {
        signals: [...signalSignals, ...newsSignals].slice(0, limit),
        window:  edition!.digest_date === todayUtc ? '24h' : 'recent',
      }
    }

    let query = supabase
      .from('signals_quality')
      .select('id, headline, cat, top_lane, pri, score, country, date, created_at')
      .eq('reviewed', true)
      .order('created_at', { ascending: false })
      .order('score', { ascending: false })
      .limit(200)

    if (countryName) {
      // Strip PostgREST filter delimiters ( , ( ) ) before interpolating into
      // the .or() clause, so a crafted country value can't inject conditions.
      const safeCountry = countryName.replace(/[,()]/g, '')
      query = query.or(`country.ilike.%${safeCountry}%,country.eq.Global`)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) return { signals: [], window: 'recent' }

    let rows = data as DigestRow[]

    if (countryName) {
      const needle = countryName.toLowerCase()
      const countrySpecific = rows.filter(r => r.country?.toLowerCase().includes(needle))
      const others          = rows.filter(r => !r.country?.toLowerCase().includes(needle))
      rows = [...countrySpecific, ...others]
    }

    const now = Date.now()
    let windowKey: DigestWindow = 'recent'
    let windowed: DigestRow[] = []
    for (const w of DIGEST_WINDOWS) {
      const cutoff = now - w.hours * 3_600_000
      const inWindow = rows.filter(r => {
        const t = digestRowRecency(r)
        return t >= cutoff && t <= now
      })
      if (inWindow.length > 0) {
        windowKey = w.key
        windowed = inWindow
        break
      }
    }
    if (windowed.length === 0) {
      windowKey = 'recent'
      windowed = rows
    }

    return {
      signals: windowed.slice(0, limit).map(curatedToSignal),
      window: windowKey,
    }
  } catch (err) {
    console.error('[fetchDailyDigest] unexpected error:', err)
    return { signals: [], window: 'recent' }
  }
}

// ── Role display mapping ──────────────────────────────────────────────────────
export { ROLE_PROFILES } from './dashboardShared'

// ── Education categories per role ─────────────────────────────────────────────
const ROLE_EDU_CATEGORIES: Record<string, { icon: string; title: string; desc: string }[]> = {
  doctor_prescriber: [
    { icon: '🩺', title: 'Prescribing Pathways',  desc: 'Clinical protocols & authorisation' },
    { icon: '💊', title: 'Dosage & Formulations', desc: 'Dosing guidance by condition'       },
    { icon: '⚖️', title: 'Country Rules',          desc: 'Jurisdiction-specific law'          },
    { icon: '📋', title: 'GMP Standards',          desc: 'Product quality requirements'       },
    { icon: '📖', title: 'Clinical Evidence',      desc: 'Research & trial summaries'         },
    { icon: '🔬', title: 'Pharmacology',           desc: 'Cannabinoid mechanism & effects'    },
  ],
  pharmacist: [
    { icon: '💊', title: 'Pharmacists',            desc: 'Dispensing & interaction safety'    },
    { icon: '📐', title: 'Dosage Education',       desc: 'Personalised dosing protocols'      },
    { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Regulatory framework'               },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal requirements'        },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Manufacturing quality'              },
    { icon: '🔬', title: 'Drug Interactions',      desc: 'Contraindications & safety'         },
  ],
  lab_qa: [
    { icon: '🧪', title: 'Testing Standards',      desc: 'COA, potency & contaminant methods' },
    { icon: '📋', title: 'GMP / ISO Compliance',   desc: 'Lab certification & audit prep'     },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Testing requirements by market'     },
    { icon: '🔬', title: 'Analytical Methods',     desc: 'HPLC, GC-MS & microbial testing'   },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Jurisdiction testing obligations'   },
    { icon: '📜', title: 'Documentation',          desc: 'COA templates & chain of custody'   },
  ],
  gmp_quality: [
    { icon: '🏛️', title: 'GMP Standards',          desc: 'EU-GMP, WHO-GMP & equivalents'      },
    { icon: '📋', title: 'Audit Readiness',        desc: 'Inspection preparation & checklists' },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Quality requirements by market'     },
    { icon: '🔬', title: 'Analytical Methods',     desc: 'In-process & release testing'       },
    { icon: '📜', title: 'Quality Documentation',  desc: 'SOPs, batch records & deviations'   },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Market-specific GMP obligations'    },
  ],
  cultivator_producer: [
    { icon: '🌿', title: 'Cultivation Compliance', desc: 'Licence & growing standards'        },
    { icon: '📋', title: 'GMP for Producers',      desc: 'Post-harvest quality requirements'  },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Production rules by jurisdiction'   },
    { icon: '🧪', title: 'Testing Requirements',   desc: 'COA & quality benchmarks'           },
    { icon: '🗺️', title: 'Export Pathways',        desc: 'Market access for flower & extract' },
    { icon: '📜', title: 'Documentation',          desc: 'Batch records & traceability'       },
  ],
  geneticist_breeder: [
    { icon: '🧬', title: 'Genetics & IP',          desc: 'Variety protection & licensing'     },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Seed & plant material rules'        },
    { icon: '🌿', title: 'Strain Compliance',      desc: 'THC limits & approved varieties'    },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Market-specific genetics law'       },
    { icon: '🔬', title: 'Analytical Testing',     desc: 'Cannabinoid & terpene profiling'    },
    { icon: '📜', title: 'Documentation',          desc: 'COAs, passports & provenance'       },
  ],
  processor_extractor: [
    { icon: '⚗️', title: 'Extraction Compliance',  desc: 'Solvent rules & facility licensing' },
    { icon: '📋', title: 'GMP for Processors',     desc: 'Manufacturing quality standards'    },
    { icon: '🧪', title: 'Testing Requirements',   desc: 'Residual solvents & potency'        },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Processing rules by jurisdiction'   },
    { icon: '🗺️', title: 'Export Pathways',        desc: 'Market access for extracts'         },
    { icon: '📜', title: 'Documentation',          desc: 'COA, SDS & batch records'           },
  ],
  importer: [
    { icon: '📦', title: 'Import Frameworks',      desc: 'Licences & pathway requirements'    },
    { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Regulatory framework'               },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Market access by jurisdiction'      },
    { icon: '🤝', title: 'Trade & Access',         desc: 'Partner & counterparty guidance'    },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Product certification'              },
    { icon: '📜', title: 'Documentation',          desc: 'Permits, COAs & customs'            },
  ],
  exporter: [
    { icon: '✈️', title: 'Export Regulations',     desc: 'Export licences & pathways'         },
    { icon: '📜', title: 'Documentation',          desc: 'COA, GMP & permit requirements'     },
    { icon: '🗺️', title: 'Market Access',          desc: 'Target market frameworks'           },
    { icon: '⚖️', title: 'Compliance',             desc: 'Destination country rules'          },
    { icon: '🤝', title: 'Trade Partners',         desc: 'Buyer & distributor guidance'       },
    { icon: '📦', title: 'Logistics & Customs',    desc: 'Shipping & GDP requirements'        },
  ],
  distributor_wholesaler: [
    { icon: '🚚', title: 'Distribution Licences',  desc: 'Wholesale & storage compliance'     },
    { icon: '📦', title: 'Logistics & GDP',        desc: 'Good distribution practice'         },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Distribution rules by market'       },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Jurisdiction-specific requirements' },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Product handling requirements'      },
    { icon: '📜', title: 'Documentation',          desc: 'Chain of custody & audit trail'     },
  ],
  retail_operator: [
    { icon: '🏪', title: 'Retail Licences',        desc: 'Store authorisation & compliance'   },
    { icon: '⚖️', title: 'Country Rules',          desc: 'Retail rules by jurisdiction'       },
    { icon: '💊', title: 'Product Knowledge',      desc: 'Formats, dosing & safety'           },
    { icon: '📋', title: 'Staff Training',         desc: 'Compliance & customer guidance'     },
    { icon: '🔍', title: 'Supplier Verification',  desc: 'COA & quality requirements'         },
    { icon: '📜', title: 'Documentation',          desc: 'Record-keeping & reporting'         },
  ],
  clinic_healthcare_operator: [
    { icon: '🏥', title: 'Clinic Authorisation',   desc: 'Prescribing facility requirements'  },
    { icon: '🩺', title: 'Clinical Protocols',     desc: 'Patient assessment & follow-up'     },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Healthcare rules by jurisdiction'   },
    { icon: '💊', title: 'Formulary & Dosing',     desc: 'Product selection & protocols'      },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Medical cannabis access rules'      },
    { icon: '📜', title: 'Documentation',          desc: 'Patient records & reporting'        },
  ],
  regulatory_compliance: [
    { icon: '⚖️', title: 'Regulatory Frameworks', desc: 'Jurisdiction law & guidance'        },
    { icon: '📋', title: 'GMP & Quality',          desc: 'Manufacturing standards'            },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal requirements'        },
    { icon: '🏛️', title: 'Audit Readiness',        desc: 'Inspection preparation'             },
    { icon: '📜', title: 'Licence Pathways',       desc: 'Application & renewal'              },
    { icon: '🔍', title: 'Enforcement Trends',     desc: 'Regulatory action monitoring'       },
  ],
  legal_advisory: [
    { icon: '⚖️', title: 'Legal Frameworks',       desc: 'Cannabis law by jurisdiction'       },
    { icon: '📜', title: 'Licence & Permits',      desc: 'Authorisation pathways'             },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal requirements'        },
    { icon: '🏛️', title: 'Regulatory Updates',     desc: 'Policy changes & enforcement'       },
    { icon: '🤝', title: 'Commercial Structures',  desc: 'Contracts & IP considerations'      },
    { icon: '📋', title: 'Compliance Obligations', desc: 'Ongoing reporting & duties'         },
  ],
  investor_operator: [
    { icon: '📈', title: 'Market Analysis',        desc: 'Opportunity & risk assessment'      },
    { icon: '⚖️', title: 'Regulatory Landscape',  desc: 'Policy & law overview'              },
    { icon: '🏗️', title: 'Operations',             desc: 'Setup & compliance requirements'    },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Jurisdiction deep-dives'            },
    { icon: '💼', title: 'Deal Structures',        desc: 'Investment models'                  },
    { icon: '📊', title: 'Financial Models',       desc: 'Projections & benchmarks'           },
  ],
  government_regulator: [
    { icon: '🏛️', title: 'Regulatory Frameworks', desc: 'International policy comparison'    },
    { icon: '⚖️', title: 'Enforcement',            desc: 'Compliance monitoring approaches'   },
    { icon: '🗺️', title: 'Country Models',         desc: 'Regulatory design benchmarks'       },
    { icon: '📋', title: 'GMP Standards',          desc: 'Manufacturing oversight'            },
    { icon: '📊', title: 'Market Data',            desc: 'Supply chain & market metrics'      },
    { icon: '📜', title: 'Policy Resources',       desc: 'Legislation & treaty references'    },
  ],
  logistics_customs: [
    { icon: '📦', title: 'Import / Export Rules',  desc: 'Controlled substance transport'     },
    { icon: '🚚', title: 'GDP Compliance',         desc: 'Good distribution practice'         },
    { icon: '📜', title: 'Customs Documentation',  desc: 'Permits, licences & manifests'      },
    { icon: '⚖️', title: 'Regulatory Frameworks',  desc: 'Transport rules by jurisdiction'    },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Border & customs requirements'      },
    { icon: '🔍', title: 'Enforcement Trends',     desc: 'Customs action monitoring'          },
  ],
  budtender: [
    { icon: '💊', title: 'Product Knowledge',      desc: 'Formats, dosing & effects'         },
    { icon: '🌿', title: 'Strains & Genetics',     desc: 'Cultivar profiles & terpenes'       },
    { icon: '⚖️', title: 'Retail Compliance',      desc: 'Local sales rules & obligations'    },
    { icon: '🩺', title: 'Patient Guidance',       desc: 'Responsible use & contraindications'},
    { icon: '📋', title: 'Staff Training',         desc: 'Certification & knowledge standards' },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Jurisdiction retail rules'          },
  ],
  patient_caregiver_education: [
    { icon: '🩺', title: 'Patient Guidance',       desc: 'Access pathways & authorisation'    },
    { icon: '💊', title: 'Dosage & Formats',       desc: 'Product types & dosing basics'      },
    { icon: '📖', title: 'Clinical Evidence',      desc: 'Conditions & treatment research'    },
    { icon: '⚖️', title: 'Country Rules',          desc: 'Patient access by jurisdiction'     },
    { icon: '🔬', title: 'Pharmacology Basics',    desc: 'How cannabinoids work'              },
    { icon: '🤝', title: 'Support Resources',      desc: 'Caregiver & patient networks'       },
  ],
  not_sure: [
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal framework'           },
    { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Stay audit-ready'                   },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Manufacturing compliance'           },
    { icon: '📖', title: 'Clinical Evidence',      desc: 'Research & trial summaries'         },
    { icon: '📦', title: 'Trade & Access',         desc: 'Import/export frameworks'            },
    { icon: '📋', title: 'Getting Started',        desc: 'Orientation for new participants'   },
  ],
}

const DEFAULT_EDU = [
  { icon: '🩺', title: 'Doctors & Prescribers', desc: 'Clinical guidance & prescribing'  },
  { icon: '💊', title: 'Pharmacists',            desc: 'Dosing, interactions & safety'    },
  { icon: '📐', title: 'Dosage Education',       desc: 'Personalise dosing'               },
  { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Stay audit-ready'                 },
  { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal framework'         },
  { icon: '🏛️', title: 'GMP Standards',          desc: 'Manufacturing compliance'          },
]

export function getEduCategoriesForRole(roleId?: string) {
  return ROLE_EDU_CATEGORIES[roleId ?? ''] ?? DEFAULT_EDU
}

// ── Country status bar data ─────────────────────────────────────────────────────
// Full ~195-country dataset lives in lib/dashboard/countryStatusData.ts
// This file re-exports the public surface so callers need no extra imports.
import {
  getCountryStatusBar as _getStatusBar,
  type CountryStatusBar,
} from '@/lib/dashboard/countryStatusData'

export type { CountryStatusBar }
export { _getStatusBar as getCountryStatusBar }

const EMPTY_STATUS: CountryStatusBar = {
  status: 'Select Market', statusColor: '#6F7A86',
  opportunity: 'Not Selected', opportunityColor: '#6F7A86',
  regulatory: 'Not Selected', regulatoryColor: '#6F7A86',
  activity: 'No Market Selected', activityColor: '#6F7A86',
  score: 0, adultUse: '—', medicalUse: '—',
}

export function getEmptyCountryStatusBar(): CountryStatusBar {
  return EMPTY_STATUS
}

// ── Wanted Requests count ─────────────────────────────────────────────────────
export async function getWantedRequestsCount(countryIso2?: string | null): Promise<number> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    let q = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('listing_type', 'wanted')
      .eq('status', 'published')
    if (countryIso2) q = q.eq('location_country', countryIso2.toUpperCase())
    const { count, error } = await q
    if (!error && typeof count === 'number') return count
  } catch { /* Supabase unavailable */ }
  return 0
}


