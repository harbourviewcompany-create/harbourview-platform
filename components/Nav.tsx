'use client'

import Link from 'next/link'
import { useState } from 'react'

const marketplaceLinks = [
  { label: 'New Products', href: '/marketplace/new-products' },
  { label: 'Used & Surplus', href: '/marketplace/used-surplus' },
  { label: 'Cannabis Inventory', href: '/marketplace/cannabis-inventory' },
  { label: 'Wanted Requests', href: '/marketplace/wanted' },
  { label: 'Services', href: '/marketplace/services' },
  { label: 'Business Opportunities', href: '/marketplace/business-opportunities' },
]

const navLinks = [
  { label: 'Marketplace', href: '/marketplace', hasDropdown: true },
  { label: 'Submit Listing', href: '/marketplace/sell', hasDropdown: false },
  { label: 'Wanted Requests', href: '/marketplace/wanted', hasDropdown: false },
  { label: 'Signals', href: '/signals', hasDropdown: false },
  { label: 'Intelligence', href: '/intelligence', hasDropdown: false },
  { label: 'Intake', href: '/intake', hasDropdown: false },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="bg-navy text-white shadow-md">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-gold font-bold text-xl tracking-tight">Harbourview</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <Link href={link.href} className="hover:text-gold transition-colors">
                    {link.label} ▾
                  </Link>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white text-navy rounded shadow-lg border border-gray-100 py-1 z-50">
                      {marketplaceLinks.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="block px-4 py-2 text-sm hover:bg-gold-pale hover:text-navy transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* CTA */}
          <div className="hidden lg:block">
            <Link href="/intake" className="btn-primary text-sm">
              Request Intake
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded hover:bg-navy-light"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy-dark border-t border-navy-light">
          <div className="page-container py-4 flex flex-col gap-3 text-sm font-medium">
            <Link href="/marketplace" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Marketplace
            </Link>
            {marketplaceLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="pl-4 text-gray-300 hover:text-gold"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/marketplace/sell" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Submit Listing
            </Link>
            <Link href="/marketplace/wanted" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Wanted Requests
            </Link>
            <Link href="/signals" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Signals
            </Link>
            <Link href="/intelligence" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Intelligence
            </Link>
            <Link href="/intake" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Intake
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
