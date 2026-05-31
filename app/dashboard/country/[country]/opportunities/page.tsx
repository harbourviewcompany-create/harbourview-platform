import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'

import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\w/g, (c) => c.toUpperCase())
  return {
    title: `${displayName} Opportunities | Harbourview`,
    description: `Harbourview ${displayName} opportunities dashboard. Reviewed commercial openings, distribution mandates and country access pathways.`,
  }
}


type Props = { params: Promise<{ country: string }> }

type OpportunityType = { icon: string; label: string; detail: string; status: 'open' | 'gated' | 'unavailable' }
type OpportunitiesDerived = {
  headline: string
  subline:  string
  types: OpportunityType[]
  intakeNote: string
  reviewNote: string
}

function statusDot(status: OpportunityType['status']) {
  if (status === 'open')      return { color: '#5dcaa5', label: 'Open for intake' }
  if (status === 'gated')     return { color: '#fbbf24', label: 'Review-gated' }
  return                             { color: '#f87171', label: 'Unavailable' }
}

function deriveOpportunities(state: DashboardPanelState): OpportunitiesDerived {
  const map: Record<DashboardPanelState, OpportunitiesDerived> = {
    live: {
      headline: 'Active opportunity intake',
      subline:  'Reviewed commercial opportunity routing is open for this jurisdiction. Submit opportunities for Harbourview intake and evaluation.',
      intakeNote: 'Submit structured opportunity briefs through the Harbourview intake system. All submissions are reviewed by the Harbourview advisory team before routing to relevant counterparties.',
      reviewNote: 'Typical review cycle is 5–10 business days. Complex multi-party opportunities may require additional review time. Confidentiality is maintained throughout.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Manufacturers and licensed exporters seeking import supply partnerships with licensed operators in this jurisdiction.', status: 'open' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Wholesale, regional distribution, and pharmacy supply chain opportunities for licensed product categories.', status: 'open' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Contract manufacturing, toll processing, and white-label licensing opportunities for licensed domestic operators.', status: 'open' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Regulatory strategy, compliance consulting, and import pathway advisory services for inbound operators.', status: 'open' },
        { icon: '🔬', label: 'Product registration support', detail: 'Product dossier preparation, registration support, and pharmacovigilance services for new product entrants.', status: 'gated' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Private deal routing, M&A advisory, and investment placement opportunities are routed through Harbourview private review only.', status: 'gated' },
      ],
    },
    partial: {
      headline: 'Selective opportunity intake',
      subline:  'Some opportunity categories are open for intake. Others require Harbourview review before routing.',
      intakeNote: 'Submit opportunities through Harbourview intake. Partial-track jurisdictions are reviewed on a case-by-case basis; some categories require pre-qualification before intake.',
      reviewNote: 'Partial intake jurisdictions have longer review cycles. Ensure your submission clearly identifies the opportunity category and target counterparty type.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Open for intake — some product categories may require additional category-specific review.', status: 'open' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Review-gated — operator relationships are not disclosed on the public dashboard.', status: 'gated' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Review-gated — not available on partial track.', status: 'gated' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Open for intake — regulatory advisory submissions are accepted.', status: 'open' },
        { icon: '🔬', label: 'Product registration support', detail: 'Review-gated — not available on partial track.', status: 'gated' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Unavailable on partial track.', status: 'unavailable' },
      ],
    },
    'static-orientation': {
      headline: 'Orientation-level intake only',
      subline:  'This jurisdiction is on a static orientation track. Opportunity intake is limited to advisory and regulatory consulting submissions.',
      intakeNote: 'Only regulatory advisory and compliance consulting submissions are accepted on the orientation track. Commercial opportunity routing is not available.',
      reviewNote: 'Orientation-track submissions are used to assess future console track escalation. No commercial routing will be initiated from static orientation intake.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Not available on orientation track.', status: 'unavailable' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Not available on orientation track.', status: 'unavailable' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Not available on orientation track.', status: 'unavailable' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Open for intake — regulatory advisory and market-entry scoping submissions accepted.', status: 'open' },
        { icon: '🔬', label: 'Product registration support', detail: 'Not available on orientation track.', status: 'unavailable' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Not available on orientation track.', status: 'unavailable' },
      ],
    },
    'fallback-backed': {
      headline: 'Fallback-track opportunity intake',
      subline:  'Opportunity intake for this jurisdiction is fallback-backed. Advisory and market-entry scoping submissions are accepted.',
      intakeNote: 'Fallback-backed intake accepts market-scoping and regulatory consulting submissions. Commercial routing is subject to Harbourview network assessment before any counterparty connection.',
      reviewNote: 'Fallback-track submissions undergo extended review. Submitters will be notified if the jurisdiction is escalated to a higher console track.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Subject to network assessment — submit for review.', status: 'gated' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Not available on fallback track.', status: 'unavailable' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Not available on fallback track.', status: 'unavailable' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Open for intake — market-entry scoping and regulatory advisory accepted.', status: 'open' },
        { icon: '🔬', label: 'Product registration support', detail: 'Not available on fallback track.', status: 'unavailable' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Not available on fallback track.', status: 'unavailable' },
      ],
    },
    'request-only': {
      headline: 'Request-only opportunity routing',
      subline:  'All commercial opportunity routing for this jurisdiction is request-gated. Submit a structured request to begin the Harbourview review process.',
      intakeNote: 'Submit a request brief via the Harbourview intake form. Include your company profile, target opportunity category, and jurisdiction rationale. All submissions are treated as confidential.',
      reviewNote: 'Request-only jurisdictions are reviewed by the Harbourview advisory team. Accepted requests will be assigned to a dedicated Harbourview contact for routing.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Available via request intake — submit structured brief for review.', status: 'gated' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Available via request intake — counterparty data not disclosed on public dashboard.', status: 'gated' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Available via request intake.', status: 'gated' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Available via request intake.', status: 'gated' },
        { icon: '🔬', label: 'Product registration support', detail: 'Available via request intake.', status: 'gated' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Available via request intake — confidential routing only.', status: 'gated' },
      ],
    },
    'review-required': {
      headline: 'Review-gated opportunity access',
      subline:  'Opportunity routing for this jurisdiction requires Harbourview review authorisation. Submit a request to initiate review.',
      intakeNote: 'Contact Harbourview to request review authorisation for this jurisdiction. Existing clients with active engagements may submit directly.',
      reviewNote: 'Review-required status may reflect pending framework developments or counterparty network assessment. Review timelines will be communicated after submission.',
      types: [
        { icon: '📦', label: 'Import supply partnerships',    detail: 'Requires review authorisation.', status: 'gated' },
        { icon: '🤝', label: 'Distribution agreements',      detail: 'Requires review authorisation.', status: 'gated' },
        { icon: '🏭', label: 'Manufacturing & licensing',    detail: 'Requires review authorisation.', status: 'gated' },
        { icon: '📋', label: 'Regulatory consulting',        detail: 'Requires review authorisation.', status: 'gated' },
        { icon: '🔬', label: 'Product registration support', detail: 'Requires review authorisation.', status: 'gated' },
        { icon: '🔒', label: 'Private M&A and investment',   detail: 'Requires review authorisation — confidential routing only.', status: 'gated' },
      ],
    },
    unavailable: {
      headline: 'Opportunity routing unavailable',
      subline:  'No opportunity routing is available for this jurisdiction on the current console.',
      intakeNote: 'Not available.',
      reviewNote: 'Not available.',
      types: [],
    },
  }
  return map[state]
}

