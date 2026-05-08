import type { Metadata } from 'next'
import Link from 'next/link'

import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { EmptyState, FooterCta, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Signals | Harbourview',
  description:
    'Global policy and regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled-market pathways.',
}

export default async function SignalsPage() {
  const signals = await getPublicRegulatorySignals()

  return (
    <main>
      <PublicHero
        eyebrow="Harbourview Signals"
        title="Regulatory and policy change signals for controlled markets."
        actions={[
          { label: 'Request Signal Review', href: '/contact' },
          { label: 'Intelligence Services', href: '/intelligence', variant: 'secondary' },
        ]}
      >
        <p>
          Source-backed monitoring for regulated cannabis, hemp/CBD and adjacent controlled-market pathways.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Public summaries are informational only and do not guarantee market access, import eligibility or regulatory outcome.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="space-y-6">
          {signals.length === 0 ? (
            <EmptyState title="No published regulatory signals yet.">
              Harbourview can review a country, policy update or commercial pathway on request.
            </EmptyState>
          ) : (
            signals.map((signal) => (
              <PublicCard key={signal.id} className="p-6">
                <h2 className="text-lg font-semibold text-[#f4f1eb]">{signal.headline}</h2>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/66">
                  {signal.country_name} • {signal.signal_type} • {signal.signal_date}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/66">{signal.public_summary}</p>
                <p className="mt-3 text-sm leading-7 text-white/50">{signal.public_implication}</p>
                {signal.canonical_source_url && (
                  <a
                    href={signal.canonical_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-gold underline decoration-gold/40 underline-offset-4"
                  >
                    View source
                  </a>
                )}
              </PublicCard>
            ))
          )}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Request signals access"
        title="Need a dated, source-backed signal assessed?"
        actions={[{ label: 'Request Review', href: '/contact' }]}
      >
        Request review for market access, compliance strategy, commercial timing or country-specific pathway monitoring.
      </FooterCta>

      <PublicSection tone="navy" className="pt-0">
        <PublicCard muted className="p-5 text-xs leading-6 text-white/44">
          {REGULATORY_SIGNALS_DISCLAIMER}
        </PublicCard>
      </PublicSection>
    </main>
  )
}
