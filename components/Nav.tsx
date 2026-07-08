'use client'

import Link from 'next/link'
import { useState } from 'react'
import { NavAuthButton } from '@/components/NavAuthButton'

type NavItem = {
  label: string
  href: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { label: 'Platform Map', href: '/platform' },
      { label: 'Operator Dashboard', href: '/dashboard' },
      { label: 'Network', href: '/network' },
      { label: 'Professionals', href: '/professionals' },
      { label: 'Institutional Partnerships', href: '/institutional-partnerships' },
      { label: 'Reviewed Connections', href: '/reviewed-connections' },
      { label: 'Trust & Governance', href: '/trust-governance' },
      { label: 'Access States', href: '/access-states' },
    ],
  },
  {
    // Marketplace pilot (Command Centre consolidation, phase 1): browse/
    // category items folded into the Command Centre marketplace panel
    // (see next.config.mjs redirects). Only the two flows with no in-shell
    // equivalent yet stay as standalone routes.
    label: 'Exchange',
    items: [
      { label: 'Marketplace', href: '/dashboard?page=marketplace' },
      { label: 'Sell or Export', href: '/marketplace/sell' },
      { label: 'Deal Rooms', href: '/marketplace/deals' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Intelligence Home', href: '/intelligence' },
      { label: 'Country Briefs', href: '/intelligence/country-briefs' },
      { label: 'Market Briefings', href: '/markets' },
      { label: 'Entry Playbooks', href: '/intelligence/playbooks' },
      { label: 'Regulatory Pathways', href: '/intelligence/regulatory-pathways' },
      { label: 'Licensing Pathways', href: '/intelligence/licensing-pathways' },
      { label: 'Logistics & Trade Routes', href: '/intelligence/logistics-trade-routes' },
      { label: 'Counterparty Intelligence', href: '/intelligence/counterparty-intelligence' },
      { label: 'Signals', href: '/signals' },
      { label: 'Watchlists', href: '/intelligence/watchlists' },
      { label: 'Source Engine', href: '/intelligence/source-engine' },
      { label: 'Source Methodology', href: '/source-methodology' },
      { label: 'Policy & Standards', href: '/policy-standards' },
      { label: 'Assessments', href: '/assessments' },
    ],
  },
]

const navLinks: NavItem[] = [
  { label: 'Education', href: '/education' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const mobileNavLinks: NavItem[] = [
  { label: 'Marketplace', href: '/dashboard?page=marketplace' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Markets', href: '/markets' },
  { label: 'Education', href: '/education' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null)

  const closeMenus = () => {
    setMobileOpen(false)
    setOpenDesktopGroup(null)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gold/10 bg-[#020814]/95 text-white shadow-[0_1px_0_rgba(198,165,90,0.08)] backdrop-blur-xl">
      <div className="page-container">
        <div className="flex h-[72px] items-center justify-between pt-[max(env(safe-area-inset-top),0px)] sm:h-20">
          <Link
            href="/"
            className="premium-wordmark text-[15px] tracking-[0.28em] sm:text-[22px]"
            aria-label="Harbourview home"
            onClick={closeMenus}
          >
            HARBOURVIEW
          </Link>

          <nav
            className="hidden items-center gap-4 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 xl:gap-6 xl:text-[11px] lg:flex"
            aria-label="Primary navigation"
          >
            {navGroups.map((group) => {
              const menuId = `desktop-nav-${group.label.toLowerCase()}`
              const isOpen = openDesktopGroup === group.label

              return (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => setOpenDesktopGroup(group.label)}
                  onMouseLeave={() => setOpenDesktopGroup(null)}
                  onFocus={() => setOpenDesktopGroup(group.label)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setOpenDesktopGroup(null)
                    }
                  }}
                >
                  <button
                    type="button"
                    className="nav-link-premium flex items-center gap-2 whitespace-nowrap uppercase"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={menuId}
                    onClick={() => setOpenDesktopGroup(isOpen ? null : group.label)}
                  >
                    <span>{group.label}</span>
                    <span aria-hidden="true" className="text-[9px] text-gold/80">▾</span>
                  </button>

                  <div id={menuId} role="menu" className={`absolute left-0 top-full z-[70] min-w-[240px] pt-4 ${isOpen ? 'block' : 'hidden'}`}>
                    <div className="rounded-sm border border-gold/14 bg-[#020814]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className="block rounded-sm px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/72 transition-colors hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold focus:outline-none"
                          onClick={closeMenus}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}

            {navLinks.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className="nav-link-premium whitespace-nowrap" onClick={closeMenus}>
                {link.label}
              </Link>
            ))}
          </nav>

          <NavAuthButton />

          <Link href="/intake" className="btn-marketplace hidden px-5 py-2.5 text-[10px] xl:inline-flex">
            Start Confidential Intake
          </Link>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-white/[0.02] text-gold transition-colors hover:border-gold/50 hover:bg-gold/10 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            type="button"
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span className="absolute left-0 top-0 block h-0.5 w-5 bg-current" />
              <span className="absolute left-0 top-[7px] block h-0.5 w-5 bg-current" />
              <span className="absolute bottom-0 left-0 block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-gold/10 bg-[#020814]/98 lg:hidden">
          <nav
            className="page-container max-h-[calc(100vh-72px)] overflow-y-auto pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/82"
            aria-label="Mobile navigation"
          >
            <div className="grid grid-cols-1 gap-3">
              {mobileNavLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="rounded-sm border border-gold/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <NavAuthButton mobile />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
