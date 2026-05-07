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
      <section className="border-b border-gold/10 bg-[#071425] text-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">
            Contact
          </p>
          <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-5xl">
            Start a confidential Harbourview conversation.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
            Use the form for qualified opportunities, market-access support, reviewed introductions,
            intelligence requests, or confidential commercial inquiries. Harbourview reviews every
            submission before follow-up.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f6f8] py-10 sm:py-12 lg:py-14">
        <div className="page-container grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ContactForm />

          <aside className="space-y-5">
            <div className="card p-6 sm:p-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dark">
                Direct Contact
              </p>
              <h2 className="mb-3 text-lg font-semibold text-navy">Email Harbourview</h2>
              <p className="mb-4 text-sm leading-7 text-gray-600">
                For confidential inquiries and qualified opportunities:
              </p>
              <a
                href={CONTACT_MAILTO_HREF}
                className="break-all text-sm font-semibold text-navy underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-dark"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="card p-6 sm:p-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-dark">
                Review Standard
              </p>
              <h2 className="mb-3 text-lg font-semibold text-navy">Reviewed before follow-up</h2>
              <p className="text-sm leading-7 text-gray-600">
                Harbourview reviews inquiries before any response or routed introduction. Submission
                does not create a transaction, representation, buyer relationship, seller relationship,
                or obligation to introduce counterparties.
              </p>
            </div>

            <div className="rounded-sm border border-gold/20 bg-white p-6 text-xs leading-6 text-gray-500 shadow-sm">
              Do not submit emergency, legal, medical, or time-critical instructions through this form.
              Harbourview will respond only after review.
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
