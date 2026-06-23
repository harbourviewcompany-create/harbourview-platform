import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'

// ... other imports and types

export type PendingSupplierProfile = {
  id: string
  company_name: string
  contact_name: string | null
  title: string | null
  seller_type: string
  categories: string[]
  regions_served: string[]
  description_public: string | null
  website: string | null
  hq_country: string | null
  services_offered: string[]
  created_at: string
}

const SUPPLIER_SELECT = 'id,company_name,contact_name,title,seller_type,categories,regions_served,description_public,website,hq_country,services_offered,created_at'

export async function listPendingSupplierProfiles(): Promise<PendingSupplierProfile[]> {
  return fetchAdminSupabaseJson<PendingSupplierProfile[]>(
    `/rest/v1/supplier_profiles?status=eq.pending&select=${SUPPLIER_SELECT}&order=created_at.desc`,
  )
}

// Keep other functions (listPendingProfessionals, etc.) as they were
