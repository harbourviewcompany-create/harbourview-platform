import type { ComplianceRegion } from './types'

export const complianceRegions: ComplianceRegion[] = [
  {
    slug: 'europe',
    name: 'Europe',
    summary: 'EU and non-EU medical cannabis, narcotics, import, quality and distribution pathways with high documentation sensitivity.',
    commercialFocus: 'EU GMP, GACP source material, GDP distribution, pharmacy-channel requirements and country-specific import controls.',
  },
  {
    slug: 'north-america',
    name: 'North America',
    summary: 'Federal, state, provincial and cross-border frameworks with substantial licence, product and channel variation.',
    commercialFocus: 'Licensed production, domestic distribution, export readiness, documentation control and jurisdiction-specific compliance screening.',
  },
  {
    slug: 'latin-america',
    name: 'Latin America',
    summary: 'Cultivation, manufacturing, medical access and export-oriented frameworks with uneven implementation across markets.',
    commercialFocus: 'Export permissions, product registration, quota sensitivity, local counsel needs and country-level market-entry screening.',
  },
  {
    slug: 'caribbean',
    name: 'Caribbean',
    summary: 'Emerging and tourism-adjacent cannabis frameworks with variable licence maturity and cross-border constraints.',
    commercialFocus: 'Licensing status, export viability, local operating permissions and specialist review before commercial reliance.',
  },
  {
    slug: 'africa',
    name: 'Africa',
    summary: 'Cultivation, export and medical-access jurisdictions with varying regulator capacity, documentation depth and investment-readiness.',
    commercialFocus: 'Cultivation permissions, export controls, GACP readiness, GMP manufacturing pathways and country-specific risk review.',
  },
  {
    slug: 'middle-east',
    name: 'Middle East',
    summary: 'Highly controlled cannabis and cannabinoid markets where specialist jurisdictional review is essential.',
    commercialFocus: 'Medical-channel controls, import/export constraints, research frameworks and restricted-route screening.',
  },
  {
    slug: 'asia-pacific',
    name: 'Asia-Pacific',
    summary: 'Diverse medical, hemp, CBD, import and prescription-channel frameworks with strong regulator-specific requirements.',
    commercialFocus: 'Medicinal product pathways, GMP expectations, import controls, prescription-channel rules and residual-THC sensitivity.',
  },
]

export function getComplianceRegion(slug: string) {
  return complianceRegions.find((region) => region.slug === slug)
}
