'use server'

import { createClient } from '@/lib/supabase/server'

export type CreatePassportState = {
  status: 'idle' | 'success' | 'error'
  message: string
  passportId?: string
}

const CULTIVAR_CATEGORIES = new Set([
  'cannabis', 'hemp', 'cbd', 'medical', 'adult_use',
  'research', 'pharmaceutical', 'industrial', 'unknown',
])

const CANNABIS_CATEGORIES = new Set([
  'cbd_dominant', 'thc_dominant', 'balanced', 'minor_cannabinoid', 'industrial_hemp', 'unknown',
])

const MAX_NAME_LEN = 200
const MAX_SUMMARY_LEN = 1200

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function createPassport(
  _prev: CreatePassportState,
  formData: FormData,
): Promise<CreatePassportState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'error', message: 'You must be signed in to create a passport.' }
  }

  const displayName = (formData.get('display_name') as string ?? '').trim()
  const publicSummary = (formData.get('public_summary') as string ?? '').trim()
  const cultivarCategory = (formData.get('cultivar_category') as string ?? '').trim()
  const cannabisCategoryRaw = (formData.get('cannabis_category') as string ?? '').trim()
  const cannabisCategory = cannabisCategoryRaw || null
  const originCountryRaw = (formData.get('origin_country_code') as string ?? '').trim().toUpperCase().slice(0, 2)
  const originCountryCode = originCountryRaw || null
  const isPublic = formData.get('is_public') === 'on'

  if (!displayName || displayName.length > MAX_NAME_LEN) {
    return { status: 'error', message: 'Display name is required and must be under 200 characters.' }
  }
  if (!publicSummary || publicSummary.length > MAX_SUMMARY_LEN) {
    return { status: 'error', message: 'Public summary is required and must be under 1,200 characters.' }
  }
  if (!CULTIVAR_CATEGORIES.has(cultivarCategory)) {
    return { status: 'error', message: 'Please select a valid cultivar category.' }
  }
  if (cannabisCategory && !CANNABIS_CATEGORIES.has(cannabisCategory)) {
    return { status: 'error', message: 'Please select a valid cannabis category.' }
  }

  const baseSlug = slugify(displayName) || `cultivar-${Date.now()}`
  let slug = baseSlug
  for (let i = 1; i <= 5; i++) {
    const { data: existing } = await supabase
      .from('cultivar_passports')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${i}`
  }

  const { data, error } = await supabase
    .from('cultivar_passports')
    .insert({
      display_name: displayName,
      slug,
      public_summary: publicSummary,
      cultivar_category: cultivarCategory,
      cannabis_category: cannabisCategory,
      origin_country_code: originCountryCode,
      owner_user_id: user.id,
      is_public: isPublic,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createPassport: insert failed', error.message)
    return { status: 'error', message: 'Could not create passport. Please try again.' }
  }

  return {
    status: 'success',
    message: `Passport "${displayName}" created. It will go through admin review before public display.`,
    passportId: data.id,
  }
}
