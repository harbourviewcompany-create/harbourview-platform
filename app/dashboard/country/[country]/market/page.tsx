import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'
import { getCountryIntelligence } from '@/data/harbourview/country-intelligence'
import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return {
    title: `${displayName} Market Overview | Harbourview`,
    description: `Harbourview ${displayName} market overview dashboard. Country-level market intelligence, pathway context and commercial routing for regulated cannabis.`,
  }
}


type Props = { params: Promise<{ country: string }> }

// ── State-derived market data ──────────────────────────────────────────────
type MarketDerived = {
  model:     { label: string; detail: string }
  imports:   { label: string; detail: string }
  operators: { label: string; detail: string }
  regulator: { label: string; detail: string }
}

function deriveMarketData(state: DashboardPanelState): MarketDerived {
  const map: Record<DashboardPanelState, MarketDerived> = {
    live: {
      model:     { label: 'Medical + Regulated Adult', detail: 'Full medical-access framework with adult-use regulatory provisions in effect.' },
      imports:   { label: 'Active import channels', detail: 'Import licences, GMP certification pathways, and narcotics import permit frameworks are operative.' },
      operators: { label: 'Licensed multi-operator', detail: 'Multiple licensed domestic operators; international suppliers are import-eligible under narcotics import permit frameworks.' },
      regulator: { label: 'National health authority', detail: 'National medicines regulator governs product approval, import authorisation, and operator licensing.' },
    },
    partial: {
      model:     { label: 'Medical access', detail: 'Medical-access framework is active with selective prescriber and dispensary routing.' },
      imports:   { label: 'Selective import channels', detail: 'Import is permitted under case-by-case narcotics permit; some product categories remain import-blocked.' },
      operators: { label: 'Restricted operator pool', detail: 'Licensed operator pool is limited; some product types require direct manufacturer import authorisation.' },
      regulator: { label: 'National medicines authority', detail: 'Regulated by national medicines regulator with oversight from the health ministry.' },
    },
    'static-orientation': {
      model:     { label: 'CBD / Limited access', detail: 'Only low-THC or CBD-classified products are accessible under the current framework.' },
      imports:   { label: 'CBD-only import pathway', detail: 'Import is limited to CBD isolates and broad-spectrum products within legal THC thresholds.' },
      operators: { label: 'Supplement-track operators', detail: 'Products are handled through supplement or nutraceutical operator channels, not narcotics licensing.' },
      regulator: { label: 'Food & supplement authority', detail: 'Products are regulated as food supplements; narcotics authority involvement is limited.' },
    },
    'fallback-backed': {
      model:     { label: 'Emerging framework', detail: 'Legislative or regulatory framework is under active development; orientation data reflects current draft posture.' },
      imports:   { label: 'Undefined import pathway', detail: 'No confirmed import framework; channels are expected to emerge as legislation progresses.' },
      operators: { label: 'Pre-licensing stage', detail: 'Operator licensing framework has not been finalised; early-mover engagement is limited to review-gated intake.' },
      regulator: { label: 'Regulatory authority (TBD)', detail: 'Regulatory mandate is expected to be assigned to the national health or medicines authority.' },
    },
    'request-only': {
      model:     { label: 'Private / request-gated', detail: 'Market access is private-route only; all engagement is routed through Harbourview review.' },
      imports:   { label: 'Case-by-case import', detail: 'Import may be possible under individual narcotics import permits; requires Harbourview routing review.' },
      operators: { label: 'Undisclosed operator pool', detail: 'Operator relationships and licensing details are not disclosed on the public dashboard; request review for access.' },
      regulator: { label: 'Restricted regulator access', detail: 'Regulatory contact and product pathway data are not available on the public surface.' },
    },
    'review-required': {
      model:     { label: 'Review-gated access', detail: 'Market posture data is available after Harbourview review and routing confirmation.' },
      imports:   { label: 'Review-gated import data', detail: 'Import framework details require review before disclosure; consult Harbourview before routing.' },
      operators: { label: 'Review-gated operator list', detail: 'Operator and counterparty data requires review authorisation before access.' },
      regulator: { label: 'Review-gated regulator info', detail: 'Regulator contact and pathway data are held behind review and not available on the public dashboard.' },
    },
    unavailable: {
      model:     { label: 'Not available', detail: 'Market framework data is not available on the public dashboard.' },
      imports:   { label: 'Not available', detail: 'Import pathway data is not available.' },
      operators: { label: 'Not available', detail: 'Operator data is not available.' },
      regulator: { label: 'Not available', detail: 'Regulator data is not available.' },
    },
  }
  return map[state]
}

