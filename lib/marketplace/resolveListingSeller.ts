import 'server-only'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'

/**
 * Resolve seller contact email for a public listing (Tier A contact path).
 * Order: high_level_specs.seller_email → candidate.submitted_by auth email → candidate raw_payload contact.
 */
export async function resolveListingSellerEmail(listingId: string): Promise<string | null> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey || !listingId) return null
  const url = resolveLockedSupabaseUrl()

  try {
    const listingRes = await fetch(
      `${url}/rest/v1/listings?id=eq.${encodeURIComponent(listingId)}&select=id,high_level_specs,seller_type&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )
    if (!listingRes.ok) return null
    const listings = (await listingRes.json()) as Array<{
      high_level_specs?: Record<string, unknown> | null
    }>
    const listing = listings[0]
    if (!listing) return null

    const specs = listing.high_level_specs || {}
    const direct = typeof specs.seller_email === 'string' ? specs.seller_email.trim() : ''
    if (direct.includes('@')) return direct.toLowerCase()

    const candidateId =
      typeof specs.source_candidate_id === 'string' ? specs.source_candidate_id.trim() : ''
    if (!candidateId) return null

    const candRes = await fetch(
      `${url}/rest/v1/marketplace_candidates?id=eq.${encodeURIComponent(candidateId)}&select=id,submitted_by,raw_payload&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )
    if (!candRes.ok) return null
    const candidates = (await candRes.json()) as Array<{
      submitted_by?: string | null
      raw_payload?: Record<string, unknown> | null
    }>
    const candidate = candidates[0]
    if (!candidate) return null

    const payloadEmail =
      typeof candidate.raw_payload?.contact_email === 'string'
        ? candidate.raw_payload.contact_email.trim()
        : typeof candidate.raw_payload?.email === 'string'
          ? candidate.raw_payload.email.trim()
          : ''
    if (payloadEmail.includes('@')) return payloadEmail.toLowerCase()

    const userId = candidate.submitted_by
    if (!userId) return null

    // Auth admin API
    const userRes = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    if (!userRes.ok) return null
    const user = (await userRes.json()) as { email?: string }
    const email = user.email?.trim()
    return email?.includes('@') ? email.toLowerCase() : null
  } catch {
    return null
  }
}
