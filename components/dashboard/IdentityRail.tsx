'use client'

import Link from 'next/link'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { useAllCountries } from '@/hooks/useAllCountries'

interface Props {
  onMarketClick: () => void
}

export function IdentityRail({ onMarketClick }: Props) {
  const { countryName, role } = useDashboard()
  const countries = useAllCountries()

  const roleLabel =
    role === 'medical_professional' ? 'Medical Professional'
    : role === 'regulatory_legal'   ? 'Regulatory & Legal'
    : 'Commercial Operator'

  const countryCount = countries.status === 'ok' ? countries.data.length : null

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-5 h-[52px]"
      style={{
        background: 'rgba(4,9,18,0.97)',
        borderBottom: '1px solid rgba(198,165,90,0.18)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left — brand + context */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="font-serif text-[15px] tracking-[0.22em] uppercase"
          style={{ color: 'var(--hv-champagne-300, #F0D39A)' }}
        >
          Harbourview
        </Link>
        <div className="h-5 w-px" style={{ background: 'rgba(198,165,90,0.18)' }} />
        <div className="flex items-center gap-2">
          {/* Country chip */}
          <button
            onClick={onMarketClick}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] tracking-[0.07em] transition-all"
            style={{
              border: '1px solid rgba(198,165,90,0.22)',
              background: 'rgba(198,165,90,0.1)',
              color: 'var(--hv-champagne-300, #F0D39A)',
            }}
          >
            <span>🌐</span>
            <span>{countryName}</span>
          </button>
          {/* Role chip */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] tracking-[0.07em]"
            style={{
              border: '1px solid rgba(198,165,90,0.15)',
              background: 'rgba(198,165,90,0.06)',
              color: 'rgba(240,211,154,0.7)',
            }}
          >
            {roleLabel}
          </div>
          {/* Free badge */}
          <div
            className="rounded-full px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
            style={{
              background: 'rgba(29,158,117,0.12)',
              border: '1px solid rgba(29,158,117,0.28)',
              color: '#5dcaa5',
            }}
          >
            ✓ Free
          </div>
        </div>
      </div>

      {/* Right — globe mini + account */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] tracking-[0.08em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
          {countryCount ? `${countryCount} tracked alpha markets` : 'Tracked alpha markets'}
        </span>
        <button
          onClick={onMarketClick}
          className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-all"
          style={{
            border: '1px solid rgba(198,165,90,0.2)',
            background: 'radial-gradient(circle at 38% 35%, rgba(198,165,90,0.25), rgba(198,165,90,0.06) 55%)',
            color: 'var(--hv-gold, #C6A55A)',
          }}
          title="Explore markets"
          aria-label="Explore markets"
        >
          🌍
        </button>
        <div
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            background: 'rgba(198,165,90,0.12)',
            border: '1px solid rgba(198,165,90,0.22)',
            color: 'var(--hv-champagne-300)',
          }}
        >
          TC
        </div>
      </div>
    </header>
  )
}
