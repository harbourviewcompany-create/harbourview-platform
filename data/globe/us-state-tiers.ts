import type { RegulatoryTier } from '@/lib/globe/globe-materials'

// Static defaults for US state/DC heat-map colouring. Live DB rows override these values.
// Source: NCSL State Medical Cannabis Laws, reviewed for this seed on 2026-08-20.
export const US_STATE_REGULATORY_TIERS = {
  'US-AK': 'domestic_only', // Alaska
  'US-AL': 'medical_limited_trade', // Alabama
  'US-AR': 'medical_limited_trade', // Arkansas
  'US-AZ': 'domestic_only', // Arizona
  'US-CA': 'domestic_only', // California
  'US-CO': 'domestic_only', // Colorado
  'US-CT': 'domestic_only', // Connecticut
  'US-DC': 'domestic_only', // District of Columbia
  'US-DE': 'domestic_only', // Delaware
  'US-FL': 'medical_limited_trade', // Florida
  'US-GA': 'medical_limited_trade', // Georgia
  'US-HI': 'medical_limited_trade', // Hawaii
  'US-IA': 'cbd_hemp_only', // Iowa
  'US-ID': 'prohibited', // Idaho
  'US-IL': 'domestic_only', // Illinois
  'US-IN': 'cbd_hemp_only', // Indiana
  'US-KS': 'cbd_hemp_only', // Kansas
  'US-KY': 'medical_limited_trade', // Kentucky
  'US-LA': 'medical_limited_trade', // Louisiana
  'US-MA': 'domestic_only', // Massachusetts
  'US-MD': 'domestic_only', // Maryland
  'US-ME': 'domestic_only', // Maine
  'US-MI': 'domestic_only', // Michigan
  'US-MN': 'domestic_only', // Minnesota
  'US-MO': 'domestic_only', // Missouri
  'US-MS': 'medical_limited_trade', // Mississippi
  'US-MT': 'domestic_only', // Montana
  'US-NC': 'cbd_hemp_only', // North Carolina
  'US-ND': 'medical_limited_trade', // North Dakota
  'US-NE': 'medical_limited_trade', // Nebraska
  'US-NH': 'medical_limited_trade', // New Hampshire
  'US-NJ': 'domestic_only', // New Jersey
  'US-NM': 'domestic_only', // New Mexico
  'US-NV': 'domestic_only', // Nevada
  'US-NY': 'domestic_only', // New York
  'US-OH': 'domestic_only', // Ohio
  'US-OK': 'medical_limited_trade', // Oklahoma
  'US-OR': 'domestic_only', // Oregon
  'US-PA': 'medical_limited_trade', // Pennsylvania
  'US-RI': 'domestic_only', // Rhode Island
  'US-SC': 'cbd_hemp_only', // South Carolina
  'US-SD': 'medical_limited_trade', // South Dakota
  'US-TN': 'cbd_hemp_only', // Tennessee
  'US-TX': 'medical_limited_trade', // Texas
  'US-UT': 'medical_limited_trade', // Utah
  'US-VA': 'domestic_only', // Virginia
  'US-VT': 'domestic_only', // Vermont
  'US-WA': 'domestic_only', // Washington
  'US-WI': 'cbd_hemp_only', // Wisconsin
  'US-WV': 'medical_limited_trade', // West Virginia
  'US-WY': 'cbd_hemp_only', // Wyoming
} as const satisfies Record<string, RegulatoryTier>
