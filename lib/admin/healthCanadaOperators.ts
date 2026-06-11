import 'server-only';
import { fetchAdminSupabaseJson, type AdminDataResult } from '@/lib/supabase/adminDataClient';

export type HealthCanadaRegistryCounts = {
  active_sites: number;
  outreach_ready: number;
  exclusions: number;
  conflicts: number;
  individual_holds: number;
};

export type HealthCanadaOperatorSite = {
  site_id: string;
  company_name: string;
  province: string | null;
  status: string;
  licence_class: string | null;
  authorized_classes: string | null;
  track: string | null;
  outreach_ready: boolean;
  review_required: boolean;
};

export async function listHealthCanadaActiveSites(): Promise<AdminDataResult<HealthCanadaOperatorSite[]>> {
  return fetchAdminSupabaseJson<HealthCanadaOperatorSite[]>(
    '/rest/v1/canadian_operator_licence_sites?select=site_id,company_name,province,status,licence_class,authorized_classes,track,outreach_ready,review_required&order=province.asc,company_name.asc&limit=200',
  );
}

export async function listHealthCanadaOutreachQueue(): Promise<AdminDataResult<Array<Record<string, unknown>>>> {
  return fetchAdminSupabaseJson<Array<Record<string, unknown>>>(
    '/rest/v1/canadian_operator_outreach_queue?select=outreach_queue_id,send_order,track,province,first_contact_note,canonical_operator_id&order=send_order.asc.nullslast&limit=200',
  );
}

export async function getHealthCanadaRegistryCounts(): Promise<AdminDataResult<HealthCanadaRegistryCounts>> {
  const [sites, outreach, exclusions, conflicts, holds] = await Promise.all([
    fetchAdminSupabaseJson<Array<{ count: number }>>('/rest/v1/canadian_operator_licence_sites?select=count'),
    fetchAdminSupabaseJson<Array<{ count: number }>>('/rest/v1/canadian_operator_outreach_queue?select=count'),
    fetchAdminSupabaseJson<Array<{ count: number }>>('/rest/v1/canadian_operator_exclusions?select=count'),
    fetchAdminSupabaseJson<Array<{ count: number }>>('/rest/v1/canadian_operator_conflicts?select=count'),
    fetchAdminSupabaseJson<Array<{ count: number }>>('/rest/v1/canadian_operator_individual_holds?select=count'),
  ]);

  for (const result of [sites, outreach, exclusions, conflicts, holds]) {
    if (!result.ok) return result as AdminDataResult<HealthCanadaRegistryCounts>;
  }

  return {
    ok: true,
    source: 'db',
    data: {
      active_sites: sites.ok ? sites.data[0]?.count ?? 0 : 0,
      outreach_ready: outreach.ok ? outreach.data[0]?.count ?? 0 : 0,
      exclusions: exclusions.ok ? exclusions.data[0]?.count ?? 0 : 0,
      conflicts: conflicts.ok ? conflicts.data[0]?.count ?? 0 : 0,
      individual_holds: holds.ok ? holds.data[0]?.count ?? 0 : 0,
    },
  };
}
