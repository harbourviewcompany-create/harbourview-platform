import type { RegulatoryTier } from '@/lib/globe/globe-materials'

// Static defaults for Australian state/territory heat-map colouring. Live DB rows override these values.
// Source: reviewed cc_jurisdiction_briefings Australia subnational seed, 2026-06-22.
export const AUSTRALIA_STATE_REGULATORY_TIERS = {
  'AU-WA': 'medical_limited_trade', // Western Australia
  'AU-NT': 'medical_limited_trade', // Northern Territory
  'AU-SA': 'medical_limited_trade', // South Australia
  'AU-QLD': 'medical_limited_trade', // Queensland
  'AU-NSW': 'medical_limited_trade', // New South Wales
  'AU-VIC': 'medical_limited_trade', // Victoria
  'AU-TAS': 'medical_limited_trade', // Tasmania
  'AU-ACT': 'medical_limited_trade', // Australian Capital Territory
} as const satisfies Record<string, RegulatoryTier>
