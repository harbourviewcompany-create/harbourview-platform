import type { Metadata } from 'next'

import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import {
  ButtonLink,
  IntelligenceSignalCard,
  PageHero,
  SectionFrame,
  SectionHeader,
  Surface,
} from '@/components/design-system/Institutional'

export const metadata: Metadata = {
  title: 'Signals | Harbourview',
  description:
    'Global policy and regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled-market pathways.',
}

export default async function SignalsPage() {
  const signals = await getPublicRegulatorySignals()

  return (
    <main className="bg-[#020814] text-white">
      <PageHero
        eyebrow="Harbourview Signals"
        title="Regulatory and policy movement translated into public-safe commercial context."
        primary={{ label: 'Request Signal Review', href: '/intake' }}
        secondary={{ label: 'Intelligence Atlas', href: '/intelligence' }}
        compact
      >
        <p>
          Signals summarize dated regulatory movement and public commercial implication. They do not publish private evidence, guarantee access or replace jurisdiction-specific legal review.
        </p>
      </PageHero>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Published signals" title="Public signal cards must be narrow, dated and implication-led.">
          <p>
            A signal should tell the user what moved, where it moved, why it matters and how to request controlled review without implying live access or private counterparty certainty.
          </p>
        </SectionHeader>
        {signals.length === 0 ? (
          <Surface tone="panel" className="rounded-[1.75rem] p-8 text-center">
            <h2 className="font-serif text-2xl tracking-[-0.03em] text-white">No published regulatory signals yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
              Harbourview can review a country, policy update or commercial pathway on request.
            </p>
            <div className="mt-6">
              <ButtonLink href="/intake">Request Review</ButtonLink>
            </div>
          </Surface>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {signals.map((signal) => (
              <IntelligenceSignalCard
                key={signal.id}
                eyebrow={`${signal.country_name} / ${signal.signal_type.replace(/_/g, ' ')}`}
                title={signal.headline}
                meta={signal.signal_date}
                href="/intake"
              >
                <p>{signal.public_summary}</p>
                <div className="mt-4 rounded-2xl border border-gold/12 bg-black/20 p-4 text-xs leading-6 text-white/52">
                  {signal.public_implication}
                </div>
                {signal.canonical_source_url ? (
                  <a
                    href={signal.canonical_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-gold underline decoration-gold/40 underline-offset-4"
                  >
                    View public source
                  </a>
                ) : null}
              </IntelligenceSignalCard>
            ))}
          </div>
        )}
      </SectionFrame>

      <SectionFrame tone="editorial">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <SectionHeader eyebrow="Signal review" title="Need a dated, source-backed signal assessed?" className="mb-0">
            <p>
              Request review for market access, compliance strategy, commercial timing or country-specific pathway monitoring.
            </p>
          </SectionHeader>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/intake">Request Review</ButtonLink>
            <ButtonLink href="/intelligence" variant="secondary">Open Intelligence</ButtonLink>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="deep" className="pt-0">
        <Surface tone="panel" className="rounded-[1.5rem] p-5 text-xs leading-6 text-white/48">
          {REGULATORY_SIGNALS_DISCLAIMER}
        </Surface>
      </SectionFrame>
    </main>
  )
}
