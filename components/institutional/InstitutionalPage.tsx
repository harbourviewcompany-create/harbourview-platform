import type { InstitutionalPageContent } from '@/lib/institutional/content'
import InstitutionalHero from '@/components/institutional/InstitutionalHero'
import ModuleCardGrid from '@/components/institutional/ModuleCardGrid'
import BoundaryNotice from '@/components/institutional/BoundaryNotice'
import InstitutionalCTA from '@/components/institutional/InstitutionalCTA'

type InstitutionalPageProps = {
  page: InstitutionalPageContent
  sectionId?: string
}

export default function InstitutionalPage({
  page,
  sectionId,
}: InstitutionalPageProps) {
  return (
    <>
      <InstitutionalHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        primaryCta={page.primaryCta}
        secondaryCta={page.secondaryCta}
      />

      {page.sections.map((section, index) => (
        <ModuleCardGrid
          key={section.title}
          id={index === 0 ? sectionId : undefined}
          title={section.title}
          description={section.description}
          items={section.items}
        />
      ))}

      {page.boundary ? <BoundaryNotice body={page.boundary} /> : null}

      <InstitutionalCTA
        title="Request a Harbourview conversation"
        body="Harbourview supports reviewed commercial engagement, institutional collaboration, intelligence requests and controlled market-access discussions through confidential intake pathways."
        primaryLabel="Request Access"
        primaryHref="/contact"
        secondaryLabel="Enter Network"
        secondaryHref="/marketplace"
      />
    </>
  )
}
