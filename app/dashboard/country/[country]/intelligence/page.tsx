import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'
import { listIaSignalsByMarket } from '@/lib/intelligence-automation/db'

import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return {
    title: `${displayName} Intelligence | Harbourview`,
    description: `Harbourview ${displayName} intelligence dashboard. Country-level market intelligence, pathway context and commercial routing for regulated cannabis.`,
  }
}


type Props = { params: Promise<{ country: string }> }

type BriefMeta = {
  classification: string
  methodology:    string
  confidence:     string
  confidenceNum:  number
  coverage:       { section: string; status: string; available: boolean }[]
  orientationPoints: string[]
}

function deriveBriefMeta(state: DashboardPanelState, countryName: string): BriefMeta {
  const map: Record<DashboardPanelState, BriefMeta> = {
    live: {
      classification:  'Live — public dashboard',
      methodology:     'Direct regulatory source monitoring, operator network reporting, and Harbourview analyst review. Data is sourced from national medicines authority publications, parliamentary legislation trackers, and operator disclosures.',
      confidence:      'High',
      confidenceNum:   88,
      coverage: [
        { section: 'Regulatory posture',   status: 'Live tracked',     available: true  },
        { section: 'Import framework',     status: 'Live tracked',     available: true  },
        { section: 'Operator landscape',   status: 'Live tracked',     available: true  },
        { section: 'Compliance signals',   status: 'Partial coverage', available: true  },
        { section: 'Market signals',       status: 'Live tracked',     available: true  },
        { section: 'Connection routing',   status: 'Review-gated',     available: false },
      ],
      orientationPoints: [
        `${countryName} has an established medical-access framework with active import and operator licensing.`,
        'Regulatory authority publications are monitored continuously; signal frequency is high.',
        'Harbourview maintains direct intelligence sourcing from published operator disclosures and regulatory bulletins.',
        'Connection routing and counterparty data are review-gated and not available on the public dashboard.',
      ],
    },
    partial: {
      classification:  'Partial — reviewed orientation',
      methodology:     'Harbourview analyst review of available public sources including government publications, health ministry advisories, and trade press. Some source layers are incomplete or require follow-up.',
      confidence:      'Moderate',
      confidenceNum:   58,
      coverage: [
        { section: 'Regulatory posture',   status: 'Partial coverage', available: true  },
        { section: 'Import framework',     status: 'Orientation only', available: true  },
        { section: 'Operator landscape',   status: 'Review-gated',     available: false },
        { section: 'Compliance signals',   status: 'Review-gated',     available: false },
        { section: 'Market signals',       status: 'Partial coverage', available: true  },
        { section: 'Connection routing',   status: 'Review-gated',     available: false },
      ],
      orientationPoints: [
        `${countryName} has a partial intelligence record; some source layers remain incomplete or review-gated.`,
        'Regulatory posture and import framework are tracked with partial source coverage.',
        'Operator, compliance, and connection data are not available on the public surface.',
        'Request Harbourview review for deeper routing and counterparty access.',
      ],
    },
    'static-orientation': {
      classification:  'Static orientation — public surface only',
      methodology:     'Static orientation data compiled from publicly available government and trade sources. Sources are not continuously monitored; data reflects a point-in-time snapshot.',
      confidence:      'Low',
      confidenceNum:   28,
      coverage: [
        { section: 'Regulatory posture',   status: 'Static snapshot',  available: true  },
        { section: 'Import framework',     status: 'Not tracked',      available: false },
        { section: 'Operator landscape',   status: 'Not tracked',      available: false },
        { section: 'Compliance signals',   status: 'Not tracked',      available: false },
        { section: 'Market signals',       status: 'Fallback only',    available: false },
        { section: 'Connection routing',   status: 'Not available',    available: false },
      ],
      orientationPoints: [
        `${countryName} is tracked with static orientation data only; live source monitoring is not active for this jurisdiction.`,
        'Regulatory framework snapshot is available; import, operator, and connection data are not tracked.',
        'Harbourview can provide a reviewed brief on request; static data should not be used for commercial routing.',
      ],
    },
    'fallback-backed': {
      classification:  'Fallback — orientation pending',
      methodology:     'Fallback orientation data compiled while active source monitoring is established. Data may not reflect current regulatory or market posture.',
      confidence:      'Low',
      confidenceNum:   20,
      coverage: [
        { section: 'Regulatory posture',   status: 'Fallback data',    available: true  },
        { section: 'Import framework',     status: 'Not confirmed',    available: false },
        { section: 'Operator landscape',   status: 'Not tracked',      available: false },
        { section: 'Compliance signals',   status: 'Not tracked',      available: false },
        { section: 'Market signals',       status: 'Not tracked',      available: false },
        { section: 'Connection routing',   status: 'Not available',    available: false },
      ],
      orientationPoints: [
        `${countryName} intelligence record is backed by fallback orientation data while active source coverage is established.`,
        'Fallback data should not be used as the sole basis for commercial or regulatory routing decisions.',
        'Request Harbourview review to initiate a reviewed intelligence record for this jurisdiction.',
      ],
    },
    'request-only': {
      classification:  'Request-only — private routing',
      methodology:     'Intelligence data for this jurisdiction is held in the private Harbourview intelligence record and is not available on the public surface.',
      confidence:      'Undisclosed',
      confidenceNum:   0,
      coverage: [
        { section: 'Regulatory posture',   status: 'Request-gated',    available: false },
        { section: 'Import framework',     status: 'Request-gated',    available: false },
        { section: 'Operator landscape',   status: 'Request-gated',    available: false },
        { section: 'Compliance signals',   status: 'Request-gated',    available: false },
        { section: 'Market signals',       status: 'Request-gated',    available: false },
        { section: 'Connection routing',   status: 'Request-gated',    available: false },
      ],
      orientationPoints: [
        `${countryName} intelligence is not available on the public dashboard.`,
        'Submit a Harbourview review request to access the private intelligence record for this jurisdiction.',
      ],
    },
    'review-required': {
      classification:  'Review-required — analyst hold',
      methodology:     'Intelligence data is held pending Harbourview analyst review before it can be released to the public surface.',
      confidence:      'Pending review',
      confidenceNum:   0,
      coverage: [
        { section: 'Regulatory posture',   status: 'Review hold',      available: false },
        { section: 'Import framework',     status: 'Review hold',      available: false },
        { section: 'Operator landscape',   status: 'Review hold',      available: false },
        { section: 'Compliance signals',   status: 'Review hold',      available: false },
        { section: 'Market signals',       status: 'Review hold',      available: false },
        { section: 'Connection routing',   status: 'Review hold',      available: false },
      ],
      orientationPoints: [
        `${countryName} intelligence is under Harbourview analyst review.`,
        'Data will be released to the public or client surface once the review is complete.',
        'Request a review timeline update from Harbourview.',
      ],
    },
    unavailable: {
      classification:  'Unavailable',
      methodology:     'No intelligence record is available for this jurisdiction on the public dashboard.',
      confidence:      'None',
      confidenceNum:   0,
      coverage:        [],
      orientationPoints: [
        `${countryName} does not have an available intelligence record on the public dashboard.`,
        'Return to the globe or choose another jurisdiction.',
      ],
    },
  }
  return map[state]
}

