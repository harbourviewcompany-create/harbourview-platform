import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Harbourview team.',
}

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Contact</h1>
          <p className="text-gray-300 max-w-xl">
            General enquiries, partnership discussions, or questions about a listing.
            We respond to all messages within one business day.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Submit a Listing</h2>
              <p className="text-sm text-gray-500 mb-4">
                To list equipment, inventory, services, or a business opportunity,
                use the dedicated intake form.
              </p>
              <a href="/intake" className="btn-primary text-sm">
                Go to Intake
              </a>
            </div>

            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Direct Email</h2>
              <p className="text-sm text-gray-500">
                You can also reach us directly at{' '}
                <a
                  href="mailto:info@harbourview.com"
                  className="text-navy underline hover:text-gold"
                >
                  info@harbourview.com
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
