import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import QuoteRequestForm from './QuoteRequestForm'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Request Routed Inquiry | Harbourview Network',
  description: 'Submit a buyer or supplier inquiry for Harbourview Network opportunities. Contact details are not public and Harbourview reviews inquiries before coordinating any introduction.',
}

export default function QuoteRequestPage() {
  return (
    <>
      <PublicHero
        eyebrow="Harbourview Network Inquiry"
        title="Request a routed buyer or supplier inquiry."
        actions={[
          { label: 'Open Marketplace', href: '/marketplace' },
          { label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>
          Submit listing interest, market requirements, quantity, timing and commercial context for Harbourview review before any counterparty coordination.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Contact details remain private. Routing depends on review, fit and response readiness.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold/70">
          <Link href="/marketplace" className="hover:underline">Marketplace</Link> / Routed Inquiry
        </p>
      </PublicHero>

      <PublicSection tone="panel">
        <div className="page-container max-w-3xl">
          <PublicCard className="mb-6 border-gold/20 bg-[#0d1e32] px-4 py-3 text-sm text-white/78">
            Public summaries do not guarantee availability, pricing, introduction, transaction terms or legal/regulatory outcomes. Harbourview reviews inquiries before routing.
          </PublicCard>
          <Suspense fallback={<PublicCard className="p-6 text-sm text-white/58">Loading inquiry form…</PublicCard>}>
            <QuoteRequestForm />
          </Suspense>
        </div>
      </PublicSection>
    </>
  )
}
