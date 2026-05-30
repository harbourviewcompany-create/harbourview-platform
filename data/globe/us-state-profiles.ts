import type { DashboardPanelState } from '@/lib/dashboard/contracts'

export interface UsStateProfile {
  iso2: string
  slug: string
  name: string
  abbreviation: string
  dashboardStatus: DashboardPanelState
}

type Seed = [iso2: string, slug: string, name: string, abbreviation: string]

const seeds: Seed[] = [
  ['US-AL', 'alabama', 'Alabama', 'AL'],
  ['US-AK', 'alaska', 'Alaska', 'AK'],
  ['US-AZ', 'arizona', 'Arizona', 'AZ'],
  ['US-AR', 'arkansas', 'Arkansas', 'AR'],
  ['US-CA', 'california', 'California', 'CA'],
  ['US-CO', 'colorado', 'Colorado', 'CO'],
  ['US-CT', 'connecticut', 'Connecticut', 'CT'],
  ['US-DE', 'delaware', 'Delaware', 'DE'],
  ['US-DC', 'district-of-columbia', 'District of Columbia', 'DC'],
  ['US-FL', 'florida', 'Florida', 'FL'],
  ['US-GA', 'georgia', 'Georgia', 'GA'],
  ['US-HI', 'hawaii', 'Hawaii', 'HI'],
  ['US-ID', 'idaho', 'Idaho', 'ID'],
  ['US-IL', 'illinois', 'Illinois', 'IL'],
  ['US-IN', 'indiana', 'Indiana', 'IN'],
  ['US-IA', 'iowa', 'Iowa', 'IA'],
  ['US-KS', 'kansas', 'Kansas', 'KS'],
  ['US-KY', 'kentucky', 'Kentucky', 'KY'],
  ['US-LA', 'louisiana', 'Louisiana', 'LA'],
  ['US-ME', 'maine', 'Maine', 'ME'],
  ['US-MD', 'maryland', 'Maryland', 'MD'],
  ['US-MA', 'massachusetts', 'Massachusetts', 'MA'],
  ['US-MI', 'michigan', 'Michigan', 'MI'],
  ['US-MN', 'minnesota', 'Minnesota', 'MN'],
  ['US-MS', 'mississippi', 'Mississippi', 'MS'],
  ['US-MO', 'missouri', 'Missouri', 'MO'],
  ['US-MT', 'montana', 'Montana', 'MT'],
  ['US-NE', 'nebraska', 'Nebraska', 'NE'],
  ['US-NV', 'nevada', 'Nevada', 'NV'],
  ['US-NH', 'new-hampshire', 'New Hampshire', 'NH'],
  ['US-NJ', 'new-jersey', 'New Jersey', 'NJ'],
  ['US-NM', 'new-mexico', 'New Mexico', 'NM'],
  ['US-NY', 'new-york', 'New York', 'NY'],
  ['US-NC', 'north-carolina', 'North Carolina', 'NC'],
  ['US-ND', 'north-dakota', 'North Dakota', 'ND'],
  ['US-OH', 'ohio', 'Ohio', 'OH'],
  ['US-OK', 'oklahoma', 'Oklahoma', 'OK'],
  ['US-OR', 'oregon', 'Oregon', 'OR'],
  ['US-PA', 'pennsylvania', 'Pennsylvania', 'PA'],
  ['US-RI', 'rhode-island', 'Rhode Island', 'RI'],
  ['US-SC', 'south-carolina', 'South Carolina', 'SC'],
  ['US-SD', 'south-dakota', 'South Dakota', 'SD'],
  ['US-TN', 'tennessee', 'Tennessee', 'TN'],
  ['US-TX', 'texas', 'Texas', 'TX'],
  ['US-UT', 'utah', 'Utah', 'UT'],
  ['US-VT', 'vermont', 'Vermont', 'VT'],
  ['US-VA', 'virginia', 'Virginia', 'VA'],
  ['US-WA', 'washington', 'Washington', 'WA'],
  ['US-WV', 'west-virginia', 'West Virginia', 'WV'],
  ['US-WI', 'wisconsin', 'Wisconsin', 'WI'],
  ['US-WY', 'wyoming', 'Wyoming', 'WY'],
]

export const usStateProfiles: UsStateProfile[] = seeds.map(([iso2, slug, name, abbreviation]) => ({
  iso2,
  slug,
  name,
  abbreviation,
  dashboardStatus: 'static-orientation',
}))

export const usStateByIso2 = Object.fromEntries(
  usStateProfiles.map((state) => [state.iso2, state]),
) as Record<string, UsStateProfile>

export const usStateSlugs = usStateProfiles.map((state) => state.slug)
