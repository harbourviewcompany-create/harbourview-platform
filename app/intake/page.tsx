import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import ConfidentialIntakeForm from './ConfidentialIntakeForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Confidential Intake',
  description:
    'Submit a confidential Harbourview inquiry for market access, commercial intelligence, and qualified introductions.',
}

export default function IntakePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Confidential Intake</h1>
          <p className="text-gray-300 max-w-2xl">
            Share qualified opportunities, commercial requirements, or confidential market-access inquiries. Harbourview reviews submissions before follow-up.
          </p>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="page-container grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="card p-6 sm:p-8">
            <ConfidentialIntakeForm />
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
          </aside>
        </div>
      </section>
    </>
  )
}
