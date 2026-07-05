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

export type EducationModuleSection = {
  id: string
  module_id: string
  section_order: number
  heading: string
  body: string
  block_type: string
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

// education_tracks holds proper UUID-keyed tracks (Country Intelligence, Industry
// Intelligence, etc.) added alongside the original free-text slugs (clinical,
// compliance, ...). track_id on education_modules can be either shape depending
// on when the row was created — this resolves both into one label map so neither
// the hub nor the detail page ever renders a raw UUID as a section header.
async function getDynamicTrackLabels(): Promise<Record<string, string>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {}
  try {
    const params = new URLSearchParams({
      select: 'id,title',
      publication_state: 'eq.published',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/education_tracks?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return {}
    const rows: { id: string; title: string }[] = await res.json()
    return Object.fromEntries(rows.map((r) => [r.id, r.title]))
  } catch {
    return {}
  }
}

export async function getTrackLabelMap(): Promise<Record<string, string>> {
  const dynamicLabels = await getDynamicTrackLabels()
  return { ...TRACK_LABELS, ...dynamicLabels }
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

// Returns the deep-guide body content for a module, ordered for display.
// education_module_sections holds the ~2,500+ word per-module content
// (Why This Matters / The Core Framework / How This Plays Out in Practice /
// etc.) that the detail page previously never fetched.
export async function getModuleSections(moduleId: string): Promise<EducationModuleSection[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({
      select: 'id,module_id,section_order,heading,body,block_type',
      module_id: `eq.${moduleId}`,
      order: 'section_order.asc',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/education_module_sections?${params}`, {
      next: { revalidate: 3600 },
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getEducationTracks(): Promise<EducationTrack[]> {
  const [modules, labelMap] = await Promise.all([
    getPublishedEducationModules(),
    getTrackLabelMap(),
  ])
  const byTrack = new Map<string, EducationModule[]>()
  for (const m of modules) {
    const list = byTrack.get(m.track_id) ?? []
    list.push(m)
    byTrack.set(m.track_id, list)
  }
  return Array.from(byTrack.entries())
    .sort(([a], [b]) => {
      const orderA = trackOrder(a)
      const orderB = trackOrder(b)
      if (orderA !== orderB) return orderA - orderB
      // Both unranked (e.g. two dynamic tracks) — fall back to alphabetical by label
      return (labelMap[a] ?? a).localeCompare(labelMap[b] ?? b)
    })
    .map(([trackId, mods]) => ({
      trackId,
      label: labelMap[trackId] ?? trackId,
      modules: mods,
    }))
}
