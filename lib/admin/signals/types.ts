import type { AdminSignalKind } from './contract'

export type AdminSignalDTO = {
  key: string
  id: string
  kind: AdminSignalKind
  headline: string
  summary: string | null
  jurisdiction: string | null
  observedAt: string | null
  priority: 'urgent' | 'high' | 'normal' | 'low'
  score: number | null
  confidence: string | null
  reviewState: string
  sourceLabel: string | null
  sourceUrl: string | null
  lane: string | null
  privateSummary: string | null
  publicSummary: string | null
  publicImplication: string | null
  publicSafe: boolean | null
  publishToPublic: boolean | null
  allowedActions: Array<'approve' | 'reject' | 'open_curated_review'>
}

export type AdminSignalReviewSnapshot = {
  generatedAt: string
  signals: AdminSignalDTO[]
  sources: Array<{
    kind: AdminSignalKind
    state: 'loaded' | 'degraded'
    count: number
    error?: string
  }>
}
