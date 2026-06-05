import 'server-only'
import { requireAdminAuth } from '@/lib/admin-auth'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import IntakeQueueClient from './IntakeQueueClient'

export const dynamic = 'force-dynamic'

export default async function IntakeQueuePage() {
  await requireAdminAuth()

  const client = getAdminDataClient()
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  let candidates: Record<string, unknown>[] = []
  let inquiries:  Record<string, unknown>[] = []
  let error: string | null = null

  if (url && key) {
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    }
    const [candRes, inqRes] = await Promise.all([
      fetch(`${url}/rest/v1/marketplace_candidates?candidate_type=eq.intake_form&status=eq.needs_review&order=discovered_at.desc&limit=100`, { headers, cache: 'no-store' }),
      fetch(`${url}/rest/v1/marketplace_inquiries?listing_id=is.null&order=created_at.desc&limit=200`, { headers, cache: 'no-store' }),
    ])
    if (candRes.ok) candidates = await candRes.json()
    if (inqRes.ok)  inquiries  = await inqRes.json()
  } else {
    error = 'SUPABASE_SERVICE_ROLE_KEY not configured.'
  }

  return <IntakeQueueClient candidates={candidates} inquiries={inquiries} configError={error} />
}
