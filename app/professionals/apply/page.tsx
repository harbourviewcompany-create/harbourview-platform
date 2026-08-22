import type { Metadata } from 'next'
import Link from 'next/link'
import ProfessionalApplicationForm, { FORM_CSS } from './ProfessionalApplicationForm'

export const metadata: Metadata = {
  title: 'Apply to the Clinical Professionals Directory | Harbourview',
  description: 'Apply to join the verified Harbourview cannabis medicine professionals directory. For physicians, pharmacists, researchers, and regulatory specialists in regulated markets.',
}

// Static: no server data on this page — the form is a client component.

export default function ProfessionalApplyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <style>{FORM_CSS}</style>
      <div className="ap-wrap">
        <Link href="/professionals" className="ap-back">← Professionals Directory</Link>

        <header className="ap-header">
          <p className="ap-eyebrow">Directory Application</p>
          <h1 className="ap-title">Join the Clinical Professionals Directory</h1>
          <p className="ap-sub">
            Apply for a verified profile in Harbourview&apos;s network of cannabis medicine clinicians,
            pharmacists, researchers, and regulatory specialists. Every application is individually
            reviewed before publication — no profile goes live automatically.
          </p>
        </header>

        <ProfessionalApplicationForm />

        <p className="ap-disclaimer">
          By applying you confirm the information provided is accurate. Harbourview verifies credentials
          before publication and reserves the right to decline or remove listings. This directory is
          non-promotional — no medical advice, prescribing guidance, or investment recommendations are
          provided through Harbourview.
        </p>
      </div>
    </main>
  )
}

const CSS = `
.ap-wrap { max-width: 680px; margin: 0 auto; padding: 48px 24px 80px; }
.ap-back { display: inline-block; font-size: 11px; color: #d4a84b; text-decoration: none; letter-spacing: .08em; margin-bottom: 32px; }
.ap-back:hover { opacity: .7; }
.ap-header { margin-bottom: 36px; }
.ap-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 12px; }
.ap-title { font-family: 'Georgia', serif; font-size: clamp(24px, 4vw, 36px); font-weight: 400; color: #f5f0e8; letter-spacing: -.01em; margin: 0 0 16px; }
.ap-sub { font-size: 14px; color: rgba(245,240,232,.55); line-height: 1.7; margin: 0; }
.ap-disclaimer { margin-top: 32px; font-size: 11px; line-height: 1.7; color: rgba(245,240,232,.25); }
`
