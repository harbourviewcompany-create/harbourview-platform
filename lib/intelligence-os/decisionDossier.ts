import 'server-only'
import { listIaSignals } from '@/lib/intelligence-automation/db'
import type { AutomationSignal } from '@/lib/intelligence-automation/types'
import type { DecisionEvidenceRelationship, DecisionIntelDossier, DecisionRecommendationState } from './types'

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : []
}

function recommendation(value: unknown): DecisionRecommendationState {
  return value === 'act_now' || value === 'investigate' || value === 'no_action' ? value : 'monitor'
}

function evidenceRelationship(value: unknown): DecisionEvidenceRelationship {
  return value === 'contradicts' || value === 'clarifies' || value === 'supersedes' || value === 'background' ? value : 'supports'
}

function probability(value: unknown): number | null {
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : null
}

function mapCanonical(row: Record<string, unknown>): DecisionIntelDossier {
  const rawEvidence = Array.isArray(row.evidence) ? row.evidence : []
  const evidence = rawEvidence.map((item) => {
    const r = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return {
      sourceLabel: text(r.sourceLabel),
      sourceUrl: text(r.sourceUrl),
      status: text(r.status) ?? 'needs_review',
      observedAt: text(r.observedAt),
      relationship: evidenceRelationship(r.relationship),
    }
  })
  const linkedContradictions = evidence
    .filter(item => item.relationship === 'contradicts')
    .map(item => `Contradictory evidence: ${item.sourceLabel ?? item.sourceUrl ?? 'linked source'}`)

  return {
    id: String(row.id),
    headline: text(row.headline) ?? 'Intelligence event',
    summary: text(row.summary),
    eventType: text(row.event_type) ?? 'development',
    jurisdictionLabel: text(row.jurisdiction_label),
    occurredAt: text(row.occurred_at),
    detectedAt: text(row.detected_at),
    effectiveAt: text(row.effective_at),
    lastVerifiedAt: text(row.last_verified_at),
    materiality: row.materiality === 'critical' || row.materiality === 'high' || row.materiality === 'low' ? row.materiality : 'medium',
    consolidationStatus: text(row.consolidation_status) ?? 'candidate',
    reviewStatus: text(row.review_status) ?? 'needs_review',
    sourceCount: typeof row.source_count === 'number' ? row.source_count : 0,
    whatHappened: text(row.what_happened) ?? text(row.summary) ?? text(row.headline) ?? 'Development under review.',
    whatChanged: text(row.what_changed),
    whyItMatters: text(row.why_it_matters),
    commercialImplications: text(row.commercial_implications),
    regulatoryImplications: text(row.regulatory_implications),
    affectedEntities: strings(row.affected_entities),
    affectedMarkets: strings(row.affected_markets),
    affectedProducts: strings(row.affected_products),
    whyNow: text(row.why_now),
    confidence: probability(row.confidence),
    confidenceRationale: text(row.confidence_rationale),
    contradictions: [...new Set([...strings(row.contradictions), ...linkedContradictions])],
    unknowns: strings(row.unknowns),
    recommendationState: recommendation(row.recommendation_state),
    recommendationReasoning: text(row.recommendation_reasoning) ?? 'Review the evidence before changing an operating decision.',
    actionSummary: text(row.action_summary),
    urgency: row.urgency === 'urgent' || row.urgency === 'high' || row.urgency === 'low' ? row.urgency : 'normal',
    evidence,
  }
}

