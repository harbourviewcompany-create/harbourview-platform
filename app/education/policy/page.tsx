import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Regulatory Policy Education | Harbourview Education',
  description:
    'Non-promotional regulatory and policy education for cannabis operators, compliance professionals, policymakers and regulated market participants.',
}

export default function PolicyPage() {
  return (
    <PublicSurfacePage
      eyebrow="Regulatory and policy education"
      title="Regulatory and policy education for regulated cannabis markets."
      description="This route provides a public-safe orientation to cannabis regulatory frameworks, policy models and market-access concepts for operators, compliance professionals and institutional participants. It does not provide legal advice, regulatory authority guidance or official government positions."
      boundary="This page is educational and comparative. It does not represent legal advice, government endorsement, official regulatory guidance or jurisdiction-specific compliance conclusions."
      primaryAction={{ label: 'Explore Policy & Standards', href: '/policy-standards' }}
      secondaryAction={{ label: 'Request Policy Intelligence', href: '/intelligence', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Policy framework concepts',
          title: 'Regulatory models that govern cannabis market access',
          description: 'Cannabis market access is governed by layered regulatory frameworks that differ significantly across jurisdictions, requiring operators to understand model differences before commercial engagement.',
          items: [
            'Medical access models — prescription, authorised prescriber, specialist-only and pharmacy dispensing frameworks across regulated markets.',
            'Licensing structures — cultivation, processing, importation, exportation, distribution, wholesale and retail authorisation frameworks.',
            'Narcotics control frameworks — Single Convention obligations, scheduling, import and export permit systems and competent authority roles.',
            'Quality standards frameworks — GMP, GACP, GDP, pharmacopoeial and country-specific product quality requirements.',
            'Market authorisation and product registration pathways — the distinction between licensed medicine, special access and unlicensed import models.',
            'Diversion prevention, inspectorate oversight, enforcement frameworks and the consequences of regulatory non-compliance.',
          ],
        },
        {
          eyebrow: 'Market conduct education',
          title: 'Responsible commercial practice in regulated cannabis markets',
          description: 'Commercial conduct in regulated cannabis markets is constrained by advertising rules, professional standards, anti-diversion obligations and international treaty obligations.',
          items: [
            'Advertising and promotion restrictions applicable to medical cannabis — what can and cannot be communicated publicly or commercially.',
            'Claims discipline — the distinction between factual product description, health claims, efficacy claims and promotional statements.',
            'Anti-diversion obligations, know-your-customer requirements and the commercial due diligence expected of regulated supply-chain participants.',
            'Professional conduct standards for operators who engage with healthcare professionals, regulators, procurement bodies or public institutions.',
          ],
        },
      ]}
      footerTitle="Policy intelligence requires a controlled workflow."
      footerDescription="Specific regulatory pathway questions, jurisdiction analysis, policy change tracking and compliance gap assessments should be handled through Harbourview intelligence and intake workflows."
    />
  )
}
