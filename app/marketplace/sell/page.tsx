import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'

export const metadata: Metadata = {
  title: 'Submit a Listing',
  description:
    'Submit equipment, inventory, cannabis inventory, services, or a business opportunity to the Harbourview marketplace for review.',
}

export default function SellPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Submit a Listing</h1>
          <p className="text-gray-300 max-w-2xl">
            Submit equipment, inventory, services, or a business opportunity for
            review. Listings are assessed before reaching the marketplace and
            introductions are made to qualified counterparties.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
