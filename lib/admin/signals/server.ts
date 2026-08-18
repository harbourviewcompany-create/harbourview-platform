import 'server-only'
import { listEngineReviewQueue } from '@/lib/signals-engine/admin'
import { listRegulatoryReviewQueue } from '@/lib/regulatory-signals/admin'
import type { RegulatorySignalRecord } from '@/lib/regulatory-signals/types'
import type { AdminSignalDTO, AdminSignalReviewSnapshot } from './types'

function enginePriority(pri: string | null, score: number | null): AdminSignalDTO['priority'] {
  if (pri === 'URGENT') return 'urgent'
  if (pri === 'HIGH' || (score ?? 0) >= 70) return 'high'
  if (pri === 'LOW') return 'low'
  return 'normal'
}

function regulatoryPriority(signal: RegulatorySignalRecord): AdminSignalDTO['priority'] {
  if (signal.impact_level === 'critical') return 'urgent'
  if (signal.impact_level === 'high') return 'high'
  if (signal.impact_level === 'low') return 'low'
  return 'normal'
}

export async function getAdminSignalReviewSnapshot(): Promise<AdminSignalReviewSnapshot> {
  const [engine, regulatory] = await Promise.all([
    listEngineReviewQueue({ minScore: 0, limit: 200 }),
    listRegulatoryReviewQueue(),
  ])

  const signals: AdminSignalDTO[] = []
  if (engine.ok) {
    for (const signal of engine.data ?? []) {
      signals.push({
        key: `engine:${signal.id}`,
        id: signal.id,
        kind: 'engine',
        headline: signal.headline || 'Untitled engine signal',
        summary: signal.summary,
        jurisdiction: signal.country,
        observedAt: signal.date || signal.created_at,
        priority: enginePriority(signal.pri, signal.score),
        score: signal.score,
        confidence: signal.verification,
        reviewState: signal.reviewed ? signal.action || 'reviewed' : 'pending',
        sourceLabel: signal.source,
        sourceUrl: signal.url,
        lane: signal.cat,
        privateSummary: signal.summary,
        publicSummary: null,
        publicImplication: null,
        publicSafe: null,
        publishToPublic: null,
        allowedActions: ['approve', 'reject'],
      })
    }
  }

  if (regulatory.ok) {
    for (const signal of regulatory.data ?? []) {
      signals.push({
        key: `regulatory:${signal.id}`,
        id: signal.id,
        kind: 'regulatory',
        headline: signal.headline,
        summary: signal.private_summary,
        jurisdiction: signal.country_name || signal.jurisdiction,
        observedAt: signal.signal_date || signal.created_at,
        priority: regulatoryPriority(signal),
        score: null,
        confidence: signal.confidence,
        reviewState: signal.review_status,
        sourceLabel: signal.regulator_name || signal.source_type,
        sourceUrl: signal.canonical_source_url || signal.source_url,
        lane: signal.signal_type,
        privateSummary: signal.private_summary,
        publicSummary: signal.public_summary,
        publicImplication: signal.public_implication,
        publicSafe: signal.public_safe,
        publishToPublic: signal.publish_to_public,
        allowedActions: ['reject', 'open_curated_review'],
      })
    }
  }

  signals.sort((a, b) => {
    const rank = { urgent: 0, high: 1, normal: 2, low: 3 }
    const priorityDelta = rank[a.priority] - rank[b.priority]
    if (priorityDelta) return priorityDelta
    return new Date(a.observedAt || 0).getTime() - new Date(b.observedAt || 0).getTime()
  })

  return {
    generatedAt: new Date().toISOString(),
    signals,
    sources: [
      {
        kind: 'engine',
        state: engine.ok ? 'loaded' : 'degraded',
        count: engine.ok ? (engine.data ?? []).length : 0,
        ...(!engine.ok ? { error: engine.error.message } : {}),
      },
      {
        kind: 'regulatory',
        state: regulatory.ok ? 'loaded' : 'degraded',
        count: regulatory.ok ? (regulatory.data ?? []).length : 0,
        ...(!regulatory.ok ? { error: regulatory.error.message } : {}),
      },
    ],
  }
}
