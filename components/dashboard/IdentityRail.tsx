'use client'

import { useEffect, useRef, useState } from 'react'
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

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(198,165,90,0.2)',
  borderRadius: '3px',
  padding: '7px 10px',
  fontSize: '12px',
  color: '#F5F1E8',
  outline: 'none',
}

export function IdentityRail({ onMarketClick }: Props) {
  const { countryName, role } = useDashboard()
  const countries = useAllCountries()
  const router = useRouter()

  const [user, setUser]           = useState<User | null | undefined>(undefined)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading]     = useState(false)
  const menuRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setMenuOpen(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setAuthError(error.message)
    } else {
      router.refresh()
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.refresh()
  }

  const roleLabel    = getDashboardRoleLabel(role)
  const countryCount = countries.status === 'ok' ? countries.data.length : null

  const emailLocal  = user?.email?.split('@')[0] ?? ''
  const emailParts  = emailLocal.split('.').filter(Boolean)
  const initials    = emailParts.length >= 2
    ? (emailParts[0][0] + emailParts[1][0]).toUpperCase()
    : emailLocal.slice(0, 2).toUpperCase() || 'HV'

  return (
    <header
      className="sticky top-0 z-50 flex h-[52px] items-center justify-between px-5"
      style={{ background: 'rgba(4,9,18,0.97)', borderBottom: '1px solid rgba(198,165,90,0.14)', backdropFilter: 'blur(12px)' }}
    >
      {/* Left — brand + context */}
      <div className="flex items-center gap-4">
        <Link href="/" className="font-serif text-[15px] tracking-[0.22em] uppercase transition-opacity hover:opacity-80" style={{ color: '#F0D39A' }}>
          Harbourview
        </Link>

        <div className="h-4 w-px" style={{ background: 'rgba(198,165,90,0.15)' }} />

        <button
          onClick={onMarketClick}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] tracking-[0.04em] transition-all hover:bg-[rgba(198,165,90,0.14)]"
          style={{ border: '1px solid rgba(198,165,90,0.2)', background: 'rgba(198,165,90,0.08)', color: '#F0D39A' }}
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center" style={{ color: 'rgba(198,165,90,0.7)' }}><GlobeIcon /></span>
          <span>{countryName}</span>
          <ChevronDownIcon />
        </button>

        <div className="hidden items-center rounded-full px-2.5 py-1 text-[11px] tracking-[0.04em] sm:flex"
          style={{ border: '1px solid rgba(198,165,90,0.12)', background: 'rgba(198,165,90,0.04)', color: 'rgba(240,211,154,0.6)' }}>
          {roleLabel}
        </div>

        {countryCount && (
          <span className="hidden text-[10px] tracking-[0.06em] xl:block" style={{ color: 'rgba(198,165,90,0.35)' }}>
            {countryCount} tracked markets
          </span>
        )}
      </div>

      {/* Right — account */}
      <div ref={menuRef} className="relative flex items-center">

        {/* Loading skeleton */}
        {user === undefined && (
          <div className="h-7 w-7 animate-pulse rounded-full" style={{ background: 'rgba(198,165,90,0.1)' }} />
        )}

        {/* Signed-in: avatar button. Signed-out: labeled Sign In button. */}
        {user !== undefined && (
          user ? (
            <button
              type="button"
              onClick={() => { setMenuOpen(o => !o); setAuthError('') }}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.25)', color: '#F0D39A' }}
            >
              {initials}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMenuOpen(o => !o); setAuthError('') }}
              aria-label="Sign in"
              aria-expanded={menuOpen}
              className="flex h-7 cursor-pointer items-center justify-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.08em] transition-all hover:opacity-80"
              style={{ background: 'rgba(198,165,90,0.1)', border: '1px solid rgba(198,165,90,0.25)', color: '#F0D39A' }}
            >
              Sign In
            </button>
          )
        )}

        {/* Dropdown */}
        {menuOpen && user !== undefined && (
          <div className="absolute right-0 top-full z-[70] w-64 pt-2">
            <div className="rounded-sm shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              style={{ background: 'rgba(2,8,20,0.98)', border: '1px solid rgba(198,165,90,0.16)' }}>

              {user ? (
                /* ── Signed-in state ── */
                <div className="p-2">
                  <div className="mb-1 border-b px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.3)' }}>Signed in as</p>
                    <p className="mt-0.5 truncate text-[11px]" style={{ color: 'rgba(240,211,154,0.75)' }}>{user.email}</p>
                  </div>
                  <Link href="/account" onClick={() => setMenuOpen(false)}
                    className="block rounded-sm px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[rgba(198,165,90,0.1)]"
                    style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Account
                  </Link>
                  <button type="button" onClick={handleSignOut}
                    className="w-full rounded-sm px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[rgba(220,80,80,0.1)]"
                    style={{ color: 'rgba(220,80,80,0.75)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Sign Out
                  </button>
                </div>
              ) : (
                /* ── Sign-in form ── */
                <div className="p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(240,211,154,0.6)' }}>
                    Sign in to Harbourview
                  </p>
                  <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      style={INPUT_STYLE}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={INPUT_STYLE}
                    />
                    {authError && (
                      <p style={{ fontSize: '11px', color: 'rgba(220,80,80,0.9)', margin: 0 }}>{authError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        marginTop: '4px',
                        padding: '8px',
                        background: loading ? 'rgba(198,165,90,0.15)' : 'rgba(198,165,90,0.18)',
                        border: '1px solid rgba(198,165,90,0.35)',
                        borderRadius: '3px',
                        color: '#F0D39A',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: loading ? 'wait' : 'pointer',
                      }}
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      Forgot password?
                    </Link>
                    <Link href="/login?mode=signup" onClick={() => setMenuOpen(false)}
                      style={{ fontSize: '10px', color: 'rgba(240,211,154,0.75)', fontWeight: 600 }}>
                      Create account →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
