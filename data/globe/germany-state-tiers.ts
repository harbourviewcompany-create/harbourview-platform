import type { RegulatoryTier } from '@/lib/globe/globe-materials'

// Static defaults for German Land heat-map colouring. Live DB rows override these values.
// Source: reviewed cc_jurisdiction_briefings Germany subnational seeds, 2026-06-22.
export const GERMANY_STATE_REGULATORY_TIERS = {
  'DE-SN': 'domestic_only', // Sachsen
  'DE-BY': 'domestic_only', // Bayern
  'DE-RP': 'domestic_only', // Rheinland-Pfalz
  'DE-SL': 'domestic_only', // Saarland
  'DE-SH': 'domestic_only', // Schleswig-Holstein
  'DE-NI': 'domestic_only', // Niedersachsen
  'DE-NW': 'domestic_only', // Nordrhein-Westfalen
  'DE-BW': 'domestic_only', // Baden-Württemberg
  'DE-BB': 'domestic_only', // Brandenburg
  'DE-MV': 'domestic_only', // Mecklenburg-Vorpommern
  'DE-HH': 'domestic_only', // Hamburg
  'DE-HE': 'domestic_only', // Hessen
  'DE-TH': 'domestic_only', // Thüringen
  'DE-ST': 'domestic_only', // Sachsen-Anhalt
  'DE-BE': 'domestic_only', // Berlin
  'DE-HB': 'domestic_only', // Bremen
} as const satisfies Record<string, RegulatoryTier>
