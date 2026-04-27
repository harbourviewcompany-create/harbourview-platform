import type { Metadata } from 'next'
import Link from 'next/link'
import { BOOKING_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Inquiry Received | Harbourview',
  description: 'Thank you. Your Harbourview inquiry has been received.',
}

export default function ThankYouPage() {
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 140px) 24px', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        {/* Gold mark */}
        <div style={{ width: '48px', height: '2px', backgroundColor: '#C6A55A', margin: '0 auto 32px' }} />

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, lineHeight: 1.2, color: '#F5F1E8', margin: '0 0 24px' }}>
          Thank you. Your inquiry has been received.
        </h1>

        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', lineHeight: 1.75, color: '#C9C2B3', margin: '0 0 16px' }}>
          Harbourview will review the information submitted and assess the most relevant next step.
        </p>

        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', lineHeight: 1.7, color: '#C9C2B3', margin: '0 0 40px', opacity: 0.85 }}>
          Where the opportunity is clear, the next step may involve a call, a market-access review, a commercial intelligence brief, a partner pathway review or a more detailed intake.
        </p>

        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#C9C2B3', opacity: 0.55, margin: '0 0 40px' }}>
          Only share sensitive commercial details where necessary.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '13px 26px',
              backgroundColor: '#C6A55A',
              color: '#0B1A2F',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Return Home
          </Link>

          <Link
            href="/intake"
            style={{
              display: 'inline-block',
              padding: '13px 26px',
              backgroundColor: 'transparent',
              color: '#C6A55A',
              border: '1px solid rgba(198,165,90,0.45)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Start Another Inquiry
          </Link>

          {BOOKING_URL && (
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '13px 26px',
                backgroundColor: 'transparent',
                color: '#C9C2B3',
                border: '1px solid rgba(198,165,90,0.25)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                borderRadius: '2px',
              }}
            >
              Book a Call
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
