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
import { MARKETPLACE_CONFIDENTIALITY_CAVEAT } from '@/lib/content/complianceCopy'

export const metadata: Metadata = {
  title: 'Exchange | Harbourview',
  description:
    'Harbourview Exchange is a controlled commercial request-routing layer for regulated market categories, inputs, services, wanted requests, and reviewed private intake. Public pages show safe summaries only; routing is not automatic.',
  openGraph: {
    title: 'Harbourview Exchange',
    description:
      'A controlled commercial request-routing layer for regulated market categories, wanted requests, and reviewed private intake. Public visibility and introductions are not automatic.',
  },
}

const processCards = [
  {
    title: 'Operators submit',
    body: 'Operators submit products, assets, services, wanted requests or commercial opportunities for Harbourview review. Publication and introductions are not automatic.',
  },
  {
    title: 'Buyers and suppliers inquire',
    body: 'Participants browse public-safe summaries and submit inquiries through Harbourview. Public pages do not expose private contact details, sensitive review material or commercial context.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Harbourview reviews category fit, public-summary safety, commercial relevance and routing context before any counterparty contact, response or introduction is considered.',
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
        eyebrow="Harbourview Exchange"
        title="Controlled commercial intake for reviewed opportunities and requests."
        actions={[
          { label: 'Submit Opportunity', href: '/marketplace/sell' },
          { label: 'Browse Listings', href: '/marketplace/listings', variant: 'secondary' },
          { label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview Exchange routes serious regulated-market submissions, wanted requests and commercial inquiries through reviewed private workflows. Public pages provide category orientation and safe summaries; they do not prove live liquidity, guarantee access or publish private counterparties.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          {MARKETPLACE_CONFIDENTIALITY_CAVEAT}
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader
          eyebrow="Controlled network workflow"
          title="Review and qualification before any introduction."
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
          title="Explore reviewed commercial-intake categories."
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
        title="Have an opportunity, review request or wanted request to submit?"
        actions={[
          { label: 'Submit Opportunity', href: '/marketplace/sell' },
          { label: 'Browse Listings', href: '/marketplace/listings', variant: 'secondary' },
        ]}
      >
        Submit supply, services, business opportunities, buyer requirements or introduction requests for Harbourview review. Public visibility and routing are not automatic.
      </FooterCta>
    </>
  )
}
