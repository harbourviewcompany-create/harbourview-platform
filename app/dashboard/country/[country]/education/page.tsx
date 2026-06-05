import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'

import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return {
    title: `${displayName} Education | Harbourview`,
    description: `Harbourview ${displayName} education dashboard. Country-level market intelligence, pathway context and commercial routing for regulated cannabis.`,
  }
}


type Props = { params: Promise<{ country: string }> }

type TrackStatus = { label: string; detail: string; available: boolean }
type TrackData   = { prescriber: TrackStatus; patient: TrackStatus; operator: TrackStatus }

function deriveEducationTracks(state: DashboardPanelState): TrackData {
  const map: Record<DashboardPanelState, TrackData> = {
    live: {
      prescriber: {
        available: true,
        label: 'Prescriber education review available by request.',
        detail: 'Prescriber education context available for review. No CPD or accreditation claim is made on this public surface without source-backed review. No certification or prescribing eligibility claim is made on this public surface without source-backed review.',
      },
      patient: {
        available: true,
        label: 'Patient education context available for review. No patient education context (subject to review) or registration claim is made on this public surface without source-backed review. Patient registration, consent protocols, and product education materials are subject to jurisdiction-specific review.',
        detail: 'Patient-facing materials are subject to jurisdiction-specific review. No registration, consent, or patient program claim is made on this public surface without source-backed review.',
      },
      operator: {
        available: true,
        label: 'operator education context (subject to review)',
        detail: 'Licensed operators are required to complete regulatory training covering GMP obligations, record-keeping, reporting, and import/export compliance before licence activation.',
      },
    },
    partial: {
      prescriber: {
        available: true,
        label: 'prescriber education context (subject to review) â selective rollout',
        detail: 'Prescriber education context available for review. No CPD availability claim is made on this public surface without source-backed review.',
      },
      patient: {
        available: true,
        label: 'Patient access â partial programme',
        detail: 'Patient access education is available in some regions or through selected pharmacy networks; national rollout is ongoing.',
      },
      operator: {
        available: false,
        label: 'Operator training â review-gated',
        detail: 'Operator-facing education materials are not on the public surface; request Harbourview review for access to training pathway details.',
      },
    },
    'static-orientation': {
      prescriber: {
        available: false,
        label: 'prescriber education pathway (subject to review) â orientation only',
        detail: 'No formal CPD pathway exists for cannabis prescribing; prescribers operate under general informed-consent and low-THC product frameworks.',
      },
      patient: {
        available: true,
        label: 'Patient access â supplement track',
        detail: 'Patients access CBD and low-THC products through supplement or pharmacy channels without formal patient registration programmes.',
      },
      operator: {
        available: false,
        label: 'No formal operator education',
        detail: 'Operator education is limited to supplement regulatory compliance; no cannabis-specific operator education context (subject to review) is in place.',
      },
    },
    'fallback-backed': {
      prescriber: {
        available: false,
        label: 'Prescriber framework â emerging',
        detail: 'Prescriber education frameworks are in development; current draft regulations may introduce CPD requirements as the framework matures.',
      },
      patient: {
        available: false,
        label: 'patient education context (subject to review) â not yet established',
        detail: 'No formal patient education or access programme is in place; fallback orientation data reflects expected framework direction only.',
      },
      operator: {
        available: false,
        label: 'Operator training â pre-legislative',
        detail: 'Operator education requirements have not yet been legislated; expected to align with health ministry guidance once framework is finalised.',
      },
    },
    'request-only': {
      prescriber: { available: false, label: 'Request-gated', detail: 'prescriber education pathway (subject to review) details require Harbourview review before disclosure.' },
      patient:    { available: false, label: 'Request-gated', detail: 'patient education context (subject to review) details require Harbourview review before disclosure.' },
      operator:   { available: false, label: 'Request-gated', detail: 'Operator education details require Harbourview review before disclosure.' },
    },
    'review-required': {
      prescriber: { available: false, label: 'Review required', detail: 'prescriber education pathway (subject to review) data is held pending Harbourview review authorisation.' },
      patient:    { available: false, label: 'Review required', detail: 'Patient access data is held pending Harbourview review authorisation.' },
      operator:   { available: false, label: 'Review required', detail: 'Operator training data is held pending Harbourview review authorisation.' },
    },
    unavailable: {
      prescriber: { available: false, label: 'Unavailable', detail: 'Not available on the public dashboard.' },
      patient:    { available: false, label: 'Unavailable', detail: 'Not available on the public dashboard.' },
      operator:   { available: false, label: 'Unavailable', detail: 'Not available on the public dashboard.' },
    },
  }
  return map[state]
}

