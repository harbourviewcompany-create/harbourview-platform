import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'
import { getCountryIntelligence } from '@/data/harbourview/country-intelligence'
import { fetchDashboardSignals } from '@/lib/dashboard/dashboardServerData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { getLatestDailyDigest, headlinesForMarket } from '@/lib/harbourview/digest'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string }> }

type SignalCategory = { icon: string; label: string; description: string; available: boolean; cadence: string }
type FeedSignal     = { tag: string; headline: string; date: string; tone: string }
type SignalsDerived = {
  headline: string
  subline:  string
  categories: SignalCategory[]
  feedSignals: FeedSignal[]
  sourceNote: string
}

function deriveSignals(state: DashboardPanelState, countryName: string): SignalsDerived {
  const map: Record<DashboardPanelState, SignalsDerived> = {
    live: {
      headline: 'Live signal feed',
      subline:  'Curated regulatory, market, and trade intelligence signals are published in near real-time for this jurisdiction.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'New regulations, guidance updates, and authority decisions published by national health authorities.', available: true,  cadence: 'Event-driven' },
        { icon: '📈', label: 'Market signals',         description: 'Licensing activity, operator entrants, supply-chain movements, and pricing signals from active market data.', available: true,  cadence: 'Weekly' },
        { icon: '🚢', label: 'Trade signals',          description: 'Import permit activity, customs notices, export pathway developments, and cross-border trade updates.', available: true,  cadence: 'Weekly' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Prescriber education updates, CPD requirement changes, and formulary or access-pathway modifications.', available: true,  cadence: 'Monthly' },
        { icon: '📰', label: 'Media intelligence',     description: 'Curated news and editorial coverage from national and trade press relevant to the cannabis market.', available: true,  cadence: 'Daily digest' },
        { icon: '🔒', label: 'Private routing signals', description: 'Counterparty intelligence and private-network signals are routed through Harbourview review.', available: false, cadence: 'Review-gated' },
      ],
      feedSignals: [
        { tag: 'Regulatory', headline: `${countryName} health authority publishes updated GMP import guidance for cannabis medicines`, date: 'May 2026', tone: 'green' },
        { tag: 'Market',     headline: `New licensed wholesaler enters ${countryName} distribution network — second entrant this quarter`, date: 'May 2026', tone: 'blue' },
        { tag: 'Trade',      headline: `${countryName} customs authority issues revised narcotics import permit processing timeline`, date: 'Apr 2026', tone: 'gold' },
        { tag: 'Market',     headline: `Pharmacy dispensing volumes increase 22% QoQ per industry association data`, date: 'Apr 2026', tone: 'blue' },
        { tag: 'Regulatory', headline: `Proposed labelling amendment enters public consultation — 60-day comment period open`, date: 'Mar 2026', tone: 'amber' },
      ],
      sourceNote: 'Signals are sourced from official national authority publications, trade press, operator disclosures, and Harbourview network intelligence. Live feed updated on event-driven and scheduled cadence.',
    },
    partial: {
      headline: 'Partial signal coverage',
      subline:  'Core regulatory and market signals are published. Some signal categories remain fallback-backed or review-gated.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'Published regulatory updates from national authority sources.', available: true,  cadence: 'Event-driven' },
        { icon: '📈', label: 'Market signals',         description: 'Selective market signals from public sources; operator-level data is review-gated.', available: true,  cadence: 'Monthly' },
        { icon: '🚢', label: 'Trade signals',          description: 'Trade signals are partially available; some import/export data requires review routing.', available: false, cadence: 'Review-gated' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Partial prescriber pathway updates available from national college and health ministry sources.', available: true,  cadence: 'Quarterly' },
        { icon: '📰', label: 'Media intelligence',     description: 'Curated national press coverage included in partial signal feed.', available: true,  cadence: 'Weekly digest' },
        { icon: '🔒', label: 'Private routing signals', description: 'Private-network and counterparty signals require Harbourview review.', available: false, cadence: 'Review-gated' },
      ],
      feedSignals: [
        { tag: 'Regulatory', headline: `Health authority publishes updated cannabis medicine prescribing guidance`, date: 'May 2026', tone: 'green' },
        { tag: 'Market',     headline: `Import volumes reported by national pharmacy association — partial data`, date: 'Apr 2026', tone: 'blue' },
        { tag: 'Regulatory', headline: `Government confirms review of import framework — no timeline published`, date: 'Mar 2026', tone: 'amber' },
      ],
      sourceNote: 'Signals are sourced from public national authority publications and select trade press. Operator-level and counterparty signals are not available on the public surface.',
    },
    'static-orientation': {
      headline: 'Static intelligence signals',
      subline:  'Signals for this jurisdiction are orientation-only. No live feed is available; curated orientation signals are published periodically.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'Orientation-level regulatory signals published when major framework changes occur.', available: true,  cadence: 'Quarterly' },
        { icon: '📈', label: 'Market signals',         description: 'Market orientation signals for supplement and CBD-track channels.', available: true,  cadence: 'Quarterly' },
        { icon: '🚢', label: 'Trade signals',          description: 'Not available on static orientation track.', available: false, cadence: 'Not available' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Not applicable — no medical prescribing framework active.', available: false, cadence: 'Not applicable' },
        { icon: '📰', label: 'Media intelligence',     description: 'Periodic media monitoring included in orientation brief.', available: true,  cadence: 'Periodic' },
        { icon: '🔒', label: 'Private routing signals', description: 'Not available on static orientation track.', available: false, cadence: 'Not available' },
      ],
      feedSignals: [
        { tag: 'Orientation', headline: `${countryName} CBD market posture — static orientation published Q1 2026`, date: 'Jan 2026', tone: 'blue' },
        { tag: 'Regulatory',  headline: `No major regulatory changes recorded since last orientation review`, date: 'Jan 2026', tone: 'slate' },
      ],
      sourceNote: 'Orientation signals are sourced from Harbourview periodic intelligence reviews. Live signal feed is not available for this jurisdiction on the current console track.',
    },
    'fallback-backed': {
      headline: 'Fallback-backed signals',
      subline:  'Signal coverage for this jurisdiction is supported by fallback intelligence. Live signals are not available; orientation-level data is published.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'Fallback regulatory signals derived from regional and comparable-jurisdiction sources.', available: true,  cadence: 'Periodic' },
        { icon: '📈', label: 'Market signals',         description: 'Market signals are fallback-backed; operator-specific data is not available.', available: false, cadence: 'Fallback only' },
        { icon: '🚢', label: 'Trade signals',          description: 'Not available on fallback track.', available: false, cadence: 'Not available' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Not available on fallback track.', available: false, cadence: 'Not available' },
        { icon: '📰', label: 'Media intelligence',     description: 'Curated media signals from regional and national sources included in fallback brief.', available: true,  cadence: 'Periodic' },
        { icon: '🔒', label: 'Private routing signals', description: 'Not available on fallback track.', available: false, cadence: 'Not available' },
      ],
      feedSignals: [
        { tag: 'Fallback', headline: `${countryName} regulatory framework development — Harbourview monitoring active`, date: 'May 2026', tone: 'gold' },
        { tag: 'Regional', headline: `Regional cannabis policy developments may affect ${countryName} market posture`, date: 'Apr 2026', tone: 'slate' },
      ],
      sourceNote: 'Fallback signals are derived from regional intelligence and comparable-jurisdiction monitoring. Jurisdiction-specific live signal feed is not available.',
    },
    'request-only': {
      headline: 'Private signal routing',
      subline:  'Signals for this jurisdiction are routed through Harbourview private review only. No public signal feed is available.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'Available through Harbourview private review routing.', available: false, cadence: 'Request-gated' },
        { icon: '📈', label: 'Market signals',         description: 'Available through Harbourview private review routing.', available: false, cadence: 'Request-gated' },
        { icon: '🚢', label: 'Trade signals',          description: 'Available through Harbourview private review routing.', available: false, cadence: 'Request-gated' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Available through Harbourview private review routing.', available: false, cadence: 'Request-gated' },
        { icon: '📰', label: 'Media intelligence',     description: 'Available through Harbourview private review routing.', available: false, cadence: 'Request-gated' },
        { icon: '🔒', label: 'Private routing signals', description: 'All signals for this jurisdiction are private-routed. Submit a request to access.', available: false, cadence: 'Request-gated' },
      ],
      feedSignals: [],
      sourceNote: 'All signals for this jurisdiction are held behind private Harbourview routing. Submit a request to access jurisdiction-specific intelligence.',
    },
    'review-required': {
      headline: 'Review-gated signals',
      subline:  'Signal feed for this jurisdiction requires Harbourview review authorisation. Framework data is available after review.',
      categories: [
        { icon: '⚖️', label: 'Regulatory signals',    description: 'Available after Harbourview review authorisation.', available: false, cadence: 'Review-gated' },
        { icon: '📈', label: 'Market signals',         description: 'Available after Harbourview review authorisation.', available: false, cadence: 'Review-gated' },
        { icon: '🚢', label: 'Trade signals',          description: 'Available after Harbourview review authorisation.', available: false, cadence: 'Review-gated' },
        { icon: '🧑‍⚕️', label: 'Prescriber signals',    description: 'Available after Harbourview review authorisation.', available: false, cadence: 'Review-gated' },
        { icon: '📰', label: 'Media intelligence',     description: 'Available after Harbourview review authorisation.', available: false, cadence: 'Review-gated' },
        { icon: '🔒', label: 'Private routing signals', description: 'All signals require review authorisation.', available: false, cadence: 'Review-gated' },
      ],
      feedSignals: [],
      sourceNote: 'Signal access for this jurisdiction requires review authorisation. Submit a request to initiate the Harbourview review process.',
    },
    unavailable: {
      headline: 'Signals unavailable',
      subline:  'No signal data is available for this jurisdiction on the current console.',
      categories: [],
      feedSignals: [],
      sourceNote: 'Signal feed is not available for this jurisdiction.',
    },
  }
  return map[state]
}

