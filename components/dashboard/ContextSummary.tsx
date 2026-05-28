'use client'

import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { getDashboardRoleLabel } from '@/lib/dashboard/globeRouteContext'
import { useCountryBrief } from '@/hooks/useCountryBrief'
import { StatusBadge } from './StatusBadge'

interface Props {
  onMarketClick: () => void
}

export function ContextSummary({ onMarketClick }: Props) {
  const { countryIso2, countryName, role, routeContext } = useDashboard()
  const brief = useCountryBrief(countryIso2)

  const statuses = brief.status === 'ok' ? [
    brief.data.market_access_status,
    brief.data.import_status ? `Import: ${brief.data.import_status}` : null,
    brief.data.export_status ? `Export: ${brief.data.export_status}` : null,
  ].filter(Boolean) as string[] : []

  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: 'rgba(13,32,55,0.7)', border: '1px solid rgba(198,165,90,0.18)' }}
    >
      <div
        className="mb-0.5 font-serif text-lg leading-tight"
        style={{ color: 'var(--hv-champagne-300, #F0D39A)' }}
      >
        {countryName}
      </div>
      <div className="mb-3 text-[11px]" style={{ color: 'rgba(243,240,234,0.55)' }}>
        {getDashboardRoleLabel(role)}{routeContext?.source === 'globe_router' ? ' · Routed from globe' : ''}
      </div>

      {brief.status === 'ok' && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {statuses.map(s => <StatusBadge key={s} label={s} />)}
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.4)' }}>
            {brief.data.regulator_label && (
              <span style={{ color: 'rgba(198,165,90,0.6)' }}>{brief.data.regulator_label} · </span>
            )}
            {brief.data.public_summary
              ? brief.data.public_summary.slice(0, 120) + (brief.data.public_summary.length > 120 ? '…' : '')
              : 'Intelligence coverage active.'}
          </p>
        </>
      )}

      {brief.status === 'loading' && (
        <div className="h-3 w-full animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      )}

      <button
        onClick={onMarketClick}
        className="mt-3 text-[10px] tracking-[0.08em] transition-opacity hover:opacity-80"
        style={{ color: 'rgba(198,165,90,0.55)' }}
      >
        Switch market →
      </button>
    </div>
  )
}
