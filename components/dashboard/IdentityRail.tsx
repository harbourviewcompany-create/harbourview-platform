'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { getDashboardRoleLabel } from '@/lib/dashboard/globeRouteContext'
import { useAllCountries } from '@/hooks/useAllCountries'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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

export function IdentityRail({ onMarketClick }: Props) {
  const { countryName, role } = useDashboard()
  const countries = useAllCountries()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const roleLabel = getDashboardRoleLabel(role)
  const countryCount = countries.status === 'ok' ? countries.data.length : null

  // Derive initials from email
  const emailLocal = user?.email?.split('@')[0] ?? ''
  const emailParts = emailLocal.split('.').filter(Boolean)
  const initials = emailParts.length >= 2
    ? (emailParts[0][0] + emailParts[1][0]).toUpperCase()
    : emailLocal.slice(0, 2).toUpperCase() || 'HV'

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
      <div className="relative flex items-center gap-2.5">
        {/* Avatar — initials or HV fallback */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold transition-all hover:opacity-80"
          style={{
            background: 'rgba(198,165,90,0.1)',
            border:     '1px solid rgba(198,165,90,0.2)',
            color:      '#F0D39A',
          }}
        >
          {initials}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full z-[70] w-52 pt-2">
            <div
              className="rounded-sm p-2 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              style={{ background: 'rgba(2,8,20,0.98)', border: '1px solid rgba(198,165,90,0.14)' }}
            >
              {user?.email && (
                <div className="mb-1 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.32)' }}>Signed in as</p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: 'rgba(240,211,154,0.7)' }}>{user.email}</p>
                </div>
              )}
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block rounded-sm px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,165,90,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Account
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-sm px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'rgba(220,80,80,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,80,80,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
