import type { Metadata } from 'next'

import { ContentStatusNotice } from '@/components/ContentStatusNotice'
import { REGULATORY_SIGNALS_DISCLAIMER } from '@/lib/regulatory-signals/constants'
import { getPublicRegulatorySignalFeed } from '@/lib/regulatory-signals/public'
import { EmptyState, FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Cannabis Regulatory Signals — Policy & Market Change Monitoring',
  description:
    'Dated, source-backed regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled markets. Covers licensing, prescriptions, enforcement and trade.',
  openGraph: {
    title: 'Cannabis Regulatory Signals — Policy & Market Monitoring | Harbourview',
    description:
      'Dated, source-backed regulatory change monitoring for regulated cannabis, hemp/CBD and adjacent controlled markets. Covers licensing, prescriptions, enforcement and trade.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview Signals — Cannabis Regulatory Monitoring',
    description:
      'Source-backed regulatory signal monitoring for cannabis policy, licensing, import/export and enforcement changes in represented jurisdictions.',
  },
}

const monitoringLanes = [
  {
    title: 'Market-access movement',
    body: 'Reviewed changes that may affect import, licensing, registration, pharmacy, medical, industrial or professional access pathways.',
  },
  {
    title: 'Regulatory route context',
    body: 'Public-safe summaries that separate dated source material from Harbourview review, route interpretation and diligence work.',
  },
  {
    title: 'Commercial timing',
    body: 'Signals that help participants decide when to request a deeper country review before public listing, outreach or introduction activity.',
  },
] as const

const reviewControls = [
  'Published signals must pass public-safe review before display.',
  'Public cards show only approved fields and exclude sensitive contact, document, review and commercial context.',
  'Signal summaries are not legal advice, market entry clearance, transaction confirmation or route certainty.',
] as const

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export default async function SignalsPage() {
  const signalFeed = await getPublicRegulatorySignalFeed()
  const signals = signalFeed.signals
  const latestSignalDate = signals[0]?.signal_date ?? 'Review queue'
  const jurisdictionCount = new Set(signals.map((signal) => signal.country_name).filter(Boolean)).size
  const signalTypeCount = new Set(signals.map((signal) => signal.signal_type)).size

  return (
    <main>
      <PublicHero
        eyebrow="Harbourview Signals"
        title="Regulatory and policy change signals for controlled markets."
        actions={[
          { label: 'Request Early Access', href: '/intake' },
          { label: 'Intelligence Services', href: '/intelligence', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
              Public signal controls
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg font-semibold text-[#f4f1eb]">{signals.length}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Published</p>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg font-semibold text-[#f4f1eb]">{jurisdictionCount}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Markets</p>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                <p className="text-lg font-semibold text-[#f4f1eb]">{signalTypeCount}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Lanes</p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-6 text-white/48">Latest public signal date: {latestSignalDate}</p>
          </PublicCard>
        }
      >
        <p>
          Signals is in controlled early access. Dated, source-backed regulatory monitoring for cannabis market access,
          compliance strategy and commercial timing — built for operators who need to move on information before it
          becomes common knowledge.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Public summaries are informational only and do not guarantee market access, import eligibility, commercial routing or regulatory outcome.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <SectionHeader eyebrow="Monitoring lanes" title="What Harbourview watches before deeper market review." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {monitoringLanes.map((lane) => (
            <PublicCard key={lane.title} className="p-6">
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h2 className="mb-4 text-lg font-semibold text-[#f4f1eb]">{lane.title}</h2>
              <p className="text-sm leading-7 text-white/58">{lane.body}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <div className="mb-6">
              <ContentStatusNotice title={signalFeed.publicLabel} status={signalFeed.source === 'live-approved' ? 'admin-backed' : 'fallback-backed'} origin={signalFeed.source}>
                {signalFeed.reviewBoundary}
              </ContentStatusNotice>
            </div>

            <SectionHeader
              eyebrow="Published signals"
              title="Reviewed public summaries for market-access monitoring."
            />
            <div className="space-y-6">
              {signals.length === 0 ? (
                <EmptyState title="No published regulatory signals yet.">
                  Harbourview can review a country, policy update or commercial pathway on request.
                </EmptyState>
              ) : (
                signals.map((signal) => (
                  <PublicCard key={signal.id} className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-gold/72">
                      <span>{signal.country_name}</span>
                      <span aria-hidden="true">•</span>
                      <span>{formatLabel(signal.signal_type)}</span>
                      <span aria-hidden="true">•</span>
                      <span>{signal.signal_date}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-[#f4f1eb]">{signal.headline}</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 text-xs uppercase tracking-[0.16em] text-white/44 sm:grid-cols-3">
                      <span className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">Impact: {formatLabel(signal.impact_level)}</span>
                      <span className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">Confidence: {formatLabel(signal.confidence)}</span>
                      <span className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">Source: {formatLabel(signal.source_tier)}</span>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-white/66">{signal.public_summary}</p>
                    <div className="mt-4 rounded-sm border border-gold/10 bg-black/20 p-4 text-sm leading-7 text-white/56">
                      {signal.public_implication}
                    </div>
                    {signal.canonical_source_url && (
                      <a
                        href={signal.canonical_source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-gold underline decoration-gold/40 underline-offset-4"
                      >
                        Public source reference
                      </a>
                    )}
                  </PublicCard>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <PublicCard className="p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Publication standard
              </p>
              <ul className="space-y-3 text-sm leading-6 text-white/60">
                {reviewControls.map((control) => (
                  <li key={control} className="border-l border-gold/30 pl-4">
                    {control}
                  </li>
                ))}
              </ul>
            </PublicCard>
            <PublicCard muted className="p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Need deeper review?
              </p>
              <p className="text-sm leading-7 text-white/56">
                Use confidential intake for country-specific questions, sensitive commercial context, document review or route-dependent diligence before acting on a public signal.
              </p>
              <a href="/intake" className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:text-gold-light">
                Start confidential intake
              </a>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Get early access"
        title="Need a dated, source-backed signal assessed?"
        actions={[{ label: 'Request Early Access', href: '/intake' }, { label: 'Contact Harbourview', href: '/contact', variant: 'secondary' }]}
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
