import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { searchMonitoringFixtures } from '@/lib/fixtures/clinical/monitoring'

export type ClinicalMonitoringProtocolDTO = {
  id: string
  protocolName: string
  context: string
  cannabinoid: string | null
  monitoringParameter: string
  baselineRequired: boolean
  followUpInterval: string | null
  rationale: string | null
  evidenceCertainty: string
  primarySourceTitle: string
  primarySourceUrl: string | null
  verifiedAt: string
}

function fromFixtures(opts: { q?: string; limit?: number }): ClinicalMonitoringProtocolDTO[] {
  return searchMonitoringFixtures(opts).map((r) => ({
    id: r.id,
    protocolName: r.protocolName,
    context: r.context,
    cannabinoid: r.cannabinoid,
    monitoringParameter: r.monitoringParameter,
    baselineRequired: r.baselineRequired,
    followUpInterval: r.followUpInterval,
    rationale: r.rationale,
    evidenceCertainty: r.evidenceCertainty,
    primarySourceTitle: r.primarySourceTitle,
    primarySourceUrl: r.primarySourceUrl,
    verifiedAt: r.verifiedAt,
  }))
}

export async function searchClinicalMonitoringProtocols(opts: {
  q?: string
  context?: string
  limit?: number
}): Promise<{ state: 'loaded' | 'empty' | 'error'; protocols: ClinicalMonitoringProtocolDTO[]; error?: string }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('clinical_monitoring_protocols')
      .select(
        'id,protocol_name,context,cannabinoid,monitoring_parameter,baseline_required,follow_up_interval,rationale,evidence_certainty,primary_source_title,primary_source_url,verified_at,review_status',
      )
      .eq('review_status', 'published')
      .order('baseline_required', { ascending: false })
      .limit(opts.limit ?? 30)

    if (opts.context?.trim()) {
      query = query.eq('context', opts.context.trim())
    }
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(
        `protocol_name.ilike.${q},monitoring_parameter.ilike.${q},context.ilike.${q}`,
      )
    }

    const { data, error } = await query
    if (error) {
      const fixtures = fromFixtures(opts)
      return fixtures.length
        ? { state: 'loaded', protocols: fixtures }
        : { state: 'error', protocols: [], error: error.message }
    }

    const protocols: ClinicalMonitoringProtocolDTO[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        protocolName: String(r.protocol_name),
        context: String(r.context),
        cannabinoid: r.cannabinoid ? String(r.cannabinoid) : null,
        monitoringParameter: String(r.monitoring_parameter),
        baselineRequired: Boolean(r.baseline_required),
        followUpInterval: r.follow_up_interval ? String(r.follow_up_interval) : null,
        rationale: r.rationale ? String(r.rationale) : null,
        evidenceCertainty: String(r.evidence_certainty),
        primarySourceTitle: String(r.primary_source_title),
        primarySourceUrl: r.primary_source_url ? String(r.primary_source_url) : null,
        verifiedAt: String(r.verified_at),
      }
    })

    if (!protocols.length) {
      const fixtures = fromFixtures(opts)
      return { state: fixtures.length ? 'loaded' : 'empty', protocols: fixtures }
    }

    return { state: 'loaded', protocols }
  } catch (e) {
    const fixtures = fromFixtures(opts)
    if (fixtures.length) return { state: 'loaded', protocols: fixtures }
    return {
      state: 'error',
      protocols: [],
      error: e instanceof Error ? e.message : 'Monitoring protocol query failed',
    }
  }
}
