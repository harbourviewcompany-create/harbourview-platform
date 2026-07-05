import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type CountryDossier = {
  id: string
  title: string
  country_id: string | null
  storage_bucket: string | null
  file_path: string | null
  file_size_bytes: number | null
  maturity_score: number | null
  maturity_tier: string | null
  page_count: number | null
  updated_at: string
}

/**
 * Fetches the deep-dive v5 market dossier record for a country, if one
 * exists. Returns null if there's no dossier row, or if the row exists but
 * has no file uploaded yet (file_path null) — callers should treat both
 * cases the same way (no dossier to surface), since a fileless row is a
 * tracked-but-not-yet-produced placeholder, not a real asset.
 *
 * Distinct from getLatestBriefing() (AI-synthesized weekly signal digest)
 * and getPlaybook() (procedural market-entry steps) — this is the
 * full manually-curated 16-section Harbourview v5 dossier.
 */
export async function getCountryDossier(countryId: string): Promise<CountryDossier | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !countryId) return null
  try {
    const params = new URLSearchParams({
      select: 'id,title,country_id,storage_bucket,file_path,file_size_bytes,maturity_score,maturity_tier,page_count,updated_at',
      country_id: `eq.${countryId}`,
      limit: '1',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dossiers?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const rows: CountryDossier[] = await res.json()
    const dossier = rows[0]
    if (!dossier || !dossier.file_path) return null
    return dossier
  } catch {
    return null
  }
}

/** Public URL for a dossier's file, given its bucket + path. Only resolves
 * for files in a public bucket. Dossiers are intentionally stored in the
 * private project-vault bucket (matching the site's existing "Request
 * Access" trust-boundary convention — see country-briefs and the
 * Intelligence Boundary section on this page), so this will correctly
 * return null for them; direct download access is admin-only, via a
 * signed URL generated server-side with the service role key (see
 * app/admin/intelligence/dossiers/page.tsx).
 */
export function getDossierFileUrl(dossier: CountryDossier): string | null {
  if (!SUPABASE_URL || !dossier.storage_bucket || !dossier.file_path) return null
  if (dossier.storage_bucket !== 'public-assets') return null
  return `${SUPABASE_URL}/storage/v1/object/public/${dossier.storage_bucket}/${dossier.file_path}`
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
