import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'

type FormularyProductDbRow = {
  id: string
  slug: string
  name: string
  country_iso2: string
  product_class: string
  authorization_status: string
  cannabinoid_profile: string
  routes: string[] | null
  authority: string
  notes: string | null
  primary_source_url: string | null
  last_reviewed: string | null
  review_status: string
  brand_name: string | null
  registration_code: string | null
  strength_label: string | null
}

function mapRow(row: FormularyProductDbRow): FormularyProductDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    countryIso2: row.country_iso2,
    productClass: row.product_class,
    authorizationStatus: row.authorization_status,
    cannabinoidProfile: row.cannabinoid_profile,
    routes: Array.isArray(row.routes) ? row.routes : [],
    authority: row.authority,
    notes: row.notes ?? '',
    primarySourceUrl: row.primary_source_url,
    lastReviewed: row.last_reviewed ?? '',
    reviewStatus: row.review_status,
    brandName: row.brand_name,
    registrationCode: row.registration_code,
    strengthLabel: row.strength_label,
  }
}

export async function searchClinicalFormulary(opts: {
  countryIso2?: string
  q?: string
  limit?: number
  includeUnderReview?: boolean
}): Promise<{ state: 'loaded' | 'empty' | 'error'; products: FormularyProductDTO[]; error?: string }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('clinical_formulary_products')
      .select(
        'id,slug,name,country_iso2,product_class,authorization_status,cannabinoid_profile,routes,authority,notes,primary_source_url,last_reviewed,review_status,brand_name,registration_code,strength_label',
      )
      .order('name', { ascending: true })
      .limit(opts.limit ?? 50)

    if (!opts.includeUnderReview) query = query.eq('review_status', 'published')
    if (opts.countryIso2) query = query.eq('country_iso2', opts.countryIso2.toUpperCase())
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(`name.ilike.${q},notes.ilike.${q},cannabinoid_profile.ilike.${q},brand_name.ilike.${q},registration_code.ilike.${q}`)
    }

    const { data, error } = await query
    if (error) return { state: 'error', products: [], error: error.message }
    const products = ((data ?? []) as FormularyProductDbRow[]).map(mapRow)
    return { state: products.length ? 'loaded' : 'empty', products }
  } catch (error) {
    return {
      state: 'error',
      products: [],
      error: error instanceof Error ? error.message : 'Formulary query failed',
    }
  }
}

export type FormularySkuDTO = {
  id: string
  countryIso2: string
  authority: string
  registrationCode: string | null
  brandName: string | null
  productName: string
  strengthLabel: string | null
  dosageForm: string | null
  route: string | null
  cannabinoidProfile: string | null
  authorizationStatus: string
  sourceUrl: string | null
  sourceType: string
  notes: string
  lastSeenAt: string
}

type FormularySkuDbRow = {
  id: string
  country_iso2: string
  authority: string
  registration_code: string | null
  brand_name: string | null
  product_name: string
  strength_label: string | null
  dosage_form: string | null
  route: string | null
  cannabinoid_profile: string | null
  authorization_status: string
  source_url: string | null
  source_type: string
  notes: string | null
  last_seen_at: string | null
  review_status: string
}

export async function searchClinicalFormularySkus(opts: {
  countryIso2?: string
  q?: string
  limit?: number
}): Promise<{ state: 'loaded' | 'empty' | 'error'; skus: FormularySkuDTO[]; error?: string }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('clinical_formulary_skus')
      .select('id,country_iso2,authority,registration_code,brand_name,product_name,strength_label,dosage_form,route,cannabinoid_profile,authorization_status,source_url,source_type,notes,last_seen_at,review_status')
      .eq('review_status', 'published')
      .order('product_name', { ascending: true })
      .limit(opts.limit ?? 50)

    if (opts.countryIso2) query = query.eq('country_iso2', opts.countryIso2.toUpperCase())
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(`product_name.ilike.${q},brand_name.ilike.${q},registration_code.ilike.${q},notes.ilike.${q}`)
    }

    const { data, error } = await query
    if (error) return { state: 'error', skus: [], error: error.message }

    const skus: FormularySkuDTO[] = ((data ?? []) as FormularySkuDbRow[]).map((row) => ({
      id: row.id,
      countryIso2: row.country_iso2,
      authority: row.authority,
      registrationCode: row.registration_code,
      brandName: row.brand_name,
      productName: row.product_name,
      strengthLabel: row.strength_label,
      dosageForm: row.dosage_form,
      route: row.route,
      cannabinoidProfile: row.cannabinoid_profile,
      authorizationStatus: row.authorization_status,
      sourceUrl: row.source_url,
      sourceType: row.source_type,
      notes: row.notes ?? '',
      lastSeenAt: row.last_seen_at ?? '',
    }))
    return { state: skus.length ? 'loaded' : 'empty', skus }
  } catch (error) {
    return {
      state: 'error',
      skus: [],
      error: error instanceof Error ? error.message : 'SKU query failed',
    }
  }
}
