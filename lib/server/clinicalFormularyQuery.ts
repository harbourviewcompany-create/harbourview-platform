import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { FormularyProductDTO } from '@/lib/clinical/formulary'

function mapRow(row: Record<string, unknown>): FormularyProductDTO {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    countryIso2: String(row.country_iso2),
    productClass: String(row.product_class),
    authorizationStatus: String(row.authorization_status),
    cannabinoidProfile: String(row.cannabinoid_profile),
    routes: Array.isArray(row.routes) ? (row.routes as string[]) : [],
    authority: String(row.authority),
    notes: String(row.notes ?? ''),
    primarySourceUrl: row.primary_source_url ? String(row.primary_source_url) : null,
    lastReviewed: String(row.last_reviewed ?? ''),
    reviewStatus: String(row.review_status),
    brandName: row.brand_name ? String(row.brand_name) : null,
    registrationCode: row.registration_code ? String(row.registration_code) : null,
    strengthLabel: row.strength_label ? String(row.strength_label) : null,
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

    if (!opts.includeUnderReview) {
      query = query.eq('review_status', 'published')
    }
    if (opts.countryIso2) {
      query = query.eq('country_iso2', opts.countryIso2.toUpperCase())
    }
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(
        `name.ilike.${q},notes.ilike.${q},cannabinoid_profile.ilike.${q},brand_name.ilike.${q},registration_code.ilike.${q}`,
      )
    }

    const { data, error } = await query
    if (error) {
      return { state: 'error', products: [], error: error.message }
    }
    const products = (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
    return { state: products.length ? 'loaded' : 'empty', products }
  } catch (e) {
    return {
      state: 'error',
      products: [],
      error: e instanceof Error ? e.message : 'Formulary query failed',
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

export async function searchClinicalFormularySkus(opts: {
  countryIso2?: string
  q?: string
  limit?: number
}): Promise<{ state: 'loaded' | 'empty' | 'error'; skus: FormularySkuDTO[]; error?: string }> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('clinical_formulary_skus')
      .select(
        'id,country_iso2,authority,registration_code,brand_name,product_name,strength_label,dosage_form,route,cannabinoid_profile,authorization_status,source_url,source_type,notes,last_seen_at,review_status',
      )
      .eq('review_status', 'published')
      .order('product_name', { ascending: true })
      .limit(opts.limit ?? 50)

    if (opts.countryIso2) query = query.eq('country_iso2', opts.countryIso2.toUpperCase())
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`
      query = query.or(
        `product_name.ilike.${q},brand_name.ilike.${q},registration_code.ilike.${q},notes.ilike.${q}`,
      )
    }

    const { data, error } = await query
    if (error) return { state: 'error', skus: [], error: error.message }

    const skus: FormularySkuDTO[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        countryIso2: String(r.country_iso2),
        authority: String(r.authority),
        registrationCode: r.registration_code ? String(r.registration_code) : null,
        brandName: r.brand_name ? String(r.brand_name) : null,
        productName: String(r.product_name),
        strengthLabel: r.strength_label ? String(r.strength_label) : null,
        dosageForm: r.dosage_form ? String(r.dosage_form) : null,
        route: r.route ? String(r.route) : null,
        cannabinoidProfile: r.cannabinoid_profile ? String(r.cannabinoid_profile) : null,
        authorizationStatus: String(r.authorization_status),
        sourceUrl: r.source_url ? String(r.source_url) : null,
        sourceType: String(r.source_type),
        notes: String(r.notes ?? ''),
        lastSeenAt: String(r.last_seen_at ?? ''),
      }
    })
    return { state: skus.length ? 'loaded' : 'empty', skus }
  } catch (e) {
    return {
      state: 'error',
      skus: [],
      error: e instanceof Error ? e.message : 'SKU query failed',
    }
  }
}
