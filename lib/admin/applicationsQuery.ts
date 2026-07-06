import {
  fetchAdminSupabaseJson,
  fetchAdminSupabaseJsonMutation,
  type AdminDataResult,
} from '@/lib/supabase/adminDataClient'

// ── Pending Professionals ────────────────────────────────────────────────────

export type PendingProfessional = {
  id: string
  profile_slug: string
  full_name: string
  title: string | null
  credential_type: string
  specialties: string[]
  countries: string[]
  languages: string[]
  bio_public: string | null
  institution: string | null
  institution_country: string | null
  accepts_referrals: boolean
  consultation_available: boolean
  verification_status: string
  status: string
  created_at: string
}

const PROFESSIONAL_SELECT =
  'id,profile_slug,full_name,title,credential_type,specialties,countries,languages,bio_public,institution,institution_country,accepts_referrals,consultation_available,verification_status,status,created_at'

export async function listPendingProfessionals(): Promise<AdminDataResult<PendingProfessional[]>> {
  return fetchAdminSupabaseJson<PendingProfessional[]>(
    `/rest/v1/hv_professionals?status=eq.pending&select=${PROFESSIONAL_SELECT}&order=created_at.desc`,
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

// ── Pending Suppliers ────────────────────────────────────────────────────────

export type PendingSupplierProfile = {
  id: string
  company_name: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  seller_type: string
  region: string
  categories: string[]
  description: string
  capabilities: {
    business_type?: string
    title?: string | null
    website?: string | null
    hq_country?: string | null
    services_offered?: string[]
    regions_served?: string[]
  } | null
  created_at: string
}

const SUPPLIER_SELECT =
  'id,company_name,contact_name,contact_email,contact_phone,seller_type,region,categories,description,capabilities,created_at'

export async function listPendingSupplierProfiles(): Promise<AdminDataResult<PendingSupplierProfile[]>> {
  // supplier_profiles.status is the listing_status enum: pending_review | approved | rejected | archived.
  // Verified directly against the live schema (information_schema.columns + pg_enum) before writing this.
  return fetchAdminSupabaseJson<PendingSupplierProfile[]>(
    `/rest/v1/supplier_profiles?status=eq.pending_review&select=${SUPPLIER_SELECT}&order=created_at.desc`,
  )
}

export async function decideSupplierApplication(
  id: string,
  decision: 'approve' | 'reject',
): Promise<AdminDataResult<null>> {
  const body = { status: decision === 'approve' ? 'approved' : 'rejected' }
  return fetchAdminSupabaseJsonMutation(`/rest/v1/supplier_profiles?id=eq.${encodeURIComponent(id)}`, 'PATCH', body)
}
