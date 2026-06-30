'use server'

// Server action for the Professionals Directory application form.
// Writes a pending row to hv_professionals — admin reviews and flips
// status='active' + verification_status='verified' before it appears publicly.

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export type ProfessionalApplicationState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const ALLOWED_CREDENTIALS = new Set([
  'physician', 'pharmacist', 'nurse_practitioner', 'researcher',
  'pharmacologist', 'lawyer', 'consultant', 'regulator', 'educator', 'other',
])

const MAX_FIELD_LEN = 200
const MAX_BIO_LEN = 1200

function readField(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readMultiField(formData: FormData, key: string): string[] {
  const raw = readField(formData, key)
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 12)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_FIELD_LEN
}

export async function submitProfessionalApplication(
  _previousState: ProfessionalApplicationState,
  formData: FormData,
): Promise<ProfessionalApplicationState> {
  // Honeypot
  const website = readField(formData, 'website')
  if (website) {
    return { status: 'error', message: 'Application could not be processed.' }
  }

  const fullName = readField(formData, 'full_name')
  const email = readField(formData, 'email').toLowerCase()
  const title = readField(formData, 'title')
  const credentialType = readField(formData, 'credential_type') || 'other'
  const institution = readField(formData, 'institution')
  const institutionCountry = readField(formData, 'institution_country').toUpperCase().slice(0, 2)
  const bioPublic = readField(formData, 'bio_public')
  const countries = readMultiField(formData, 'countries').map(c => c.toUpperCase().slice(0, 2))
  const specialties = readMultiField(formData, 'specialties')
  const languages = readMultiField(formData, 'languages')
  const clinicalFocus = readMultiField(formData, 'clinical_focus')
  const acceptsReferrals = formData.get('accepts_referrals') === 'on'
  const consultationAvailable = formData.get('consultation_available') === 'on'
  const consent = formData.get('consent') === 'on'

  if (!fullName || !email || !credentialType) {
    return { status: 'error', message: 'Please complete your name, email, and credential type.' }
  }

  if (fullName.length > MAX_FIELD_LEN || institution.length > MAX_FIELD_LEN) {
    return { status: 'error', message: 'One or more fields is longer than allowed.' }
  }

  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Please use a valid email address.' }
  }

  if (!ALLOWED_CREDENTIALS.has(credentialType)) {
    return { status: 'error', message: 'Please select a valid credential type.' }
  }

  if (bioPublic.length > MAX_BIO_LEN) {
    return { status: 'error', message: `Bio must be under ${MAX_BIO_LEN} characters.` }
  }

  if (countries.length === 0) {
    return { status: 'error', message: 'Please list at least one market of practice.' }
  }

  if (!consent) {
    return { status: 'error', message: 'Please confirm consent before submitting.' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('professional_application: Supabase env vars missing')
    return {
      status: 'error',
      message: 'Application capture is not configured yet. Please contact Harbourview directly.',
    }
  }

  const svc = createClient(url, serviceKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })

  const baseSlug = slugify(fullName) || `professional-${Date.now()}`
  let profileSlug = baseSlug
  let suffix = 1
  // Ensure slug uniqueness — try a few times before falling back to timestamp
  while (suffix < 6) {
    const { data: existing } = await svc
      .from('hv_professionals')
      .select('id')
      .eq('profile_slug', profileSlug)
      .maybeSingle()
    if (!existing) break
    suffix += 1
    profileSlug = `${baseSlug}-${suffix}`
  }

  // bio_public doubles as the only free-text field -- append contact email there
  // for admin review since the table has no dedicated contact_email column.
  const bioWithContact = bioPublic
    ? `${bioPublic}\n\n[Application contact: ${email}]`
    : `[Application contact: ${email}]`

  const { error } = await svc.from('hv_professionals').insert({
    profile_slug: profileSlug,
    full_name: fullName,
    title: title || null,
    credential_type: credentialType,
    specialties,
    countries,
    languages,
    bio_public: bioWithContact,
    institution: institution || null,
    institution_country: institutionCountry || null,
    accepts_referrals: acceptsReferrals,
    consultation_available: consultationAvailable,
    clinical_focus: clinicalFocus.length > 0 ? clinicalFocus : null,
    // status='pending' keeps this hidden from the public directory (which only
    // shows status='active' AND verification_status='verified') until an admin
    // reviews the application and flips both fields.
    status: 'pending',
  })

  if (error) {
    console.error('professional_application: insert failed', error.message)
    return {
      status: 'error',
      message: 'The application could not be saved. Please try again or contact Harbourview directly.',
    }
  }

  return {
    status: 'success',
    message: 'Application received. Harbourview will review your credentials before your profile goes live in the directory.',
  }
}
