export const DATA_OWNERSHIP = {
  account: 'core',
  organization: 'core',
  membership: 'core',
  workspace: 'core',
  workflowState: 'core',
  jurisdiction: 'intelligence',
  regulation: 'intelligence',
  regulatorySignal: 'intelligence',
  intelligenceProvenance: 'intelligence',
  originalEvidence: 'evidence',
  cache: 'cache',
  eventDelivery: 'events',
  searchIndex: 'search',
  analyticsProjection: 'analytics',
} as const

export type HarbourviewDataKind = keyof typeof DATA_OWNERSHIP
export type HarbourviewDataOwner = (typeof DATA_OWNERSHIP)[HarbourviewDataKind]

export function ownerFor(kind: HarbourviewDataKind): HarbourviewDataOwner {
  return DATA_OWNERSHIP[kind]
}
