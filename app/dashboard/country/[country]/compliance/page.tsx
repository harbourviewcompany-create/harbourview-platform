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
    title: `${displayName} Compliance | Harbourview`,
    description: `Harbourview ${displayName} compliance dashboard. Country-level market intelligence, pathway context and commercial routing for regulated cannabis.`,
  }
}


type Props = { params: Promise<{ country: string }> }

type RequirementItem = { label: string; status: 'met' | 'gated' | 'unavailable'; detail: string }
type ComplianceDerived = {
  headline: string
  subline: string
  requirements: RequirementItem[]
  importNote: string
  certNote: string
}

function dot(status: RequirementItem['status']) {
  if (status === 'met')       return { bg: '#5dcaa5', label: 'Confirmed' }
  if (status === 'gated')     return { bg: '#fbbf24', label: 'Review-gated' }
  return                             { bg: '#f87171', label: 'Unavailable' }
}

function deriveCompliance(state: DashboardPanelState): ComplianceDerived {
  const map: Record<DashboardPanelState, ComplianceDerived> = {
    live: {
      headline: 'Active compliance framework',
      subline:  'GMP, import permits, labelling, and packaging requirements are fully operative and documented.',
      importNote: 'Narcotics import permits are required per shipment. Country-specific import declaration and advance notification requirements apply. EU-GMP or equivalent is accepted.',
      certNote:   'EU-GMP certificate or equivalent (TGA, Health Canada, GACP+GMP) required for all product categories. Certificate must cover the specific product SKU and manufacturing site.',
      requirements: [
        { label: 'GMP certification',          status: 'met',       detail: 'EU-GMP or recognised equivalent required for all imported product. Certificate must be current and site-specific.' },
        { label: 'Narcotics import permit',    status: 'met',       detail: 'Per-shipment import permit required from national health authority. Advance application timelines apply.' },
        { label: 'Product labelling',          status: 'met',       detail: 'Language, THC/CBD declaration, batch number, expiry, and manufacturer origin requirements are published and enforced.' },
        { label: 'Packaging requirements',     status: 'met',       detail: 'Child-resistant, opaque, and tamper-evident packaging required. Branding and health-claim restrictions apply.' },
        { label: 'Operator licensing',         status: 'met',       detail: 'Importers and distributors require a narcotics wholesale or import licence from the national health authority.' },
        { label: 'Analytical testing',         status: 'met',       detail: 'Certificate of Analysis from an accredited laboratory required. Potency, residual solvents, microbials, and pesticides are standard panels.' },
        { label: 'Batch traceability',         status: 'met',       detail: 'Full batch traceability from cultivation to distribution is required. Electronic record-keeping may be mandated.' },
        { label: 'Review-gated connections',   status: 'gated',     detail: 'Counterparty and operator contact data is routed through Harbourview review before disclosure.' },
      ],
    },
    partial: {
      headline: 'Partial compliance framework',
      subline:  'Core GMP and import permit requirements are active; some product categories or channels remain review-gated.',
      importNote: 'Import permits required. Some product categories may require additional category-specific authorisation. Advance notification requirements vary by product type.',
      certNote:   'GMP certification required for medical-grade products. CBD and supplement products may use alternative quality certifications.',
      requirements: [
        { label: 'GMP certification',          status: 'met',       detail: 'Required for medical-grade and THC-containing products. Supplement and CBD products may have reduced requirements.' },
        { label: 'Narcotics import permit',    status: 'met',       detail: 'Required for THC-containing products. CBD products may follow a simplified import notification pathway.' },
        { label: 'Product labelling',          status: 'met',       detail: 'Core labelling requirements published. Some product categories may have category-specific guidance pending.' },
        { label: 'Packaging requirements',     status: 'gated',     detail: 'Medical product packaging is defined; adult-use or novel product packaging requirements are not yet finalised.' },
        { label: 'Operator licensing',         status: 'gated',     detail: 'Licensing framework exists for core product types; additional categories may require review before routing.' },
        { label: 'Analytical testing',         status: 'met',       detail: 'CoA required for all product imports. Test panel may vary by product category.' },
        { label: 'Batch traceability',         status: 'gated',     detail: 'Traceability requirements are defined for some channels; full-chain requirements are review-gated.' },
        { label: 'Review-gated connections',   status: 'gated',     detail: 'Counterparty data is not available on the public dashboard; request Harbourview routing review.' },
      ],
    },
    'static-orientation': {
      headline: 'Supplement-track compliance',
      subline:  'Compliance requirements are defined for CBD and low-THC products only; medical-grade compliance framework is not operative.',
      importNote: 'CBD and low-THC products import under food, supplement, or nutraceutical channels. THC import is blocked or restricted to trace levels.',
      certNote:   'Food-grade or supplement-grade quality certification may be sufficient. GMP is not universally required for complement-track products.',
      requirements: [
        { label: 'GMP certification',          status: 'gated',     detail: 'Not required for supplement-track products; may be required if product claims medicinal use.' },
        { label: 'Narcotics import permit',    status: 'unavailable', detail: 'Not applicable for CBD and low-THC products under supplement classification.' },
        { label: 'Product labelling',          status: 'met',       detail: 'Supplement labelling requirements apply. Health-claim restrictions are enforced by food/supplement regulator.' },
        { label: 'Packaging requirements',     status: 'met',       detail: 'Standard consumer packaging requirements apply. Childproofing may not be required for supplement-track products.' },
        { label: 'Operator licensing',         status: 'gated',     detail: 'Supplement or food operator registration required. Narcotics licensing is not applicable.' },
        { label: 'Analytical testing',         status: 'gated',     detail: 'Testing requirements are defined by food/supplement regulator; THC limits are strictly enforced.' },
        { label: 'Batch traceability',         status: 'unavailable', detail: 'Formal batch traceability is not required under supplement framework.' },
        { label: 'Review-gated connections',   status: 'gated',     detail: 'Operator and distributor connections require Harbourview review for routing.' },
      ],
    },
    'fallback-backed': {
      headline: 'Emerging compliance posture',
      subline:  'Compliance requirements are under development. Orientation data reflects current draft posture; requirements are subject to change.',
      importNote: 'No confirmed import compliance framework. Draft regulations may impose GMP and permit requirements once enacted.',
      certNote:   'No confirmed certification pathway. Engage early with the national health authority to understand emerging requirements.',
      requirements: [
        { label: 'GMP certification',          status: 'gated', detail: 'Anticipated requirement; not yet mandated under current draft legislation.' },
        { label: 'Narcotics import permit',    status: 'gated', detail: 'Expected under emerging framework; current pathway undefined.' },
        { label: 'Product labelling',          status: 'gated', detail: 'Draft labelling requirements are not finalised; review before engaging.' },
        { label: 'Packaging requirements',     status: 'gated', detail: 'Not yet defined; anticipated to align with regional standards.' },
        { label: 'Operator licensing',         status: 'gated', detail: 'Licensing framework is in draft or pre-consultation stage.' },
        { label: 'Analytical testing',         status: 'gated', detail: 'Test panel requirements anticipated but not confirmed.' },
        { label: 'Batch traceability',         status: 'gated', detail: 'Traceability requirements are not yet specified.' },
        { label: 'Review-gated connections',   status: 'gated', detail: 'All operator and counterparty engagement requires Harbourview review.' },
      ],
    },
    'request-only': {
      headline: 'Private compliance routing',
      subline:  'Compliance details are not disclosed on the public dashboard. All requirements routing is handled via Harbourview review.',
      importNote: 'Import compliance data is available through Harbourview private review only. Submit a request to receive jurisdiction-specific guidance.',
      certNote:   'Certification requirements are not disclosed publicly. Request Harbourview review for operator-specific certification pathway.',
      requirements: [
        { label: 'GMP certification',          status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Narcotics import permit',    status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Product labelling',          status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Packaging requirements',     status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Operator licensing',         status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Analytical testing',         status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Batch traceability',         status: 'gated', detail: 'Not disclosed on public dashboard.' },
        { label: 'Review-gated connections',   status: 'gated', detail: 'Not disclosed on public dashboard.' },
      ],
    },
    'review-required': {
      headline: 'Review-gated compliance data',
      subline:  'Compliance requirements are held behind Harbourview review. Framework exists; details require authorisation before disclosure.',
      importNote: 'Import permit requirements exist but are not disclosed on the public surface. Submit a review request for compliance routing.',
      certNote:   'Certification pathway details require review before access. Contact Harbourview to initiate compliance assessment.',
      requirements: [
        { label: 'GMP certification',          status: 'gated', detail: 'Requirement confirmed; details available after review.' },
        { label: 'Narcotics import permit',    status: 'gated', detail: 'Requirement confirmed; pathway details available after review.' },
        { label: 'Product labelling',          status: 'gated', detail: 'Requirements published in-country; Harbourview review required before routing.' },
        { label: 'Packaging requirements',     status: 'gated', detail: 'Requirements exist; not disclosed on the public dashboard.' },
        { label: 'Operator licensing',         status: 'gated', detail: 'Licensing framework confirmed; operator-level details require review.' },
        { label: 'Analytical testing',         status: 'gated', detail: 'CoA required; test panel details available after review.' },
        { label: 'Batch traceability',         status: 'gated', detail: 'Requirement exists; scope and specifics available after review.' },
        { label: 'Review-gated connections',   status: 'gated', detail: 'All counterparty routing requires Harbourview review authorisation.' },
      ],
    },
    unavailable: {
      headline: 'Compliance data unavailable',
      subline:  'This console does not surface compliance data for this jurisdiction.',
      importNote: 'Not available.',
      certNote:   'Not available.',
      requirements: [
        { label: 'GMP certification',          status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Narcotics import permit',    status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Product labelling',          status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Packaging requirements',     status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Operator licensing',         status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Analytical testing',         status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Batch traceability',         status: 'unavailable', detail: 'Not available for this jurisdiction.' },
        { label: 'Review-gated connections',   status: 'unavailable', detail: 'Not available for this jurisdiction.' },
      ],
    },
  }
  return map[state]
}

