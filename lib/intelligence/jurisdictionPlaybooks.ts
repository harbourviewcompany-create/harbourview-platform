import 'server-only'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

export type PlaybookStep = {
  step: number
  title: string
  required: boolean
  description: string
  estimated_weeks: number
}

export type PlaybookRegulator = {
  name: string
  role: string
  tier?: 'top' | 'mid'
  country?: string
  website?: string | null
}

export type JurisdictionPlaybook = {
  country_iso2: string
  country_name: string
  difficulty: 'low' | 'moderate' | 'high' | 'very_high'
  typical_timeline_months: number | null
  estimated_cost_range: string | null
  legal_framework_summary: string | null
  steps: PlaybookStep[]
  key_regulators: PlaybookRegulator[]
  common_pitfalls: string[]
  last_reviewed: string
}

const DIFFICULTY_LABEL: Record<string, string> = {
  low:       'Low complexity',
  moderate:  'Moderate complexity',
  high:      'High complexity',
  very_high: 'Very high complexity',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  low:       '#4caf82',
  moderate:  '#d4a84b',
  high:      '#e07c3a',
  very_high: '#e05555',
}

export { DIFFICULTY_LABEL, DIFFICULTY_COLOR }

// Playbooks change infrequently — content is editorial and reviewed manually.
// 1-hour ISR is appropriate; this removes the per-request DB hit.
const PLAYBOOK_REVALIDATE = 3600

const PLAYBOOK_COLUMNS = [
  'country_iso2',
  'country_name',
  'difficulty',
  'typical_timeline_months',
  'estimated_cost_range',
  'legal_framework_summary',
  'steps',
  'key_regulators',
  'common_pitfalls',
  'last_reviewed',
].join(',')

export async function getPlaybook(iso2: string): Promise<JurisdictionPlaybook | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  try {
    // Use the shared fetch-based approach so Next.js can apply ISR revalidation.
    // The Supabase SDK's createClient does not integrate with Next.js fetch
    // caching, but a direct fetch() call does.
    const params = new URLSearchParams({
      select: PLAYBOOK_COLUMNS,
      country_iso2: `eq.${iso2.toUpperCase()}`,
      status: 'eq.published',
      limit: '1',
    })

    const res = await fetch(`${url}/rest/v1/jurisdiction_playbooks?${params}`, {
      next: { revalidate: PLAYBOOK_REVALIDATE },
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) return null
    const rows = await res.json()
    return (rows[0] as JurisdictionPlaybook) ?? null
  } catch {
    return null
  }
}

export async function getAllPlaybooks(): Promise<JurisdictionPlaybook[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const params = new URLSearchParams({
      select: PLAYBOOK_COLUMNS,
      status: 'eq.published',
      order: 'country_name.asc',
    })

    const res = await fetch(`${url}/rest/v1/jurisdiction_playbooks?${params}`, {
      next: { revalidate: PLAYBOOK_REVALIDATE },
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) return []
    const rows = await res.json()
    return (rows as JurisdictionPlaybook[]) ?? []
  } catch {
    return []
  }
}
