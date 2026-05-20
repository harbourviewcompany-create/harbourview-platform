import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { PUBLIC_PRIVATE_BOUNDARY } from '@/lib/institutional/content'

export type IntelligenceModulePageContent = {
  eyebrow: string
  title: string
  description: string
  requestLabel: string
  reviewItems: string[]
  boundaryItems: string[]
}

export default function IntelligenceModulePage({
  content,
}: {
  content: IntelligenceModulePageContent
}) {
  return (
    <>
      <PublicHero
        eyebrow={content.eyebrow}
        title={content.title}
        compact
        actions={[
          { label: content.requestLabel, href: '/contact' },
          { label: 'Review Source Methodology', href: '/source-methodology', variant: 'secondary' },
        ]}
      >
        <p>{content.description}</p>
        <p className="mt-4 text-sm leading-7 text-white/54">{PUBLIC_PRIVATE_BOUNDARY}</p>
      </PublicHero>

      <PublicSection tone="navy">
        <SectionHeader eyebrow="Public-safe scope" title="What this module can support publicly">
          HAR-37 establishes the navigable intelligence surface. Deeper analyst material, source records and counterparty details remain outside public pages.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {content.reviewItems.map((item) => (
            <PublicCard key={item} className="p-6">
              <p className="text-sm leading-7 text-white/62">{item}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Boundary controls" title="Information stays reviewed before it becomes specific.">
          These pages are orientation surfaces, not live market claims or open evidence repositories.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {content.boundaryItems.map((item) => (
            <PublicCard key={item} muted className="p-5">
              <p className="text-sm leading-7 text-white/58">{item}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Reviewed intelligence"
        title="Request a controlled intelligence brief"
        actions={[
          { label: content.requestLabel, href: '/contact' },
          { label: 'Speak Confidentially', href: '/intake', variant: 'secondary' },
        ]}
      >
        Harbourview reviews market, company, route and counterparty questions before any private material is prepared or routed.
      </FooterCta>
    </>
  )
}
