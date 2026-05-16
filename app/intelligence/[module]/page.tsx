import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EmptyState, FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { intelligenceModules } from '@/lib/institutional/content'

const moduleContent: Record<string, {
  title: string
  eyebrow: string
  description: string
  disclaimer: string
  focusAreas: string[]
}> = {
  'country-briefs': {
    eyebrow: 'Country intelligence',
    title: 'Country Briefs',
    description:
      'Reviewed public-safe country context for access models, commercial maturity, pathway considerations and opportunity categories.',
    disclaimer:
      'Country briefs are directional context only. They do not confirm route availability, licensing eligibility, counterparties, import approval, legal advice or commercial demand.',
    focusAreas: [
      'Market access model and relevant public pathway context',
      'Commercial maturity and participant categories',
      'High-level route constraints and review questions',
      'Public-safe next steps before private review',
    ],
  },
  'licensing-pathways': {
    eyebrow: 'Licensing and market entry',
    title: 'Licensing Pathways',
    description:
      'Country-level explainers for licensing structures, importer and distributor roles, dispensing models and documentation expectations.',
    disclaimer:
      'Licensing pathway content is educational. Harbourview does not represent licence grant, regulator approval or legal interpretation on public pages.',
    focusAreas: [
      'Importer, distributor, pharmacy and operator role framing',
      'Public documentation expectations and pathway questions',
      'Jurisdiction-sensitive review boundaries',
      'When to request professional or regulatory review',
    ],
  },
  'regulatory-pathways': {
    eyebrow: 'Regulatory pathway context',
    title: 'Regulatory Pathways',
    description:
      'Structured pathway context for regulated market access, public-health safeguards and authority-facing considerations.',
    disclaimer:
      'Regulatory pathway content is neutral orientation only and is not official guidance, legal advice or government endorsement.',
    focusAreas: [
      'Access model comparison and public-health safeguards',
      'Regulated-market documentation and conduct questions',
      'Market-entry caution areas',
      'Signals that may require private review before action',
    ],
  },
  'counterparty-intelligence': {
    eyebrow: 'Counterparty intelligence',
    title: 'Counterparty Intelligence',
    description:
      'Public-safe framing for reviewed counterparty discovery, confidential routing and private source-material handling.',
    disclaimer:
      'Harbourview does not publish confidential counterparty identities, private source materials, analyst notes, contact details or transaction-sensitive information on public pages.',
    focusAreas: [
      'Role fit, seriousness and commercial readiness signals',
      'Private source and evidence handling boundaries',
      'Reviewed-introduction requirements',
      'Controlled escalation from public inquiry to private review',
    ],
  },
  'logistics-trade-routes': {
    eyebrow: 'Logistics and trade route context',
    title: 'Logistics & Trade Routes',
    description:
      'Education on controlled logistics, chain of custody, route feasibility, documentation and shipment risk considerations.',
    disclaimer:
      'Trade-route content does not confirm shipment feasibility, customs clearance, import/export eligibility or logistics provider availability.',
    focusAreas: [
      'Chain-of-custody and documentation concepts',
      'Route feasibility questions before engagement',
      'Public-safe shipment risk framing',
      'When logistics review must move into private workflow',
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(moduleContent).map((module) => ({ module }))
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module } = await params
  const content = moduleContent[module]

  if (!content) {
    return {
      title: 'Intelligence Module | Harbourview',
    }
  }

  return {
    title: `${content.title} | Harbourview Intelligence`,
    description: content.description,
  }
}

export default async function IntelligenceModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const content = moduleContent[module]

  if (!content) notFound()

  const matchingModule = intelligenceModules.find((item) => item.href?.endsWith(`/${module}`))

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow={content.eyebrow}
        title={content.title}
        actions={[
          { label: 'Request Intelligence Brief', href: '/contact' },
          { label: 'Back to Intelligence', href: '/intelligence', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-5 text-sm leading-7 text-white/58">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
              Publication boundary
            </p>
            <p>{content.disclaimer}</p>
          </PublicCard>
        }
      >
        <p>{content.description}</p>
        {matchingModule ? <p className="mt-4 text-sm leading-7 text-white/52">{matchingModule.description}</p> : null}
      </PublicHero>

      <PublicSection tone="navy">
        <SectionHeader
          eyebrow="Public module structure"
          title="This section establishes the public route and review boundary."
        >
          Deeper analyst material, source evidence, counterparty detail and private workflow records remain outside the public surface.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {content.focusAreas.map((area) => (
            <PublicCard key={area} className="p-6 text-sm leading-7 text-white/62">
              {area}
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <EmptyState
          title="Private review is required before route-specific action."
          action={{ label: 'Request Review', href: '/contact' }}
        >
          Harbourview can review country, counterparty, documentation, logistics and regulatory context before any commercial routing, publication, buyer outreach or introduction workflow.
        </EmptyState>
      </PublicSection>

      <FooterCta
        eyebrow="Controlled intelligence request"
        title="Move from public context to reviewed private workflow."
        actions={[{ label: 'Contact Harbourview', href: '/contact' }]}
      >
        Submit the country, product category, counterparty type or route question that requires review.
      </FooterCta>
    </main>
  )
}
