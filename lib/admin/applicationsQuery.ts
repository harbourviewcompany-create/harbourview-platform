import {
  fetchAdminSupabaseJson,
  fetchAdminSupabaseJsonMutation,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'

export type PendingProfessional = {
  id: string
  full_name: string
  title: string | null
  credential_type: string
  institution: string | null
  institution_country: string | null
  countries: string[]
  specialties: string[]
  bio_public: string | null
  created_at: string
}

export type PendingSupplierProfile = {
  id: string
  company_name: string | null
  contact_name: string | null
  email: string | null
  seller_type: string
  regions_served: string[] | null
  categories: string[]
  description_public: string | null
  hq_country: string | null
  created_at: string
}

const PROFESSIONAL_SELECT =
  'id,full_name,title,credential_type,institution,institution_country,countries,specialties,bio_public,created_at'
const SUPPLIER_SELECT =
  'id,company_name,contact_name,email,seller_type,regions_served,categories,description_public,hq_country,created_at'

export async function listPendingProfessionals(): Promise<AdminDataResult<PendingProfessional[]>> {
  return fetchAdminSupabaseJson<PendingProfessional[]>(
    `/rest/v1/hv_professionals?status=eq.pending&select=${PROFESSIONAL_SELECT}&order=created_at.desc`,
  )
}

export async function listPendingSupplierProfiles(): Promise<AdminDataResult<PendingSupplierProfile[]>> {
  // supplier_profiles.status is the listing_status enum: pending_review | approved | rejected | archived.
  // Verified directly against the live schema (information_schema.columns + pg_enum) before writing this.
  return fetchAdminSupabaseJson<PendingSupplierProfile[]>(
    `/rest/v1/supplier_profiles?status=eq.pending_review&select=${SUPPLIER_SELECT}&order=created_at.desc`,
  )
}

export async function decideProfessionalApplication(
  id: string,
  decision: 'approve' | 'reject',
): Promise<AdminDataResult<null>> {
  const body =
    decision === 'approve'
      ? { status: 'active', verification_status: 'verified', verified_at: new Date().toISOString() }
      : { status: 'rejected', verification_status: 'rejected' }
  return fetchAdminSupabaseJsonMutation(`/rest/v1/hv_professionals?id=eq.${encodeURIComponent(id)}`, 'PATCH', body)
}

export async function decideSupplierApplication(
  id: string,
  decision: 'approve' | 'reject',
): Promise<AdminDataResult<null>> {
  const body = { status: decision === 'approve' ? 'approved' : 'rejected' }
  return fetchAdminSupabaseJsonMutation(`/rest/v1/supplier_profiles?id=eq.${encodeURIComponent(id)}`, 'PATCH', body)
}
