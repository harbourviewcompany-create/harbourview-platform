import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'About Harbourview — Global Cannabis Market Access & Intelligence',
  description:
    'Harbourview combines market-access intelligence, reviewed opportunity pathways, and relationship-led commercial support for serious participants in regulated cannabis markets.',
  openGraph: {
    title: 'About Harbourview — Commercial Intelligence & Market Access',
    description:
      'Harbourview combines market-access intelligence, reviewed opportunity pathways, and relationship-led commercial support for serious participants in regulated cannabis markets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Harbourview',
    description:
      'Market access backed by intelligence and relationships. Built for serious operators in regulated cannabis and adjacent supply chains.',
  },
}

const pillars = [
  {
    eyebrow: 'Intelligence',
    title: 'What the market actually looks like',
    body: 'Market signals, category fit, route considerations and counterparty context are treated as decision inputs, not public claims.',
  },
  {
    eyebrow: 'Network',
    title: 'Finding the right counterparty',
    body: 'Listings, wanted requests and service support are routed through review so public pages stay commercially useful and disclosure-safe.',
  },
  {
    eyebrow: 'Access',
    title: 'Getting to the right conversation',
    body: 'Harbourview prioritizes qualified pathways, serious counterparties and disciplined follow-up over open marketplace exposure.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PublicHero
        eyebrow="About Harbourview"
        title="Harbourview is built by people who have done this work in the field."
        actions={[
          { label: 'See what\'s active in your region', href: '/marketplace' },
          { label: 'Request a country brief', href: '/intelligence', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview was built by operators with over 15 years of active commercial experience in regulated cannabis — running BD across Canada, Europe, LatAm, APAC, and Africa. The platform exists because the information and introductions that matter in this industry are not publicly available. We built the infrastructure to route them properly.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <PublicCard className="p-6 sm:p-8">
            <SectionHeader eyebrow="What Harbourview does" title="How we work" className="mb-5" />
            <div className="space-y-5 text-sm leading-7 text-white/60 sm:text-base">
              <p>
                Harbourview gives operators, buyers, exporters, importers, and institutional participants a reviewed pathway to commercial engagement — without the noise of open directories, unqualified brokerage, or public counterparty exposure.
              </p>
              <p>
                Submissions are reviewed. Contact details stay private. Routing is deliberate.
              </p>
              <p>
                The Harbourview model is intentionally narrow. We do not operate as an open directory, broker, or advisory firm. We function as a controlled commercial network: we know the operators, we understand the pathways, and we route qualified engagement through reviewed workflows. If you are serious about a regulated market, we can help you move more efficiently than any public-facing resource.
              </p>
            </div>
          </PublicCard>

          <aside className="space-y-6">
            <PublicCard muted className="p-6">
              <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Positioning</h2>
              <p className="text-sm leading-7 text-white/58">Commercial access for operators who can&apos;t afford to move through the wrong door.</p>
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
        <SectionHeader eyebrow="How it works" title="Three disciplines control the Harbourview experience." />
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
        title="Tell us your market. We'll route you."
        actions={[
          { label: 'See what\'s active in your region', href: '/marketplace' },
          { label: 'Request a country brief', href: '/intelligence', variant: 'secondary' },
        ]}
      />
    </>
  )
}
