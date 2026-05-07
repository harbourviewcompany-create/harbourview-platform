import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import ContactForm from './ContactForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Contact Harbourview',
  description:
    'Contact Harbourview for confidential commercial inquiries, qualified opportunities, market-access support, and reviewed introductions.',
}

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <p className="text-gold text-sm uppercase tracking-[0.22em] mb-3">Contact</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Contact Harbourview</h1>
          <p className="text-gray-300 max-w-2xl">
            For confidential commercial inquiries, qualified opportunities, and controlled
            introductions, contact Harbourview through the form below or by direct email.
          </p>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="page-container grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="card p-6 sm:p-8">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Direct Contact</h2>
              <p className="text-sm text-gray-500 mb-3">
                For confidential inquiries and qualified opportunities:
              </p>
              <a
                href={CONTACT_MAILTO_HREF}
                className="text-navy underline hover:text-gold text-sm"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="card p-6">
              <h2 className="text-navy font-semibold text-base mb-3">Review Standard</h2>
              <p className="text-sm text-gray-500">
                Harbourview reviews inquiries before follow-up. Submission does not create a
                transaction, representation, or obligation to introduce counterparties.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
