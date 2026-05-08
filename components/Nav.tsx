'use client'

import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  { label: 'Network', href: '/marketplace' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Signals', href: '/signals' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Clinical Education', href: '/network/clinical-education' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gold/10 bg-[#020814]/95 text-white shadow-[0_1px_0_rgba(198,165,90,0.08)] backdrop-blur-xl">
      <div className="page-container">
        <div className="flex h-[72px] items-center justify-between pt-[max(env(safe-area-inset-top),0px)] sm:h-20">
          <Link
            href="/"
            className="premium-wordmark text-[15px] tracking-[0.28em] sm:text-[22px]"
            aria-label="Harbourview home"
          >
            HARBOURVIEW
          </Link>

          <nav className="hidden items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 xl:gap-7 xl:text-[11px] lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link-premium">
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-white/[0.02] text-gold transition-colors hover:border-gold/50 hover:bg-gold/10 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className="relative block h-4 w-5">
              <span className="absolute left-0 top-0 block h-0.5 w-5 bg-current"></span>
              <span className="absolute left-0 top-[7px] block h-0.5 w-5 bg-current"></span>
              <span className="absolute bottom-0 left-0 block h-0.5 w-5 bg-current"></span>
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gold/10 bg-[#020814]/98 lg:hidden">
          <div className="page-container grid grid-cols-1 gap-2 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/82 sm:grid-cols-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm border border-gold/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
