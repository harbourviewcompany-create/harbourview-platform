export const CANDIDATE_B_DEFAULT_COUNTRY = 'DE'

export const candidateBCountryOptions = [
  {
    iso2: 'DE',
    name: 'Germany',
    region: 'Europe',
  },
] as const

export type CandidateBCountryOption = (typeof candidateBCountryOptions)[number]
