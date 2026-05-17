import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

type SurfaceAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type SurfaceSection = {
  eyebrow: string
  title: string
  description: string
  items: string[]
}

export type PublicSurfacePageProps = {
  eyebrow: string
  title: string
  description: string
  boundary: string
  primaryAction: SurfaceAction
  secondaryAction?: SurfaceAction
  sections: SurfaceSection[]
  footerTitle: string
  footerDescription: string
}

export default function PublicSurfacePage({
  eyebrow,
  title,
  description,
  boundary,
  primaryAction,
  secondaryAction,
  sections,
  footerTitle,
  footerDescription,
}: PublicSurfacePageProps) {
  const actions = secondaryAction ? [primaryAction, secondaryAction] : [primaryAction]

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow={eyebrow}
        title={title}
        compact
        actions={actions}
        aside={
          <PublicCard className="p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/72">
              Public boundary
            </p>
            <p className="text-sm leading-7 text-white/58">{boundary}</p>
          </PublicCard>
        }
      >
        <p>{description}</p>
      </PublicHero>

      {sections.map((section, index) => (
        <PublicSection key={section.title} tone={index % 2 === 0 ? 'navy' : 'dark'}>
          <SectionHeader eyebrow={section.eyebrow} title={section.title}>
            {section.description}
          </SectionHeader>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item) => (
              <PublicCard key={item} className="p-6">
                <p className="text-sm leading-7 text-white/62">{item}</p>
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      ))}

      <FooterCta
        eyebrow="Reviewed workflow"
        title={footerTitle}
        actions={actions}
      >
        {footerDescription}
      </FooterCta>
    </main>
  )
}
