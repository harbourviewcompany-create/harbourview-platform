import type { Metadata } from 'next'
import { TradingSupplyIntakeForm } from '@/components/marketplace/TradingSupplyIntakeForm'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Submit Wholesale Cannabis Supply | Harbourview Exchange',
  description: 'Submit a structured wholesale cannabis lot with stock, analytical, logistics, pricing and document information for Harbourview review.',
}

export default function CannabisTradingIntakePage() {
  return (
    <>
      <PublicHero eyebrow="Exchange — Wholesale Cannabis Intake" title="Submit a transaction-ready cannabis lot for governed review." compact>
        <p>Capture stock quantity, product form, cannabinoid profile, shipping territories, volume pricing, COAs, images and availability in the format buyers need to evaluate supply.</p>
        <p className="mt-4 text-sm leading-7 text-white/54">Everything remains private at intake. Harbourview decides which approved commercial fields can enter the public trade dossier and keeps seller identity, licence evidence and private provenance controlled.</p>
      </PublicHero>
      <PublicSection tone="navy">
        <div className="mx-auto max-w-5xl">
          <PublicCard className="mb-6 p-5 text-sm leading-7 text-white/58">
            <span className="font-semibold text-white/75">Review contract:</span> submission is not publication. Public visibility, sample routing, document release and buyer introduction remain separate operator-reviewed actions.
          </PublicCard>
          <TradingSupplyIntakeForm mode="cannabis" />
        </div>
      </PublicSection>
    </>
  )
}
