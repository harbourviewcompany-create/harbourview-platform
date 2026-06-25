'use server'

// Server action for the Supplier Directory application form.
// Writes a pending row to supplier_profiles — admin reviews and flips
// status='active' + verification_status='verified' before it appears publicly.
// Mirrors submitProfessionalApplication.ts exactly in structure and security patterns.

import { createClient } from '@supabase/supabase-js'

export type SupplierApplicationState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const ALLOWED_SELLER_TYPES = new Set([
  'cultivator', 'processor', 'distributor', 'equipment', 
  'genetics', 'lab_testing', 'packaging', 'services', 'other'
])

const MAX_FIELD_LEN = 200
const MAX_DESCRIPTION_LEN = 1500

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

export async function submitSupplierApplication(
  _previousState: SupplierApplicationState,
  formData: FormData,
): Promise<SupplierApplicationState> {
  // Honeypot
  const website = readField(formData, 'website')
  if (website) {
    return { status: 'error', message: 'Application could not be processed.' }
  }

  const companyName = readField(formData, 'company_name')
  const contactName = readField(formData, 'contact_name')
  const email = readField(formData, 'email').toLowerCase()
  const title = readField(formData, 'title')
  const sellerType = readField(formData, 'seller_type') || 'other'
  const hqCountry = readField(formData, 'hq_country').toUpperCase().slice(0, 2)
  const descriptionPublic = readField(formData, 'description_public')
  const websiteUrl = readField(formData, 'website_url')
  const regionsServed = readMultiField(formData, 'regions_served').map(r => r.toUpperCase().slice(0, 2))
  const categories = readMultiField(formData, 'categories')
  const servicesOffered = readMultiField(formData, 'services_offered')
  const consent = formData.get('consent') === 'on'

  if (!companyName || !email || !sellerType) {
    return { status: 'error', message: 'Please complete company name, email, and business type.' }
  }

  if (companyName.length > MAX_FIELD_LEN || contactName.length > MAX_FIELD_LEN) {
    return { status: 'error', message: 'One or more fields is longer than allowed.' }
  }

  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Please use a valid email address.' }
  }

  if (!ALLOWED_SELLER_TYPES.has(sellerType)) {
    return { status: 'error', message: 'Please select a valid business type.' }
  }

  if (descriptionPublic.length > MAX_DESCRIPTION_LEN) {
    return { status: 'error', message: `Description must be under ${MAX_DESCRIPTION_LEN} characters.` }
  }

  if (regionsServed.length === 0) {
    return { status: 'error', message: 'Please list at least one market/region served.' }
  }

  if (!consent) {
    return { status: 'error', message: 'Please confirm consent before submitting.' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('supplier_application: Supabase env vars missing')
    return {
      status: 'error',
      message: 'Application capture is not configured yet. Please contact Harbourview directly.',
    }
  }

  const svc = createClient(url, serviceKey, { auth: { persistSession: false } })

  const baseSlug = slugify(companyName) || `supplier-${Date.now()}`
  let profileSlug = baseSlug
  let suffix = 1
  // Ensure slug uniqueness
  while (suffix < 6) {
    const { data: existing } = await svc
      .from('supplier_profiles')
      .select('id')
      .eq('profile_slug', profileSlug)
      .maybeSingle()
    if (!existing) break
    suffix += 1
    profileSlug = `${baseSlug}-${suffix}`
  }

  // description_public doubles as the only free-text field -- append contact email there
  // for admin review since we keep the table lean for now.
  const descriptionWithContact = descriptionPublic
    ? `${descriptionPublic}\n\n[Application contact: ${email}]`
    : `[Application contact: ${email}]`

  const { error } = await svc.from('supplier_applications').insert({
    profile_slug: profileSlug,
    company_name: companyName,
    contact_name: contactName || null,
    email,
    title: title || null,
    seller_type: sellerType,
    categories,
    regions_served: regionsServed,
    description_public: descriptionWithContact,
    website: websiteUrl || null,
    hq_country: hqCountry || null,
    services_offered: servicesOffered,
    // status='pending_review' hides this from the public directory and
    // surfaces it in the admin applications queue (which filters on pending_review)
    status: 'pending_review',
  })

  if (error) {
    console.error('supplier_application: insert failed', error.message)
    return {
      status: 'error',
      message: 'The application could not be saved. Please try again or contact Harbourview directly.',
    }
  }

  return {
    status: 'success',
    message: 'Application received. Harbourview will review your company before your profile goes live in the Supplier Directory.',
  }
}
