import type { RegulatorySignalType } from './types'

export const REGULATORY_SIGNAL_TYPE_LABELS: Record<RegulatorySignalType, string> = {
  regulatory_change: 'Regulatory Changes',
  policy_announcement: 'Policy Announcements',
  import_export_pathway: 'Import and Export Pathways',
  licensing_market_access: 'Licensing and Market Access',
  prescription_patient_access: 'Prescription and Patient Access',
  hemp_cbd_controlled_cannabinoids: 'Hemp, CBD and Controlled Cannabinoids',
  enforcement_compliance_action: 'Enforcement and Compliance Actions',
  consultation_pending_rule_change: 'Consultations and Pending Rule Changes',
  court_agency_decision: 'Court and Agency Decisions',
  controlled_substance_scheduling: 'Controlled Substance Scheduling',
  customs_trade_requirement: 'Customs and Trade Requirements',
  quality_standard_requirement: 'Quality Standard Requirements',
}

export const REGULATORY_SIGNALS_DISCLAIMER =
  'Harbourview Signals is provided for commercial intelligence purposes only. It is not legal, medical, investment or compliance advice. Operators should confirm requirements with qualified local counsel, regulators and licensed counterparties before acting.'
