import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import { FormShell, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import ContactForm from './ContactForm'

// Static: no server data on this page — the form is a client component.

export const metadata: Metadata = {
  title: 'Contact Harbourview — Confidential Cannabis Market Inquiries',
  description:
    'Submit confidential inquiries for market-access intelligence, reviewed commercial opportunities, counterparty introductions and cannabis pathway review.',
  openGraph: {
    title: 'Contact Harbourview — Confidential Cannabis Market Inquiries',
    description:
      'Submit confidential inquiries for market-access intelligence, reviewed commercial opportunities, counterparty introductions and cannabis pathway review.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Harbourview',
    description:
      'Confidential intake for market access, commercial opportunities, intelligence requests and counterparty introductions.',
  },
}

const contactPaths = [
  'Exchange submissions and wanted requests',
  'Commercial intelligence and country pathway review',
  'Supplier, buyer or service-provider routing questions',
  'Confidential opportunities requiring controlled review',
  'Export or import pathway questions where public sources don\'t give you a clear answer',
]

export default function ContactPage() {
  return (
    <>
      <PublicHero
        eyebrow="Contact Harbourview"
        title="Send Harbourview a message. We review everything."
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
          This is the right place to send qualified opportunities, intelligence questions, market-access requests,
          and confidential commercial inquiries. Every submission is reviewed before any follow-up or counterparty
          contact is made.
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
                What are you working on?
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
                Harbourview reviews every inquiry before follow-up. Submitting a message does not create a transaction,
                representation, or obligation on either side. Availability, pricing, transaction terms and legal or
                regulatory outcomes are subject to separate commercial review.
              </p>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>
    </>
  )
}
