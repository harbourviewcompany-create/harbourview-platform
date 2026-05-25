import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Market access backed by intelligence and relationships',
  description:
    'Harbourview is a controlled-market platform connecting reviewed marketplace pathways, intelligence and confidential routing for qualified commercial participants.',
}

const pathways = [
  {
    title: 'Marketplace',
    body: 'Reviewed public listings and wanted demand with controlled introductions and private inquiry handling.',
    cta: '/marketplace',
  },
  {
    title: 'Signals',
    body: 'Policy and regulatory movement monitored for timing, route awareness and commercial planning.',
    cta: '/signals',
  },
  {
    title: 'Intelligence',
    body: 'Country and route-focused intelligence workflows for discreet, high-context market access decisions.',
    cta: '/intelligence',
  },
]

export default function HomePage() {
  return (
    <main>
      <PublicHero
        eyebrow="Harbourview"
        title="Market access backed by intelligence and relationships."
        actions={[
          { label: 'Enter Marketplace', href: '/marketplace' },
          { label: 'Open Intelligence', href: '/intelligence', variant: 'secondary' },
          { label: 'Confidential Intake', href: '/intake', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview is a premium, controlled-market environment for serious commercial participants.
          Public pages provide reviewed summaries only; introductions, counterparty details and sensitive
          context remain private.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Designed for discreet cross-border activity where trust, compliance posture and commercial timing
          matter as much as opportunity quality.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pathways.map((item) => (
            <PublicCard key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Entry pathway</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
              <a href={item.cta} className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                Continue
              </a>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Commercial routing"
        title="Buyer, seller and intelligence flows coordinated through controlled review."
        actions={[
          { label: 'Submit Opportunity', href: '/marketplace/sell' },
          { label: 'Create Wanted Request', href: '/marketplace/wanted', variant: 'secondary' },
        ]}
      >
        Harbourview protects confidentiality and does not publish private contacts, transaction terms, source
        evidence or internal review notes on public surfaces.
      </FooterCta>
    </main>
  )
}
