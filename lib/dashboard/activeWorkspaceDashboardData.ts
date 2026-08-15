import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  getEvidenceData,
  getPublicPathwayTemplate,
  type EvidenceData,
  type PathwayData,
  type WatchlistData,
} from '@/lib/dashboard/dashboardLiveData'

export async function getActiveOrgPathwayProgress(
  workspaceId: string | null,
  countryIso2: string | null,
  roleId: string | null,
): Promise<PathwayData> {
  const publicPathway = await getPublicPathwayTemplate(countryIso2, roleId)
  if (!workspaceId || !publicPathway.template) return publicPathway

  try {
    const supabase = await createClient()
    const requirementIds = publicPathway.requirements.map(item => item.id)
    const [{ data: progress }, requirementResult] = await Promise.all([
      supabase
        .from('cc_org_pathway_progress')
        .select('current_step, status, last_action_at')
        .eq('org_id', workspaceId)
        .eq('template_id', publicPathway.template.id)
        .maybeSingle(),
      requirementIds.length
        ? supabase
            .from('cc_org_requirement_status')
            .select('requirement_id, status, submitted_at, reviewed_at')
            .eq('org_id', workspaceId)
            .in('requirement_id', requirementIds)
        : Promise.resolve({ data: [] }),
    ])

    return {
      ...publicPathway,
      progress: progress ?? null,
      requirementStatuses: requirementResult.data ?? [],
    }
  } catch {
    return publicPathway
  }
}

export async function getActiveWatchlistData(
  workspaceId: string | null,
  userId: string | null,
): Promise<WatchlistData> {
  const empty: WatchlistData = {
    items: [],
    rules: [],
    notifications: { total_alerts: 0, awaiting_review: 0, resolved: 0, snoozed: 0 },
  }
  if (!workspaceId || !userId) return empty

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const [itemsRes, rulesRes, notifsRes] = await Promise.all([
      supabase
        .from('cc_watchlist_items')
        .select('id, item_type, ref_id, title, subtitle, tags, jurisdiction, confidence_pct, latest_change_at, latest_change_note, next_action, watch_status, created_at, updated_at')
        .eq('org_id', workspaceId)
        .or(`watch_status.eq.active,and(watch_status.eq.snoozed,snoozed_until.lt.${now})`)
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('cc_watch_rules')
        .select('id, rule_type, keywords, is_active')
        .eq('org_id', workspaceId),
      supabase
        .from('cc_watchlist_notifications')
        .select('is_read, is_snoozed')
        .eq('user_id', userId),
    ])

    const notifs = notifsRes.data ?? []
    return {
      items: itemsRes.data ?? [],
      rules: rulesRes.data ?? [],
      notifications: {
        total_alerts: notifs.filter(item => !item.is_read && !item.is_snoozed).length,
        awaiting_review: notifs.filter(item => !item.is_read && !item.is_snoozed).length,
        resolved: notifs.filter(item => item.is_read).length,
        snoozed: notifs.filter(item => item.is_snoozed).length,
      },
    }
  } catch {
    return empty
  }
}

export async function getActiveEvidenceData(
  workspaceId: string | null,
  countryIso2: string | null,
): Promise<EvidenceData> {
  // Reuse the existing public source projection without supplying a user id,
  // which deliberately skips its legacy first-membership organization lookup.
  const publicEvidence = await getEvidenceData(null, countryIso2)
  if (!workspaceId) return publicEvidence

  try {
    const supabase = await createClient()
    const { data: docs } = await supabase
      .from('hv_evidence_documents')
      .select('id, display_name, document_type, verification_status, expiry_date, created_at')
      .eq('org_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(25)

    return {
      sources: publicEvidence.sources,
      orgDocs: docs ?? [],
    }
  } catch {
    return publicEvidence
  }
}
