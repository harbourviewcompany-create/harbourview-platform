import 'server-only'
import { createClient } from '@supabase/supabase-js'

export type PlaybookStep = {
  step: number
  title: string
  body: string
  weeks: number
}

export type PlaybookRegulator = {
  name: string
  role: string
}

export type JurisdictionPlaybook = {
  country_iso2: string
  country_name: string
  difficulty: 'low' | 'moderate' | 'high' | 'very_high'
  typical_timeline_months: number
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

export async function getPlaybook(iso2: string): Promise<JurisdictionPlaybook | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const svc = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await svc
    .from('jurisdiction_playbooks')
    .select('*')
    .eq('country_iso2', iso2.toUpperCase())
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as JurisdictionPlaybook
}

export async function getAllPlaybooks(): Promise<JurisdictionPlaybook[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const svc = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await svc
    .from('jurisdiction_playbooks')
    .select('*')
    .eq('status', 'published')
    .order('country_name', { ascending: true })

  return (data ?? []) as JurisdictionPlaybook[]
}
