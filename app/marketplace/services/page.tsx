import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Processing Services | Harbourview Exchange',
  description: 'Reviewed extraction, remediation, infusion, enrichment, testing, manufacturing and related regulated-market service capacity.',
}

const serviceTypes = [
  ['Extraction', 'CO₂, ethanol and other reviewed extraction capacity.'],
  ['THC remediation / washdown', 'Processing services with batch, method and capacity terms.'],
  ['Infusion', 'Commercial infusion capacity with formulation and market constraints.'],
  ['Enrichment', 'Cannabinoid enrichment and related plant-material processing.'],
  ['Distillation / isolation', 'Downstream distillate, isolate and concentrate production.'],
  ['Lab testing', 'Reviewed analytical and quality-testing service pathways.'],
  ['Manufacturing', 'Bulk and finished-format manufacturing capacity.'],
  ['White label / private label', 'Commercial production and brand-ready supply pathways.'],
]

export default function ServicesCategoryPage() {
  return (
    <>
      <PublicHero
        eyebrow="Exchange — Services"
        title="Buy processing capacity with the same commercial clarity as inventory."
        actions={[
          { label: 'Browse Service Capacity', href: '/marketplace/trading?category=service' },
          { label: 'Submit a Service', href: '/marketplace/sell/service', variant: 'secondary' },
          { label: 'Request a Service', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>Reviewed service dossiers can publish process, facility market, capacity, turnaround, minimum batch, jurisdictions served, volume pricing, certifications and approved supporting documents.</p>
        <p className="mt-4 text-sm leading-7 text-white/54">Provider identity, private facility evidence and transaction-sensitive terms stay controlled until Harbourview routes a qualified introduction.</p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Processing market" title="Commercial service categories." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceTypes.map(([title, description]) => (
            <PublicCard key={title} className="p-5">
              <h2 className="text-sm font-semibold text-[#f5f1e8]">{title}</h2>
              <p className="mt-2 text-xs leading-6 text-white/45">{description}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <PublicCard className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Buyer-ready service dossier</p>
            <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">Capacity and economics should be visible before the introduction.</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">Where approved, Harbourview can publish minimum batch, daily or monthly capacity, turnaround, process details, input/output constraints, quantity-price tiers, relevant standards and public documents so buyers can screen fit before using operator time.</p>
          </PublicCard>
          <PublicCard className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Demand side</p>
            <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">Can't find the capacity you need?</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">Post the exact process, input quantity, jurisdiction, timing, documentation and budget requirement. Harbourview can route matching providers privately.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/marketplace/sell?type=wanted" className="btn-marketplace">Post service requirement</Link>
              <Link href="/marketplace/trading?category=service" className="btn-outline">Browse services</Link>
            </div>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
