import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Cultivation & Production Education | Harbourview Education',
  description:
    'Non-promotional cultivation and production education for cannabis operators on production controls, batch consistency and export readiness.',
}

export default function CultivationProductionPage() {
  return (
    <PublicSurfacePage
      eyebrow="Cultivation and production education"
      title="Cultivation and production education for regulated cannabis export readiness."
      description="This route provides a public-safe orientation to production controls, post-harvest discipline and export preparation for cannabis cultivators and licensed producers. It does not provide cultivation licence advice, GACP certification, QP opinion or jurisdiction-specific regulatory conclusions."
      boundary="This page is educational only. It does not provide cultivation licence advice, GACP certification, QP opinion, export clearance, batch release authority or jurisdiction-specific regulatory conclusions."
      primaryAction={{ label: 'Request Export Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Explore GACP Education', href: '/education/gacp', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Production controls',
          title: 'Quality and documentation controls across the cultivation and production cycle',
          description: 'Consistent, documented production controls are the foundation of export-ready cannabis. Importing countries and qualified persons evaluate these controls when assessing supply suitability.',
          items: [
            'Genetics identity and propagation records — variety documentation, cutting origin, tissue culture provenance and consistency across production batches.',
            'Cultivation input controls — nutrient programme, pest and disease management, prohibited substance avoidance and input batch records.',
            'Harvest planning, harvest execution records, fresh weight yield, moisture content at harvest and initial quality assessment.',
            'Post-harvest handling — drying conditions, curing parameters, moisture content at cure, storage temperature and humidity control records.',
            'Primary processing — trimming, sorting, sieving, pre-packaging batch identification and weight reconciliation.',
            'Secondary processing for extract or finished product — extraction method, solvent or CO₂ parameters, concentration step records and formulation documentation.',
          ],
        },
        {
          eyebrow: 'Export readiness',
          title: 'What cultivators and producers need to prepare for international supply',
          description: 'Export readiness requires documentary evidence that covers the full production pathway from cultivation through to finished product testing.',
          items: [
            'GACP certificate covering the cultivation site, scope and review date — required for most regulated import markets.',
            'GMP certificate covering secondary processing or finished product manufacturing where applicable.',
            'Batch-specific CoA with pesticide residue, heavy metal, mycotoxin, microbial and potency results from an accredited laboratory.',
            'Cultivation batch records, harvest records and processing records that support the CoA and demonstrate traceability.',
            'Stability data or accelerated stability results that support the proposed shelf life for the export product.',
            'Export licence, narcotics export permit, phytosanitary certificate and country-specific documentation requirements for the target import market.',
          ],
        },
      ]}
      footerTitle="Export documentation requires route-specific review."
      footerDescription="Cultivation site assessments, GACP gap analysis, export documentation packages and supply qualification reviews should be handled through Harbourview intake for confidential, qualified review."
    />
  )
}
