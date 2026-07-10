'use server'

// Server action for the Supplier Directory application form.
// Writes a pending_review row to supplier_profiles — admin reviews and flips
// status='approved' before it appears publicly in the supplier directory.
//
// NOTE: supplier_profiles has a narrower live schema than hv_professionals
// (single `region` enum, DB-level `seller_type` enum, `marketplace_category[]`
// categories, no profile_slug/title/website/hq_country/services_offered
// columns). Richer form input that doesn't map to a real column is preserved
// in the `capabilities` jsonb column instead of being dropped.

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export type SupplierApplicationState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const ALLOWED_SELLER_TYPES = new Set([
  'cultivator', 'processor', 'distributor', 'equipment',
  'genetics', 'lab_testing', 'packaging', 'services', 'other'
])

// Form business type -> live `seller_type` enum (licensed_producer | distributor |
// wholesaler | retailer | investor | other). The granular value the user picked
// is kept verbatim in capabilities.business_type for accurate display.
const SELLER_TYPE_DB_MAP: Record<string, string> = {
  cultivator: 'licensed_producer',
  processor: 'licensed_producer',
  distributor: 'distributor',
  equipment: 'other',
  genetics: 'licensed_producer',
  lab_testing: 'other',
  packaging: 'other',
  services: 'other',
  other: 'other',
}

// ISO2 -> live `region` enum (north_america | europe | asia_pacific |
// latin_america | middle_east_africa | global). Coarse on purpose — the full
// country list the supplier entered is preserved in capabilities.regions_served.
const REGION_BY_COUNTRY: Record<string, string> = {
  US: 'north_america', CA: 'north_america', MX: 'north_america',
  GB: 'europe', DE: 'europe', FR: 'europe', NL: 'europe', PT: 'europe', ES: 'europe',
  IT: 'europe', CH: 'europe', PL: 'europe', CZ: 'europe', GR: 'europe', DK: 'europe',
  AT: 'europe', BE: 'europe', SE: 'europe', NO: 'europe', FI: 'europe', IE: 'europe',
  RO: 'europe', HR: 'europe', UA: 'europe',
  AU: 'asia_pacific', NZ: 'asia_pacific', JP: 'asia_pacific', KR: 'asia_pacific',
  CN: 'asia_pacific', TH: 'asia_pacific', IN: 'asia_pacific', PH: 'asia_pacific',
  BR: 'latin_america', AR: 'latin_america', CO: 'latin_america', CL: 'latin_america',
  PE: 'latin_america', UY: 'latin_america', JM: 'latin_america', TT: 'latin_america',
  ZA: 'middle_east_africa', IL: 'middle_east_africa', AE: 'middle_east_africa',
  MA: 'middle_east_africa', LB: 'middle_east_africa',
}

// Live `marketplace_category` enum values relevant to supplier-directory listings.
const DB_CATEGORIES = new Set([
  'new_products', 'used_surplus', 'cannabis_inventory', 'wanted_requests', 'services',
  'business_opportunities', 'supplier_directory', 'cultivation_equipment', 'export_ready',
  'import_demand', 'consumables', 'distressed_inventory', 'distressed_businesses', 'genetics',
  'professional_services', 'labs_testing', 'logistics', 'packaging', 'processing_equipment',
])

// Freeform keyword -> nearest valid category, for the free-text category field.
const CATEGORY_KEYWORDS: Array<[string, string]> = [
  ['equipment', 'cultivation_equipment'],
  ['packaging', 'packaging'],
  ['genetic', 'genetics'],
  ['logistic', 'logistics'],
  ['test', 'labs_testing'],
  ['lab', 'labs_testing'],
  ['consult', 'professional_services'],
  ['service', 'professional_services'],
  ['consumable', 'consumables'],
  ['process', 'processing_equipment'],
]

function mapCategories(raw: string[]): string[] {
  const mapped = new Set<string>()
  for (const entry of raw) {
    const key = entry.toLowerCase().trim()
    if (DB_CATEGORIES.has(key)) {
      mapped.add(key)
      continue
    }
    for (const [keyword, category] of CATEGORY_KEYWORDS) {
      if (key.includes(keyword)) mapped.add(category)
    }
  }
  mapped.add('supplier_directory')
  return Array.from(mapped)
}

function mapRegion(countries: string[]): string {
  const regions = new Set(countries.map((c) => REGION_BY_COUNTRY[c] ?? 'global'))
  return regions.size === 1 ? [...regions][0] : 'global'
}

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

  if (!descriptionPublic) {
    return { status: 'error', message: 'Please provide a public company description.' }
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

  const svc = createClient(url, serviceKey, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })

  const { error } = await svc.from('supplier_profiles').insert({
    company_name: companyName,
    contact_name: contactName || null,
    contact_email: email,
    seller_type: SELLER_TYPE_DB_MAP[sellerType] ?? 'other',
    region: mapRegion(regionsServed),
    categories: mapCategories(categories),
    description: descriptionPublic,
    capabilities: {
      business_type: sellerType,
      title: title || null,
      website: websiteUrl || null,
      hq_country: hqCountry || null,
      services_offered: servicesOffered,
      regions_served: regionsServed,
    },
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
