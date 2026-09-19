/**
 * Role → Command Centre defaults.
 * Keys are ROLE_PROFILES `.short` labels as shown in the desktop shell.
 */
import type { CommandPage } from '@/components/dashboard/CommandCentre'

export type RoleCommandDefault = {
  /** Landing page when the user has no explicit ?page= */
  home: CommandPage
  /** Ordered secondary pages for Briefing priority actions */
  priorities: CommandPage[]
  /** Optional operator hint under Briefing priorities */
  focus: string
}

const DEFAULT: RoleCommandDefault = {
  home: 'briefing',
  priorities: ['signals', 'regulatory', 'marketplace'],
  focus: 'Monitor jurisdiction posture and act on high-confidence signals',
}

/** Map Command UI role short-label → defaults */
export const ROLE_COMMAND_DEFAULTS: Record<string, RoleCommandDefault> = {
  Doctor: {
    home: 'clinical',
    priorities: ['clinical', 'access-pathway', 'regulatory'],
    focus: 'Prescribing framework, formulary, and clinical authorizations',
  },
  Pharmacist: {
    home: 'access-pathway',
    priorities: ['access-pathway', 'licences', 'regulatory'],
    focus: 'Dispensing authority, permits, and formulary changes',
  },
  Budtender: {
    home: 'education',
    priorities: ['education', 'marketplace', 'regulatory'],
    focus: 'Product knowledge, retail rules, and approved SKUs',
  },
  Cultivator: {
    home: 'briefing',
    priorities: ['licences', 'prices', 'access-pathway'],
    focus: 'Licence posture, wholesale pricing, and production pathways',
  },
  Geneticist: {
    home: 'genetics',
    priorities: ['genetics', 'evidence', 'regulatory'],
    focus: 'Cultivar passports, evidence, and IP/variety rules',
  },
  Processor: {
    home: 'compliance',
    priorities: ['licences', 'access-pathway', 'compliance'],
    focus: 'Processing licences, GMP pathway, and quality obligations',
  },
  'Lab/QA': {
    home: 'evidence',
    priorities: ['evidence', 'compliance', 'regulatory'],
    focus: 'Testing standards, COA expectations, and lab accreditation',
  },
  Importer: {
    home: 'marketplace',
    priorities: ['marketplace', 'access-pathway', 'trade-calc'],
    focus: 'Supply, import permits, and landed-cost realism',
  },
  Exporter: {
    home: 'marketplace',
    priorities: ['marketplace', 'access-pathway', 'logistics'],
    focus: 'Buyer demand, export permits, and corridor logistics',
  },
  Distributor: {
    home: 'logistics',
    priorities: ['logistics', 'licences', 'banking'],
    focus: 'GDP logistics, distribution licences, and payment rails',
  },
  'Clinic Op.': {
    home: 'clinical',
    priorities: ['clinical', 'access-pathway', 'kyb'],
    focus: 'Clinical ops, authorization pathway, and partner verification',
  },
  Retail: {
    home: 'marketplace',
    priorities: ['licences', 'marketplace', 'regulatory'],
    focus: 'Retail licence, approved listings, and sales rules',
  },
  Compliance: {
    home: 'compliance',
    priorities: ['compliance', 'regulatory', 'licences'],
    focus: 'Regulatory change, licence portfolio, and audit readiness',
  },
  Legal: {
    home: 'compliance',
    priorities: ['compliance', 'kyb', 'regulatory'],
    focus: 'Legal risk, counterparty diligence, and statute change',
  },
  Investor: {
    home: 'briefing',
    priorities: ['signals', 'marketplace', 'prices'],
    focus: 'Market signals, deal flow, and pricing benchmarks',
  },
  Regulator: {
    home: 'regulatory',
    priorities: ['regulatory', 'evidence', 'countries'],
    focus: 'Cross-jurisdiction standards and reform tracking',
  },
  'Patient Ed.': {
    home: 'education',
    priorities: ['education', 'clinical', 'access-pathway'],
    focus: 'Patient education and access pathway orientation',
  },
  'GMP/QA': {
    home: 'compliance',
    priorities: ['compliance', 'evidence', 'licences'],
    focus: 'GMP/GACP requirements, CAPA, and certification',
  },
  Logistics: {
    home: 'logistics',
    priorities: ['logistics', 'trade-calc', 'access-pathway'],
    focus: 'Controlled-substance logistics and corridor cost',
  },
}

export function getRoleCommandDefault(roleShort: string | null | undefined): RoleCommandDefault {
  if (!roleShort) return DEFAULT
  return ROLE_COMMAND_DEFAULTS[roleShort] ?? DEFAULT
}

export function resolveCommandHome(
  roleShort: string | null | undefined,
  explicitPage?: string | null,
): CommandPage {
  if (explicitPage && explicitPage.length > 0) return explicitPage as CommandPage
  return getRoleCommandDefault(roleShort).home
}
