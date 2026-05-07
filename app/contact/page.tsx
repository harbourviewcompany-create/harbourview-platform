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

const contactPaths = [
  'Harbourview Network submissions and wanted requests',
  'Commercial intelligence and country pathway review',
  'Supplier, buyer or service-provider routing questions',
  'Confidential opportunities requiring controlled review',
]

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
                Contact Harbourview
              </p>
              <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Start with a controlled commercial inquiry.
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
                Use this page for qualified opportunities, wanted requests,
                intelligence questions, market-access support and confidential
                commercial routing. Harbourview reviews inquiries before follow-up
                or counterparty contact.
              </p>
            </div>

            <aside className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Direct email
              </p>
              <a
                href={CONTACT_MAILTO_HREF}
                className="break-all text-base font-semibold text-[#f4f1eb] underline decoration-gold/40 underline-offset-4 hover:text-gold"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-4 text-sm leading-7 text-white/54">
                Contact details submitted to Harbourview are not displayed publicly.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-12 sm:py-16">
        <div className="page-container grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="rounded-sm border border-gold/10 bg-[#071425] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-7">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Suitable inquiries
              </p>
              <ul className="space-y-3 text-sm leading-6 text-white/60">
                {contactPaths.map((path) => (
                  <li key={path} className="border-l border-gold/30 pl-4">
                    {path}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-gold/10 bg-[#071425] p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Review standard
              </p>
              <p className="text-sm leading-7 text-white/56">
                Harbourview reviews inquiries before follow-up. Submission does not
                create a transaction, representation or obligation to introduce
                counterparties. Availability, pricing, transaction terms and legal or
                regulatory outcomes remain subject to separate review.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
