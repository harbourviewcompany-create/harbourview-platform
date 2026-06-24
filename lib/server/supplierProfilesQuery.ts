import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type SupplierProfile = {
  id: string
  profile_slug: string
  company_name: string
  title: string | null
  seller_type: string
  categories: string[]
  regions_served: string[]
  description_public: string | null
  website: string | null
  hq_country: string | null
  services_offered: string[]
  verification_status: string
  status: string
  created_at: string
}

export const SELLER_TYPE_LABELS: Record<string, string> = {
  cultivator: 'Cultivator / Grower',
  processor: 'Processor / Manufacturer',
  distributor: 'Distributor / Wholesaler',
  equipment: 'Equipment & Technology Provider',
  genetics: 'Genetics / Breeder',
  lab_testing: 'Testing Lab / Analytics',
  packaging: 'Packaging & Compliance',
  services: 'Services & Consulting',
  other: 'Other',
}

export const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia-Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

export const CATEGORY_LABELS: Record<string, string> = {
  flower: 'Flower',
  edibles: 'Edibles',
  vapes: 'Vapes & Concentrates',
  equipment: 'Equipment',
  genetics: 'Genetics',
  packaging: 'Packaging',
  testing: 'Testing & Labs',
  services: 'Services & Advisory',
  other: 'Other',
}

export async function getApprovedSupplierProfiles(): Promise<SupplierProfile[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'id,profile_slug,company_name,seller_type,categories,regions_served,description_public,website,hq_country,services_offered,verification_status,status,created_at',
      'status': 'eq.active',
      'verification_status': 'eq.verified',
      order: 'created_at.desc',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles?${params}`, {
      cache: 'no-store',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
