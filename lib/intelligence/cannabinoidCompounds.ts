import 'server-only'

// Cannabinoid compound reference data, sourced from ChEMBL (public.cannabinoid_compounds
// -> api.cannabinoid_compounds). Same fetch-based pattern as jurisdictionPlaybooks.ts: a
// direct fetch() to PostgREST (not the Supabase SDK client) so Next.js can apply ISR
// revalidation to the request.

export type CannabinoidCompound = {
  id: string
  chembl_id: string
  pref_name: string
  max_phase: number | null
  first_approval: number | null
  is_natural_product: boolean | null
  is_approved_drug: boolean | null
  therapeutic_flag: boolean | null
  molecular_formula: string | null
  synonyms: string[] | null
  atc_codes: string[] | null
  regulatory_notes: string | null
  fetched_at: string
  updated_at: string
}

// Compound reference data changes on a weekly ChEMBL sync cadence at most --
// editorial/reference content, not live signals. 1-hour ISR matches the
// playbooks precedent and removes the per-request DB hit.
const COMPOUND_REVALIDATE = 3600

const COMPOUND_COLUMNS = [
  'id',
  'chembl_id',
  'pref_name',
  'max_phase',
  'first_approval',
  'is_natural_product',
  'is_approved_drug',
  'therapeutic_flag',
  'molecular_formula',
  'synonyms',
  'atc_codes',
  'regulatory_notes',
  'fetched_at',
  'updated_at',
].join(',')

function restBase(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

export async function getAllCannabinoidCompounds(): Promise<CannabinoidCompound[]> {
  const base = restBase()
  if (!base) return []

  try {
    const params = new URLSearchParams({
      select: COMPOUND_COLUMNS,
      order: 'max_phase.desc,pref_name.asc',
    })

    const res = await fetch(`${base.url}/rest/v1/cannabinoid_compounds?${params}`, {
      next: { revalidate: COMPOUND_REVALIDATE },
      headers: {
        apikey: base.key,
        Authorization: `Bearer ${base.key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) return []
    const rows = await res.json()
    return (rows as CannabinoidCompound[]) ?? []
  } catch {
    return []
  }
}

export async function getCannabinoidCompound(chemblId: string): Promise<CannabinoidCompound | null> {
  const base = restBase()
  if (!base) return null

  try {
    const params = new URLSearchParams({
      select: COMPOUND_COLUMNS,
      chembl_id: `eq.${chemblId.toUpperCase()}`,
      limit: '1',
    })

    const res = await fetch(`${base.url}/rest/v1/cannabinoid_compounds?${params}`, {
      next: { revalidate: COMPOUND_REVALIDATE },
      headers: {
        apikey: base.key,
        Authorization: `Bearer ${base.key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) return null
    const rows = await res.json()
    return (rows[0] as CannabinoidCompound) ?? null
  } catch {
    return null
  }
}

export function approvalLabel(compound: CannabinoidCompound): string {
  if (compound.is_approved_drug) {
    return compound.first_approval ? `Approved drug (${compound.first_approval})` : 'Approved drug'
  }
  if (compound.max_phase != null) return `Phase ${compound.max_phase} — no approval`
  return 'No clinical phase on record'
}