function mapLegacySignal(row: Record<string, unknown>, eventId: string): DecisionIntelDossier {
  const confidence = probability(row.quality_confidence)
  const impact = text(row.impact) ?? text(row.pri) ?? text(row.commercial_impact)
  const materiality = impact?.toLowerCase() === 'critical' ? 'critical'
    : ['high', 'urgent'].includes(impact?.toLowerCase() ?? '') ? 'high'
    : impact?.toLowerCase() === 'low' ? 'low' : 'medium'

  return {
    id: eventId,
    headline: text(row.title_en) ?? text(row.editorial_title) ?? text(row.headline) ?? 'Intelligence event',
    summary: text(row.summary_en) ?? text(row.summary) ?? text(row.editorial_blurb),
    eventType: text(row.content_type) ?? text(row.cat) ?? 'development',
    jurisdictionLabel: text(row.country),
    occurredAt: text(row.date),
    detectedAt: text(row.created_at),
    effectiveAt: null,
    lastVerifiedAt: null,
    materiality,
    consolidationStatus: 'legacy_fallback',
    reviewStatus: 'migrated_reviewed',
    sourceCount: typeof row.corroborating_count === 'number' ? Math.max(1, row.corroborating_count) : 1,
    whatHappened: text(row.summary_en) ?? text(row.summary) ?? text(row.headline) ?? 'Development under review.',
    whatChanged: null,
    whyItMatters: text(row.commercial_impact),
    commercialImplications: text(row.commercial_impact),
    regulatoryImplications: null,
    affectedEntities: [],
    affectedMarkets: text(row.country) ? [text(row.country)!] : [],
    affectedProducts: [],
    whyNow: 'This item entered the reviewed intelligence feed and requires contextual assessment against current operating conditions.',
    confidence,
    confidenceRationale: null,
    contradictions: [],
    unknowns: [
      'This fallback dossier predates canonical assertion/event backfill; evidence lineage and analysis fields are intentionally limited to the allowlisted API projection until the Stage 0 migration is applied.',
    ],
    recommendationState: materiality === 'low' ? 'monitor' : 'investigate',
    recommendationReasoning: 'The signal is surfaceable, but legacy review does not independently verify a decision recommendation.',
    actionSummary: null,
    urgency: materiality === 'critical' || materiality === 'high' ? 'high' : 'normal',
    evidence: text(row.source) || text(row.url) ? [{
      sourceLabel: text(row.source),
      sourceUrl: text(row.url),
      status: 'needs_review',
      observedAt: text(row.date) ?? text(row.created_at),
      relationship: 'supports',
    }] : [],
  }
}

function mapIaSignal(signal: AutomationSignal, eventId: string): DecisionIntelDossier {
  const materiality = signal.commercialImpact === 'high' ? 'high' : signal.commercialImpact === 'low' ? 'low' : 'medium'
  return {
    id: eventId,
    headline: signal.title,
    summary: signal.summary,
    eventType: signal.type,
    jurisdictionLabel: signal.market,
    occurredAt: signal.detectedAt,
    detectedAt: signal.detectedAt,
    effectiveAt: null,
    lastVerifiedAt: null,
    materiality,
    consolidationStatus: 'ia_legacy_fallback',
    reviewStatus: 'needs_review',
    sourceCount: 1,
    whatHappened: signal.summary || signal.title,
    whatChanged: null,
    whyItMatters: `${signal.commercialImpact} commercial impact in ${signal.market}.`,
    commercialImplications: `${signal.commercialImpact} commercial impact; canonical evidence-backed assessment has not yet been created for this IA fallback record.`,
    regulatoryImplications: null,
    affectedEntities: [],
    affectedMarkets: signal.market ? [signal.market] : [],
    affectedProducts: [],
    whyNow: 'This record is being served from the legacy IA fallback because no canonical Pipeline B dossier was available.',
    confidence: signal.confidence >= 0 && signal.confidence <= 100 ? signal.confidence / 100 : null,
    confidenceRationale: null,
    contradictions: [],
    unknowns: ['Canonical source/evidence lineage is not available for this legacy IA fallback record.'],
    recommendationState: materiality === 'low' ? 'monitor' : 'investigate',
    recommendationReasoning: 'Investigate before acting because this record is not backed by the canonical Stage 0 assertion/evidence chain.',
    actionSummary: null,
    urgency: materiality === 'high' ? 'high' : 'normal',
    evidence: signal.sourceName ? [{ sourceLabel: signal.sourceName, sourceUrl: null, status: 'needs_review', observedAt: signal.detectedAt, relationship: 'supports' }] : [],
  }
}

