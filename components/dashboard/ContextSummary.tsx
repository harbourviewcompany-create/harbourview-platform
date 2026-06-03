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
  const brief = useCountryBrief(countryIso2 ?? '')

  const statuses = brief.status === 'ok' ? [
    brief.data.market_access_status,
    brief.data.import_status ? `Import: ${brief.data.import_status}` : null,
    brief.data.export_status ? `Export: ${brief.data.export_status}` : null,
  ].filter(Boolean) as string[] : []

  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: 'rgba(10,22,42,0.8)', border: '1px solid rgba(198,165,90,0.16)' }}
    >
      {/* Country + ISO chip */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="font-serif text-[16px] leading-tight text-white truncate">
          {countryName ?? 'Choose a market'}
        </p>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em]"
          style={{
            background: 'rgba(198,165,90,0.08)',
            border: '1px solid rgba(198,165,90,0.18)',
            color: 'rgba(198,165,90,0.65)',
          }}
        >
          {countryIso2 ?? '—'}
        </span>
      </div>

      {/* Role + routing source */}
      <p className="mb-2.5 text-[10px]" style={{ color: 'rgba(243,240,234,0.45)' }}>
        {getDashboardRoleLabel(role)}
        {routeContext?.source === 'globe_router' && (
          <span style={{ color: 'rgba(198,165,90,0.4)' }}> · Globe</span>
        )}
      </p>

      {/* Status badges */}
      {brief.status === 'ok' && statuses.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {statuses.map(s => <StatusBadge key={s} label={s} />)}
        </div>
      )}

      {/* Summary */}
      {brief.status === 'ok' && (
        <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.38)' }}>
          {brief.data.regulator_label && (
            <span style={{ color: 'rgba(198,165,90,0.55)' }}>{brief.data.regulator_label} · </span>
          )}
          {brief.data.public_summary
            ? brief.data.public_summary.slice(0, 110) + (brief.data.public_summary.length > 110 ? '…' : '')
            : 'Intelligence coverage active.'}
        </p>
      )}

      {brief.status === 'loading' && (
        <div className="h-2.5 w-3/4 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      )}

      {/* Switch */}
      <button
        onClick={onMarketClick}
        className="mt-3 flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
        style={{ color: 'rgba(198,165,90,0.5)' }}
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5"/>
          <path d="M3.5 6h5M6 3.5v5"/>
        </svg>
        Switch market
      </button>
    </div>
  )
}
