// lib/dashboard/dashboardShared.ts
// Constants and types shared between server and client dashboard components.
// NO 'server-only' — safe to import from 'use client' components.

import type { RoleId } from '@/types/globe-router'

export type DashboardSignal = {
  id: string
  slug?: string
  title: string
  type: string
  market: string
  tag: { label: string; color: string; bg: string; border: string }
  timeAgo: string
  confidence: number
  commercialImpact: string
  summary?: string
  sourceLabel?: string
  sourceUrl?: string
  publishedAt?: string
  verificationStatus?: string
  jurisdictions?: string[]
  counterparties?: string[]
  facilities?: string[]
  licencesCertifications?: string[]
  products?: string[]
  marketAccess?: string[]
  verifiedFacts?: string[]
  inferences?: string[]
  transactionStage?: string
  image?: { url?: string; status?: string }
  flag?: string
  contentType?: 'signal' | 'editorial'
  /** Sanitized presentation synthesis only. Raw/private analysis never belongs in this DTO. */
  analysis?: {
    what_changed?: string
    who_is_affected?: string
    deadline?: string | null
    recommended_action?: string
  }

  // ── Quality-brain display fields (Pipeline B) ───────────────────────────────
  corroborationCount?: number
  translated?: boolean
  originalLanguageLabel?: string | null
  signalContentType?: string | null
}

export type DigestWindow = '24h' | '7d' | '30d' | 'recent'

export const ROLE_PROFILES: Partial<Record<RoleId, { label: string; short: string }>> = {
  doctor_prescriber:          { label: 'Doctor / Prescriber',      short: 'Doctor'      },
  pharmacist:                 { label: 'Pharmacist',               short: 'Pharmacist'  },
  budtender:                  { label: 'Budtender',                short: 'Budtender'   },
  cultivator_producer:        { label: 'Cultivator / Producer',    short: 'Cultivator'  },
  geneticist_breeder:         { label: 'Geneticist / Breeder',     short: 'Geneticist'  },
  processor_extractor:        { label: 'Processor / Extractor',    short: 'Processor'   },
  lab_qa:                     { label: 'Lab / QA',                 short: 'Lab/QA'      },
  importer:                   { label: 'Importer / Buyer',         short: 'Importer'    },
  exporter:                   { label: 'Exporter / Supplier',      short: 'Exporter'    },
  distributor_wholesaler:     { label: 'Distributor / Wholesaler', short: 'Distributor' },
  clinic_healthcare_operator: { label: 'Clinic / Healthcare Op.',  short: 'Clinic Op.'  },
  retail_operator:            { label: 'Retail Operator',          short: 'Retail'      },
  regulatory_compliance:      { label: 'Regulatory / Compliance',  short: 'Compliance'  },
  legal_advisory:             { label: 'Legal / Advisory',         short: 'Legal'       },
  investor_operator:          { label: 'Investor / Operator',      short: 'Investor'    },
  government_regulator:       { label: 'Government Regulator',     short: 'Regulator'   },
  patient_caregiver_education:{ label: 'Patient / Caregiver',      short: 'Patient Ed.' },
  gmp_quality:                { label: 'GMP / Quality',            short: 'GMP/QA'      },
  logistics_customs:          { label: 'Logistics / Customs',      short: 'Logistics'   },
  not_sure:                   { label: 'Not Sure Yet',             short: 'General'     },
}
