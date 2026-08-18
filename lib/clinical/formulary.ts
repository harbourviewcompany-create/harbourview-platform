/**
 * Clinical formulary layer — jurisdiction-authorised product reference.
 * Distinct from marketplace listings and genetics. Not product marketing.
 */

export type FormularyAuthorizationStatus =
  | 'authorised'
  | 'import-authorised'
  | 'compounding-permitted'
  | 'restricted'
  | 'not-authorised'
  | 'unknown'

export type FormularyProductClass =
  | 'cbd-dominant'
  | 'thc-dominant'
  | 'balanced'
  | 'isolate'
  | 'full-spectrum'
  | 'pharmaceutical'
  | 'other'

export type FormularyProduct = {
  id: string
  slug: string
  name: string
  countryIso2: string
  productClass: FormularyProductClass
  authorizationStatus: FormularyAuthorizationStatus
  cannabinoidProfile: string
  routes: string[]
  authority: string
  notes: string
  primarySourceUrl?: string
  lastReviewed: string
  reviewStatus: 'published' | 'under-review'
}

export type FormularyQuery = {
  countryIso2?: string
  status?: FormularyAuthorizationStatus
  q?: string
  limit?: number
}

/** API/DTO shape returned by /api/clinical/formulary */
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

/** API/DTO shape returned by /api/clinical/formulary */
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
  brandName?: string | null
  registrationCode?: string | null
  strengthLabel?: string | null
}
