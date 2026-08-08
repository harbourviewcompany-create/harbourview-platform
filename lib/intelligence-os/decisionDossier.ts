import 'server-only'
import type { DecisionIntelDossier, DecisionRecommendationState } from './types'

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : []
}

function recommendation(value: unknown): DecisionRecommendationState {
  return value === 'act_now' || value === 'investigate' || value === 'no_action' ? value : 'monitor'
}

function mapCanonical(row: Record<string, unknown>): DecisionIntelDossier {
  const evidence = Array.isArray(row.evidence) ? row.evidence : []
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
    confidence: typeof row.confidence === 'number' ? row.confidence : null,
    confidenceRationale: text(row.confidence_rationale),
    contradictions: strings(row.contradictions),
    unknowns: strings(row.unknowns),
    recommendationState: recommendation(row.recommendation_state),
    recommendationReasoning: text(row.recommendation_reasoning) ?? 'Review the evidence before changing an operating decision.',
    actionSummary: text(row.action_summary),
    urgency: row.urgency === 'urgent' || row.urgency === 'high' || row.urgency === 'low' ? row.urgency : 'normal',
    evidence: evidence.map((item) => {
      const r = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      return {
        sourceLabel: text(r.sourceLabel),
        sourceUrl: text(r.sourceUrl),
        status: text(r.status) ?? 'needs_review',
        observedAt: text(r.observedAt),
      }
    }),
  }
}

function mapLegacySignal(row: Record<string, unknown>, eventId: string): DecisionIntelDossier {
  const analysis = row.analysis && typeof row.analysis === 'object' ? row.analysis as Record<string, unknown> : {}
  const confidence = typeof row.quality_confidence === 'number' && row.quality_confidence >= 0 && row.quality_confidence <= 1
    ? row.quality_confidence
    : null
  const proposedAction = text(analysis.recommended_action)
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
    lastVerifiedAt: text(row.reviewed_at),
    materiality,
    consolidationStatus: 'legacy_fallback',
    reviewStatus: 'migrated_reviewed',
    sourceCount: typeof row.corroborating_count === 'number' ? Math.max(1, row.corroborating_count) : 1,
    whatHappened: text(row.summary_en) ?? text(row.summary) ?? text(row.headline) ?? 'Development under review.',
    whatChanged: text(analysis.what_changed),
    whyItMatters: text(row.commercial_impact),
    commercialImplications: text(row.commercial_impact),
    regulatoryImplications: null,
    affectedEntities: text(analysis.who_is_affected) ? [text(analysis.who_is_affected)!] : [],
    affectedMarkets: text(row.country) ? [text(row.country)!] : [],
    affectedProducts: [],
    whyNow: 'This item entered the reviewed intelligence feed and requires contextual assessment against current operating conditions.',
    confidence,
    confidenceRationale: text(analysis.confidence_rationale),
    contradictions: [],
    unknowns: [
      'This fallback dossier predates canonical assertion/event backfill; evidence lineage is incomplete until the Stage 0 migration is applied.',
      ...(row.snapshot_id ? [] : ['No acquisition snapshot is linked to this signal.']),
    ],
    recommendationState: proposedAction ? 'investigate' : materiality === 'low' ? 'monitor' : 'investigate',
    recommendationReasoning: proposedAction
      ? 'An upstream analysis proposes an action, but legacy review does not independently verify the recommendation.'
      : 'The signal is surfaceable, but verified decision evidence is not yet sufficient for immediate action.',
    actionSummary: proposedAction,
    urgency: materiality === 'critical' || materiality === 'high' ? 'high' : 'normal',
    evidence: text(row.source) || text(row.url) ? [{
      sourceLabel: text(row.source),
      sourceUrl: text(row.url),
      status: 'needs_review',
      observedAt: text(row.date) ?? text(row.created_at),
    }] : [],
  }
}

async function loadCanonical(db: any, eventId: string): Promise<DecisionIntelDossier | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const { data, error } = await db
      .from('intel_event_dossiers')
      .select('*')
      .eq('id', eventId)
      .maybeSingle()
    if (!error && data) return mapCanonical(data as Record<string, unknown>)
  } catch { /* migration may not be applied on a preview database yet */ }
  return null
}

/**
 * Loads the canonical first-slice dossier. The legacy fallback keeps preview/main
 * deploys useful before the additive migration is applied; it never upgrades a
 * legacy reviewed signal to verified intelligence. A non-representative clustered
 * signal resolves to its canonical event before falling back, so a feed row cannot
 * fragment one event back into separate legacy dossiers.
 */
export async function loadDecisionIntelDossier(supabase: unknown, eventId: string): Promise<DecisionIntelDossier | null> {
  // The generated Database type intentionally lags additive migrations; keep the
  // untyped boundary isolated here until types are regenerated after migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const canonical = await loadCanonical(db, eventId)
  if (canonical) return canonical

  const signalId = eventId.startsWith('event:') ? eventId.slice('event:'.length) : eventId
  try {
    const { data, error } = await db
      .from('signals')
      .select('id,date,created_at,reviewed_at,cat,pri,headline,summary,source,url,country,commercial_impact,analysis,quality_confidence,impact,title_en,summary_en,editorial_title,editorial_blurb,snapshot_id,cluster_rep_id,corroborating_count,reviewed,quality_label,content_type,action')
      .eq('id', signalId)
      .eq('reviewed', true)
      .maybeSingle()
    if (error || !data) return null
    const row = data as Record<string, unknown>
    if (['spam','boilerplate','nav','duplicate'].includes(String(row.quality_label ?? ''))) return null
    if (['story','research','noise'].includes(String(row.content_type ?? ''))) return null
    if (row.action === 'rejected') return null

    const clusterRepId = text(row.cluster_rep_id)
    if (clusterRepId && clusterRepId !== signalId) {
      const clustered = await loadCanonical(db, `event:${clusterRepId}`)
      if (clustered) return clustered
    }

    return mapLegacySignal(row, eventId)
  } catch {
    return null
  }
}
