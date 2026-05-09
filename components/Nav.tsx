'use client'

import Link from 'next/link'
import { useState } from 'react'

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
    label: 'Network',
    items: [
      { label: 'Network', href: '/network' },
      { label: 'Opportunities', href: '/opportunities' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Intelligence', href: '/intelligence' },
      { label: 'Signals', href: '/signals' },
    ],
  },
]

const navLinks: NavItem[] = [
  { label: 'Compliance', href: '/compliance' },
  { label: 'Clinical Education', href: '/network/clinical-education' },
  { label: 'Contact', href: '/contact' },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null)
  const [openMobileGroups, setOpenMobileGroups] = useState<Record<string, boolean>>({
    Network: true,
    Intelligence: true,
  })

  const closeMenus = () => {
    setMobileOpen(false)
    setOpenDesktopGroup(null)
  }

  const toggleMobileGroup = (label: string) => {
    setOpenMobileGroups((current) => ({
      ...current,
      [label]: !current[label],
    }))
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

          <nav className="hidden items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 xl:gap-7 xl:text-[11px] lg:flex">
          <nav
            className="hidden items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 xl:gap-7 xl:text-[11px] lg:flex"
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
                    <span aria-hidden="true" className="text-[9px] text-gold/80">
                      ▾
                    </span>
                  </button>

                  <div
                    id={menuId}
                    role="menu"
                    className={`absolute left-0 top-full min-w-[220px] pt-4 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="rounded-sm border border-gold/14 bg-[#020814]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className="block rounded-sm px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/72 transition-colors hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold focus:outline-none"
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
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="nav-link-premium whitespace-nowrap"
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/intake" className="btn-marketplace hidden px-5 py-2.5 text-[10px] xl:inline-flex">
            Request Introduction
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
            className="page-container grid grid-cols-1 gap-3 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/82"
            aria-label="Mobile navigation"
          >
            {navGroups.map((group) => {
              const groupId = `mobile-nav-${group.label.toLowerCase()}`
              const isOpen = Boolean(openMobileGroups[group.label])

              return (
                <div key={group.label} className="rounded-sm border border-gold/10 bg-white/[0.02]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gold/10 hover:text-gold"
                    aria-expanded={isOpen}
                    aria-controls={groupId}
                    onClick={() => toggleMobileGroup(group.label)}
                  >
                    <span>{group.label}</span>
                    <span aria-hidden="true" className="text-gold/80">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div id={groupId} className="grid gap-2 border-t border-gold/10 p-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="rounded-sm bg-black/16 px-4 py-3 text-white/72 transition-colors hover:bg-gold/10 hover:text-gold"
                          onClick={closeMenus}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {navLinks.map((link) => (
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

            <Link
              href="/intake"
              className="rounded-sm border border-gold/30 bg-gold px-4 py-3 text-center text-[#071425] transition-colors hover:bg-gold-light"
              onClick={closeMenus}
            >
              Request Introduction
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
