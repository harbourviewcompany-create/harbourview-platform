import type { RegulatorySignalType } from './types'

export const REGULATORY_SIGNAL_TYPE_LABELS: Record<RegulatorySignalType, string> = {
  licensing_market_access: 'Licensing and Market Access',
  prescription_patient_access: 'Prescription and Patient Access',
  import_export_pathway: 'Import and Export Pathways',
  enforcement_action: 'Enforcement Actions',
  policy_consultation: 'Policy Consultations',
  legislation_change: 'Legislation Changes',
  quota_allocation: 'Quota Allocations',
  regulatory_guidance: 'Regulatory Guidance',
  court_decision: 'Court Decisions',
  trade_agreement: 'Trade Agreements',
  international_treaty: 'International Treaties',
  pharmaceutical_reclassification: 'Pharmaceutical Reclassification',
  hemp_cbd_boundary: 'Hemp, CBD and Controlled Cannabinoids',
  industrial_use_access: 'Industrial Use Access',
  professional_access: 'Professional Access',
  research_access: 'Research Access',
  enforcement_risk: 'Enforcement Risk',
  market_exit: 'Market Exit',
}

export const REGULATORY_SIGNALS_DISCLAIMER =
  'Harbourview Signals is provided for commercial intelligence purposes only. It is not legal, medical, investment or compliance advice. Operators should confirm requirements with qualified local counsel, regulators and licensed counterparties before acting.'
