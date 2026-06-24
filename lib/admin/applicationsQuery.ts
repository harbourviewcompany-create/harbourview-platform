import { fetchAdminSupabaseJson, fetchAdminSupabaseJsonMutation, type AdminDataResult } from '@/lib/supabase/adminDataClient'

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
  action: 'approve' | 'reject',
): Promise<AdminDataResult<null>> {
  const patch =
    action === 'approve'
      ? { status: 'active', verification_status: 'verified' }
      : { status: 'rejected' }

  return fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/hv_professionals?id=eq.${encodeURIComponent(id)}`,
    'PATCH',
    patch,
  )
}

// ── Pending Suppliers ────────────────────────────────────────────────────────

export type PendingSupplierProfile = {
  id: string
  profile_slug: string
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

const SUPPLIER_SELECT =
  'id,profile_slug,company_name,contact_name,title,seller_type,categories,regions_served,description_public,website,hq_country,services_offered,created_at'

export async function listPendingSupplierProfiles(): Promise<AdminDataResult<PendingSupplierProfile[]>> {
  return fetchAdminSupabaseJson<PendingSupplierProfile[]>(
    `/rest/v1/supplier_profiles?status=eq.pending&select=${SUPPLIER_SELECT}&order=created_at.desc`,
  )
}

export async function decideSupplierApplication(
  id: string,
  action: 'approve' | 'reject',
): Promise<AdminDataResult<null>> {
  const patch =
    action === 'approve'
      ? { status: 'active', verification_status: 'verified' }
      : { status: 'rejected' }

  return fetchAdminSupabaseJsonMutation<null>(
    `/rest/v1/supplier_profiles?id=eq.${encodeURIComponent(id)}`,
    'PATCH',
    patch,
  )
}
