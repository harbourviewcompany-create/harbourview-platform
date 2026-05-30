'use client'

import Link from 'next/link'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { getDashboardRoleLabel } from '@/lib/dashboard/globeRouteContext'
import { useAllCountries } from '@/hooks/useAllCountries'

interface Props {
  onMarketClick: () => void
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6"/>
      <ellipse cx="8" cy="8" rx="2.8" ry="6"/>
      <path d="M2 8h12"/>
      <path d="M3 5h10M3 11h10"/>
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3.5l3 3 3-3"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5"/>
      <path d="M2.5 14.5c0-3.5 2.5-5 5.5-5s5.5 1.5 5.5 5"/>
    </svg>
  )
}

export function IdentityRail({ onMarketClick }: Props) {
  const { countryName, role } = useDashboard()
  const countries = useAllCountries()

  const roleLabel = getDashboardRoleLabel(role)
  const countryCount = countries.status === 'ok' ? countries.data.length : null

  return (
    <header
      className="sticky top-0 z-50 flex h-[52px] items-center justify-between px-5"
      style={{
        background: 'rgba(4,9,18,0.97)',
        borderBottom: '1px solid rgba(198,165,90,0.14)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left — brand + context */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="font-serif text-[15px] tracking-[0.22em] uppercase transition-opacity hover:opacity-80"
          style={{ color: '#F0D39A' }}
        >
          Harbourview
        </Link>

        <div className="h-4 w-px" style={{ background: 'rgba(198,165,90,0.15)' }} />

        {/* Market selector chip */}
        <button
          onClick={onMarketClick}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] tracking-[0.04em] transition-all hover:bg-[rgba(198,165,90,0.14)]"
          style={{
            border:     '1px solid rgba(198,165,90,0.2)',
            background: 'rgba(198,165,90,0.08)',
            color:      '#F0D39A',
          }}
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center" style={{ color: 'rgba(198,165,90,0.7)' }}>
            <GlobeIcon />
          </span>
          <span>{countryName}</span>
          <ChevronDownIcon />
        </button>

        {/* Role chip */}
        <div
          className="hidden items-center rounded-full px-2.5 py-1 text-[11px] tracking-[0.04em] sm:flex"
          style={{
            border:     '1px solid rgba(198,165,90,0.12)',
            background: 'rgba(198,165,90,0.04)',
            color:      'rgba(240,211,154,0.6)',
          }}
        >
          {roleLabel}
        </div>

        {/* Coverage count */}
        {countryCount && (
          <span className="hidden text-[10px] tracking-[0.06em] xl:block" style={{ color: 'rgba(198,165,90,0.35)' }}>
            {countryCount} tracked markets
          </span>
        )}
      </div>

      {/* Right — account */}
      <div className="flex items-center gap-2.5">
        {/* Free tier badge */}
        <div
          className="hidden rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] sm:block"
          style={{
            background: 'rgba(29,158,117,0.1)',
            border:     '1px solid rgba(29,158,117,0.24)',
            color:      '#5dcaa5',
          }}
        >
          Free tier
        </div>

        {/* Avatar */}
        <div
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(198,165,90,0.1)',
            border:     '1px solid rgba(198,165,90,0.2)',
            color:      '#F0D39A',
          }}
          title="Account"
        >
          <span className="flex h-4 w-4 items-center justify-center" style={{ color: 'rgba(240,211,154,0.8)' }}>
            <UserIcon />
          </span>
        </div>
      </div>
    </header>
  )
}
