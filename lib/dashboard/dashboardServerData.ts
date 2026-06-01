import 'server-only'
import { listIaSignals } from '@/lib/intelligence-automation/db'
import { automationSignals } from '@/lib/intelligence-automation/fixtures'
import type { AutomationSignal } from '@/lib/intelligence-automation/types'
import type { DashboardSignal } from './dashboardShared'

// ── Signal tag display mapping ────────────────────────────────────────────────
export const SIGNAL_TAG_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  regulatory_change:        { label: 'REGULATION',   color: '#D9A441', bg: 'rgba(217,164,65,0.15)',  border: 'rgba(217,164,65,0.35)'  },
  importer_activity:        { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  buyer_demand:             { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  pricing_availability:     { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  market_entry_opportunity: { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
  documentation_readiness:  { label: 'COMPLIANCE',   color: '#5DAFC8', bg: 'rgba(59,130,160,0.15)',  border: 'rgba(59,130,160,0.30)'  },
  new_product_category:     { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  relationship_opportunity: { label: 'TRADE',        color: '#B07ED4', bg: 'rgba(139,95,168,0.15)',  border: 'rgba(139,95,168,0.30)'  },
  equipment_surplus:        { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  distressed_asset:         { label: 'SUPPLY CHAIN', color: '#D49560', bg: 'rgba(184,115,51,0.15)',  border: 'rgba(184,115,51,0.30)'  },
  facility_expansion:       { label: 'INVESTMENT',   color: '#8AAFE8', bg: 'rgba(100,149,237,0.12)', border: 'rgba(100,149,237,0.25)' },
  distributor_activity:     { label: 'MARKET',       color: '#6FCF7D', bg: 'rgba(111,207,125,0.12)', border: 'rgba(111,207,125,0.30)' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export type { DashboardSignal } from './dashboardShared'

function shapeSignals(signals: AutomationSignal[], limit: number): DashboardSignal[] {
  return signals
    .filter(s => s.stage !== 'archived')
    .slice(0, limit)
    .map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      market: s.market,
      tag: SIGNAL_TAG_MAP[s.type] ?? { label: 'INTEL', color: '#D9A441', bg: 'rgba(217,164,65,0.12)', border: 'rgba(217,164,65,0.28)' },
      timeAgo: timeAgo(s.detectedAt),
      confidence: s.confidence,
      commercialImpact: s.commercialImpact,
    }))
}

export async function fetchDashboardSignals(limit = 8): Promise<DashboardSignal[]> {
  try {
    const result = await listIaSignals()
    if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
      return shapeSignals(result.data, limit)
    }
  } catch { /* fall through */ }
  return shapeSignals(automationSignals, limit)
}

// ── Role display mapping ──────────────────────────────────────────────────────
export { ROLE_PROFILES } from './dashboardShared'

// ── Education categories per role ─────────────────────────────────────────────
const ROLE_EDU_CATEGORIES: Record<string, { icon: string; title: string; desc: string }[]> = {
  doctor_prescriber: [
    { icon: '🩺', title: 'Prescribing Pathways',  desc: 'Clinical protocols & authorisation' },
    { icon: '💊', title: 'Dosage & Formulations', desc: 'Dosing guidance by condition'       },
    { icon: '⚖️', title: 'Country Rules',          desc: 'Jurisdiction-specific law'          },
    { icon: '📋', title: 'GMP Standards',          desc: 'Product quality requirements'       },
    { icon: '📖', title: 'Clinical Evidence',      desc: 'Research & trial summaries'         },
    { icon: '🔬', title: 'Pharmacology',           desc: 'Cannabinoid mechanism & effects'    },
  ],
  pharmacist: [
    { icon: '💊', title: 'Pharmacists',            desc: 'Dispensing & interaction safety'    },
    { icon: '📐', title: 'Dosage Education',       desc: 'Personalised dosing protocols'      },
    { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Regulatory framework'               },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal requirements'        },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Manufacturing quality'              },
    { icon: '🔬', title: 'Drug Interactions',      desc: 'Contraindications & safety'         },
  ],
  importer: [
    { icon: '📦', title: 'Import Frameworks',      desc: 'Licences & pathway requirements'    },
    { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Regulatory framework'               },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Market access by jurisdiction'      },
    { icon: '🤝', title: 'Trade & Access',         desc: 'Partner & counterparty guidance'    },
    { icon: '🏛️', title: 'GMP Standards',          desc: 'Product certification'              },
    { icon: '📜', title: 'Documentation',          desc: 'Permits, COAs & customs'            },
  ],
  exporter: [
    { icon: '✈️', title: 'Export Regulations',     desc: 'Export licences & pathways'         },
    { icon: '📜', title: 'Documentation',          desc: 'COA, GMP & permit requirements'     },
    { icon: '🗺️', title: 'Market Access',          desc: 'Target market frameworks'           },
    { icon: '⚖️', title: 'Compliance',             desc: 'Destination country rules'          },
    { icon: '🤝', title: 'Trade Partners',         desc: 'Buyer & distributor guidance'       },
    { icon: '📦', title: 'Logistics & Customs',    desc: 'Shipping & GDP requirements'        },
  ],
  investor_operator: [
    { icon: '📈', title: 'Market Analysis',        desc: 'Opportunity & risk assessment'      },
    { icon: '⚖️', title: 'Regulatory Landscape',  desc: 'Policy & law overview'              },
    { icon: '🏗️', title: 'Operations',             desc: 'Setup & compliance requirements'    },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Jurisdiction deep-dives'            },
    { icon: '💼', title: 'Deal Structures',        desc: 'Investment models'                  },
    { icon: '📊', title: 'Financial Models',       desc: 'Projections & benchmarks'           },
  ],
  regulatory_compliance: [
    { icon: '⚖️', title: 'Regulatory Frameworks', desc: 'Jurisdiction law & guidance'        },
    { icon: '📋', title: 'GMP & Quality',          desc: 'Manufacturing standards'            },
    { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal requirements'        },
    { icon: '🏛️', title: 'Audit Readiness',        desc: 'Inspection preparation'             },
    { icon: '📜', title: 'Licence Pathways',       desc: 'Application & renewal'              },
    { icon: '🔍', title: 'Enforcement Trends',     desc: 'Regulatory action monitoring'       },
  ],
}

const DEFAULT_EDU = [
  { icon: '🩺', title: 'Doctors & Prescribers', desc: 'Clinical guidance & prescribing'  },
  { icon: '💊', title: 'Pharmacists',            desc: 'Dosing, interactions & safety'    },
  { icon: '📐', title: 'Dosage Education',       desc: 'Personalise dosing'               },
  { icon: '⚖️', title: 'Compliance & Reg.',      desc: 'Stay audit-ready'                 },
  { icon: '🗺️', title: 'Country Rules',          desc: 'Regional legal framework'         },
  { icon: '🏛️', title: 'GMP Standards',          desc: 'Manufacturing compliance'          },
]

export function getEduCategoriesForRole(roleId?: string) {
  return ROLE_EDU_CATEGORIES[roleId ?? ''] ?? DEFAULT_EDU
}

// ── Country status bar data ───────────────────────────────────────────────────
export type CountryStatusBar = {
  status: string;       statusColor: string
  opportunity: string;  opportunityColor: string
  regulatory: string;   regulatoryColor: string
  activity: string;     activityColor: string
  score: number;        adultUse: string; medicalUse: string
}

const STATUS_DATA: Record<string, CountryStatusBar> = {
  DE: { status:'Market Open',    statusColor:'#6FCF7D', opportunity:'Very High', opportunityColor:'#D9A441', regulatory:'Progressive', regulatoryColor:'#6FCF7D', activity:'Very Strong', activityColor:'#D9A441', score:91, adultUse:'Legal',      medicalUse:'Legal'     },
  AU: { status:'Market Open',    statusColor:'#6FCF7D', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Established', regulatoryColor:'#6FCF7D', activity:'Strong',      activityColor:'#D9A441', score:84, adultUse:'Limited',    medicalUse:'Legal'     },
  CA: { status:'Market Open',    statusColor:'#6FCF7D', opportunity:'Very High', opportunityColor:'#D9A441', regulatory:'Mature',      regulatoryColor:'#6FCF7D', activity:'Very Strong', activityColor:'#D9A441', score:95, adultUse:'Legal',      medicalUse:'Legal'     },
  BR: { status:'Developing',     statusColor:'#D9A441', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Growing',     activityColor:'#D9A441', score:68, adultUse:'Restricted', medicalUse:'Limited'   },
  IL: { status:'Market Open',    statusColor:'#6FCF7D', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Favorable',   regulatoryColor:'#6FCF7D', activity:'Strong',      activityColor:'#D9A441', score:79, adultUse:'Limited',    medicalUse:'Legal'     },
  FR: { status:'Partial Access', statusColor:'#D9A441', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Moderate',    activityColor:'#B8C0C8', score:54, adultUse:'None',       medicalUse:'Limited'   },
  IT: { status:'Partial Access', statusColor:'#D9A441', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Developing',  activityColor:'#B8C0C8', score:51, adultUse:'None',       medicalUse:'Limited'   },
  NL: { status:'Partial Access', statusColor:'#D9A441', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Active',      activityColor:'#D9A441', score:62, adultUse:'Tolerated',  medicalUse:'Legal'     },
  PT: { status:'Partial Access', statusColor:'#D9A441', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Progressive', regulatoryColor:'#6FCF7D', activity:'Growing',     activityColor:'#D9A441', score:67, adultUse:'Tolerated',  medicalUse:'Legal'     },
  PL: { status:'Partial Access', statusColor:'#D9A441', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Moderate',    activityColor:'#B8C0C8', score:48, adultUse:'None',       medicalUse:'Limited'   },
  US: { status:'Complex',        statusColor:'#D9A441', opportunity:'Very High', opportunityColor:'#D9A441', regulatory:'Complex',     regulatoryColor:'#D49560', activity:'Very Strong', activityColor:'#D9A441', score:71, adultUse:'State Only', medicalUse:'State Only'},
  GB: { status:'Under Review',   statusColor:'#5DAFC8', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Under Review',regulatoryColor:'#5DAFC8', activity:'Developing',  activityColor:'#B8C0C8', score:47, adultUse:'None',       medicalUse:'Limited'   },
  CZ: { status:'Under Review',   statusColor:'#5DAFC8', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Developing',  activityColor:'#B8C0C8', score:52, adultUse:'None',       medicalUse:'Limited'   },
  DK: { status:'Under Review',   statusColor:'#5DAFC8', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Developing',  activityColor:'#B8C0C8', score:49, adultUse:'None',       medicalUse:'Limited'   },
  CH: { status:'Under Review',   statusColor:'#5DAFC8', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Progressive', regulatoryColor:'#6FCF7D', activity:'Moderate',    activityColor:'#B8C0C8', score:55, adultUse:'None',       medicalUse:'Limited'   },
  NZ: { status:'Market Open',    statusColor:'#6FCF7D', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Favorable',   regulatoryColor:'#6FCF7D', activity:'Strong',      activityColor:'#D9A441', score:78, adultUse:'Limited',    medicalUse:'Legal'     },
  CO: { status:'Request Only',   statusColor:'#6F7A86', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Developing',  activityColor:'#B8C0C8', score:44, adultUse:'Restricted', medicalUse:'Legal'     },
  TH: { status:'Partial Access', statusColor:'#D9A441', opportunity:'High',      opportunityColor:'#D9A441', regulatory:'Evolving',    regulatoryColor:'#D9A441', activity:'Growing',     activityColor:'#D9A441', score:65, adultUse:'Restricted', medicalUse:'Legal'     },
  MT: { status:'Request Only',   statusColor:'#6F7A86', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Limited',     activityColor:'#B8C0C8', score:42, adultUse:'Limited',    medicalUse:'Legal'     },
  LU: { status:'Request Only',   statusColor:'#6F7A86', opportunity:'Medium',    opportunityColor:'#B8C0C8', regulatory:'Developing',  regulatoryColor:'#D9A441', activity:'Limited',     activityColor:'#B8C0C8', score:40, adultUse:'Legal',      medicalUse:'Legal'     },
}

const EMPTY_STATUS: CountryStatusBar = {
  status: 'Select Market', statusColor: '#6F7A86',
  opportunity: 'Not Selected', opportunityColor: '#6F7A86',
  regulatory: 'Not Selected', regulatoryColor: '#6F7A86',
  activity: 'No Market Selected', activityColor: '#6F7A86',
  score: 0, adultUse: '—', medicalUse: '—',
}

const FALLBACK_STATUS: CountryStatusBar = {
  status: 'Intelligence Pending', statusColor: '#6F7A86',
  opportunity: 'Under Assessment', opportunityColor: '#6F7A86',
  regulatory: 'Unknown', regulatoryColor: '#6F7A86',
  activity: 'Limited Data', activityColor: '#6F7A86',
  score: 0, adultUse: '—', medicalUse: '—',
}

export function getEmptyCountryStatusBar(): CountryStatusBar {
  return EMPTY_STATUS
}

export function getCountryStatusBar(iso2: string | null | undefined): CountryStatusBar {
  if (!iso2) return EMPTY_STATUS
  return STATUS_DATA[iso2.toUpperCase()] ?? FALLBACK_STATUS
}
