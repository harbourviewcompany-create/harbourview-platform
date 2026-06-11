import 'server-only'

import { getPublicCountryProfileBySlug, getPublicCountryProfiles } from './public-country-dto'

export async function listPublicCountryProfiles() {
  return getPublicCountryProfiles()
}

export async function getPublicCountryProfile(slug: string) {
  return getPublicCountryProfileBySlug(slug)
}
