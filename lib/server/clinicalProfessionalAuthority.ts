import 'server-only'
import { requireVerifiedClinician } from '@/lib/clinical/auth'
import { createClient } from '@/lib/supabase/server'

export type ClinicalProfessionalAuthorityResult = {
  state: 'loaded' | 'unknown' | 'permission' | 'error'
  verifiedClinician: boolean
  professional: {
    id: string
    fullName: string
    role: string | null
    licenceNumber: string | null
    licenceJurisdiction: string | null
    verificationStatus: string | null
  } | null
  jurisdiction: string
  capabilities: {
    recommend: boolean | null
    prescribe: boolean | null
    dispense: boolean | null
    claimAppropriateness: boolean | null
  }
  evidenceVersion: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  notes: string | null
  error?: string
}

const unknownCapabilities = {
  recommend: null,
  prescribe: null,
  dispense: null,
  claimAppropriateness: null,
} as const

export async function resolveClinicalProfessionalAuthority(
  jurisdictionInput: string,
): Promise<ClinicalProfessionalAuthorityResult> {
  const jurisdiction = jurisdictionInput.trim().toUpperCase()
  const auth = await requireVerifiedClinician()
  if (!auth.ok) {
    return {
      state: 'permission',
      verifiedClinician: false,
      professional: null,
      jurisdiction,
      capabilities: { ...unknownCapabilities },
      evidenceVersion: null,
      effectiveFrom: null,
      effectiveTo: null,
      notes: auth.error,
    }
  }

  const professional = auth.professional
  const identity = professional ? {
    id: professional.id,
    fullName: professional.full_name,
    role: professional.clinical_role,
    licenceNumber: professional.licence_number,
    licenceJurisdiction: professional.licence_jurisdiction,
    verificationStatus: professional.verification_status,
  } : null

  if (!professional?.clinical_role) {
    return {
      state: 'unknown',
      verifiedClinician: true,
      professional: identity,
      jurisdiction,
      capabilities: { ...unknownCapabilities },
      evidenceVersion: null,
      effectiveFrom: null,
      effectiveTo: null,
      notes: 'Verified clinician has no resolved clinical role.',
    }
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('clinical_jurisdiction_authority')
      .select('jurisdiction,clinical_role,may_recommend,may_prescribe,may_dispense,may_claim_appropriateness,notes,evidence_version,effective_from,effective_to')
      .eq('jurisdiction', jurisdiction)
      .eq('clinical_role', professional.clinical_role)
      .lte('effective_from', now)
      .or(`effective_to.is.null,effective_to.gt.${now}`)
      .maybeSingle()

    if (error) {
      return {
        state: /permission|row-level security|42501/i.test(error.message) ? 'permission' : 'error',
        verifiedClinician: true,
        professional: identity,
        jurisdiction,
        capabilities: { ...unknownCapabilities },
        evidenceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        notes: null,
        error: error.message,
      }
    }

    if (!data) {
      return {
        state: 'unknown',
        verifiedClinician: true,
        professional: identity,
        jurisdiction,
        capabilities: { ...unknownCapabilities },
        evidenceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        notes: 'No current governed authority row exists for this jurisdiction and professional role.',
      }
    }

    return {
      state: 'loaded',
      verifiedClinician: true,
      professional: identity,
      jurisdiction,
      capabilities: {
        recommend: Boolean(data.may_recommend),
        prescribe: Boolean(data.may_prescribe),
        dispense: Boolean(data.may_dispense),
        claimAppropriateness: Boolean(data.may_claim_appropriateness),
      },
      evidenceVersion: data.evidence_version ?? null,
      effectiveFrom: data.effective_from ?? null,
      effectiveTo: data.effective_to ?? null,
      notes: data.notes ?? null,
    }
  } catch (error) {
    return {
      state: 'error',
      verifiedClinician: true,
      professional: identity,
      jurisdiction,
      capabilities: { ...unknownCapabilities },
      evidenceVersion: null,
      effectiveFrom: null,
      effectiveTo: null,
      notes: null,
      error: error instanceof Error ? error.message : 'Authority resolution failed',
    }
  }
}
