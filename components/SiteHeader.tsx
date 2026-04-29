'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const handleNavClick = (href: string, label: string) => {
    trackEvent('nav_click', { href, label })
    setMobileOpen(false)
  }

  const handleCTAClick = () => {
    trackEvent('cta_confidential_inquiry_click', { location: 'header' })
    setMobileOpen(false)
  }

  return (
    <header
      style={{
        backgroundColor: 'rgba(8,20,35,0.97)',
        borderBottom: '1px solid rgba(198,165,90,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          onClick={() => handleNavClick('/', 'home')}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: '#C6A55A',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          HARBOURVIEW
        </Link>

        {/* Desktop Nav */}
        <nav
          aria-label="Primary navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '32px' }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.href, link.label)}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: pathname === link.href ? '#C6A55A' : '#C9C2B3',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/intake"
            onClick={handleCTAClick}
            style={{
              display: 'inline-block',
              padding: '9px 20px',
              backgroundColor: '#C6A55A',
              color: '#0B1A2F',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
            }}
          >
            Start a Confidential Inquiry
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#C9C2B3',
          }}
          className="show-mobile"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div
          className="show-mobile"
          style={{
            borderTop: '1px solid rgba(198,165,90,0.15)',
            backgroundColor: '#081423',
            padding: '24px',
          }}
        >
          <nav aria-label="Mobile navigation" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href, link.label)}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(198,165,90,0.1)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: pathname === link.href ? '#C6A55A' : '#F5F1E8',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/intake"
              onClick={handleCTAClick}
              style={{
                display: 'block',
                marginTop: '20px',
                padding: '14px 24px',
                backgroundColor: '#C6A55A',
                color: '#0B1A2F',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: '2px',
                textAlign: 'center',
              }}
            >
              Start a Confidential Inquiry
            </Link>
          </nav>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
      `}</style>
    </header>
  )
}
