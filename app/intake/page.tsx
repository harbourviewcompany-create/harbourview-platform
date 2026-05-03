import type { Metadata } from 'next'
import ConfidentialIntakeForm from './ConfidentialIntakeForm'

export const metadata: Metadata = {
  title: 'Confidential Intake',
  description:
    'Begin a confidential discussion with Harbourview. For buyers, sellers, operators, and partners seeking a managed introduction or advisory engagement.',
}

export default function IntakePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Confidential Intake</h1>
          <p className="text-gray-300 max-w-2xl">
            For buyers, sellers, operators, and partners seeking a confidential
            conversation. Harbourview manages the intake process — submissions are
            reviewed and responses are handled directly.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <ConfidentialIntakeForm />
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Confidentiality</h2>
              <p className="text-sm text-gray-500">
                All intake submissions are handled in confidence. Details are not
                shared with third parties without explicit consent.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Submit a Listing</h2>
              <p className="text-sm text-gray-500 mb-4">
                To list equipment, inventory, services, or a business opportunity
                in the marketplace, use the dedicated seller intake form.
              </p>
              <a href="/marketplace/sell" className="btn-primary text-sm">
                Go to Seller Intake
              </a>
            </div>

            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Direct Email</h2>
              <p className="text-sm text-gray-500">
                You can also reach us at{' '}
                <a
                  href="mailto:harbourviewcompany@gmail.com"
                  className="text-navy underline hover:text-gold"
                >
                  harbourviewcompany@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
