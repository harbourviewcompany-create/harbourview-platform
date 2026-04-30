import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import QuoteRequestForm from './QuoteRequestForm'

export const metadata: Metadata = {
  title: 'Request Quote | Harbourview Marketplace',
  description: 'Request a quote for Harbourview Marketplace consumables, packaging, production supplies or supplier-sourced listings.',
}

export default function QuoteRequestPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Request a Quote</h1>
          <p className="text-gray-300 max-w-2xl">
            Tell Harbourview what you need, where it needs to ship and the volume you are considering. We review the request before supplier introduction or quote.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-3xl">
          <Suspense fallback={<div className="card p-6 text-sm text-gray-500">Loading quote request…</div>}>
            <QuoteRequestForm />
          </Suspense>
        </div>
      </section>
    </>
  )
}
