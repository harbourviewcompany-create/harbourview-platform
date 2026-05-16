import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHero, SectionFrame, Surface, TrustBoundaryPanel } from '@/components/design-system/Institutional'
import QuoteRequestForm from './QuoteRequestForm'

export const metadata: Metadata = {
  title: 'Request Routed Inquiry | Harbourview Network',
  description: 'Submit a buyer or supplier inquiry for Harbourview Network opportunities. Contact details are not public and Harbourview reviews inquiries before coordinating any introduction.',
}

export default function QuoteRequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Routed inquiry"
        title="Request follow-up without exposing private commercial context publicly."
        primary={{ label: 'Complete Inquiry', href: '#routed-inquiry' }}
        secondary={{ label: 'Confidential Intake', href: '/intake' }}
        aside={<TrustBoundaryPanel />}
        compact
      >
        <p>
          Use this route for buyer, supplier and counterparty inquiries tied to public summaries, categories or demand briefs. Harbourview reviews before any introduction or transaction follow-up.
        </p>
      </PageHero>

      <SectionFrame tone="editorial" id="routed-inquiry">
        <div className="mx-auto max-w-4xl">
          <Surface tone="form" className="mb-6 rounded-[1.5rem] p-5">
            <p className="text-sm leading-7 text-[#435066]">
              Public summaries do not guarantee availability, pricing, introduction, transaction terms or legal/regulatory outcomes. Harbourview reviews inquiries before routing.
            </p>
          </Surface>
          <Suspense fallback={<Surface tone="form" className="rounded-[1.75rem] p-6 text-sm text-[#435066]">Loading inquiry form…</Surface>}>
            <QuoteRequestForm />
          </Suspense>
        </div>
      </SectionFrame>
    </>
  )
}
