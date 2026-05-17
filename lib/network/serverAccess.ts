import 'server-only'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient'

export type NetworkAdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminDataError }

function requestFailed(message: string): AdminDataError {
  return { code: 'request_failed', message }
}

export async function networkAdminRequest<T>(path: string, init: RequestInit = {}): Promise<NetworkAdminResult<T>> {
  await requireAdminAuth()
  const client = getAdminDataClient()
  if (!client.ok) return client

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