export default async function MarketPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) return notFound()

  const panel       = country.panels.market
  const badge       = getDashboardStatusBadge(panel.state)
  const intel       = getCountryIntelligence(country.slug)
  const baseDerived = deriveMarketData(panel.state)

  // Fetch the live DB intel profile once, up front — used both for the tier-2
  // fallback below AND for the deep commercial-pathway / regulatory-outlook
  // content section further down (which was previously never rendered even
  // though the data layer already returns it).
  const liveProfile = await getCountryIntelProfile(country.iso2)

  // Tier 1: static registry (9 countries); Tier 2: live DB briefing; Tier 3: derived from panel state
  let derived: MarketDerived
  if (intel?.market) {
    derived = {
      model:     { label: intel.market.frameworkLabel,  detail: intel.market.frameworkDetail },
      imports:   { label: intel.market.importLabel,     detail: intel.market.importDetail },
      operators: { label: intel.market.operatorLabel,   detail: intel.market.operatorDetail },
      regulator: { label: intel.market.regulatorLabel,  detail: intel.market.regulatorDetail },
    }
  } else {
    derived = liveProfile?.briefing_program_status ? {
      model:     {
        label:  liveProfile.briefing_program_status,
        detail: liveProfile.briefing_market_dynamics ?? baseDerived.model.detail,
      },
      imports:   baseDerived.imports,
      operators: baseDerived.operators,
      regulator: {
        label:  liveProfile.briefing_regulatory_body?.split(';')[0]?.split('—')[0]?.trim() ?? baseDerived.regulator.label,
        detail: liveProfile.briefing_regulatory_body ?? baseDerived.regulator.detail,
      },
    } : baseDerived
  }
  const isLocked = panel.state === 'unavailable' || panel.state === 'request-only'

  // Deep intel content — rendered only when real enriched material exists and
  // the panel isn't access-locked. commercial_pathway_summary is the deep
  // market-entry briefing; regulatory_outlook and patient/physician access are
  // structured jurisdiction-briefing fields. All are already fetched above.
  const pathwaySummary   = !isLocked ? liveProfile?.commercial_pathway_summary ?? null : null
  const regulatoryOutlook = !isLocked ? liveProfile?.briefing_regulatory_outlook ?? null : null
  const patientAccess    = !isLocked ? liveProfile?.briefing_patient_access ?? null : null
  const physicianAccess  = !isLocked ? liveProfile?.briefing_physician_access ?? null : null
  const hasDeepIntel = Boolean(pathwaySummary || regulatoryOutlook || patientAccess || physicianAccess)

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
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Market posture</span>
      </nav>

      {/* ── Posture hero ── */}
      <div
        className="mb-5 overflow-hidden rounded-2xl"
        style={{ background: TONE_BG[badge.tone], border: `1px solid ${TONE_BORDER[badge.tone]}`, borderLeft: `4px solid ${TONE_TEXT[badge.tone]}` }}
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Regulatory posture · {country.displayName}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-white">{derived.model.label}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.6)' }}>
              {derived.model.detail}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
            style={{ background: TONE_BG[badge.tone], borderColor: TONE_BORDER[badge.tone], color: TONE_TEXT[badge.tone] }}
          >
            {badge.label}
          </span>
        </div>

        {/* State copy */}
        <div className="border-t px-5 py-3" style={{ borderColor: TONE_BORDER[badge.tone] }}>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
            {panel.stateCopy.summary}
          </p>
        </div>
      </div>

      {/* ── Market framework grid ── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          { icon: '🏭', heading: 'Import framework',    data: derived.imports },
          { icon: '🏢', heading: 'Operator framework',  data: derived.operators },
          { icon: '⚖️', heading: 'Primary regulator',  data: derived.regulator },
          { icon: '📋', heading: 'Public orientation',  data: { label: 'Published summary', detail: panel.publicSummary } },
        ].map(({ icon, heading, data }) => (
          <div
            key={heading}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(7,15,30,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base leading-none">{icon}</span>
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
                {heading}
              </p>
            </div>
            <p className="mb-0.5 text-[13px] font-medium text-white">{data.label}</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>{data.detail}</p>
          </div>
        ))}
      </div>

      {/* ── Deep intel: commercial pathway + regulatory outlook ── */}
      {hasDeepIntel && (
        <div className="mb-5 space-y-3">
          {pathwaySummary && (
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(198,165,90,0.05)', border: '1px solid rgba(198,165,90,0.2)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base leading-none">🧭</span>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'rgba(198,165,90,0.75)' }}>
                  Commercial pathway
                </p>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.75)' }}>
                {pathwaySummary}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {regulatoryOutlook && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(7,15,30,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base leading-none">🔭</span>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>Regulatory outlook</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>{regulatoryOutlook}</p>
              </div>
            )}
            {patientAccess && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(7,15,30,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base leading-none">🩺</span>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>Patient access</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>{patientAccess}</p>
              </div>
            )}
            {physicianAccess && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(7,15,30,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base leading-none">👨‍⚕️</span>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>Physician access</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>{physicianAccess}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Locked notice ── */}
      {isLocked && (
        <div
          className="mb-5 rounded-2xl p-4 text-center"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(248,113,113,0.65)' }}>{panel.stateCopy.emptyState}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=market-review&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Request market review
        </Link>
        <Link
          href={`${country.dashboardPath}/compliance`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View compliance →
        </Link>
        <Link
          href={`${country.dashboardPath}/signals`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View signals →
        </Link>
      </div>

      {/* Back */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href={country.dashboardPath} className="text-[11px] transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.38)' }}>
          ← {country.displayName} overview
        </Link>
      </div>

    </div>
  )
}

