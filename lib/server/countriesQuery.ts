import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type PublicCountry = {
  id: string
  country_name: string
  country_slug: string
  iso_alpha2: string
  iso_alpha3: string
  region: string | null
  subregion: string | null
  market_access_status: string
  medical_status: string
  adult_use_status: string
  import_status: string
  export_status: string
  signals_status: string
  opportunity_status: string
  public_summary: string | null
  data_completeness: string
  last_updated_label: string | null
}

export async function getPublicCountries(): Promise<PublicCountry[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'id,country_name,country_slug,iso_alpha2,iso_alpha3,region,subregion,market_access_status,medical_status,adult_use_status,import_status,export_status,signals_status,opportunity_status,public_summary,data_completeness,last_updated_label',
      order: 'country_name.asc',
    })
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/countries?${params.toString()}`,
      {
        next: { revalidate: 3600 },
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      },
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getPublicCountryBySlug(slug: string): Promise<PublicCountry | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const params = new URLSearchParams({
      select: '*',
      country_slug: `eq.${slug}`,
      limit: '1',
    })
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/countries?${params.toString()}`,
      {
        next: { revalidate: 3600 },
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      },
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}
