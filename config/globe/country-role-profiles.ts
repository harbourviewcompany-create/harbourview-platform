import { getCountryByIso2 } from '@/lib/dashboard/countries'
import type { CountryOption, CountryRoleProfile, RoleId } from '@/types/globe-router'
import { allRoleIds } from './role-profiles'

export const countryOptions: CountryOption[] = [
  { iso2: 'DE', name: 'Germany', region: 'Europe' },
  { iso2: 'CA', name: 'Canada', region: 'North America' },
  { iso2: 'PT', name: 'Portugal', region: 'Europe' },
  { iso2: 'NL', name: 'Netherlands', region: 'Europe' },
  { iso2: 'AU', name: 'Australia', region: 'Oceania' },
  { iso2: 'GB', name: 'United Kingdom', region: 'Europe' },
  { iso2: 'US', name: 'United States', region: 'North America' },
  { iso2: 'CO', name: 'Colombia', region: 'South America' },
  { iso2: 'UY', name: 'Uruguay', region: 'South America' },
  { iso2: 'IL', name: 'Israel', region: 'Middle East' },
  { iso2: 'ZA', name: 'South Africa', region: 'Africa' },
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
    countryName: countryOptionMap[countryIso2]?.name ?? countryIso2,
  }
}

export function getCountryName(countryIso2?: string) {
  if (!countryIso2) return 'Selected market'

  // Primary: tracked-alpha short list with curated names
  const tracked = countryOptionMap[countryIso2]
  if (tracked) return tracked.name

  // Fallback: full 196-country Natural Earth database
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
