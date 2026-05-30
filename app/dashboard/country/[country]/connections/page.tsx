import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'

type Props = { params: Promise<{ country: string }> }

type ConnectionCategory = { icon: string; label: string; detail: string; status: 'reviewed' | 'gated' | 'unavailable' }
type ConnectionsDerived = {
  headline:    string
  subline:     string
  categories:  ConnectionCategory[]
  networkNote: string
  routingNote: string
  reviewCount: number
}

function statusDot(status: ConnectionCategory['status']) {
  if (status === 'reviewed')  return { color: '#5dcaa5', label: 'Reviewed' }
  if (status === 'gated')     return { color: '#fbbf24', label: 'Review-gated' }
  return                             { color: '#f87171', label: 'Unavailable' }
}

function deriveConnections(state: DashboardPanelState, countryName: string): ConnectionsDerived {
  const map: Record<DashboardPanelState, ConnectionsDerived> = {
    live: {
      headline:    'Reviewed connection routing',
      subline:     'Harbourview-reviewed counterparty and operator connections are available for this jurisdiction.',
      reviewCount: 12,
      networkNote: `The ${countryName} connection network includes reviewed licensed operators, regulatory contacts, distribution partners, and clinical-track contacts. All connections are verified through Harbourview network protocols before routing.`,
      routingNote: 'Connections are routed through Harbourview on a needs-matched basis. Submitting an opportunity or review request triggers the counterparty matching process. Direct contact disclosure requires Harbourview authorisation.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',        detail: 'Reviewed licensed importers, wholesalers, and pharmacy distributors with active narcotics licences.', status: 'reviewed' },
        { icon: '🏥', label: 'Clinical networks',         detail: 'Reviewed prescriber networks, specialist clinics, and patient access programmes with clinical-track operators.', status: 'reviewed' },
        { icon: '⚖️', label: 'Regulatory contacts',      detail: 'Reviewed regulator contacts for import permit, product registration, and licensing pathway queries.', status: 'reviewed' },
        { icon: '🚢', label: 'Logistics & customs',       detail: 'Reviewed freight, customs clearance, and narcotics logistics providers with established import track records.', status: 'reviewed' },
        { icon: '🔬', label: 'Testing laboratories',      detail: 'Reviewed accredited analytical testing laboratories for CoA, potency, and compliance panel requirements.', status: 'reviewed' },
        { icon: '📋', label: 'Legal & compliance',        detail: 'Reviewed legal and regulatory consulting contacts for import pathway, licensing, and compliance support.', status: 'gated' },
        { icon: '💼', label: 'Investment & M&A',          detail: 'Private deal and investment routing requires separate Harbourview review authorisation. Not disclosed publicly.', status: 'gated' },
      ],
    },
    partial: {
      headline:    'Partial connection routing',
      subline:     'Some reviewed connections are available. Full network access requires Harbourview review authorisation.',
      reviewCount: 5,
      networkNote: `Partial connection routing is available for ${countryName}. Core operator and logistics contacts are reviewed; clinical and regulatory contacts are gated pending further network assessment.`,
      routingNote: 'Partial routing does not include all counterparty types. Submitting an opportunity will trigger assessment of which connections are appropriate for your specific use case.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',        detail: 'Reviewed for select product categories. Additional operator types may be gated.', status: 'reviewed' },
        { icon: '🏥', label: 'Clinical networks',         detail: 'Review-gated — clinical network access not available on partial track.', status: 'gated' },
        { icon: '⚖️', label: 'Regulatory contacts',      detail: 'Review-gated — requires Harbourview authorisation before routing.', status: 'gated' },
        { icon: '🚢', label: 'Logistics & customs',       detail: 'Reviewed logistics contacts available for core product import pathways.', status: 'reviewed' },
        { icon: '🔬', label: 'Testing laboratories',      detail: 'Reviewed for core compliance panel requirements.', status: 'reviewed' },
        { icon: '📋', label: 'Legal & compliance',        detail: 'Review-gated on partial track.', status: 'gated' },
        { icon: '💼', label: 'Investment & M&A',          detail: 'Not available on partial track.', status: 'unavailable' },
      ],
    },
    'static-orientation': {
      headline:    'Orientation — no direct connections',
      subline:     'This jurisdiction is on a static orientation track. Direct counterparty connections are not available.',
      reviewCount: 0,
      networkNote: `No reviewed counterparty connections are available for ${countryName} on the orientation track. The Harbourview network does not include active connections for supplement-track or orientation-only jurisdictions.`,
      routingNote: 'To request connection routing, the jurisdiction must be escalated to a higher console track. Submit a request to initiate track escalation review.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',   detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '🏥', label: 'Clinical networks',    detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '⚖️', label: 'Regulatory contacts', detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '🚢', label: 'Logistics & customs',  detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '🔬', label: 'Testing laboratories', detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '📋', label: 'Legal & compliance',   detail: 'Not available on orientation track.',       status: 'unavailable' },
        { icon: '💼', label: 'Investment & M&A',     detail: 'Not available on orientation track.',       status: 'unavailable' },
      ],
    },
    'fallback-backed': {
      headline:    'Fallback — limited connection routing',
      subline:     'Connection routing for this jurisdiction is fallback-backed. Submit a request to initiate network assessment.',
      reviewCount: 0,
      networkNote: `${countryName} connection routing is fallback-backed. No confirmed network has been established for this jurisdiction; Harbourview will initiate a network assessment upon receiving a structured request.`,
      routingNote: 'Fallback-track connection requests trigger a network assessment process. Assessment timelines vary by jurisdiction complexity. Submitters will be notified of outcomes.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',   detail: 'Subject to network assessment — not confirmed.',  status: 'gated' },
        { icon: '🏥', label: 'Clinical networks',    detail: 'Not available on fallback track.',                status: 'unavailable' },
        { icon: '⚖️', label: 'Regulatory contacts', detail: 'Subject to network assessment — not confirmed.',  status: 'gated' },
        { icon: '🚢', label: 'Logistics & customs',  detail: 'Subject to network assessment — not confirmed.',  status: 'gated' },
        { icon: '🔬', label: 'Testing laboratories', detail: 'Subject to network assessment — not confirmed.',  status: 'gated' },
        { icon: '📋', label: 'Legal & compliance',   detail: 'Not available on fallback track.',                status: 'unavailable' },
        { icon: '💼', label: 'Investment & M&A',     detail: 'Not available on fallback track.',                status: 'unavailable' },
      ],
    },
    'request-only': {
      headline:    'Request-only connection routing',
      subline:     'All counterparty connections for this jurisdiction are routed through Harbourview private review only.',
      reviewCount: 0,
      networkNote: `${countryName} connection data is not disclosed on the public dashboard. Harbourview maintains a private network for this jurisdiction; access requires a structured request and review authorisation.`,
      routingNote: 'Submit a request brief through the Harbourview intake system. Include your company profile, target counterparty type, and specific routing rationale. All submissions are treated as confidential.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',   detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '🏥', label: 'Clinical networks',    detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '⚖️', label: 'Regulatory contacts', detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '🚢', label: 'Logistics & customs',  detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '🔬', label: 'Testing laboratories', detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '📋', label: 'Legal & compliance',   detail: 'Available via private request routing.',  status: 'gated' },
        { icon: '💼', label: 'Investment & M&A',     detail: 'Available via confidential private routing only.', status: 'gated' },
      ],
    },
    'review-required': {
      headline:    'Review-required connections',
      subline:     'Connection routing for this jurisdiction requires Harbourview review authorisation before any counterparty routing is initiated.',
      reviewCount: 0,
      networkNote: `Harbourview maintains a reviewed network for ${countryName}. Access to this network requires review authorisation due to jurisdiction-specific routing sensitivities.`,
      routingNote: 'Submit a review request to initiate the authorisation process. Existing clients with active Harbourview engagements may request expedited review.',
      categories: [
        { icon: '🏢', label: 'Licensed operators',   detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '🏥', label: 'Clinical networks',    detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '⚖️', label: 'Regulatory contacts', detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '🚢', label: 'Logistics & customs',  detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '🔬', label: 'Testing laboratories', detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '📋', label: 'Legal & compliance',   detail: 'Requires review authorisation.',   status: 'gated' },
        { icon: '💼', label: 'Investment & M&A',     detail: 'Requires review authorisation — confidential routing only.', status: 'gated' },
      ],
    },
    unavailable: {
      headline:    'Connections unavailable',
      subline:     'No connection routing is available for this jurisdiction on the current console.',
      reviewCount: 0,
      networkNote: 'Not available.',
      routingNote: 'Not available.',
      categories:  [],
    },
  }
  return map[state]
}

