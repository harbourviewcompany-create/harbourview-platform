import type { Metadata } from 'next'
import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Reviewed Network Listings | Harbourview Network',
  description:
    'A safe public entry point for Harbourview Network listing categories, wanted requests and opportunity submissions.',
  openGraph: {
    title: 'Reviewed Network Listings | Harbourview Network',
    description:
      'Explore Harbourview Network categories and submit commercial opportunities through controlled review pathways.',
  },
}

const accessCards = [
  {
    title: 'Explore the Network',
    href: '/marketplace',
    eyebrow: 'Network overview',
    body: 'Review the public Harbourview Network categories for regulated products, inputs, services, wanted requests and commercial access pathways.',
  },
  {
    title: 'Review Wanted Requests',
    href: '/marketplace/wanted',
    eyebrow: 'Buyer demand',
    body: 'View public summaries of operator requirements and buyer-side demand that can be routed through Harbourview review.',
  },
  {
    title: 'Submit an Opportunity',
    href: '/marketplace/sell',
    eyebrow: 'Controlled intake',
    body: 'Submit supply, services, assets or commercial opportunities for Harbourview review before any publication or introduction pathway.',
  },
]

const guardrails = [
  'Public pages show controlled summaries only.',
  'Private counterparty details are not published on this route.',
  'Availability, terms and introduction fit remain subject to Harbourview review.',
]

export default function MarketplaceListingsPage() {
  return (
    <>
      <PublicHero
        eyebrow="Harbourview Network Listings"
        title="Reviewed commercial pathways for qualified network opportunities."
        actions={[
          { label: 'Explore Network', href: '/marketplace' },
          { label: 'View Wanted Requests', href: '/marketplace/wanted', variant: 'secondary' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview Network organizes public access around controlled category summaries, wanted requests and reviewed submission pathways.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Sensitive counterparty information, commercial terms and internal review context remain private unless a separate qualified introduction is appropriate.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Public access routes" title="Start from the appropriate reviewed pathway." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {accessCards.map((card) => (
            <PublicLinkCard key={card.href} href={card.href} eyebrow={card.eyebrow} title={card.title}>
              {card.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader eyebrow="Review standard" title="Public visibility is intentionally limited." className="mb-0" />
          <PublicCard className="p-7">
            <ul className="space-y-5">
              {guardrails.map((item) => (
                <li key={item} className="flex gap-4 text-sm leading-7 text-white/62">
                  <span className="mt-3 h-px w-8 shrink-0 bg-gradient-to-r from-gold to-gold-light" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
