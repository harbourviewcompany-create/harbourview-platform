import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type EducationModule = {
  id: string
  slug: string
  title: string
  description: string
  audience: string[]
  sensitivity: string
  track_id: string
  publication_state: string
  sort_order: number
}

export type EducationTrack = {
  trackId: string
  label: string
  modules: EducationModule[]
}

export const TRACK_LABELS: Record<string, string> = {
  clinical: 'Clinical',
  compliance: 'Compliance & Quality',
  export: 'Export Readiness',
  genetics: 'Genetics & Cultivar IP',
  import: 'Import & Distribution',
  logistics: 'Logistics & Cold Chain',
  market: 'Market Access',
  quality: 'Lab & QA',
  regulatory: 'Regulatory Intelligence',
}

export const AUDIENCE_LABELS: Record<string, string> = {
  doctor_prescriber: 'Prescribing physicians',
  clinic_healthcare_operator: 'Clinic operators',
  pharmacist: 'Pharmacists',
  geneticist_breeder: 'Geneticists & breeders',
  cultivator_producer: 'Cultivators & producers',
  importer: 'Importers',
  exporter: 'Exporters',
  wholesaler_distributor: 'Wholesalers & distributors',
  processor_extractor: 'Processors & extractors',
  investor_operator: 'Investors & operators',
  government_regulator: 'Regulators & government',
  gmp_quality: 'GMP / quality teams',
  lab_qa: 'Lab & QA staff',
  general: 'General audience',
}

function trackOrder(trackId: string): number {
  const order = ['regulatory', 'market', 'compliance', 'export', 'import', 'logistics', 'quality', 'clinical', 'genetics']
  const idx = order.indexOf(trackId)
  return idx === -1 ? order.length : idx
}

export async function getPublishedEducationModules(): Promise<EducationModule[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'id,slug,title,description,audience,sensitivity,track_id,publication_state,sort_order',
      publication_state: 'eq.published',
      order: 'track_id.asc,sort_order.asc',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/education_modules?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getEducationModuleBySlug(slug: string): Promise<EducationModule | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const params = new URLSearchParams({
      select: 'id,slug,title,description,audience,sensitivity,track_id,publication_state,sort_order',
      slug: `eq.${slug}`,
      publication_state: 'eq.published',
      limit: '1',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/education_modules?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getEducationTracks(): Promise<EducationTrack[]> {
  const modules = await getPublishedEducationModules()
  const byTrack = new Map<string, EducationModule[]>()
  for (const m of modules) {
    const list = byTrack.get(m.track_id) ?? []
    list.push(m)
    byTrack.set(m.track_id, list)
  }
  return Array.from(byTrack.entries())
    .sort(([a], [b]) => trackOrder(a) - trackOrder(b))
    .map(([trackId, mods]) => ({
      trackId,
      label: TRACK_LABELS[trackId] ?? trackId,
      modules: mods,
    }))
}
