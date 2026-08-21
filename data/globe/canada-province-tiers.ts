import type { RegulatoryTier } from '@/lib/globe/globe-materials'

// Static defaults for Canadian province/territory heat-map colouring. Live DB rows override these values.
// Source: reviewed cc_jurisdiction_briefings Canada subnational seed, 2026-06-22.
export const CANADA_PROVINCE_REGULATORY_TIERS = {
  'CA-AB': 'domestic_only', // Alberta
  'CA-BC': 'domestic_only', // British Columbia
  'CA-MB': 'domestic_only', // Manitoba
  'CA-NB': 'domestic_only', // New Brunswick
  'CA-NL': 'domestic_only', // Newfoundland and Labrador
  'CA-NT': 'domestic_only', // Northwest Territories
  'CA-NS': 'domestic_only', // Nova Scotia
  'CA-NU': 'domestic_only', // Nunavut
  'CA-ON': 'domestic_only', // Ontario
  'CA-PE': 'domestic_only', // Prince Edward Island
  'CA-QC': 'domestic_only', // Québec
  'CA-SK': 'domestic_only', // Saskatchewan
  'CA-YT': 'domestic_only', // Yukon
} as const satisfies Record<string, RegulatoryTier>