const TONE_DOT: Record<string, string> = {
  green: '#5dcaa5', blue: '#7ec8f7', gold: '#f4d27a',
  amber: '#fbbf24', slate: 'rgba(255,255,255,0.25)', red: '#f87171',
}

export default async function SignalsPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) return notFound()

  const panel       = country.panels.signals
  const badge       = getDashboardStatusBadge(panel.state)
  const intel       = getCountryIntelligence(country.slug)
  const baseDerived = deriveSignals(panel.state, country.displayName)

  // ── Pull live signals (regulatory feed -> curated signals table -> IA),
  //    fall back to static registry / derived defaults ─────────────────────
  const liveSignals = await fetchDashboardSignals(12, country.displayName)

  // ── Harbourview Signals digest: today's editorial headlines for this market ──
  const { digest: dailyDigest, source: digestSource } = await getLatestDailyDigest()
  const digestHeadlines = headlinesForMarket(dailyDigest, country.displayName)
  const digestDateLabel = new Date(`${dailyDigest.digest_date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  function liveToFeedSignal(s: DashboardSignal): FeedSignal {
    const tone = s.confidence >= 80 ? 'green' : s.confidence >= 60 ? 'gold' : 'blue'
    return {
      tag:      s.tag.label,
      headline: s.title,
      date:     s.timeAgo,
      tone,
    }
  }

  const derived: SignalsDerived = (() => {
    // Prefer live signals (regulatory feed → curated signals table → IA) → static registry → derived defaults
    if (liveSignals.length > 0) {
      return {
        ...baseDerived,
        feedSignals: liveSignals.map(liveToFeedSignal),
        sourceNote: `${liveSignals.length} active signal${liveSignals.length !== 1 ? 's' : ''} from Harbourview's regulatory and market intelligence feed, covering ${country.displayName} and related jurisdictions. Sources include national regulator publications, operator disclosures, importer directories, and reviewed analyst intake.`,
      }
    }
    if (intel?.signals) {
      return {
        ...baseDerived,
        feedSignals: intel.signals.feedSignals.map(s => ({
          tag:      s.tag,
          headline: s.headline,
          date:     s.date,
          tone:     s.tone,
        })),
        sourceNote: intel.signals.sourceNote,
      }
    }
    return baseDerived
  })()

  const availableCount = derived.categories.filter((c) => c.available).length
  const signalsLive = liveSignals.length > 0

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>{country.displayName}</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Signals</span>
      </nav>

      {/* ── Hero ── */}
      <div
        className="mb-5 overflow-hidden rounded-2xl"
        style={{ background: TONE_BG[badge.tone], border: `1px solid ${TONE_BORDER[badge.tone]}`, borderLeft: `4px solid ${TONE_TEXT[badge.tone]}` }}
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Intelligence signals · {country.displayName}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-white">{derived.headline}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.58)' }}>
              {derived.subline}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
            style={{ background: TONE_BG[badge.tone], borderColor: TONE_BORDER[badge.tone], color: TONE_TEXT[badge.tone] }}
          >
            {badge.label}
          </span>
          {signalsLive && (
            <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-400">
              {liveSignals.length} live
            </span>
          )}
        </div>
        {derived.categories.length > 0 && (
          <div className="border-t px-5 py-2.5" style={{ borderColor: TONE_BORDER[badge.tone] }}>
            <p className="text-[10px]" style={{ color: 'rgba(243,240,234,0.38)' }}>
              {availableCount} of {derived.categories.length} signal categories active
            </p>
          </div>
        )}
      </div>

      {/* ── Harbourview Signals digest ── */}
      {digestHeadlines.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Harbourview Signals
            </h2>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {digestDateLabel}{digestSource === 'fixture' ? ' · preparing' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {digestHeadlines.map((item, i) => (
              <div
                key={item.signal_id ?? `${country.slug}-digest-${i}`}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(11,26,47,0.85)', border: '1px solid rgba(198,165,90,0.16)' }}
              >
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.12em]"
                    style={{ background: 'rgba(198,165,90,0.12)', color: '#C6A55A' }}
                  >
                    {item.market}
                  </span>
                </div>
                <p className="text-[13px] font-medium leading-snug text-white">{item.headline}</p>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.58)' }}>
                  <span className="font-semibold" style={{ color: 'rgba(198,165,90,0.85)' }}>Why it matters: </span>
                  {item.why_it_matters}
                </p>
                {item.whats_next && (
                  <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.44)' }}>
                    <span className="font-semibold" style={{ color: 'rgba(198,165,90,0.7)' }}>What&apos;s next: </span>
                    {item.whats_next}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Signal categories ── */}
      {derived.categories.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
            Signal categories
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {derived.categories.map((cat) => (
              <div
                key={cat.label}
                className="rounded-xl p-3.5"
                style={{
                  background: cat.available ? 'rgba(7,15,30,0.75)' : 'rgba(7,15,30,0.4)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: cat.available ? 1 : 0.6,
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cat.icon}</span>
                    <p className="text-[12px] font-medium text-white">{cat.label}</p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.1em]"
                    style={{
                      background: cat.available ? 'rgba(93,202,165,0.1)' : 'rgba(255,255,255,0.04)',
                      color: cat.available ? '#5dcaa5' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {cat.cadence}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.42)' }}>{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Signal feed ── */}
      {derived.feedSignals.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
            Recent signals
          </h2>
          <div className="flex flex-col gap-2">
            {derived.feedSignals.map((sig, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(7,15,30,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span
                  className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: TONE_DOT[sig.tone] ?? TONE_DOT.slate }}
                />
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-baseline gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em]"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                    >
                      {sig.tag}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{sig.date}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white">{sig.headline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Source note ── */}
      <div
        className="mb-5 rounded-2xl p-4"
        style={{ background: 'rgba(13,32,55,0.6)', border: '1px solid rgba(198,165,90,0.1)' }}
      >
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
          Source methodology
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.48)' }}>{derived.sourceNote}</p>
      </div>

      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=signal-subscription&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Subscribe to signals
        </Link>
        <Link
          href={`${country.dashboardPath}/intelligence`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View intelligence brief →
        </Link>
        <Link
          href={`${country.dashboardPath}/market`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View market posture →
        </Link>
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href={country.dashboardPath} className="text-[11px] transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.38)' }}>
          ← {country.displayName} overview
        </Link>
      </div>
    </div>
  )
}
