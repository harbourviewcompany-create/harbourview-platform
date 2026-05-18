import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Education',
  description:
    'Non-promotional professional education for clinical, pharmacy, quality, commercial, regulatory and institutional stakeholders.',
}

const educationSpineRoutes = [
  {
    title: 'Compliance Readiness',
    href: '/education/compliance-readiness',
    body: 'Prepare evidence, escalation triggers and review questions without treating public education as legal or regulatory advice.',
  },
  {
    title: 'Export & Import Readiness',
    href: '/education/export-import-readiness',
    body: 'Organize exporter, importer, product, batch, logistics and route assumptions before qualified review.',
  },
  {
    title: 'Pharmaceutical & Medical Cannabis',
    href: '/education/pharmaceutical-medical-cannabis',
    body: 'Frame professional medical cannabis education without clinical directions, patient-specific instructions or promotional product claims.',
  },
  {
    title: 'Cannabis History Library',
    href: '/education/cannabis-history-library',
    body: 'Create a source-led library shelf for policy evolution, market development, quality systems and institutional milestones.',
  },
  {
    title: 'Regulatory Change Tracker',
    href: '/policy-standards/regulatory-change-tracker',
    body: 'Route regulatory-change monitoring requests while separating signals from legal outcomes or market-access guarantees.',
  },
]

export default function EducationPage() {
  return (
    <>
      <InstitutionalPage page={hubPages.education} sectionId="education-tracks" />
      <PublicSection tone="dark">
        <SectionHeader eyebrow="HAR-40 knowledge spine" title="Public education routes now support deeper professional readiness workflows.">
          These public surfaces keep education useful while avoiding legal advice, medical advice, investment advice, compliance guarantees or unverified current regulatory claims.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {educationSpineRoutes.map((route) => (
            <PublicLinkCard key={route.href} href={route.href} title={route.title} eyebrow="Education route">
              {route.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>
    </>
  )
}
