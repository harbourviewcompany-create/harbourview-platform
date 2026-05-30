import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'GACP Education | Harbourview Education',
  description:
    'Non-promotional Good Agricultural and Collection Practice education for cannabis cultivators, exporters and regulated supply-chain participants.',
}

export default function GacpPage() {
  return (
    <PublicSurfacePage
      eyebrow="Cultivation quality education"
      title="Good Agricultural and Collection Practice for regulated cannabis cultivation."
      description="This route provides a public-safe orientation to GACP principles, cultivation controls and harvest documentation expectations for cannabis cultivators, exporters and supply-chain professionals. It does not replace regulatory guidance, site audits or qualified technical review."
      boundary="This page is educational only. It does not provide regulatory approval, cultivation licence advice, export clearance, QP opinion or jurisdiction-specific GACP compliance conclusions."
      primaryAction={{ label: 'Request Quality Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'GACP foundations',
          title: 'Agricultural controls that underpin regulated cannabis quality',
          description: 'GACP establishes quality requirements for the cultivation, harvesting, drying and primary processing of cannabis plant material intended for regulated supply chains.',
          items: [
            'Site selection, soil quality, water source, environmental monitoring and pest and disease management controls.',
            'Seed or cutting origin documentation, variety identity, propagation records and genetic consistency requirements.',
            'Cultivation input controls covering fertilisers, pesticides, growth regulators and prohibited substance avoidance.',
            'Harvest timing, harvesting method, handling and post-harvest moisture, temperature and storage controls.',
            'Drying, curing and primary processing steps with temperature, humidity and contamination controls.',
            'Traceability from seed or cutting through to dried flower or extract, with batch identification and yield records.',
          ],
        },
        {
          eyebrow: 'Export readiness',
          title: 'Documentation categories cultivators should prepare for international supply',
          description: 'Export routes require evidence that cannabis plant material was grown, harvested and handled under documented quality controls aligned with applicable GACP standards.',
          items: [
            'GACP certificate or equivalent quality certification for the cultivation site and scope of activity.',
            'Cultivation batch records covering planting date, variety, inputs applied, harvest date, yield and test results.',
            'Pesticide residue, heavy metal, mycotoxin, moisture and microbial test results for the relevant batch.',
            'Post-harvest handling and storage records demonstrating temperature, humidity and contamination control.',
            'Chain of custody documentation from cultivation site through primary processing and packaging.',
            'Country-specific import authority requirements for GACP evidence, phytosanitary certificates and narcotics permits.',
          ],
        },
      ]}
      footerTitle="Cultivation documentation requires route-specific review."
      footerDescription="GACP evidence packages, cultivation site assessments and export readiness reviews should be handled through Harbourview intake for controlled, confidential handling."
    />
  )
}
