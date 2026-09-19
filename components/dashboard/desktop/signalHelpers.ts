/** Shared signal classification helpers for desktop Command pages. */

export type SignalGroup =
  | 'REGULATORY'
  | 'MARKET ACCESS'
  | 'SUPPLY CHAIN'
  | 'TESTING & COMPLIANCE'
  | 'EXPORT / BUYER MOVEMENT'
  | 'EVIDENCE UPDATES'

export function deriveSignalGroup(title: string): SignalGroup {
  const t = title.toLowerCase()
  if (/export|import|buyer|gacp|eu.gmp|international/.test(t)) return 'EXPORT / BUYER MOVEMENT'
  if (/test|coa|compliance|qa|quality|lab|microbial|pesticide|threshold/.test(t)) return 'TESTING & COMPLIANCE'
  if (/supply|packaging|shipping|logistics|lead.time|transport/.test(t)) return 'SUPPLY CHAIN'
  if (/retail|dispensary|demand|patient|consumer|pos|sales/.test(t)) return 'MARKET ACCESS'
  if (/study|evidence|research|clinical|terpene|data/.test(t)) return 'EVIDENCE UPDATES'
  return 'REGULATORY'
}

export function derivePolicyArea(title: string): string {
  const t = title.toLowerCase()
  if (/tax/.test(t)) return 'Taxation'
  if (/packag|label/.test(t)) return 'Packaging & Labeling'
  if (/advertis/.test(t)) return 'Marketing & Advertising'
  if (/record|retention/.test(t)) return 'Recordkeeping & Compliance'
  if (/test|lab|coa|microbial|pesticide/.test(t)) return 'Laboratory Testing & QC'
  if (/licen|permit|cap|moratorium/.test(t)) return 'Licensing & Permits'
  if (/zon|local|municipal/.test(t)) return 'Local Zoning & Ordinance'
  if (/track|trace|system|software/.test(t)) return 'Track & Trace'
  return 'Regulatory & Policy'
}

export function deriveImpact(conf: number): 'High' | 'Medium' | 'Low' {
  return conf >= 80 ? 'High' : conf >= 65 ? 'Medium' : 'Low'
}

export const SIG_GROUP_ICONS: Record<SignalGroup, string> = {
  'REGULATORY': '◎',
  'MARKET ACCESS': '⊞',
  'SUPPLY CHAIN': '⬡',
  'TESTING & COMPLIANCE': '⬟',
  'EXPORT / BUYER MOVEMENT': '◈',
  'EVIDENCE UPDATES': '⊟',
}

export const SIG_GROUP_ORDER: SignalGroup[] = [
  'REGULATORY',
  'MARKET ACCESS',
  'SUPPLY CHAIN',
  'TESTING & COMPLIANCE',
  'EXPORT / BUYER MOVEMENT',
  'EVIDENCE UPDATES',
]
