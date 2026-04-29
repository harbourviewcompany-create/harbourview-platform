import type { Metadata } from 'next'
import IntakeForm from './IntakeForm'

export const metadata: Metadata = {
  title: 'Submit a Listing',
  description:
    'Submit equipment, inventory, services, or a business opportunity to the Harbourview marketplace.',
}

export default function IntakePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Submit a Listing</h1>
          <p className="text-gray-300 max-w-2xl">
            Use this form to submit equipment, inventory, services, or a business
            opportunity for review. All listings are reviewed before publication.
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
