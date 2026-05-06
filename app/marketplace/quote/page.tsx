import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import QuoteRequestForm from './QuoteRequestForm'

export const metadata: Metadata = {
  title: 'Request Routed Inquiry | Harbourview Network',
  description: 'Submit a buyer or supplier inquiry for Harbourview Network opportunities. Contact details are not public and Harbourview reviews inquiries before coordinating any introduction.',
}

export default function QuoteRequestPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Request Routed Inquiry</h1>
          <p className="text-gray-300 max-w-2xl">
            Contact details are not public. Harbourview reviews buyer, supplier and counterparty inquiries before coordinating any introduction or transaction follow-up. Provide the listing or category of interest, budget or target price, quantity, location, timing and intended use.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-3xl">
          <div className="mb-6 rounded border border-gold/30 bg-gold-pale px-4 py-3 text-sm text-navy">
            Public summaries do not guarantee availability, pricing, introduction, transaction terms or legal/regulatory outcomes. Harbourview reviews inquiries before routing.
          </div>
          <Suspense fallback={<div className="card p-6 text-sm text-gray-500">Loading inquiry form…</div>}>
            <QuoteRequestForm />
          </Suspense>
        </div>
      </section>
    </>
  )
}
