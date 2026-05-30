import { countries, getCountryByIso2 } from '@/lib/dashboard/countries'
import { canadaProvinceProfiles } from '@/data/globe/canada-province-profiles'
import { usStateProfiles } from '@/data/globe/us-state-profiles'
import type { CountryOption, CountryRoleProfile, RoleId } from '@/types/globe-router'
import { allRoleIds } from './role-profiles'

const curatedCountryOrder = ['DE', 'CA', 'PT', 'NL', 'AU', 'GB', 'US', 'CO', 'UY', 'IL', 'ZA']

function mapDashboardCountryToOption(country: (typeof countries)[number]): CountryOption {
  return {
    iso2: country.iso2,
    iso3: country.iso3,
    name: country.displayName,
    region: country.region,
    subregion: country.subregion,
    aliases: country.aliases,
    dashboardStatus: country.dashboardStatus,
  }
}

export const countryOptions: CountryOption[] = [
  ...curatedCountryOrder
    .map((iso2) => countries.find((country) => country.iso2 === iso2))
    .filter((country): country is (typeof countries)[number] => Boolean(country))
    .map(mapDashboardCountryToOption),
  ...countries
    .filter((country) => !curatedCountryOrder.includes(country.iso2))
    .map(mapDashboardCountryToOption),
]

// Province options — injected after country options so provinces appear in search
const provinceOptions: CountryOption[] = canadaProvinceProfiles.map((p) => ({
  iso2: p.iso2,
  name: p.name,
  region: 'Americas',
  subregion: 'North America',
  aliases: [p.abbreviation, `${p.name} Canada`, `CA-${p.abbreviation}`],
  dashboardStatus: p.dashboardStatus,
}))

// US state options — injected after province options
const usStateOptions: CountryOption[] = usStateProfiles.map((s) => ({
  iso2: s.iso2,
  name: s.name,
  region: 'Americas',
  subregion: 'North America',
  aliases: [s.abbreviation, `${s.name} United States`, `${s.name} USA`, `US-${s.abbreviation}`],
  dashboardStatus: s.dashboardStatus,
}))

// Merge: provinces and states appear after main country list
export const allCountryAndProvinceOptions: CountryOption[] = [
  ...countryOptions,
  ...provinceOptions,
  ...usStateOptions,
]

export const countryOptionMap = Object.fromEntries(
  countryOptions.map((country) => [country.iso2, country]),
) as Record<string, CountryOption>

