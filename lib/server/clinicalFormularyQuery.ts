import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type FormularyProductDTO = {
  id: string
  slug: string
  name: string
  countryIso2: string
  productClass: string
  authorizationStatus: string
  cannabinoidProfile: string
  routes: string[]
  authority: string
  notes: string
  primarySourceUrl: string | null
  lastReviewed: string
  reviewStatus: string
}

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
        'id,slug,name,country_iso2,product_class,authorization_status,cannabinoid_profile,routes,authority,notes,primary_source_url,last_reviewed,review_status',
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
      query = query.or(`name.ilike.${q},notes.ilike.${q},cannabinoid_profile.ilike.${q}`)
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
