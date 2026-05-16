import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EmptyState, FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

const educationTrackContent: Record<string, {
  title: string
  eyebrow: string
  description: string
  boundary: string
  modules: string[]
}> = {
  'pharmacy-education': {
    eyebrow: 'Professional education',
    title: 'Pharmacy Education',
    description:
      'Public-safe orientation for dispensing workflows, controlled handling concepts, patient-facing communication context and product-format literacy.',
    boundary:
      'This content is informational and non-promotional. It does not provide medical advice, dispensing instructions, treatment recommendations or accredited continuing education unless expressly stated.',
    modules: [
      'Dispensing workflow concepts',
      'Controlled handling and record-readiness themes',
      'Product-format literacy without prescribing guidance',
      'Patient communication boundaries and escalation points',
    ],
  },
  'quality-compliance': {
    eyebrow: 'Quality and compliance education',
    title: 'Quality & Compliance',
    description:
      'Educational structure for GMP, GACP, GDP, batch documentation, CoA review, qualification and audit-readiness concepts.',
    boundary:
      'Quality education is orientation only and does not replace qualified audit, legal, regulatory or QP review.',
    modules: [
      'GMP, GACP and GDP concept orientation',
      'Batch documentation and CoA literacy',
      'Supplier qualification and audit-readiness framing',
      'Deviation, complaint and recall-readiness concepts',
    ],
  },
  'importer-distributor': {
    eyebrow: 'Importer and distributor education',
    title: 'Importer & Distributor',
    description:
      'Education support for route feasibility, intake documentation review, product onboarding and distribution readiness.',
    boundary:
      'Importer and distributor content does not confirm licence status, route eligibility, import approval or commercial readiness.',
    modules: [
      'Intake documentation and product onboarding questions',
      'Distribution-readiness and channel-fit concepts',
      'Market-entry constraints and escalation triggers',
      'Reviewed inquiry workflow before commercial routing',
    ],
  },
  'procurement': {
    eyebrow: 'Procurement education',
    title: 'Procurement',
    description:
      'Public-safe education around documentation review, product evaluation, substitution risk and buyer readiness.',
    boundary:
      'Procurement education does not verify sellers, approve products, confirm availability or replace buyer due diligence.',
    modules: [
      'Documentation review and product evaluation structure',
      'Quality, substitution and evidence-risk themes',
      'Buyer-readiness and internal review checklists',
      'When to route a request into private review',
    ],
  },
  'investor-due-diligence': {
    eyebrow: 'Investor education',
    title: 'Investor Due Diligence',
    description:
      'Educational framing for licence quality, compliance exposure, operating maturity, market viability and defensibility.',
    boundary:
      'Investor education is not investment advice, valuation advice, legal advice or confirmation of operating quality.',
    modules: [
      'Licence and operating-model review questions',
      'Compliance exposure and documentation maturity themes',
      'Market viability and route defensibility concepts',
      'Evidence standards before relying on a claim',
    ],
  },
  'laboratory-testing': {
    eyebrow: 'Laboratory and testing education',
    title: 'Laboratory & Testing',
    description:
      'Education around CoA integrity, contaminant testing, method reliability, stability and lab due diligence concepts.',
    boundary:
      'Testing education does not validate a laboratory, product, method or batch and does not replace qualified technical review.',
    modules: [
      'CoA literacy and test-panel orientation',
      'Contaminant, stability and method-reliability concepts',
      'Lab due diligence questions',
      'Escalation into quality or technical review',
    ],
  },
  'pharmacovigilance-safety': {
    eyebrow: 'Safety education',
    title: 'Pharmacovigilance & Safety',
    description:
      'Education around product complaints, adverse event concepts, recall readiness, post-market surveillance and safety signals.',
    boundary:
      'Safety education is not medical advice, pharmacovigilance outsourcing, regulatory reporting advice or incident handling authority.',
    modules: [
      'Complaint and adverse-event concept orientation',
      'Recall-readiness and product-withdrawal themes',
      'Post-market surveillance and signal-routing concepts',
      'Safety boundaries for public education',
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(educationTrackContent).map((track) => ({ track }))
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params
  const content = educationTrackContent[track]

  if (!content) return { title: 'Education Track | Harbourview' }

  return {
    title: `${content.title} | Harbourview Education`,
    description: content.description,
  }
}

export default async function EducationTrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params
  const content = educationTrackContent[track]

  if (!content) notFound()

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow={content.eyebrow}
        title={content.title}
        actions={[
          { label: 'Request Education Partnership', href: '/institutional-partnerships' },
          { label: 'Back to Education', href: '/education', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-5 text-sm leading-7 text-white/58">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
              Education boundary
            </p>
            <p>{content.boundary}</p>
          </PublicCard>
        }
      >
        <p>{content.description}</p>
      </PublicHero>

      <PublicSection tone="navy">
        <SectionHeader eyebrow="Track structure" title="A controlled public education spine.">
          These routes make the education system navigable while keeping specialist interpretation, accreditation claims and sensitive material out of the public layer.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {content.modules.map((module) => (
            <PublicCard key={module} className="p-6 text-sm leading-7 text-white/62">
              {module}
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <EmptyState
          title="Private or institutional use requires review."
          action={{ label: 'Start Institutional Conversation', href: '/institutional-partnerships' }}
        >
          Harbourview can review education use, publication boundaries, partner requirements and professional-context risks before wider distribution.
        </EmptyState>
      </PublicSection>

      <FooterCta
        eyebrow="Education partnership"
        title="Need a reviewed education pathway?"
        actions={[{ label: 'Contact Harbourview', href: '/contact' }]}
      >
        Route education, pharmacy, quality, investor or safety questions into a controlled Harbourview review workflow.
      </FooterCta>
    </main>
  )
}