export default async function OpportunitiesPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel   = country.panels.opportunities
  const badge   = getDashboardStatusBadge(panel.state)
  const derived = deriveOpportunities(panel.state)
  const openCount  = derived.types.filter((t) => t.status === 'open').length
  const totalCount = derived.types.length

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>{country.displayName}</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Opportunities</span>
      </nav>

      {/* ── Hero ── */}
      <div
        className="mb-5 overflow-hidden rounded-2xl"
        style={{ background: TONE_BG[badge.tone], border: `1px solid ${TONE_BORDER[badge.tone]}`, borderLeft: `4px solid ${TONE_TEXT[badge.tone]}` }}
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Commercial opportunity routing · {country.displayName}
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
        {totalCount > 0 && (
          <div className="border-t px-5 py-2.5" style={{ borderColor: TONE_BORDER[badge.tone] }}>
            <p className="text-[10px]" style={{ color: 'rgba(243,240,234,0.38)' }}>
              {openCount > 0 ? `${openCount} of ${totalCount} opportunity types open for direct intake` : 'All categories require review — submit a request to begin'}
            </p>
          </div>
        )}
      </div>

      {/* ── Opportunity types ── */}
      {derived.types.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
            Opportunity categories
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {derived.types.map((type) => {
              const d = statusDot(type.status)
              return (
                <div
                  key={type.label}
                  className="flex gap-3 rounded-xl p-4"
                  style={{
                    background: type.status === 'open' ? 'rgba(7,15,30,0.75)' : 'rgba(7,15,30,0.4)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    opacity: type.status === 'unavailable' ? 0.45 : 1,
                  }}
                >
                  <span className="mt-0.5 text-xl leading-none">{type.icon}</span>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-baseline gap-2">
                      <p className="text-[12px] font-medium text-white">{type.label}</p>
                      <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: d.color, opacity: 0.8 }}>
                        {d.label}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.42)' }}>{type.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Intake + review notes ── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          { icon: '📥', label: 'Intake process',  content: derived.intakeNote },
          { icon: '🔎', label: 'Review process',  content: derived.reviewNote },
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
          href={`/contact?intent=opportunity-intake&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Submit opportunity
        </Link>
        <Link
          href={`${country.dashboardPath}/connections`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View connections →
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
