'use client'

import Link from 'next/link'
import { useState } from 'react'

const marketplaceLinks = [
  { label: 'New Products', href: '/marketplace/new-products' },
  { label: 'Used & Surplus', href: '/marketplace/used-surplus' },
  { label: 'Cannabis Inventory', href: '/marketplace/cannabis-inventory' },
  { label: 'Wanted Requests', href: '/marketplace/wanted-requests' },
  { label: 'Services', href: '/marketplace/services' },
  { label: 'Business Opportunities', href: '/marketplace/business-opportunities' },
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
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {/* Marketplace dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link
                href="/marketplace"
                className="hover:text-gold transition-colors"
              >
                Marketplace ▾
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

            <Link href="/supplier-directory" className="hover:text-gold transition-colors">
              Suppliers
            </Link>
            <Link href="/intake" className="hover:text-gold transition-colors">
              Submit a Listing
            </Link>
            <Link href="/contact" className="hover:text-gold transition-colors">
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <Link href="/intake" className="btn-primary text-sm">
              Submit a Listing
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded hover:bg-navy-light"
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
        <div className="md:hidden bg-navy-dark border-t border-navy-light">
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
            <Link href="/supplier-directory" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Suppliers
            </Link>
            <Link href="/intake" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Submit a Listing
            </Link>
            <Link href="/contact" className="hover:text-gold" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