export const defaultPrimaryRoleIds: RoleId[] = [
  'importer',
  'exporter',
  'doctor_prescriber',
  'pharmacist',
  'cultivator_producer',
  'lab_qa',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

const defaultSecondaryRoleIds: RoleId[] = allRoleIds.filter(
  (roleId) => !defaultPrimaryRoleIds.includes(roleId),
)

const exportMarketPrimaryRoleIds: RoleId[] = [
  'exporter',
  'importer',
  'gmp_quality',
  'logistics_customs',
  'distributor_wholesaler',
  'lab_qa',
  'cultivator_producer',
  'regulatory_compliance',
  'investor_operator',
  'not_sure',
]

export const defaultCountryRoleProfile: CountryRoleProfile = {
  countryIso2: 'GLOBAL',
  countryName: 'Global default',
  marketModel: 'unknown',
  primaryRoleIds: defaultPrimaryRoleIds,
  secondaryRoleIds: defaultSecondaryRoleIds,
  searchableRoleIds: allRoleIds,
}

export const countryRoleProfiles: CountryRoleProfile[] = [
  {
    countryIso2: 'DE',
    countryName: 'Germany',
    marketModel: 'medical',
    primaryRoleIds: [
      'importer',
      'exporter',
      'gmp_quality',
      'distributor_wholesaler',
      'pharmacist',
      'doctor_prescriber',
      'lab_qa',
      'regulatory_compliance',
      'investor_operator',
      'not_sure',
    ],
    secondaryRoleIds: [
      'cultivator_producer',
      'geneticist_breeder',
      'clinic_healthcare_operator',
      'legal_advisory',
      'patient_caregiver_education',
      'government_regulator',
      'logistics_customs',
    ],
    searchableRoleIds: allRoleIds,
    notes: 'Germany prioritizes medical, import, wholesale, pharmacy and quality pathways.',
  },
  {
    countryIso2: 'CA',
    countryName: 'Canada',
    marketModel: 'mixed',
    primaryRoleIds: [
      'cultivator_producer',
      'geneticist_breeder',
      'processor_extractor',
      'lab_qa',
      'exporter',
      'distributor_wholesaler',
      'retail_operator',
      'budtender',
      'doctor_prescriber',
      'regulatory_compliance',
      'investor_operator',
      'not_sure',
    ],
    secondaryRoleIds: [
      'pharmacist',
      'clinic_healthcare_operator',
      'importer',
      'legal_advisory',
      'patient_caregiver_education',
      'government_regulator',
      'gmp_quality',
      'logistics_customs',
    ],
    searchableRoleIds: allRoleIds,
    notes: 'Canada prioritizes licensed production, genetics, extraction, lab, export, retail and compliance pathways.',
  },
  ...['PT', 'NL', 'AU', 'GB', 'CO', 'UY', 'IL', 'ZA'].map((countryIso2) => ({
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
    marketModel: 'export' as const,
    primaryRoleIds: exportMarketPrimaryRoleIds,
    secondaryRoleIds: allRoleIds.filter((roleId) => !exportMarketPrimaryRoleIds.includes(roleId)),
    searchableRoleIds: allRoleIds,
    notes: 'Export-market profile prioritizes cross-border, quality, logistics and review pathways.',
  })),
]

export const countryRoleProfileMap = Object.fromEntries(
  countryRoleProfiles.map((profile) => [profile.countryIso2, profile]),
) as Record<string, CountryRoleProfile>

export function getCountryRoleProfile(countryIso2?: string): CountryRoleProfile {
  if (!countryIso2) return defaultCountryRoleProfile

  return countryRoleProfileMap[countryIso2] ?? {
    ...defaultCountryRoleProfile,
    countryIso2,
    countryName: countryOptionMap[countryIso2]?.name ?? getCountryName(countryIso2),
  }
}

export function getCountryName(countryIso2?: string) {
  if (!countryIso2) return 'Selected market'

  // Primary: full dashboard-safe country registry used by both desktop and mobile routing.
  const tracked = countryOptionMap[countryIso2]
  if (tracked) return tracked.name

  // Fallback: full 196-country Natural Earth database.
  const full = getCountryByIso2(countryIso2)
  if (full) return full.displayName

  return countryIso2
}

export function getMultiMarketRoleIds(countryIso2s: string[]) {
  if (countryIso2s.length === 0) return defaultPrimaryRoleIds

  const roleCount = new Map<RoleId, number>()

  countryIso2s.forEach((countryIso2) => {
    getCountryRoleProfile(countryIso2).primaryRoleIds.forEach((roleId) => {
      roleCount.set(roleId, (roleCount.get(roleId) ?? 0) + 1)
    })
  })

  const crossBorderFirst: RoleId[] = [
    'importer',
    'exporter',
    'distributor_wholesaler',
    'gmp_quality',
    'regulatory_compliance',
    'investor_operator',
    'lab_qa',
    'not_sure',
  ]

  const sortedRoles = [...allRoleIds].sort((a, b) => {
    const priorityA = crossBorderFirst.indexOf(a)
    const priorityB = crossBorderFirst.indexOf(b)
    const weightedA = (roleCount.get(a) ?? 0) * 10 + (priorityA === -1 ? 0 : 9 - priorityA)
    const weightedB = (roleCount.get(b) ?? 0) * 10 + (priorityB === -1 ? 0 : 9 - priorityB)

    return weightedB - weightedA
  })

  const prioritizedCrossBorder = crossBorderFirst.filter((roleId) => sortedRoles.includes(roleId))
  const remainingRoles = sortedRoles.filter((roleId) => !prioritizedCrossBorder.includes(roleId))

  return [...prioritizedCrossBorder, ...remainingRoles]
}
