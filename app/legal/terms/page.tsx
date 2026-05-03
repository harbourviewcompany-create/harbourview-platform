import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Harbourview terms of use — conditions governing access to and use of this platform.',
}

export default function TermsPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms of Use</h1>
          <p className="text-gray-300 max-w-2xl">
            Conditions governing access to and use of the Harbourview platform
            and its associated services.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          <div className="card p-8 space-y-6 text-sm text-gray-600 leading-relaxed">
            <p>
              By accessing this website you agree to the following terms. If you
              do not agree, please do not use this platform.
            </p>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Use of the Platform</h2>
              <p>
                This platform is provided for legitimate commercial purposes
                within regulated markets. Users must not submit false, misleading,
                or unlawful content. Harbourview reserves the right to decline or
                remove any submission at its discretion.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Introductions and Listings</h2>
              <p>
                Harbourview facilitates introductions and publishes reviewed
                listings but does not act as a broker, agent, or party to any
                transaction. All commercial arrangements are made directly
                between counterparties. Harbourview accepts no liability for
                transactions arising from introductions or listed opportunities.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Regulatory Compliance</h2>
              <p>
                Users are solely responsible for ensuring their activities comply
                with applicable laws and regulations in their jurisdiction. Cannabis
                and regulated-industry transactions may be subject to licensing
                requirements. Harbourview does not provide legal or compliance advice.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Intellectual Property</h2>
              <p>
                All content on this platform is the property of Harbourview or
                its contributors. Reproduction without permission is prohibited.
              </p>
            </div>

            <div>
              <h2 className="text-navy font-semibold text-base mb-2">Changes to Terms</h2>
              <p>
                These terms may be updated at any time. Continued use of the
                platform constitutes acceptance of the current terms.
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
