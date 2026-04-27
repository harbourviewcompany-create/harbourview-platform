import type { Metadata } from 'next'
import Link from 'next/link'
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/categories'

export const metadata: Metadata = {
  title: {
    default: 'Marketplace | Harbourview',
    template: '%s | Harbourview Marketplace',
  },
  description:
    'Harbourview Marketplace — curated cannabis listings, wanted requests, supplier directory and business opportunities across regulated global markets.',
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Marketplace sub-nav */}
      <div
        style={{
          backgroundColor: 'rgba(8,20,35,0.8)',
          borderBottom: '1px solid rgba(198,165,90,0.12)',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            gap: '0',
          }}
        >
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                color: '#C9C2B3',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                borderBottom: '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              <span style={{ fontSize: '11px' }}>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        {children}
      </div>
    </div>
  )
}
