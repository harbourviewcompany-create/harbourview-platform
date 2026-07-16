// Signal type → display tag mapping — single source of truth for signal UI colours/labels.
// Imported by dashboardServerData.ts; previously duplicated inline there.

export type SignalTag = { label: string; color: string; bg: string; border: string }

export const SIGNAL_TAG_MAP: Record<string, SignalTag> = {
  regulatory_change:        { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:        { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:             { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  pricing_availability:     { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  market_entry_opportunity: { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  distributor_activity:     { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  documentation_readiness:  { label: 'COMPLIANCE',   color: '#5DAFC8', bg: 'rgba(59,130,160,0.15)',  border: 'rgba(59,130,160,0.30)'  },
  new_product_category:     { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  relationship_opportunity: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  equipment_surplus:        { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  distressed_asset:         { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  facility_expansion:       { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
}

// Maps regulatory signal types → the tag key above.
// Keys must match the live `regulatory_signals_type_check` CHECK constraint
// values (see lib/regulatory-signals/types.ts) or the lookup silently misses
// and falls back to INTEL_TAG_FALLBACK.
export const REG_TYPE_TO_TAG: Record<string, string> = {
  regulatory_guidance:              'regulatory_change',
  policy_consultation:              'regulatory_change',
  legislation_change:               'regulatory_change',
  pharmaceutical_reclassification:  'regulatory_change',
  court_decision:                   'regulatory_change',
  international_treaty:             'regulatory_change',
  market_exit:                      'regulatory_change',
  import_export_pathway:            'new_product_category',
  trade_agreement:                  'new_product_category',
  quota_allocation:                 'new_product_category',
  industrial_use_access:            'new_product_category',
  licensing_market_access:          'importer_activity',
  prescription_patient_access:      'importer_activity',
  hemp_cbd_boundary:                'importer_activity',
  professional_access:              'importer_activity',
  enforcement_action:               'documentation_readiness',
  enforcement_risk:                 'documentation_readiness',
  research_access:                  'documentation_readiness',
}

export const INTEL_TAG_FALLBACK: SignalTag = {
  label: 'INTEL', color: '#D9A441', bg: 'rgba(217,164,65,0.12)', border: 'rgba(217,164,65,0.28)',
}
