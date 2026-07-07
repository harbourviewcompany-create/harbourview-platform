import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type SupplierCapabilities = {
  business_type?: string
  title?: string | null
  website?: string | null
  hq_country?: string | null
  services_offered?: string[]
  regions_served?: string[]
}

export type SupplierProfile = {
  id: string
  company_name: string | null
  seller_type: string
  region: string
  categories: string[]
  description: string
  capabilities: SupplierCapabilities | null
  created_at: string
}

// Form-level business type (stored in capabilities.business_type), richer than
// the coarse DB `seller_type` enum — preferred for display when present.
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
  // DB-level seller_type enum fallback labels.
  licensed_producer: 'Licensed Producer',
  wholesaler: 'Wholesaler',
  retailer: 'Retailer',
  investor: 'Investor',
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

const SELECT_COLS = 'id,company_name,seller_type,region,categories,description,capabilities,created_at'

export function displaySellerType(profile: Pick<SupplierProfile, 'seller_type' | 'capabilities'>): string {
  const businessType = profile.capabilities?.business_type
  if (businessType && SELLER_TYPE_LABELS[businessType]) return SELLER_TYPE_LABELS[businessType]
  return SELLER_TYPE_LABELS[profile.seller_type] ?? profile.seller_type
}

export function displayRegions(profile: Pick<SupplierProfile, 'region' | 'capabilities'>): string {
  const countries = profile.capabilities?.regions_served
  if (countries && countries.length > 0) return countries.join(', ')
  return profile.region.replace(/_/g, ' ')
}

export async function getApprovedSupplierProfileById(id: string): Promise<SupplierProfile | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const params = new URLSearchParams({
      select: SELECT_COLS,
      id: `eq.${id}`,
      status: 'eq.approved',
      limit: '1',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles?${params}`, {
      cache: 'no-store',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const rows: SupplierProfile[] = await res.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getApprovedSupplierProfiles(): Promise<SupplierProfile[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: SELECT_COLS,
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
    const rows: SupplierProfile[] = await res.json()
    return rows
  } catch {
    return []
  }
}
