import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'About Harbourview',
  description:
    'Learn how Harbourview supports commercial intelligence, controlled network access, reviewed opportunities, and market-access pathways.',
}

const pillars = [
  {
    eyebrow: 'Intelligence',
    title: 'Commercial context',
    body: 'Market signals, category fit, route considerations and counterparty context are treated as decision inputs, not public claims.',
  },
  {
    eyebrow: 'Network',
    title: 'Controlled discovery',
    body: 'Listings, wanted requests and service support are routed through review so public pages stay commercially useful and disclosure-safe.',
  },
  {
    eyebrow: 'Access',
    title: 'Relationship-led routing',
    body: 'Harbourview prioritizes qualified pathways, serious counterparties and disciplined follow-up over open marketplace exposure.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PublicHero
        eyebrow="About Harbourview"
        title="Commercial intelligence, controlled access and disciplined market routing."
        actions={[
          { label: 'Enter Harbourview Network', href: '/marketplace' },
          { label: 'Request Intelligence', href: '/intelligence', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview supports serious participants in regulated cannabis and adjacent supply chains by combining market-access intelligence, reviewed opportunity pathways, qualified inquiry handling and relationship-led commercial support.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <PublicCard className="p-6 sm:p-8">
            <SectionHeader eyebrow="Operating model" title="What Harbourview does" className="mb-5" />
            <div className="space-y-5 text-sm leading-7 text-white/60 sm:text-base">
              <p>
                Harbourview is built for operators, suppliers, service providers, buyers, investors and strategic partners who need commercially useful visibility without public exposure or undisciplined brokerage.
              </p>
              <p>
                Harbourview Network provides a controlled commercial environment for regulated cannabis products, inputs, services, wanted requests, qualified introductions and country-specific access pathways.
              </p>
              <p>
                Inquiries and submissions are reviewed before routing. Contact details remain private unless Harbourview coordinates an appropriate response or introduction.
              </p>
            </div>
          </PublicCard>

          <aside className="space-y-6">
            <PublicCard muted className="p-6">
              <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Positioning</h2>
              <p className="text-sm leading-7 text-white/58">Market access backed by intelligence and relationships.</p>
            </PublicCard>
            <PublicCard muted className="p-6">
              <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Operating standard</h2>
              <p className="text-sm leading-7 text-white/58">
                Reviewed inquiries. Private contact handling. No public counterparty exposure. No guaranteed transaction, availability, introduction or regulatory outcome.
              </p>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Public system" title="Three disciplines control the Harbourview experience." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <PublicCard key={pillar.title} className="p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold/72">{pillar.eyebrow}</p>
              <h3 className="mb-3 text-lg font-semibold text-[#f4f1eb]">{pillar.title}</h3>
              <p className="text-sm leading-7 text-white/58">{pillar.body}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Next step"
        title="Use Harbourview Network or request intelligence support."
        actions={[
          { label: 'Enter Network', href: '/marketplace' },
          { label: 'Request Intelligence', href: '/intelligence', variant: 'secondary' },
        ]}
      />
    </>
  )
}
