/**
 * Provider-neutral Harbourview data contracts.
 *
 * Rule: UI/routes depend on these contracts, never directly on a database SDK.
 * Each logical record has exactly one authoritative owner.
 */
export type DataHealth = 'healthy' | 'degraded' | 'unavailable'

export type HarbourviewIdPrefix =
  | 'usr' | 'org' | 'wrk' | 'jur' | 'reg' | 'sig' | 'src' | 'evd' | 'cmp' | 'lic' | 'doc' | 'job' | 'evt'

export type HarbourviewId = `${HarbourviewIdPrefix}_${string}`

export interface DependencyHealth {
  name: 'core' | 'identity' | 'intelligence' | 'evidence' | 'cache' | 'events' | 'search' | 'analytics'
  status: DataHealth
  latencyMs?: number
  checkedAt: string
  detail?: string
}

export interface EvidencePointer {
  id: HarbourviewId
  objectKey: string
  sha256: string
  sourceUrl: string
  retrievedAt: string
  contentType: string
  parserVersion?: string
}

export interface IntelligenceProvenance {
  sourceQuality: number
  extractionConfidence: number
  freshnessScore: number
  verificationStatus: 'verified' | 'high_confidence' | 'developing' | 'conflicting' | 'stale'
  primarySource: boolean
  lastVerifiedAt?: string
  evidenceIds: HarbourviewId[]
}

export interface CoreRepository {
  health(): Promise<DependencyHealth>
}

export interface IntelligenceRepository {
  health(): Promise<DependencyHealth>
}

export interface EvidenceRepository {
  health(): Promise<DependencyHealth>
  put(pointer: EvidencePointer, body: Uint8Array): Promise<void>
}

export interface CacheRepository {
  health(): Promise<DependencyHealth>
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
}

export interface EventEnvelope<T = unknown> {
  id: HarbourviewId
  type: string
  occurredAt: string
  aggregateId: HarbourviewId
  schemaVersion: number
  payload: T
}

export interface EventPublisher {
  health(): Promise<DependencyHealth>
  publish<T>(event: EventEnvelope<T>): Promise<void>
}