async function loadCanonical(db: any, eventId: string): Promise<DecisionIntelDossier | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const { data, error } = await db.rpc('get_intel_event_dossier', { p_event_id: eventId })
    if (!error && Array.isArray(data) && data[0]) return mapCanonical(data[0] as Record<string, unknown>)
  } catch { /* Stage-0 RPC may not be applied on a preview database yet */ }
  return null
}

async function resolveCanonicalEventId(db: any, signalId: string): Promise<string | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const { data, error } = await db.rpc('resolve_intel_event_route', { p_signal_id: signalId })
    if (error || !Array.isArray(data) || !data[0]) return null
    return text((data[0] as Record<string, unknown>).event_id)
  } catch { /* Stage-0 RPC may not be applied on a preview database yet */ }
  return null
}

async function loadIaFallback(signalId: string, eventId: string): Promise<DecisionIntelDossier | null> {
  try {
    const result = await listIaSignals()
    if (!result.ok || !Array.isArray(result.data)) return null
    const signal = result.data.find(item => item.id === signalId && item.stage !== 'archived')
    return signal ? mapIaSignal(signal, eventId) : null
  } catch {
    return null
  }
}

async function loadLegacyPublicSignal(db: any, signalIds: string[], eventId: string): Promise<DecisionIntelDossier | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const candidateId of signalIds) {
    try {
      const { data, error } = await db
        .from('signals')
        .select('id,date,created_at,reviewed_at,cat,pri,headline,summary,source,url,country,commercial_impact,quality_confidence,impact,title_en,summary_en,editorial_title,editorial_blurb,cluster_rep_id,corroborating_count,reviewed,quality_label,content_type,action')
        .eq('id', candidateId)
        .eq('reviewed', true)
        .maybeSingle()
      if (error || !data) continue

      const row = data as Record<string, unknown>
      if (['spam','boilerplate','nav','duplicate'].includes(String(row.quality_label ?? ''))) return null
      if (['story','research','noise'].includes(String(row.content_type ?? ''))) return null
      if (row.action === 'rejected') return null

      const clusterRepId = text(row.cluster_rep_id)
      if (clusterRepId && clusterRepId !== candidateId) {
        const clusteredRoute = await resolveCanonicalEventId(db, clusterRepId)
        if (clusteredRoute) {
          const clustered = await loadCanonical(db, clusteredRoute)
          if (clustered) return clustered
        }
      }
      return mapLegacySignal(row, eventId)
    } catch { /* try the next compatible legacy id */ }
  }
  return null
}

/**
 * Loads the canonical first-slice dossier. The route resolver first resolves native
 * Pipeline-B ids and regulatory mirror ids to one event. If that canonical event is
 * deliberately suppressed by review state, the loader returns null rather than
 * resurrecting it through legacy compatibility. Legacy public.signals and IA fallback
 * are used only when no canonical ownership exists.
 */
export async function loadDecisionIntelDossier(supabase: unknown, eventId: string): Promise<DecisionIntelDossier | null> {
  // The generated Database type intentionally lags additive migrations; keep the
  // untyped boundary isolated here until types are regenerated after migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const canonical = await loadCanonical(db, eventId)
  if (canonical) return canonical

  const signalId = eventId.startsWith('event:') ? eventId.slice('event:'.length) : eventId
  const routedEventId = await resolveCanonicalEventId(db, signalId)
  if (routedEventId) {
    if (routedEventId !== eventId) {
      const routed = await loadCanonical(db, routedEventId)
      if (routed) return routed
    }
    // Canonical ownership exists but the allowlisted dossier did not return a row.
    return null
  }

  const legacyIds = signalId.startsWith('rs-') ? [signalId] : [signalId, `rs-${signalId}`]
  const legacy = await loadLegacyPublicSignal(db, legacyIds, eventId)
  if (legacy) return legacy

  return loadIaFallback(signalId, eventId)
}
