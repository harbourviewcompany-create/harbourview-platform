import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type CountryLegalStatus = {
  iso2: string
  country_name: string
  legal_status:
    | 'recreational_retail'
    | 'recreational_noncommercial'
    | 'medical_only'
    | 'cbd_hemp_only'
    | 'prohibited'
    | 'unresearched'
  notes: string | null
  last_reviewed: string
}

// Informational only -- never used to hide or block catalog items. The
// product decision is that everything is publicly visible/quotable
// everywhere; this exists so a buyer sees an honest, current statement of
// the legal picture in their market alongside that, not instead of it.
// A country with no row here is genuinely unresearched, not assumed
// prohibited or assumed legal -- callers must render that distinctly from
// the researched statuses.
export async function getCountryLegalStatus(iso2: string): Promise<CountryLegalStatus | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const code = iso2.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return null

  try {
    const params = new URLSearchParams({
      select: 'iso2,country_name,legal_status,notes,last_reviewed',
      iso2: `eq.${code}`,
      limit: '1',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/country_cannabis_legal_status_v1?${params.toString()}`, {
      next: { revalidate: 3600 },
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    const rows: unknown = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) return null
    return rows[0] as CountryLegalStatus
  } catch {
    return null
  }
}

export const LEGAL_STATUS_LABELS: Record<CountryLegalStatus['legal_status'], string> = {
  recreational_retail: 'Recreational — commercial retail legal',
  recreational_noncommercial: 'Recreational — personal use/home cultivation legal, no commercial retail',
  medical_only: 'Medical cannabis only',
  cbd_hemp_only: 'CBD / low-THC hemp products only',
  prohibited: 'Cannabis prohibited',
  unresearched: 'Not yet reviewed',
}
