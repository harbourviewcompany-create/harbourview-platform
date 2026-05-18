import type { GlobeLayerId } from '@/types/globe-router'

export type GlobeLayerTone = 'base' | 'slate' | 'bronze' | 'gold' | 'amber_white' | 'burden'

export interface GlobeLayerLegendStep {
  label: string
  tone: GlobeLayerTone
  description: string
}

export interface GlobeSemanticLayerConfig {
  id: GlobeLayerId
  label: string
  description: string
  legend: GlobeLayerLegendStep[]
}

export const globeSemanticLayers: GlobeSemanticLayerConfig[] = [
  {
    id: 'country_select',
    label: 'Country select',
    description: 'Neutral country-selection mode. Countries remain dark navy plates with restrained gold engraved borders.',
    legend: [
      { label: 'Available', tone: 'base', description: 'Selectable country plate.' },
      { label: 'Selected', tone: 'gold', description: 'Warm controlled-access glow.' },
      { label: 'No public pathway yet', tone: 'slate', description: 'Visible but subdued; request review instead.' },
    ],
  },
  {
    id: 'market_openness',
    label: 'Market openness',
    description: 'Shows relative openness without rainbow heatmap colors.',
    legend: [
      { label: 'Closed / restricted', tone: 'slate', description: 'Subdued plate and low edge energy.' },
      { label: 'Case-by-case', tone: 'bronze', description: 'Bronze edge and restrained fill.' },
      { label: 'Open pathway', tone: 'gold', description: 'Gold edge, still below selected-state intensity.' },
    ],
  },
  {
    id: 'opportunity_heat',
    label: 'Opportunity heat',
    description: 'Commercial movement intensity in Harbourview tones.',
    legend: [
      { label: 'Low movement', tone: 'base', description: 'Dark raised plate.' },
      { label: 'Building', tone: 'bronze', description: 'Bronze surface warmth.' },
      { label: 'High opportunity', tone: 'amber_white', description: 'Amber-white edge highlight over gold glow.' },
    ],
  },
  {
    id: 'import_potential',
    label: 'Import potential',
    description: 'Demand-side potential and route viability.',
    legend: [
      { label: 'Limited', tone: 'slate', description: 'Muted edge and low fill.' },
      { label: 'Emerging', tone: 'bronze', description: 'Bronze edge.' },
      { label: 'Strong', tone: 'gold', description: 'Gold rim with selected-state reserved for user choice.' },
    ],
  },
  {
    id: 'export_potential',
    label: 'Export potential',
    description: 'Supply-side and export readiness signal.',
    legend: [
      { label: 'Limited', tone: 'slate', description: 'Muted plate.' },
      { label: 'Developing', tone: 'bronze', description: 'Bronze fill and edge.' },
      { label: 'Strong', tone: 'gold', description: 'Gold rim.' },
    ],
  },
  {
    id: 'regulatory_signals',
    label: 'Regulatory signals',
    description: 'Recent movement in law, access, standards or enforcement.',
    legend: [
      { label: 'Quiet', tone: 'base', description: 'Neutral plate.' },
      { label: 'Watch', tone: 'bronze', description: 'Bronze pulse edge.' },
      { label: 'Active signal', tone: 'amber_white', description: 'Amber-white tick without warning-red semantics.' },
    ],
  },
  {
    id: 'documentation_burden',
    label: 'Documentation burden',
    description: 'Shows high burden as dense bronze/slate, not as high-opportunity brightness.',
    legend: [
      { label: 'Lower burden', tone: 'base', description: 'Neutral dark plate.' },
      { label: 'Material burden', tone: 'bronze', description: 'Bronze hatch effect.' },
      { label: 'High burden', tone: 'burden', description: 'Slate-bronze density; deliberately less luminous than opportunity.' },
    ],
  },
]

export const globeSemanticLayerMap = Object.fromEntries(
  globeSemanticLayers.map((layer) => [layer.id, layer]),
) as Record<GlobeLayerId, GlobeSemanticLayerConfig>
