'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function NavAuthButton({ mobile = false }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  // Loading — render nothing to avoid layout shift
  if (user === undefined) {
    if (mobile) return null
    return <div className="h-8 w-8 rounded-full bg-white/[0.06] animate-pulse" aria-hidden="true" />
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (mobile) {
    if (!user) {
      return (
        <Link
          href="/login"
          className="rounded-sm border border-gold/10 bg-white/[0.02] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/82 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
        >
          Sign In
        </Link>
      )
    }

    return (
      <>
        <Link
          href="/account"
          className="rounded-sm border border-gold/10 bg-white/[0.02] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/82 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-sm border border-white/8 bg-white/[0.02] px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-white/40 transition-colors hover:border-red-400/30 hover:text-red-400"
        >
          Sign Out
        </button>
      </>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Link
        href="/login"
        className="nav-link-premium whitespace-nowrap text-[10px] xl:text-[11px]"
      >
        Sign In
      </Link>
    )
  }

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : 'HV'

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Account menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/12 text-[10px] font-bold text-[#C6A55A] transition-colors hover:border-[#C6A55A]/55 hover:bg-[#C6A55A]/20"
      >
        {initials}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-[70] w-56 pt-3">
          <div className="rounded-sm border border-gold/14 bg-[#020814]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="mb-1 border-b border-white/[0.08] px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/38">Signed in as</p>
              <p className="mt-0.5 truncate text-xs text-[#F5F1E8]/65">{user.email}</p>
            </div>
            <Link
              href="/account"
              role="menuitem"
              className="block rounded-sm px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/72 transition-colors hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold focus:outline-none"
              onClick={() => setMenuOpen(false)}
            >
              Account
            </Link>
            <Link
              href="/dashboard"
              role="menuitem"
              className="block rounded-sm px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/72 transition-colors hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold focus:outline-none"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full rounded-sm px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 transition-colors hover:bg-red-900/20 hover:text-red-400 focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
