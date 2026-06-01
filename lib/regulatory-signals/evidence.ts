import 'server-only'
import { fetchAdminSupabaseJson, getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'

type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError }

export type RegulatoryEvidenceOption = {
  id: string
  evidence_title: string
  canonical_url: string | null
  evidence_url: string
  source_tier: string
  country_name: string | null
  regulator_name: string | null
  validation_status: string
}

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message }
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<AdminResult<T>> {
  const client = getAdminDataClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!client.ok) return client as any as any

  const response = await fetch(`${client.data.url}${path}`, {
    ...init,
    headers: {
      apikey: client.data.serviceRoleKey,
      Authorization: `Bearer ${client.data.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const text = await response.text()
  if (!response.ok) return { ok: false, error: requestFailed(`Supabase returned ${response.status}: ${text.slice(0, 240)}`) }
  return { ok: true, data: (text ? JSON.parse(text) : null) as T }
}

export async function listRegulatoryEvidenceOptions() {
  return fetchAdminSupabaseJson<RegulatoryEvidenceOption[]>('/rest/v1/regulatory_signals.evidence?select=id,evidence_title,canonical_url,evidence_url,source_tier,country_name,regulator_name,validation_status&order=captured_at.desc')
}

export async function linkRegulatoryEvidenceToSignal(signalId: string, evidenceId: string) {
  if (!signalId || !evidenceId) return { ok: false as const, error: requestFailed('Signal ID and evidence ID are required.') }
  return adminRequest('/rest/v1/regulatory_signals.signal_evidence_links', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ signal_id: signalId, evidence_id: evidenceId, relationship: 'supporting' }),
  })
}
