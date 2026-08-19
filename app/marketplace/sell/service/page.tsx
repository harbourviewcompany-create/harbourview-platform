import type { Metadata } from 'next'
import { TradingSupplyIntakeForm } from '@/components/marketplace/TradingSupplyIntakeForm'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Submit Processing Service | Harbourview Exchange',
  description: 'Submit extraction, remediation, infusion, enrichment, testing or other regulated-market processing capacity for Harbourview review.',
}

export default function ServiceTradingIntakePage() {
  return (
    <>
      <PublicHero eyebrow="Exchange — Commercial Service Intake" title="Publish processing capacity as a buyer-ready commercial service." compact>
        <p>Capture process, capacity, turnaround, minimum batch, jurisdictions served, volume pricing, certifications and supporting documents for Harbourview review.</p>
        <p className="mt-4 text-sm leading-7 text-white/54">Provider identity and private evidence remain controlled until Harbourview determines that a qualified introduction is appropriate.</p>
      </PublicHero>
      <PublicSection tone="navy">
        <div className="mx-auto max-w-5xl">
          <PublicCard className="mb-6 p-5 text-sm leading-7 text-white/58">
            <span className="font-semibold text-white/75">Commercial standard:</span> a service listing should give a buyer enough operating detail to assess fit before an introduction—without exposing confidential provider or facility information prematurely.
          </PublicCard>
          <TradingSupplyIntakeForm mode="service" />
        </div>
      </PublicSection>
    </>
  )
}
