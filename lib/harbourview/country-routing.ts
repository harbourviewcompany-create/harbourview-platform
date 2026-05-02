import { countries } from '@/data/harbourview/countries'

const slugSet = new Set(countries.map((c) => c.slug))

export function normalizeCountrySlug(input?: string | null) {
  if (!input) return null
  return input.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
}

export function getSafeCountrySlug(input?: string | null) {
  const slug = normalizeCountrySlug(input)
  if (!slug) return null
  return slugSet.has(slug) ? slug : null
}

export function getCountryBySlug(slug?: string | null) {
  if (!slug) return null
  return countries.find((c) => c.slug === slug) || null
}

export function buildCountryRoute(base: string, slug?: string | null) {
  const safe = getSafeCountrySlug(slug)
  if (!safe) return base
  return `${base}?country=${safe}`
}
