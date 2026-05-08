import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import { FormShell, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
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
      <PublicHero
        eyebrow="Contact Harbourview"
        title="Start a confidential Harbourview conversation"
        compact
        aside={
          <PublicCard className="p-6">
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
          </PublicCard>
        }
      >
        <p>
          Use this page for qualified opportunities, wanted requests, intelligence questions, market-access support and confidential commercial routing.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Harbourview reviews inquiries before follow-up or counterparty contact.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <FormShell>
            <ContactForm />
          </FormShell>

          <aside className="space-y-6">
            <PublicCard className="p-6">
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
            </PublicCard>

            <PublicCard muted className="p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Review standard
              </p>
              <p className="text-sm leading-7 text-white/56">
                Harbourview reviews inquiries before follow-up. Submission does not create a transaction, representation or obligation to introduce counterparties. Availability, pricing, transaction terms and legal or regulatory outcomes remain subject to separate review.
              </p>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>
    </>
  )
}
