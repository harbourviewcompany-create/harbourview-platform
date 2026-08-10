'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

export function DesktopDecisionIntelBridge({ signals, access }: { signals: DashboardSignal[]; access?: FeatureAccess }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (signals.length === 0) return null

  const query = searchParams.toString()
  const returnTo = `${pathname}${query ? `?${query}` : ''}`
  const canOpenDossiers = access?.granted === true

  return (
    <section className="mx-5 mt-4 rounded-2xl border border-[#c6a55a]/20 bg-[#07111f] p-4" aria-label="Decision intelligence dossiers">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c6a55a]">Decision intelligence</p>
          <h2 className="mt-1 text-sm font-semibold text-[#f5f1e8]">Evidence-backed dossiers</h2>
        </div>
        <span className="text-[10px] text-white/45">{canOpenDossiers ? 'Open the full evidence, unknowns and decision posture' : 'Intel access is required to open evidence-backed dossiers'}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {signals.map(signal => {
          const eventId = signal.decisionIntelEventId ?? `event:${signal.id}`
          const dossierHref = `/dashboard/intel/events/${encodeURIComponent(eventId)}?returnTo=${encodeURIComponent(returnTo)}`
          const href = canOpenDossiers ? dossierHref : '/account/upgrade'
          return (
            <Link
              key={signal.id}
              href={href}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-[#f5f1e8] no-underline hover:border-[#c6a55a]/40"
              aria-label={canOpenDossiers ? `Open intelligence dossier: ${signal.title}` : `Upgrade to Intel to open intelligence dossier: ${signal.title}`}
            >
              <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-[#c6a55a]">{signal.market || signal.type}</span>
              <strong className="mt-1 block text-xs leading-5">{signal.title}</strong>
              <span className="mt-2 block text-[10px] text-white/45">{canOpenDossiers ? 'Open dossier →' : 'Upgrade to Intel →'}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