// Map ia_signal commercial_impact + type → dashboard tone colour
function signalTone(impact: string, type: string): string {
  if (type === 'regulatory_change' || type === 'documentation_readiness') return 'green'
  if (impact === 'high')   return 'green'
  if (impact === 'medium') return 'gold'
  if (type === 'buyer_demand' || type === 'importer_activity' || type === 'distributor_activity') return 'blue'
  return 'slate'
}

// Map ia_signal stage → public label (no internal jargon)
function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    new:                       'New',
    needs_review:              'Active',
    qualified:                 'Qualified',
    converted_to_opportunity:  'Opportunity',
    linked_to_counterparty:    'Matched',
    linked_to_market_pathway:  'Pathway',
    archived:                  'Archived',
  }
  return labels[stage] ?? stage
}

const TONE_DOT: Record<string, string> = {
  green: '#5dcaa5', blue: '#7ec8f7', gold: '#f4d27a',
  amber: '#fbbf24', slate: 'rgba(255,255,255,0.25)', red: '#f87171',
}

export default async function IntelligencePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel  = country.panels.intelligence
  const badge  = getDashboardStatusBadge(panel.state)
  const meta   = deriveBriefMeta(panel.state, country.displayName)
  const showConfidenceBar = meta.confidenceNum > 0

  // ── Live signals from IA DB ───────────────────────────────────────────────
  const signalsResult = await listIaSignalsByMarket(country.displayName)
  const liveSignals   = signalsResult.ok
    ? signalsResult.data.filter(s => s.stage !== 'archived')
    : []
  const hasLiveSignals = liveSignals.length > 0

  const highImpact  = liveSignals.filter(s => s.commercialImpact === 'high').length
  const medImpact   = liveSignals.filter(s => s.commercialImpact === 'medium').length
  const qualified   = liveSignals.filter(s => s.stage === 'qualified' || s.stage === 'converted_to_opportunity').length

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>
          {country.displayName}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Intelligence</span>
      </nav>

      {/* ── Brief header ── */}
      <div
        className="mb-5 rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(11,26,47,0.95) 0%, rgba(6,14,28,0.9) 100%)',
          border: `1px solid ${TONE_BORDER[badge.tone]}`,
          borderLeft: `4px solid ${TONE_TEXT[badge.tone]}`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Intelligence brief · {country.displayName}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-white">Country Intelligence</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
              style={{ background: TONE_BG[badge.tone], borderColor: TONE_BORDER[badge.tone], color: TONE_TEXT[badge.tone] }}
            >
              {badge.label}
            </span>
            {hasLiveSignals && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-400">
                {liveSignals.length} live signal{liveSignals.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Brief metadata row */}
        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3"
          style={{ borderColor: 'rgba(198,165,90,0.1)' }}
        >
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.4)' }}>Classification</p>
            <p className="mt-0.5 text-[12px] text-white">{meta.classification}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.4)' }}>Source confidence</p>
            <div className="mt-1 flex items-center gap-2">
              {showConfidenceBar && (
                <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${meta.confidenceNum}%`, background: TONE_TEXT[badge.tone] }}
                  />
                </div>
              )}
              <span className="text-[12px] text-white">{meta.confidence}</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.4)' }}>Last updated</p>
            <p className="mt-0.5 text-[12px] text-white">{country.lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* ── Orientation points ── */}
      <div
        className="mb-5 rounded-2xl p-4"
        style={{ background: 'rgba(7,15,30,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="mb-3 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          Key orientation points
        </p>
        <ul className="flex flex-col gap-2.5">
          {meta.orientationPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_TEXT[badge.tone], opacity: 0.6 }} />
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.65)' }}>{point}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Two-column: methodology + coverage ── */}
      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
            Source methodology
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
            {meta.methodology}
          </p>
        </div>

        {meta.coverage.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
              Coverage status
            </p>
            <div className="flex flex-col gap-1.5">
              {meta.coverage.map(({ section, status, available }) => (
                <div key={section} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: available ? TONE_TEXT[badge.tone] : 'rgba(255,255,255,0.2)' }}
                    />
                    <span className="truncate text-[11px]" style={{ color: available ? 'rgba(243,240,234,0.7)' : 'rgba(243,240,234,0.35)' }}>
                      {section}
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ color: available ? TONE_TEXT[badge.tone] : 'rgba(255,255,255,0.25)' }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Live intelligence signals ── */}
      {hasLiveSignals && (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              Live intelligence signals
            </p>
            <div className="flex gap-3 text-[10px]">
              {highImpact > 0 && <span className="text-emerald-400">{highImpact} high impact</span>}
              {qualified > 0  && <span className="text-purple-400">{qualified} qualified</span>}
              {medImpact > 0  && <span style={{ color: 'rgba(243,240,234,0.35)' }}>{medImpact} medium</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {liveSignals.map(sig => {
              const tone = signalTone(sig.commercialImpact, sig.type)
              return (
                <div
                  key={sig.id}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(7,15,30,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span
                    className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: TONE_DOT[tone] ?? TONE_DOT.slate }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-baseline gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em]"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                      >
                        {sig.type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em]"
                        style={{
                          background: sig.commercialImpact === 'high' ? 'rgba(93,202,165,0.1)' : 'rgba(255,255,255,0.04)',
                          color: sig.commercialImpact === 'high' ? '#5dcaa5' : 'rgba(255,255,255,0.25)',
                        }}
                      >
                        {sig.commercialImpact} impact
                      </span>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{sig.detectedAt}</span>
                      <span
                        className="text-[9px] uppercase tracking-[0.08em]"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        {stageLabel(sig.stage)}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-white">{sig.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
                      {sig.summary}
                    </p>
                    <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(198,165,90,0.45)' }}>
                      Source: {sig.sourceName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold" style={{ color: TONE_DOT[tone] }}>{sig.confidence}%</p>
                    <p className="text-[9px] uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.2)' }}>conf.</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No signals state for live/partial countries */}
      {!hasLiveSignals && (panel.state === 'live' || panel.state === 'partial') && (
        <div
          className="mb-5 rounded-2xl p-4"
          style={{ background: 'rgba(7,15,30,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[12px]" style={{ color: 'rgba(243,240,234,0.35)' }}>
            No active intelligence signals for {country.displayName} at this time.
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=intelligence-review&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Request intelligence review
        </Link>
        <Link
          href={`${country.dashboardPath}/signals`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View signals →
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
