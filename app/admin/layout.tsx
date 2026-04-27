import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'Admin | Harbourview', template: '%s | HV Admin' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060F1C' }}>
      {/* Admin nav bar */}
      <div style={{ backgroundColor: '#0A1628', borderBottom: '1px solid rgba(198,165,90,0.15)', padding: '0 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', height: '52px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', color: '#C6A55A' }}>
            HV ADMIN
          </span>
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Listings', href: '/admin/listings' },
            { label: 'Wanted', href: '/admin/wanted' },
            { label: 'Inquiries', href: '/admin/inquiries' },
            { label: 'Matches', href: '/admin/matches' },
            { label: 'Disclosures', href: '/admin/disclosures' },
            { label: 'Audit', href: '/admin/audit' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', fontWeight: 500, color: '#C9C2B3', textDecoration: 'none', letterSpacing: '0.03em' }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Link
              href="/"
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', color: '#C9C2B3', opacity: 0.5, textDecoration: 'none' }}
            >
              ← Public site
            </Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 24px' }}>
        {children}
      </div>
    </div>
  )
}
