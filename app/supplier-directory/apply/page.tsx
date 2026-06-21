import type { Metadata } from 'next'
import Link from 'next/link'
import SupplierApplicationForm, { FORM_CSS } from './SupplierApplicationForm'

export const metadata: Metadata = {
  title: 'Apply to the Supplier Directory | Harbourview',
  description: 'Apply to be listed in the Harbourview supplier directory. For licensed producers, distributors, equipment vendors, and service providers in regulated cannabis markets.',
}

export const dynamic = 'force-dynamic'

export default function SupplierApplyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <style>{FORM_CSS}</style>
      <div className="ap-wrap">
        <Link href="/supplier-directory" className="ap-back">← Supplier Directory</Link>

        <header className="ap-header">
          <p className="ap-eyebrow">Directory Application</p>
          <h1 className="ap-title">Join the Harbourview Supplier Directory</h1>
          <p className="ap-sub">
            Apply for a reviewed profile in Harbourview&apos;s network of producers, distributors,
            equipment vendors, and service providers serving regulated cannabis markets. Every
            submission is individually reviewed before publication — no profile goes live automatically.
          </p>
        </header>

        <SupplierApplicationForm />

        <p className="ap-disclaimer">
          By applying you confirm the information provided is accurate. Harbourview reviews category
          fit, credentials and commercial relevance before publication and reserves the right to
          decline or remove listings. Submission does not guarantee listing or introduction routing.
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
