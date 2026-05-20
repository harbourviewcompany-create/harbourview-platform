import type { Metadata } from 'next'
import {
  FooterCta,
  PublicCard,
  PublicHero,
  PublicLinkCard,
  PublicSection,
  SectionHeader,
} from '@/components/PublicUi'
import { marketplaceCategoryCapabilityMap } from '@/lib/marketplace/categoryCapabilityMap'
import { MARKETPLACE_CONFIDENTIALITY_INTRO_CAVEAT } from '@/lib/content/complianceCopy'

export const metadata: Metadata = {
  title: 'Network | Harbourview',
  description:
    'Harbourview Network is a controlled commercial network for regulated cannabis products, inputs, services, wanted requests, qualified introductions and country-specific access pathways.',
  openGraph: {
    title: 'Harbourview Network',
    description:
      'A controlled commercial network for regulated cannabis products, inputs, services, wanted requests, qualified introductions and country-specific access pathways.',
  },
}

const processCards = [
  {
    title: 'Operators submit',
    body: 'Operators submit products, assets, services, wanted requests or commercial opportunities for Harbourview review. Publication and introductions are not automatic.',
  },
  {
    title: 'Buyers and suppliers inquire',
    body: 'Participants browse public summaries and submit inquiries through Harbourview. Public pages do not expose private contact details or sensitive commercial context.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Harbourview reviews category fit, commercial relevance and routing context before any counterparty contact, response or introduction is coordinated.',
  },
  {
    title: 'Private routing follows',
    body: 'Introductions, availability, pricing, transaction terms and legal or regulatory requirements remain subject to separate review and agreement by the relevant parties.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <PublicHero
        eyebrow="Harbourview Network"
        title="Controlled commercial access for reviewed opportunities and requests."
        actions={[
          { label: 'Submit Opportunity', href: '/marketplace/sell' },
          { label: 'Explore Categories', href: '#categories', variant: 'secondary' },
          { label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview Network connects qualified participants through reviewed opportunities, wanted requests, qualified introductions, commercial intelligence and relationship-led market access.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          {`${MARKETPLACE_CONFIDENTIALITY_INTRO_CAVEAT} Submissions do not guarantee availability, transaction terms or regulatory outcomes.`}
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader
          eyebrow="Controlled network workflow"
          title="Review and qualification before introduction."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {processCards.map((card) => (
            <PublicCard key={card.title} className="p-6">
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h3 className="mb-4 text-lg font-semibold text-[#f4f1eb]">{card.title}</h3>
              <p className="text-sm leading-7 text-white/58">{card.body}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection id="categories" tone="navy">
        <SectionHeader
          eyebrow="Network categories"
          title="Explore reviewed commercial access categories."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {marketplaceCategoryCapabilityMap.map((cat) => (
            <PublicLinkCard key={cat.route} href={cat.route} title={cat.label}>
              <span className="block text-white/66">{cat.privateBoundary}</span>
              <span className="mt-4 inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                {cat.publicLabel}
              </span>
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Submit to Harbourview"
        title="Have an opportunity, introduction request or wanted request to submit?"
        actions={[
          { label: 'Submit Opportunity', href: '/marketplace/sell' },
          { label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        Submit supply, services, business opportunities, buyer requirements or introduction requests for Harbourview Network review. Public visibility and routing are not automatic.
      </FooterCta>
    </>
  )
}