export default async function CompliancePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) return notFound()

  const panel       = country.panels.compliance
  const badge       = getDashboardStatusBadge(panel.state)
  const intel       = getCountryIntelligence(country.slug)
  const baseDerived = deriveCompliance(panel.state)

  // Fetch live DB intel profile once, up front — used by the tier-2 fallback
  // below AND the deep regulatory-activity section further down (previously
  // fetched only inside the else branch, and its richest fields discarded).
  const liveProfile = await getCountryIntelProfile(country.iso2)

  // Tier 1: static registry (9 countries); Tier 2: live DB briefing; Tier 3: derived from panel state
  let derived: ComplianceDerived
  if (intel?.compliance) {
    derived = {
      headline:     intel.compliance.headline,
      subline:      intel.compliance.subline,
      importNote:   intel.compliance.importNote,
      certNote:     intel.compliance.certNote,
      requirements: intel.compliance.requirements,
    }
  } else {
    derived = liveProfile?.briefing_program_status ? {
      headline:     liveProfile.briefing_program_status,
      subline:      liveProfile.briefing_regulatory_outlook?.slice(0, 220) ?? baseDerived.subline,
      importNote:   baseDerived.importNote,
      certNote:     baseDerived.certNote,
      requirements: baseDerived.requirements,
    } : baseDerived
  }
  const metCount   = derived.requirements.filter((r) => r.status === 'met').length
  const totalCount = derived.requirements.length

  // Deep compliance context — access rules + tracked regulatory changes. Gated
  // on real content and non-locked panels so empty countries render unchanged.
  const isLocked = panel.state === 'unavailable' || panel.state === 'request-only'
  const physicianAccess = !isLocked ? liveProfile?.briefing_physician_access ?? null : null
  const patientAccess   = !isLocked ? liveProfile?.briefing_patient_access ?? null : null
  const recentChanges   = !isLocked ? (liveProfile?.recentChanges ?? []).slice(0, 5) : []
  const hasAccessIntel  = Boolean(physicianAccess || patientAccess)
  const hasChanges      = recentChanges.length > 0

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>{country.displayName}</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Compliance</span>
      </nav>

      {/* ── Hero ── */}
      <div
        className="mb-5 overflow-hidden rounded-2xl"
        style={{ background: TONE_BG[badge.tone], border: `1px solid ${TONE_BORDER[badge.tone]}`, borderLeft: `4px solid ${TONE_TEXT[badge.tone]}` }}
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: TONE_TEXT[badge.tone] }}>
              Compliance framework · {country.displayName}
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
        {/* Requirement count bar */}
        <div className="border-t px-5 py-3" style={{ borderColor: TONE_BORDER[badge.tone] }}>
          <div className="mb-1.5 flex items-center justify-between text-[10px]" style={{ color: 'rgba(243,240,234,0.4)' }}>
            <span>{metCount} of {totalCount} requirements confirmed</span>
            <span style={{ color: TONE_TEXT[badge.tone] }}>{Math.round((metCount / totalCount) * 100)}% coverage</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(metCount / totalCount) * 100}%`, background: TONE_TEXT[badge.tone] }}
            />
          </div>
        </div>
      </div>

      {/* ── Requirements checklist ── */}
      <div className="mb-5">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          Compliance requirements
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {derived.requirements.map((req) => {
            const d = dot(req.status)
            return (
              <div
                key={req.label}
                className="flex gap-3 rounded-xl p-3.5"
                style={{ background: 'rgba(7,15,30,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="mt-[3px] h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d.bg }} />
                <div className="min-w-0">
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <p className="text-[12px] font-medium text-white">{req.label}</p>
                    <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: d.bg, opacity: 0.75 }}>{d.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.42)' }}>{req.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Import + cert notes ── */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          { icon: '🚢', label: 'Import compliance note', content: derived.importNote },
          { icon: '🏅', label: 'Certification pathway',  content: derived.certNote },
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
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.52)' }}>{content}</p>
          </div>
        ))}
      </div>

      {/* ── Access rules (physician / patient) ── */}
      {hasAccessIntel && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {physicianAccess && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base leading-none">👨‍⚕️</span>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>Physician access</p>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.52)' }}>{physicianAccess}</p>
            </div>
          )}
          {patientAccess && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base leading-none">🩺</span>
                <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>Patient access</p>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.52)' }}>{patientAccess}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tracked regulatory changes ── */}
      {hasChanges && (
        <div className="mb-5">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
            Recent regulatory changes
          </h2>
          <div className="space-y-2">
            {recentChanges.map((change) => (
              <div
                key={change.id}
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(7,15,30,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-white">{change.field_name.replace(/_/g, ' ')}</p>
                  <span className="shrink-0 text-[9px]" style={{ color: 'rgba(243,240,234,0.35)' }}>
                    {new Date(change.changed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {change.new_value && (
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>{change.new_value}</p>
                )}
                {change.source_label && (
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(198,165,90,0.4)' }}>{change.source_label}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=compliance-review&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Request compliance review
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

