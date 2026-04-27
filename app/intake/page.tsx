import type { Metadata } from 'next'
import { IntakeForm } from '@/components/IntakeForm'

export const metadata: Metadata = {
  title: 'Start with Harbourview | Cannabis Market Access Inquiry',
  description: 'Submit a light inquiry to Harbourview. Share your commercial objective and Harbourview will assess the most relevant next step.',
}

export default function IntakePage() {
  return (
    <>
      <section style={{ padding: '72px 24px 40px', borderBottom: '1px solid rgba(198,165,90,0.15)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px,5vw,50px)', fontWeight: 600, lineHeight: 1.15, color: '#F5F1E8', margin: '0 0 20px' }}>
            Start with Harbourview
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '17px', lineHeight: 1.7, color: '#C9C2B3', margin: '0 0 12px' }}>
            Use this form to share what you are trying to do. The first step is intentionally light. If more detail is needed, Harbourview can route you to a deeper intake path.
          </p>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', lineHeight: 1.6, color: '#C9C2B3', opacity: 0.65, margin: 0 }}>
            Information submitted through Harbourview is used to review the inquiry, assess fit and determine the most relevant next step. Sensitive details should only be shared where necessary.
          </p>
        </div>
      </section>

      <section style={{ padding: '56px 24px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
