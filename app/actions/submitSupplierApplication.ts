'use server'

// Server action for the Supplier Directory application form.
// Writes a pending_review row to supplier_profiles — admin reviews and
// flips status='approved' before it appears on the public directory.
//
// Uses the anon key (not service role): supplier_profiles RLS already has
// a purpose-built anon-insert policy (supplier_profiles_anon_insert) that
// enforces status='pending_review', description length, email format, and
// blocks internal_notes/archived_at from being set by a public submitter.
// The database is already the source of truth for these constraints, so
// this action validates for good UX but doesn't need to duplicate every
// rule or use elevated privileges to do so.

import { createClient } from '@supabase/supabase-js'

export type SupplierApplicationState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const ALLOWED_SELLER_TYPES = new Set([
  'licensed_producer', 'distributor', 'wholesaler', 'retailer', 'investor', 'other',
])

const ALLOWED_REGIONS = new Set([
  'north_america', 'europe', 'asia_pacific', 'latin_america', 'middle_east_africa', 'global',
])

const ALLOWED_CATEGORIES = new Set([
  'cultivation_equipment', 'processing_equipment', 'consumables', 'packaging',
  'logistics', 'labs_testing', 'professional_services', 'services', 'genetics',
  'supplier_directory',
])

const MAX_FIELD_LEN = 200
const MAX_DESCRIPTION_LEN = 2000

function readField(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function submitSupplierApplication(
  _previousState: SupplierApplicationState,
  formData: FormData,
): Promise<SupplierApplicationState> {
  // Honeypot
  const website = readField(formData, 'website_url')
  if (website) {
    return { status: 'error', message: 'Application could not be processed.' }
  }

  const companyName = readField(formData, 'company_name')
  const contactName = readField(formData, 'contact_name')
  const contactEmail = readField(formData, 'contact_email').toLowerCase()
  const contactPhone = readField(formData, 'contact_phone')
  const sellerType = readField(formData, 'seller_type')
  const region = readField(formData, 'region')
  const categories = formData.getAll('categories').map((c) => String(c))
  const description = readField(formData, 'description')
  const consent = formData.get('consent') === 'on'

  if (!companyName || !contactName || !contactEmail || !description) {
    return { status: 'error', message: 'Please complete company name, contact name, email, and description.' }
  }

  if (companyName.length > MAX_FIELD_LEN || contactName.length > MAX_FIELD_LEN) {
    return { status: 'error', message: 'One or more fields is longer than allowed.' }
  }

  if (!isValidEmail(contactEmail)) {
    return { status: 'error', message: 'Please use a valid email address.' }
  }

  if (!ALLOWED_SELLER_TYPES.has(sellerType)) {
    return { status: 'error', message: 'Please select a valid company type.' }
  }

  if (!ALLOWED_REGIONS.has(region)) {
    return { status: 'error', message: 'Please select a valid region.' }
  }

  if (categories.length === 0 || !categories.every((c) => ALLOWED_CATEGORIES.has(c))) {
    return { status: 'error', message: 'Please select at least one valid supply category.' }
  }

  if (description.length > MAX_DESCRIPTION_LEN) {
    return { status: 'error', message: `Description must be under ${MAX_DESCRIPTION_LEN} characters.` }
  }

  if (!consent) {
    return { status: 'error', message: 'Please confirm consent before submitting.' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    console.error('supplier_application: Supabase env vars missing')
    return {
      status: 'error',
      message: 'Application capture is not configured yet. Please contact Harbourview directly.',
    }
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } })

  const { error } = await supabase.from('supplier_profiles').insert({
    company_name: companyName,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    seller_type: sellerType,
    region,
    categories,
    description,
    // RLS requires this exact value for anon inserts — explicit here even
    // though it matches the column default, to keep the insert unambiguous.
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
    message: 'Application received. Harbourview will review your submission before your profile goes live in the directory.',
  }
}
