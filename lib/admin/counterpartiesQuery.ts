import 'server-only'
import {
  fetchAdminSupabaseJson,
  fetchAdminSupabaseJsonMutation,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'

export type Counterparty = {
  id: string
  name: string
  role: string
  markets: string[]
  categories: string[]
  needs_profile: string | null
  supply_profile: string | null
  interaction_count: number
  last_interaction: string | null
  introduction_count: number
  documentation_status: 'complete' | 'partial' | 'missing'
  created_at: string
  updated_at: string
}

export type CounterpartyInput = {
  name: string
  role: string
  markets: string[]
  categories: string[]
  needs_profile?: string | null
  supply_profile?: string | null
  documentation_status?: 'complete' | 'partial' | 'missing'
}

const SELECT =
  'id,name,role,markets,categories,needs_profile,supply_profile,interaction_count,last_interaction,introduction_count,documentation_status,created_at,updated_at'

export async function listCounterparties(opts?: {
  market?: string
  role?: string
  doc_status?: string
  limit?: number
}): Promise<AdminDataResult<Counterparty[]>> {
  const params = new URLSearchParams({ select: SELECT, order: 'updated_at.desc' })
  if (opts?.doc_status) params.set('documentation_status', `eq.${opts.doc_status}`)
  if (opts?.role)       params.set('role', `eq.${opts.role}`)
  if (opts?.limit)      params.set('limit', String(opts.limit))
  return fetchAdminSupabaseJson<Counterparty[]>(`/rest/v1/ia_counterparties?${params}`)
}

export async function getCounterpartyById(id: string): Promise<AdminDataResult<Counterparty | null>> {
  const params = new URLSearchParams({ select: SELECT, id: `eq.${id}`, limit: '1' })
  const result = await fetchAdminSupabaseJson<Counterparty[]>(`/rest/v1/ia_counterparties?${params}`)
  if (!result.ok) return result
  return { ok: true, data: result.data[0] ?? null, source: result.source }
}

export async function updateCounterparty(
  id: string,
  patch: Partial<CounterpartyInput>,
): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/ia_counterparties?id=eq.${id}`,
    'PATCH',
    patch as Record<string, unknown>,
  )
}

export async function normalizeCounterpartyMarkets(id: string, markets: string[]): Promise<AdminDataResult<null>> {
  return fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/ia_counterparties?id=eq.${id}`,
    'PATCH',
    { markets },
  )
}

export const COUNTERPARTY_ROLES = [
  'importer', 'distributor', 'licensed_producer', 'buyer', 'seller',
  'lab', 'consultant', 'logistics', 'packaging', 'equipment',
  'investor', 'legal', 'other',
] as const

export const ROLE_LABELS: Record<string, string> = {
  importer:          'Importer',
  distributor:       'Distributor',
  licensed_producer: 'Licensed Producer',
  buyer:             'Buyer',
  seller:            'Seller',
  lab:               'Lab / Testing',
  consultant:        'Consultant',
  logistics:         'Logistics',
  packaging:         'Packaging',
  equipment:         'Equipment',
  investor:          'Investor',
  legal:             'Legal / Compliance',
  other:             'Other',
}

export const DOC_STATUS_LABELS: Record<string, string> = {
  complete: 'Complete',
  partial:  'Partial',
  missing:  'Missing',
}

export const DOC_STATUS_COLORS: Record<string, string> = {
  complete: 'text-emerald-400',
  partial:  'text-amber-400',
  missing:  'text-red-400',
}
