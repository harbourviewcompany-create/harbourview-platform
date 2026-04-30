import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Signals',
  description:
    'Market monitoring and commercial signals for regulated industry participants. Pricing trends, supply shifts, and deal flow indicators.',
}

export default function SignalsPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="inline-block text-xs font-semibold uppercase tracking-widest bg-gold text-navy px-2 py-1 rounded mb-4">
            Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Signals</h1>
          <p className="text-gray-300 max-w-2xl">
            Market monitoring and commercial signals for serious participants
            in regulated markets.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="page-container max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Pricing Signals</h3>
              <p className="text-gray-500 text-sm">
                Indicative pricing data across equipment categories, cannabis
                inventory types, and service segments in regulated markets.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Supply Shifts</h3>
              <p className="text-gray-500 text-sm">
                Early indicators of supply tightening or surplus across key
                inventory and equipment categories.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Deal Flow</h3>
              <p className="text-gray-500 text-sm">
                Aggregated deal flow indicators from Harbourview&apos;s marketplace
                and introduction activity.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Market Commentary</h3>
              <p className="text-gray-500 text-sm">
                Periodic commentary on conditions in regulated markets from the
                Harbourview team.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-navy font-bold text-xl mb-3">Request Early Access</h2>
            <p className="text-gray-500 text-sm mb-6">
              Signals is in development. Submit an intake request to register
              interest and be contacted when the module launches.
            </p>
            <Link href="/intake" className="btn-primary px-8 py-3">
              Request Early Access
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
