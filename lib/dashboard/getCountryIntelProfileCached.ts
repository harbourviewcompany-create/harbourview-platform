import { unstable_cache } from 'next/cache'
import {
  getCountryIntelProfile as _getCountryIntelProfile,
} from './dashboardLiveData'
import type { CountryIntelProfile } from './dashboardLiveData'

export type { CountryIntelProfile }

// Cached wrapper — 24 hour revalidation.
// Each country gets its own cache entry keyed by ISO2.
// Use revalidateTag('country-intel-profile') to bust all entries on data updates,
// or revalidateTag(`country-intel-profile-${iso2.toUpperCase()}`) for a single country.
export const getCountryIntelProfile = (iso2: string | null): Promise<CountryIntelProfile | null> => {
  if (!iso2) return Promise.resolve(null)
  const key = iso2.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (key.length < 2) return Promise.resolve(null)
  return unstable_cache(
    () => _getCountryIntelProfile(key),
    ['country-intel-profile', key],
    {
      revalidate: 86400, // 24 hours
      tags: ['country-intel-profile', `country-intel-profile-${key}`],
    },
  )()
}
