import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type SupplierProfile = {
  id: string
  profile_slug: string
  company_name: string | null
  title: string | null
  seller_type: string
  regions_served: string[] | null
  categories: string[]
  description_public: string | null
  created_at: string
}

export const SELLER_TYPE_LABELS: Record<string, string> = {
  cultivator: 'Cultivator / Grower',
  processor: 'Processor / Manufacturer',
  distributor: 'Distributor / Wholesaler',
  equipment: 'Equipment & Technology',
  genetics: 'Genetics / Breeder',
  lab_testing: 'Testing Lab / Analytics',
  packaging: 'Packaging & Compliance',
  services: 'Services & Consulting',
  other: 'Other',
}

export const CATEGORY_LABELS: Record<string, string> = {
  cultivation_equipment: 'Cultivation Equipment',
  processing_equipment: 'Processing Equipment',
  consumables: 'Consumables & Inputs',
  packaging: 'Packaging',
  logistics: 'Logistics & Distribution',
  labs_testing: 'Labs & Testing',
  professional_services: 'Professional Services',
  services: 'Services & Advisory',
  genetics: 'Genetics',
  supplier_directory: 'General Supply',
}

export async function getApprovedSupplierProfileById(profileSlug: string): Promise<SupplierProfile | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const params = new URLSearchParams({
      select: 'id,profile_slug,company_name,title,seller_type,regions_served,categories,description_public,created_at',
      profile_slug: `eq.${profileSlug}`,
      status: 'eq.approved',
      limit: '1',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles?${params}`, {
      cache: 'no-store',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getApprovedSupplierProfiles(): Promise<SupplierProfile[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'id,profile_slug,company_name,title,seller_type,regions_served,categories,description_public,created_at',
      status: 'eq.approved',
      order: 'created_at.desc',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles?${params}`, {
      // Admin approve/reject (app/api/admin/applications/suppliers/[id]) needs
      // this to reflect immediately, not after a stale-cache window — the page
      // itself is force-dynamic for the same reason. Mirrors app/professionals/page.tsx.
      cache: 'no-store',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
