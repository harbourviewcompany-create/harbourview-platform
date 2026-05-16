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
    <main className="bg-[#020814] text-white">
      <section className="border-b border-gold/10 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(2,8,20,1)_100%)] py-16 sm:py-20">
        <div className="page-container grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.34fr)] lg:items-end">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/74">
              Reviewed confidential intake
            </p>
            <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.05em] text-[#f5f1e8] sm:text-6xl lg:text-7xl">
              Start a confidential Harbourview conversation.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
              Share qualified opportunities, commercial requirements or confidential market-access inquiries. Harbourview reviews submissions before follow-up, routing or counterparty contact.
            </p>
          </div>

          <aside className="rounded-sm border border-gold/14 bg-[#071425]/78 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
              Direct contact
            </p>
            <a href={CONTACT_MAILTO_HREF} className="text-sm font-semibold text-[#f5f1e8] underline decoration-gold/50 underline-offset-4 hover:text-gold sm:text-base">
              {CONTACT_EMAIL}
            </a>
            <p className="mt-4 text-sm leading-7 text-white/56">
              Contact details submitted to Harbourview are not displayed publicly.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-[#f6f7f9] py-12 text-navy sm:py-16">
        <div className="page-container grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-[0_18px_48px_rgba(7,20,37,0.08)] sm:p-6 lg:p-8">
            <ConfidentialIntakeForm />
          </div>

          <aside className="rounded-sm border border-gray-200 bg-white p-6 shadow-[0_18px_48px_rgba(7,20,37,0.08)]">
            <h2 className="text-base font-semibold text-navy">Suitable inquiries</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-gray-500">
              <li>Harbourview Network submissions and wanted requests</li>
              <li>Country intelligence or market-access questions</li>
              <li>Qualified commercial introductions</li>
              <li>Regulatory, quality, clinical or institutional routing requests</li>
            </ul>
            <div className="mt-6 rounded-sm border border-gold/20 bg-gold/10 p-4 text-xs leading-6 text-navy/70">
              Public pages remain discovery-only. Sensitive commercial, regulatory and counterparty details stay inside reviewed workflows.
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