export default async function ConnectionsPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel   = country.panels.connections
  const badge   = getDashboardStatusBadge(panel.state)
  const derived = deriveConnections(panel.state, country.displayName)
  const reviewedCount = derived.categories.filter((c) => c.status === 'reviewed').length

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>{country.displayName}</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Connections</span>
      </nav>

      {/* ── Hero ── */}
      <div
        className="mb-5 overflow-hidden rounded-2xl"
        style={{ background: TONE_BG[badge.tone], border: `1px solid ${TONE_BORDER[badge.tone]}`, borderLeft: `4px solid ${TONE_TEXT[badge.tone]}` }}
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Counterparty connections · {country.displayName}
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
        </div>

        {/* Reviewed count row */}
        <div className="flex items-center justify-between border-t px-5 py-2.5" style={{ borderColor: TONE_BORDER[badge.tone] }}>
          <p className="text-[10px]" style={{ color: 'rgba(243,240,234,0.38)' }}>
            {derived.reviewCount > 0
              ? `${derived.reviewCount} reviewed connections available for routing`
              : reviewedCount > 0
              ? `${reviewedCount} of ${derived.categories.length} connection types reviewed`
              : 'All connection categories require review or are unavailable'}
          </p>
          {derived.reviewCount > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em]"
              style={{ background: 'rgba(93,202,165,0.1)', color: '#5dcaa5' }}
            >
              Network active
            </span>
          )}
        </div>
      </div>

      {/* ── Connection categories ── */}
      {derived.categories.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
            Connection types
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {derived.categories.map((cat) => {
              const d = statusDot(cat.status)
              return (
                <div
                  key={cat.label}
                  className="flex gap-3 rounded-xl p-3.5"
                  style={{
                    background: cat.status === 'reviewed' ? 'rgba(7,15,30,0.8)' : 'rgba(7,15,30,0.4)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    opacity: cat.status === 'unavailable' ? 0.4 : 1,
                  }}
                >
                  <span className="mt-0.5 text-xl leading-none">{cat.icon}</span>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-baseline gap-2">
                      <p className="text-[12px] font-medium text-white">{cat.label}</p>
                      <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: d.color, opacity: 0.8 }}>
                        {d.label}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.42)' }}>{cat.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Network + routing notes ── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          { icon: '🌐', label: 'Network overview',  content: derived.networkNote },
          { icon: '🔀', label: 'Routing process',   content: derived.routingNote },
        ].map(({ icon, label, content }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base leading-none">{icon}</span>
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>{label}</p>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>{content}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=connection-request&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Request connections
        </Link>
        <Link
          href={`${country.dashboardPath}/opportunities`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View opportunities →
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
