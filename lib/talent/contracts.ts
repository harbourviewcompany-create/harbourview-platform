export type TalentJobDTO = {
  id: string
  title: string
  department: string | null
  description: string | null
  countryIso2: string | null
  regionCode: string | null
  locality: string | null
  locationText: string | null
  employmentType: string | null
  workplaceType: string | null
  applicationMethod: 'harbourview_direct' | 'external' | 'agency' | 'contact_employer'
  applicationUrl: string | null
  freshnessState: string
  lastConfirmedAt: string | null
  publishedAt: string | null
  employer: {
    workspaceId: string
    name: string
    verificationStatus: string | null
  }
}

export type TalentJobSearchResponse = {
  data: TalentJobDTO[]
  nextCursor: string | null
  state: 'loaded' | 'empty' | 'no_match' | 'degraded'
}

export type TalentCandidateDTO = {
  personId: string
  displayName: string | null
  headline: string | null
  countryIso2: string | null
  availabilityState: string | null
  visibilityMode: string
  disclosureLevel: number
  capabilities: string[]
  credentials: string[]
  languages: string[]
  verificationSummary: string
}

export type TalentPeopleSearchResponse = {
  data: TalentCandidateDTO[]
  nextCursor: string | null
  state: 'loaded' | 'empty' | 'no_match'
}

export function encodeTalentCursor(createdAt: string, id: string) {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url')
}

export function decodeTalentCursor(cursor: string | null) {
  if (!cursor) return null
  try {
    const value = Buffer.from(cursor, 'base64url').toString('utf8')
    const divider = value.lastIndexOf('|')
    if (divider < 1) return null
    const createdAt = value.slice(0, divider)
    const id = value.slice(divider + 1)
    if (!createdAt || !/^[0-9a-f-]{36}$/i.test(id) || Number.isNaN(Date.parse(createdAt))) return null
    return { createdAt, id }
  } catch {
    return null
  }
}
