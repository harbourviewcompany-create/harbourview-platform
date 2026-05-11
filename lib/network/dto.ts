import type { NetworkCountry, PublicNetworkCountryDTO } from './types'

export function toPublicCountryDTO(country: NetworkCountry): PublicNetworkCountryDTO {
  return {
    id: country.id,
    slug: country.slug,
    name: country.name,
    publicSummary: country.publicSummary,
  }
}
