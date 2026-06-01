import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Education',
  description:
    'Non-promotional professional education for clinical, pharmacy, quality, commercial, regulatory and institutional stakeholders.',
  openGraph: {
    title: 'Harbourview Education',
    description: 'Non-promotional professional education for regulated cannabis operators, quality professionals, importers, distributors and institutional participants.',
  },
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
    title: 'GMP Education',
    href: '/education/gmp',
    body: 'Good Manufacturing Practice foundations, documentation readiness and quality evidence categories for cannabis operators and exporters.',
  },
  {
    title: 'GACP Education',
    href: '/education/gacp',
    body: 'Agricultural and collection practice controls, cultivation documentation and export readiness for cannabis cultivators.',
  },
  {
    title: 'GDP Education',
    href: '/education/gdp',
    body: 'Distribution controls, cold chain management, import documentation and controlled-drug handling for logistics and distribution professionals.',
  },
  {
    title: 'Pharmaceutical & Medical Cannabis',
    href: '/education/pharmaceutical-medical-cannabis',
    body: 'Frame professional medical cannabis education without clinical directions, patient-specific instructions or promotional product claims.',
  },
  {
    title: 'Pharmacy Education',
    href: '/education/pharmacy',
    body: 'Dispensing channel concepts, controlled-handling requirements and supply-chain context for pharmacy professionals and importers.',
  },
  {
    title: 'Laboratory & Testing',
    href: '/education/testing',
    body: 'CoA literacy, testing method concepts, contaminant categories and quality documentation evaluation for procurement and supply teams.',
  },
  {
    title: 'Quality & Compliance',
    href: '/education/quality-compliance',
    body: 'The full quality system map — GACP, GMP, GDP, CoA and audit readiness — across the regulated cannabis supply chain.',
  },
  {
    title: 'Importer & Distributor',
    href: '/education/importer-distributor',
    body: 'Role definitions, authorisation requirements, route documentation and onboarding readiness for import and distribution participants.',
  },
  {
    title: 'Cultivation & Production',
    href: '/education/cultivation-production',
    body: 'Production controls, post-harvest discipline, batch documentation and export evidence for cultivators and licensed producers.',
  },
  {
    title: 'Procurement',
    href: '/education/procurement',
    body: 'Supplier evaluation, documentation review, buyer readiness and due diligence concepts for regulated cannabis procurement teams.',
  },
  {
    title: 'Pharmacovigilance & Safety',
    href: '/education/pharmacovigilance',
    body: 'Adverse event concepts, product complaint handling, recall readiness and post-market safety obligations for operators and quality teams.',
  },
  {
    title: 'Regulatory & Policy',
    href: '/education/policy',
    body: 'Regulatory frameworks, licensing models, market conduct standards and policy concepts for regulated cannabis market participants.',
  },
  {
    title: 'Cannabis History Library',
    href: '/education/cannabis-history-library',
    body: 'Source-led library for policy evolution, market development, quality systems and institutional milestones across regulated cannabis.',
  },
  {
    title: 'Professional Briefings',
    href: '/education/briefings',
    body: 'Controlled professional briefings prepared for specific audience contexts — reviewed before preparation and distributed with a scope statement.',
  },
  {
    title: 'Review Required Topics',
    href: '/education/review-required',
    body: 'Topics that require qualified review before Harbourview can respond — and how to route them through the appropriate intake path.',
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
