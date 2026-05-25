import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Terms of Use | Harbourview',
  description: 'Harbourview terms of use — conditions governing access to and use of this platform.',
}

export default function TermsPage() {
  return (
    <>
      <PublicHero eyebrow="Legal" title="Terms of Use" compact>
        <p className="text-white/62">Conditions governing access to and use of the Harbourview platform and its associated services.</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-2xl">
          <PublicCard className="p-8 sm:p-10">
            <div className="space-y-8 text-sm leading-8 text-white/62">
              <p>By accessing this website you agree to the following terms. If you do not agree, please do not use this platform.</p>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Use of the Platform</h2>
                <p>This platform is provided for legitimate commercial purposes within regulated markets. Users must not submit false, misleading, or unlawful content. Harbourview reserves the right to decline or remove any submission at its discretion.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Introductions and Listings</h2>
                <p>Harbourview facilitates introductions and publishes reviewed listings but does not act as a broker, agent, or party to any transaction. All commercial arrangements are made directly between counterparties. Harbourview accepts no liability for transactions arising from introductions or listed opportunities.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Regulatory Compliance</h2>
                <p>Users are solely responsible for ensuring their activities comply with applicable laws and regulations in their jurisdiction. Cannabis and regulated-industry transactions may be subject to licensing requirements. Harbourview does not provide legal or compliance advice.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Intellectual Property</h2>
                <p>All content on this platform is the property of Harbourview or its contributors. Reproduction without permission is prohibited.</p>
              </section>
              <section>
                <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Changes to Terms</h2>
                <p>These terms may be updated at any time. Continued use of the platform constitutes acceptance of the current terms.</p>
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
