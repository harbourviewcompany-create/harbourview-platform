import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Disclaimer | Harbourview',
  description: 'Harbourview disclaimer — limitations of liability and scope of services.',
}

export default function DisclaimerPage() {
  return (
    <>
      <PublicHero eyebrow="Legal" title="Disclaimer" compact>
        <p className="text-white/62">Limitations of liability and scope of services provided through this platform.</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-2xl">
          <PublicCard className="p-8 sm:p-10">
            <div className="space-y-8 text-sm leading-8 text-white/62">
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">No Transaction Involvement</h2>
                <p>Harbourview is a market-access and intelligence platform. We facilitate introductions and publish reviewed listings but are not a party to, and accept no liability for, any commercial transaction between users of this platform.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">No Investment or Legal Advice</h2>
                <p>Nothing on this platform constitutes investment, legal, financial, or regulatory advice. Market data, signals, and intelligence materials are provided for informational purposes only. Users should seek independent professional advice before making commercial decisions.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Accuracy of Listings</h2>
                <p>While Harbourview reviews submissions before publication, we make no representations or warranties regarding the accuracy, completeness, or fitness for purpose of any listed content. Buyers should conduct their own due diligence.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Regulatory Jurisdiction</h2>
                <p>Cannabis and other regulated-industry activities are subject to varying legal frameworks across jurisdictions. Harbourview does not represent that any listed activity is lawful in any particular jurisdiction. Users are solely responsible for their own regulatory compliance.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Limitation of Liability</h2>
                <p>To the fullest extent permitted by law, Harbourview accepts no liability for any loss, damage, or claim arising from use of this platform, reliance on listed content, or transactions conducted between counterparties introduced through this service.</p>
              </section>
              <p className="text-xs text-white/30">Last reviewed: 2025.</p>
            </div>
          </PublicCard>
          <div className="mt-8 flex gap-4">
            <Link href="/" className="btn-intelligence text-sm">← Back to Home</Link>
          </div>
        </div>
      </PublicSection>
    </>
  )
}
