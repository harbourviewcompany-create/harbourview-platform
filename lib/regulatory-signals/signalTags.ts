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

// Maps regulatory signal types → the tag key above
export const REG_TYPE_TO_TAG: Record<string, string> = {
  regulatory_change:               'regulatory_change',
  policy_announcement:             'regulatory_change',
  controlled_substance_scheduling: 'regulatory_change',
  consultation_pending_rule_change:'regulatory_change',
  court_agency_decision:           'regulatory_change',
  import_export_pathway:           'new_product_category',
  customs_trade_requirement:       'new_product_category',
  licensing_market_access:         'importer_activity',
  prescription_patient_access:     'importer_activity',
  hemp_cbd_controlled_cannabinoids:'importer_activity',
  enforcement_compliance_action:   'documentation_readiness',
  quality_standard_requirement:    'documentation_readiness',
}

export const INTEL_TAG_FALLBACK: SignalTag = {
  label: 'INTEL', color: '#D9A441', bg: 'rgba(217,164,65,0.12)', border: 'rgba(217,164,65,0.28)',
}
