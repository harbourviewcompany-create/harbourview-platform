// app/admin/intelligence/dossiers/page.tsx
//
// Portfolio view of Harbourview v5 market intelligence dossiers.
// dossier_status is the 27-market coverage tracker (status/priority/notes) —
// already populated, previously only visible via raw SQL. dossiers holds
// the actual file reference once a dossier has been produced. This page
// joins the two client-side by market name (no FK between them; dossiers
// links to countries.id, not dossier_status, and dossier_status covers more
// markets than either countries or dossiers currently does).

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import DossiersClient, { type DossierStatusRow, type DossierFileRow } from './DossiersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPortfolio(): Promise<{
  statusRows: DossierStatusRow[]
  fileRows: DossierFileRow[]
  error: string | null
}> {
  const client = getAdminDataClient()
  if (!client.ok) return { statusRows: [], fileRows: [], error: client.error.message }

  const { url, serviceRoleKey } = client.data
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' }

  const [statusRes, fileRes] = await Promise.all([
    fetch(`${url}/rest/v1/dossier_status?select=id,market,region,status,priority,last_updated,notes&order=priority.asc,market.asc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/dossiers?select=id,title,country_id,storage_bucket,file_path,drive_file_id,file_size_bytes,maturity_score,maturity_tier,page_count,updated_at`, { headers, cache: 'no-store' }),
  ])

  if (!statusRes.ok) return { statusRows: [], fileRows: [], error: `dossier_status fetch failed: ${statusRes.status}` }
  if (!fileRes.ok) return { statusRows: [], fileRows: [], error: `dossiers fetch failed: ${fileRes.status}` }

  const statusRows = (await statusRes.json()) as DossierStatusRow[]
  const fileRows = (await fileRes.json()) as DossierFileRow[]
  return { statusRows, fileRows, error: null }
}

export default async function AdminDossiersPage() {
  await requireAdminAuth()
  const { statusRows, fileRows, error } = await getPortfolio()

  return <DossiersClient statusRows={statusRows} fileRows={fileRows} configError={error} />
}
