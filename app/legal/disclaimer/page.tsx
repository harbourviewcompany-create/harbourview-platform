import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Harbourview disclaimer — limitations of liability and scope of services provided through this platform.',
}

export default function DisclaimerPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Disclaimer</h1>
          <p className="text-gray-300 max-w-2xl">
            Limitations of liability and scope of services provided through
            the Harbourview platform.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          <div className="card p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-navy font-semibold text-base mb-2">No Transaction Involvement</h2>
              <p>
                Harbourview is a market-access and intelligence platform. We
                facilitate introductions and publish reviewed listings but are not
                a party to, and accept no liability for, any commercial transaction
                between users of this platform.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">No Investment or Legal Advice</h2>
              <p>
                Nothing on this platform constitutes investment, legal, financial,
                or regulatory advice. Market data, signals, and intelligence
                materials are provided for informational purposes only. Users
                should seek independent professional advice before making
                commercial decisions.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Accuracy of Listings</h2>
              <p>
                While Harbourview reviews submissions before publication, we make
                no representations or warranties regarding the accuracy,
                completeness, or fitness for purpose of any listed content.
                Buyers should conduct their own due diligence.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Regulatory Jurisdiction</h2>
              <p>
                Cannabis and other regulated-industry activities are subject to
                varying legal frameworks across jurisdictions. Harbourview does
                not represent that any listed activity is lawful in any particular
                jurisdiction. Users are solely responsible for their own
                regulatory compliance.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Harbourview accepts no
                liability for any loss, damage, or claim arising from use of
                this platform, reliance on listed content, or transactions
                conducted between counterparties introduced through this service.
              </p>
            </div>

            <p className="text-xs text-gray-400">Last reviewed: 2025.</p>
          </div>

          <div className="mt-8">
            <Link href="/" className="btn-outline text-sm px-6 py-2.5">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
