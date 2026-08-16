// lib/dashboard/dashboardShared.ts
// Constants and types shared between server and client dashboard components.
// NO 'server-only' — safe to import from 'use client' components.

import type { RoleId } from '@/types/globe-router'
import type { DigestDeltaStatus, DigestPriorityDomain } from '@/lib/signals/digestDelta'

export type DashboardSignal = {
  id: string
  slug?: string          // present for editorial signals; undefined for IA/curated
  title: string
  type: string
  market: string
  tag: { label: string; color: string; bg: string; border: string }
  timeAgo: string
  confidence: number
  commercialImpact: string
  /** Safe authenticated presentation fields. Raw/private signal analysis never belongs in this DTO. */
  summary?: string
  sourceLabel?: string   // source attribution (regulator name or 'Harbourview Intelligence'); optional — not all signal sources supply it
  sourceUrl?: string     // link to the original article for editorial content; optional
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
  flag?: string          // country flag emoji; optional — not all signal sources supply it
  /** Canonical first-slice Decision Intelligence event identifier when this feed row can resolve to a dossier. */
  decisionIntelEventId?: string
  /** Decision posture carried from the same rule used by the first-slice assessment/recommendation backfill. */
  decisionRecommendationState?: 'act_now' | 'investigate' | 'monitor' | 'no_action'
  // 'signal' (default): trade/regulatory intelligence — confidence bar + category chip.
  // 'editorial': mainstream-media cannabis news/commentary — no confidence score,
  // no commercial-impact framing, rendered as a plain headline + why-it-matters card.
  contentType?: 'signal' | 'editorial'
  // LLM-generated synthesis (what changed, who's affected, deadline,
  // recommended action, confidence rationale) — the analysis layer, not
  // just a bare headline. Optional: only present once hv-signal-analysis
  // has processed a given signal; older/unanalyzed signals fall back to
  // commercialImpact alone.
  analysis?: {
    what_changed?: string
    who_is_affected?: string
    deadline?: string | null
    recommended_action?: string
    confidence_rationale?: string
  }

  // ── Daily Brief cross-edition delta metadata ──────────────────────────────
  // Present only on curated Daily Brief signal cards. Optional so older
  // editions and the live ranked fallback remain backward compatible.
  eventKey?: string | null
  priorEventKey?: string | null
  deltaStatus?: DigestDeltaStatus | null
  advancementReason?: string | null
  jurisdiction?: string
  entities?: string[]
  priorityDomain?: DigestPriorityDomain
  competitivePositionChange?: boolean
  competitivePositionDetail?: string | null

  // ── Quality-brain display fields (Pipeline B) ───────────────────────────────
  // Computed upstream; optional so older/fixture rows keep working.
  /** How many related source observations in this feed report the same development. */
  corroborationCount?: number
  /** True when headline/summary shown are machine-translated. */
  translated?: boolean
  /** e.g. "Portuguese" when source language was not English. */
  originalLanguageLabel?: string | null
  /** Classifier route taxonomy: regulatory | market | story | research */
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
  lab_qa:                     { label: 'Lab / QA',                  short: 'Lab/QA'      },
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
