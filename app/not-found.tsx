import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page Not Found | Harbourview' }

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#C6A55A',
          marginBottom: '16px',
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          color: '#F5F1E8',
          margin: '0 0 16px',
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          color: '#C9C2B3',
          lineHeight: '1.7',
          maxWidth: '480px',
          marginBottom: '36px',
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 22px',
            backgroundColor: '#C6A55A',
            color: '#0B1A2F',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: '2px',
          }}
        >
          Return Home
        </Link>
        <Link
          href="/marketplace"
          style={{
            display: 'inline-block',
            padding: '10px 22px',
            border: '1px solid rgba(198,165,90,0.3)',
            color: '#C6A55A',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            textDecoration: 'none',
            borderRadius: '2px',
          }}
        >
          Marketplace
        </Link>
      </div>
    </div>
  )
}
