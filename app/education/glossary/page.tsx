import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Professional Glossary | Harbourview Education',
  description:
    'Professional terminology for regulated cannabis supply chains — quality systems, regulatory frameworks, import and export, clinical and distribution concepts.',
}

export default function GlossaryPage() {
  return (
    <PublicSurfacePage
      eyebrow="Professional terminology"
      title="A controlled terminology reference for regulated cannabis supply chains."
      description="This route provides a public-safe reference for professional terminology used in regulated cannabis quality systems, regulatory frameworks, import and export, clinical and distribution contexts. Definitions are orientation-level only and do not substitute for jurisdiction-specific legal, regulatory or professional guidance."
      boundary="This glossary is educational and orientation-level only. Definitions do not constitute legal advice, regulatory guidance, QP opinion or authoritative interpretation of any regulation, standard or treaty obligation."
      primaryAction={{ label: 'Request Briefing', href: '/education/request' }}
      secondaryAction={{ label: 'Explore Education Tracks', href: '/education', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Quality and manufacturing terms',
          title: 'GMP, GACP, GDP and quality system terminology',
          description: 'Terms used in quality system certification, regulatory inspection, batch documentation and supply-chain qualification.',
          items: [
            'GMP (Good Manufacturing Practice) — the quality system standard governing cannabis manufacturing, including facility controls, batch documentation, personnel, testing and release.',
            'GACP (Good Agricultural and Collection Practice) — the quality standard governing cannabis cultivation, harvesting, drying and primary processing.',
            'GDP (Good Distribution Practice) — the quality standard governing wholesale storage, transport, chain of custody and controlled-drug distribution.',
            'CoA (Certificate of Analysis) — the batch-specific document from an accredited laboratory confirming product identity, potency, contaminants and compliance with specification.',
            'QP (Qualified Person) — the legally designated individual responsible for certifying that a batch was manufactured in accordance with applicable GMP and regulatory requirements.',
            'CAPA (Corrective and Preventive Action) — the documented process for investigating a quality deviation, identifying root cause and implementing corrective measures.',
            'SOP (Standard Operating Procedure) — a documented, version-controlled procedure governing a specific manufacturing, quality or operational process.',
          ],
        },
        {
          eyebrow: 'Regulatory and trade terms',
          title: 'Import, export, narcotics control and market access terminology',
          description: 'Terms used in international trade, controlled drug licensing, narcotics permit frameworks and market authorisation contexts.',
          items: [
            'Narcotics export permit — the country-of-origin competent authority authorisation required to legally export controlled cannabis products across international borders.',
            'Narcotics import order — the destination country competent authority authorisation required to legally import controlled cannabis products.',
            'Single Convention on Narcotic Drugs 1961 — the international treaty framework that governs the scheduling and cross-border movement of cannabis as a controlled substance.',
            'Market authorisation — the regulatory approval granted by a national medicines authority for a specific pharmaceutical product to be placed on the market.',
            'Special access scheme — a regulatory pathway allowing import or use of an unlicensed product outside of formal market authorisation, subject to country-specific conditions.',
            'Phytosanitary certificate — an official document issued by a plant health authority confirming the health status of plant material for import purposes.',
            'Incoterms — International Commercial Terms defining the responsibilities of buyer and seller for delivery, risk transfer, insurance and customs across international trade.',
          ],
        },
      ]}
      footerTitle="Terminology changes across jurisdictions and contexts."
      footerDescription="For jurisdiction-specific interpretation of regulatory, legal or quality terms, route through Harbourview intake or engage qualified professional review."
    />
  )
}
