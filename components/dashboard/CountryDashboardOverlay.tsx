'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'
import { dashboardSections, getDashboardSectionHref } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

const labels = {
  market: 'Market',
  education: 'Education',
  compliance: 'Compliance',
  signals: 'Signals',
  opportunities: 'Opportunities',
  intelligence: 'Intelligence',
  connections: 'Reviewed Connections',
}

export function CountryDashboardOverlay({ country, open, onClose }: { country: CountryDashboardSummary; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  const badge = getDashboardStatusBadge(country.dashboardStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 md:items-center md:justify-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="country-overlay-title">
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-[#c6a55a]/25 bg-[#07111f] p-5 text-white shadow-2xl md:max-w-3xl md:rounded-3xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#c6a55a]">Selected country persisted</p>
            <h2 id="country-overlay-title" className="mt-2 text-3xl font-semibold">{country.displayName}</h2>
            <p className="mt-2 text-sm text-white/65">{country.region} · {badge.label}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" aria-label="Close country dashboard overlay">×</button>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <OverlayMetric label="Market posture" value={country.panels.market.marketPosture} />
          <OverlayMetric label="Education status" value={country.panels.education.educationStatus} />
          <OverlayMetric label="Compliance status" value={country.panels.compliance.complianceStatus} />
          <OverlayMetric label="Signal availability" value={country.panels.signals.signalAvailability} />
          <OverlayMetric label="Opportunity status" value={country.panels.opportunities.opportunityStatus} />
          <OverlayMetric label="Intelligence status" value={country.panels.intelligence.intelligenceStatus} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={country.dashboardPath} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">View Country Dashboard</Link>
          {dashboardSections.map((section) => <Link key={section} href={getDashboardSectionHref(country.slug, section)} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{labels[section]}</Link>)}
          <Link href={`/contact?intent=dashboard-review&country=${country.slug}`} className="rounded-xl border border-[#c6a55a]/40 px-4 py-3 text-sm text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Request Harbourview Review</Link>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Change Country</button>
        </div>
      </div>
    </div>
  )
}

function OverlayMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <dt className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</dt>
      <dd className="mt-2 text-sm leading-5 text-white/72">{value}</dd>
    </div>
  )
}
