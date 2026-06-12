import { PUBLIC_COUNTRY_DTO_ALLOWLIST } from '../lib/country-data/types'
import { getPublicCountryProfiles } from '../lib/country-data/public-country-dto'

const allowed = new Set<string>(PUBLIC_COUNTRY_DTO_ALLOWLIST)
const profiles = getPublicCountryProfiles()
const violations = profiles.flatMap((profile) =>
  Object.keys(profile)
    .filter((key) => !allowed.has(key))
    .map((key) => ({ slug: profile.slug, key })),
)

const result = {
  checkedProfiles: profiles.length,
  allowlistFields: PUBLIC_COUNTRY_DTO_ALLOWLIST.length,
  violations,
  pass: violations.length === 0,
}

console.log(JSON.stringify(result, null, 2))
if (!result.pass) process.exit(1)