export default async function EducationPage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const panel  = country.panels.education
  const badge  = getDashboardStatusBadge(panel.state)
  const tracks = deriveEducationTracks(panel.state)

  const trackList = [
    { key: 'prescriber', icon: 'ð©º', label: 'Prescriber track', data: tracks.prescriber },
    { key: 'patient',    icon: 'ð¤', label: 'Patient track',    data: tracks.patient    },
    { key: 'operator',   icon: 'ð­', label: 'Operator track',   data: tracks.operator   },
  ]

  /* P0 claim-control patch: education page is public orientation only. No CPD, accreditation, prescribing, certification, patient-program, or national-standardization claims are made on this public surface without source-backed review. */
return (
    <div className="min-h-full p-5 lg:p-7">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.4)' }}>Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>âº</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.55)' }}>
          {country.displayName}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>âº</span>
        <span style={{ color: 'rgba(198,165,90,0.85)' }}>Education</span>
      </nav>

      {/* ââ Header ââ */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-2xl leading-none">ð</span>
            <h1 className="font-serif text-2xl font-semibold text-white">Education pathways</h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
            Prescriber, patient, and operator education frameworks for {country.displayName}.
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
      <div
        className="mb-5 rounded-2xl border-l-2 px-4 py-3.5"
        style={{ background: TONE_BG[badge.tone], borderLeftColor: TONE_TEXT[badge.tone] }}
      >
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em]" style={{ color: TONE_TEXT[badge.tone] }}>
          {panel.stateCopy.label}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.75)' }}>
          {panel.stateCopy.summary}
        </p>
      </div>

      {/* ââ Three pathway tracks ââ */}
      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        {trackList.map(({ key, icon, label, data }) => {
          const available = data.available
          return (
            <div
              key={key}
              className="flex flex-col rounded-2xl p-4"
              style={{
                background: available ? 'rgba(7,15,30,0.85)' : 'rgba(255,255,255,0.02)',
                border: available
                  ? `1px solid ${TONE_BORDER[badge.tone]}`
                  : '1px solid rgba(255,255,255,0.07)',
                borderTop: available ? `3px solid ${TONE_TEXT[badge.tone]}` : '3px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Track header */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg leading-none">{icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-white">{label}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: available ? TONE_TEXT[badge.tone] : 'rgba(255,255,255,0.2)' }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-[0.1em]"
                      style={{ color: available ? TONE_TEXT[badge.tone] : 'rgba(255,255,255,0.3)' }}
                    >
                      {available ? 'Available' : 'Gated'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status label */}
              <p
                className="mb-2 text-[11px] font-medium"
                style={{ color: available ? 'rgba(243,240,234,0.8)' : 'rgba(243,240,234,0.35)' }}
              >
                {data.label}
              </p>

              {/* Detail */}
              <p
                className="flex-1 text-[11px] leading-relaxed"
                style={{ color: available ? 'rgba(243,240,234,0.5)' : 'rgba(243,240,234,0.28)' }}
              >
                {data.detail}
              </p>
            </div>
          )
        })}
      </div>

      {/* ââ Public orientation ââ */}
      <div
        className="mb-5 rounded-2xl p-4"
        style={{ background: 'rgba(13,32,55,0.65)', border: '1px solid rgba(198,165,90,0.1)' }}
      >
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
          Public orientation
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
          {panel.publicSummary}
        </p>
      </div>

      {/* ââ Actions ââ */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href={`/contact?intent=education-review&country=${country.slug}`}
          className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.28)', color: '#F0D39A' }}
        >
          Request education review
        </Link>
        <Link
          href={`${country.dashboardPath}/compliance`}
          className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.5)' }}
        >
          View compliance â
        </Link>
      </div>

      {/* Back */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href={country.dashboardPath} className="text-[11px] transition-opacity hover:opacity-70" style={{ color: 'rgba(198,165,90,0.38)' }}>
          â {country.displayName} overview
        </Link>
      </div>

    </div>
  )
}
