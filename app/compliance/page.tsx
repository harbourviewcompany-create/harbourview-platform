import type { Metadata } from 'next'

import { complianceRegions } from '@/lib/compliance/regions'
import { coreComplianceDisclaimer } from '@/lib/compliance/disclaimers'
import { FooterCta, PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Compliance Pathways | Harbourview',
  description:
    'Public-safe compliance orientation and pathway intelligence for regulated cannabis operators. Informational only and not legal advice.',
}

export default function CompliancePage() {
  return (
    <>
      <PublicHero
        eyebrow="Compliance pathways"
        title="Public-safe orientation for regulated market access."
        actions={[
          { label: 'Request Compliance Support', href: '/compliance/request-support' },
          { label: 'Explore Regions', href: '#regions', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview organizes compliance pathway context for regulated cannabis operators, suppliers and commercial teams assessing cross-border routes, market entry and documentation expectations.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          This page is informational only. It does not provide legal advice, regulatory approval, import eligibility or a guaranteed commercial route.
        </p>
      </PublicHero>

      <PublicSection id="regions" tone="navy">
        <SectionHeader eyebrow="Regional orientation" title="Start with the relevant pathway context.">
          Public region pages provide controlled summaries and routing context. Detailed assessments remain subject to separate review.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {complianceRegions.map((region) => (
            <PublicLinkCard key={region.slug} href={`/compliance/regions/${region.slug}`} eyebrow="Compliance region" title={region.name}>
              {region.summary}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader eyebrow="Review standard" title="Compliance content is not transaction clearance." className="mb-0">
            Harbourview can help frame questions, identify pathway constraints and coordinate commercial review. Final legal, regulatory, licensing and import decisions remain with qualified professionals and competent authorities.
          </SectionHeader>

          <PublicCard className="p-6 sm:p-7">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
              Public disclaimer
            </p>
            <p className="text-sm leading-7 text-white/60">{coreComplianceDisclaimer}</p>
            <div className="mt-6 border-t border-gold/10 pt-5 text-xs leading-6 text-white/42">
              Public compliance pages intentionally avoid private counterparty details, unpublished evidence, contact data, pricing and internal Harbourview review notes.
            </div>
          </PublicCard>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Next step"
        title="Need a pathway reviewed before commercial engagement?"
        actions={[
          { label: 'Request Support', href: '/compliance/request-support' },
          { label: 'Contact Harbourview', href: '/contact', variant: 'secondary' },
        ]}
      >
        Submit context for Harbourview review before assuming eligibility, route viability or counterparty fit.
      </FooterCta>
    </>
  )
}
