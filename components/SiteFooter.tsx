import Link from 'next/link'
import {
  HARBOURVIEW_EMAIL,
  HARBOURVIEW_PHONE,
  HARBOURVIEW_LINKEDIN_URL,
  HARBOURVIEW_LINKEDIN,
  FOOTER_LINKS,
  LEGAL_LINKS,
} from '@/lib/constants'

export function SiteFooter() {
  return (
    <footer
      style={{
        backgroundColor: '#081423',
        borderTop: '1px solid rgba(198,165,90,0.18)',
        padding: '64px 24px 40px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px',
            marginBottom: '48px',
          }}
        >
          {/* Brand column */}
          <div style={{ maxWidth: '280px' }}>
            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#C6A55A',
                margin: '0 0 16px',
              }}
            >
              HARBOURVIEW
            </p>
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#C9C2B3',
                margin: '0 0 24px',
              }}
            >
              Market access, commercial intelligence and strategic introductions for the global cannabis industry.
            </p>
          </div>

          {/* Pages column */}
          <div>
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#C6A55A',
                margin: '0 0 16px',
              }}
            >
              Pages
            </p>
            <nav aria-label="Footer navigation">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '14px',
                        color: '#C9C2B3',
                        textDecoration: 'none',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact column */}
          <div>
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#C6A55A',
                margin: '0 0 16px',
              }}
            >
              Contact
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`mailto:${HARBOURVIEW_EMAIL}`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: '#C9C2B3', textDecoration: 'none' }}
              >
                {HARBOURVIEW_EMAIL}
              </a>
              <a
                href={`tel:${HARBOURVIEW_PHONE.replace(/-/g, '')}`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: '#C9C2B3', textDecoration: 'none' }}
              >
                {HARBOURVIEW_PHONE}
              </a>
              <a
                href={HARBOURVIEW_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: '#C9C2B3', textDecoration: 'none' }}
              >
                {HARBOURVIEW_LINKEDIN}
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(198,165,90,0.12)', paddingTop: '32px' }}>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '12px',
              color: '#C9C2B3',
              opacity: 0.7,
              margin: 0,
              lineHeight: '1.7',
              maxWidth: '700px',
            }}
          >
            Harbourview provides commercial intelligence, market-access support and strategic introduction services. Legal or regulatory advice is provided through qualified partners where required.
          </p>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '12px',
              color: '#C9C2B3',
              opacity: 0.5,
              marginTop: '12px',
              marginBottom: 0,
            }}
          >
            © {new Date().getFullYear()} Harbourview. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', color: '#C9C2B3', opacity: 0.4, textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
