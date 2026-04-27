import type { Metadata } from 'next'
import { ContactForm } from '@/components/ContactForm'
import { HARBOURVIEW_EMAIL, HARBOURVIEW_PHONE, HARBOURVIEW_LINKEDIN_URL, HARBOURVIEW_LINKEDIN } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Harbourview',
  description: 'Contact Harbourview for market-access, commercial intelligence, strategic introduction or cannabis industry partnership inquiries.',
}

export default function ContactPage() {
  return (
    <>
      <section style={{ padding: '72px 24px 40px', borderBottom: '1px solid rgba(198,165,90,0.15)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px,5vw,50px)', fontWeight: 600, lineHeight: 1.15, color: '#F5F1E8', margin: '0 0 20px' }}>
            Contact Harbourview
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '17px', lineHeight: 1.7, color: '#C9C2B3', margin: '0', maxWidth: '600px' }}>
            For market-access, commercial intelligence, strategic introduction or cannabis industry partnership inquiries, contact Harbourview directly or start with a structured intake.
          </p>
        </div>
      </section>

      <section style={{ padding: '56px 24px 80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px' }}>
          {/* Contact details */}
          <div>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C6A55A', margin: '0 0 20px' }}>
              Direct Contact
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#C9C2B3', opacity: 0.6, margin: '0 0 4px' }}>Email</p>
                <a href={`mailto:${HARBOURVIEW_EMAIL}`} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: '#F5F1E8', textDecoration: 'none' }}>
                  {HARBOURVIEW_EMAIL}
                </a>
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#C9C2B3', opacity: 0.6, margin: '0 0 4px' }}>Phone</p>
                <a href={`tel:${HARBOURVIEW_PHONE.replace(/-/g,'')}`} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: '#F5F1E8', textDecoration: 'none' }}>
                  {HARBOURVIEW_PHONE}
                </a>
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#C9C2B3', opacity: 0.6, margin: '0 0 4px' }}>LinkedIn</p>
                <a href={HARBOURVIEW_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', color: '#F5F1E8', textDecoration: 'none' }}>
                  {HARBOURVIEW_LINKEDIN}
                </a>
              </div>
            </div>

            <div style={{ marginTop: '40px', padding: '20px 24px', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '2px', backgroundColor: 'rgba(198,165,90,0.03)' }}>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3', margin: '0 0 12px' }}>
                For a structured inquiry with context about your objective, organization type and target market, the intake form provides a more complete starting point.
              </p>
              <a href="/intake" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, color: '#C6A55A', textDecoration: 'none' }}>
                Start with Intake →
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C6A55A', margin: '0 0 20px' }}>
              Send a Message
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
