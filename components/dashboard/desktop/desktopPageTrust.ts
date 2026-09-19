import type { CommandPage } from '../CommandCentre'

export type DesktopDataSource = 'live' | 'reference' | 'mixed'

export type DesktopPageTrust = {
  dataSource: DesktopDataSource
  /** Short operator-facing scope note */
  hint?: string
}

/** Canonical trust map — keep aligned with mobile SECTION trust rules. */
export const DESKTOP_PAGE_TRUST: Partial<Record<CommandPage, DesktopPageTrust>> = {
  briefing: { dataSource: 'mixed', hint: 'Operating picture + live lanes' },
  digest: { dataSource: 'live', hint: 'Synthesized signal window' },
  signals: { dataSource: 'live', hint: 'Pipeline signals' },
  marketplace: { dataSource: 'live', hint: 'Reviewed commercial records' },
  regulatory: { dataSource: 'live', hint: 'Watchlist + signal hits' },
  'local-intel': { dataSource: 'mixed', hint: 'Reviewed local layer' },
  watchlist: { dataSource: 'live', hint: 'Active watch rules' },
  evidence: { dataSource: 'mixed', hint: 'Sources + coverage' },
  education: { dataSource: 'reference', hint: 'Published modules' },
  'access-pathway': { dataSource: 'mixed', hint: 'Pathway playbook' },
  genetics: { dataSource: 'mixed', hint: 'Public cultivar passports' },
  clinical: { dataSource: 'mixed', hint: 'Clinical workspace' },
  compliance: { dataSource: 'mixed', hint: 'Regulatory posture' },
  countries: { dataSource: 'reference', hint: 'Directory' },
  assistant: { dataSource: 'live', hint: 'Session assistant' },
  documents: { dataSource: 'live', hint: 'Evidence documents' },
  events: { dataSource: 'mixed', hint: 'Calendar + intel' },
  experts: { dataSource: 'reference', hint: 'Directory' },
  banking: { dataSource: 'reference', hint: 'Directory' },
  notifications: { dataSource: 'live', hint: 'Operator alerts' },
  kyb: { dataSource: 'live', hint: 'Verification workflow' },
  prices: { dataSource: 'mixed', hint: 'Market metrics' },
  logistics: { dataSource: 'reference', hint: 'Directory' },
  jobs: { dataSource: 'live', hint: 'Talent feed' },
  talent: { dataSource: 'live', hint: 'Talent feed' },
  insurance: { dataSource: 'reference', hint: 'Directory' },
  licences: { dataSource: 'mixed', hint: 'Licence tracker' },
  'trade-calc': { dataSource: 'reference', hint: 'Calculator' },
  organization: { dataSource: 'live', hint: 'Org context' },
  settings: { dataSource: 'reference', hint: 'Billing & plan' },
}
