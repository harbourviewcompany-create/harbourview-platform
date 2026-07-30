import type { Metadata } from 'next'
import Link from 'next/link'
import FinancingInquiryForm from './FinancingInquiryForm'

export const metadata: Metadata = {
  title: 'Trade Financing Inquiry | Harbourview',
  description:
    'Request reviewed trade financing or BNPL support for regulated cannabis marketplace transactions. Structured inquiry only — no open credit decisioning on this form.',
}

export default function FinancingInquiryPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{PAGE_CSS}</style>
      <div className="fin-wrap">
        <header className="fin-header">
          <div className="fin-eyebrow">Marketplace · Trade finance</div>
          <h1 className="fin-title">Request trade financing support</h1>
          <p className="fin-sub">
            Structured inquiry for BNPL-style or trade-finance support on regulated cannabis
            transactions. Harbourview reviews fit, amount, purpose and timeline before any partner
            introduction — this form does not approve credit.
          </p>
          <div className="fin-links">
            <Link href="/marketplace">← Marketplace</Link>
            <Link href="/marketplace/deals">Deal rooms</Link>
            <Link href="/contact">General contact</Link>
          </div>
        </header>
        <FinancingInquiryForm />
        <p className="fin-foot">
          Submissions are logged as reviewed marketplace inquiries. Do not share banking credentials,
          full account numbers, or documents you are not authorized to disclose on this form.
        </p>
      </div>
    </main>
  )
}

const PAGE_CSS = `
.fin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
.fin-header { margin-bottom: 32px; }
.fin-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 12px; }
.fin-title { font-family: Georgia, serif; font-size: clamp(26px, 4vw, 36px); font-weight: 400; color: #f5f0e8; margin: 0 0 14px; }
.fin-sub { font-size: 14px; line-height: 1.7; color: rgba(245,240,232,.55); margin: 0 0 18px; max-width: 620px; }
.fin-links { display: flex; flex-wrap: wrap; gap: 16px; }
.fin-links a { font-size: 11px; color: #d4a84b; text-decoration: none; }
.fin-links a:hover { opacity: .75; }
.fin-foot { margin-top: 28px; font-size: 11px; line-height: 1.65; color: rgba(245,240,232,.3); max-width: 620px; }
`
