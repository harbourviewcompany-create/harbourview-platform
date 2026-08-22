/**
 * Harbourview Talent — read query layer
 * Session-aware. No hard dependency on organizations join.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  TalentListParams,
  TalentListResult,
  TalentOpportunity,
} from '@/types/talent'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

/**
 * The `talent_opportunities` row as it comes back from Postgres, before
 * `mapRow` normalises it.
 *
 * Derived from `TalentOpportunity` rather than restated, so a field added to
 * the DTO cannot silently drift from the row shape. Only the columns that
 * genuinely differ are overridden: the three the mapper defaults or renames,
 * plus the denormalised company columns the migration stores in place of an
 * `organizations` join (see the comment on `talent_opportunities.company_name`).
 */
type TalentOpportunityRow = Omit<
  TalentOpportunity,
  'organization_id' | 'jurisdictions' | 'organization_name' | 'organization_slug' | 'organization_location'
> & {
  organization_id: string | null
  jurisdictions: string[] | null
  company_name: string | null
  company_location: string | null
}

function mapRow(row: TalentOpportunityRow): TalentOpportunity {
  return {
    id: row.id,
    organization_id: row.organization_id ?? '',
    title: row.title,
    slug: row.slug,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    role_family: row.role_family,
    seniority: row.seniority,
    employment_type: row.employment_type,
    location_type: row.location_type,
    primary_jurisdiction: row.primary_jurisdiction,
    jurisdictions: row.jurisdictions ?? [],
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_currency: row.salary_currency,
    salary_period: row.salary_period,
    application_url: row.application_url,
    application_email: row.application_email,
    status: row.status,
    is_featured: row.is_featured,
    published_at: row.published_at,
    closes_at: row.closes_at,
    view_count: row.view_count,
    application_count: row.application_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    organization_name: row.company_name || undefined,
    organization_location: row.company_location ?? null,
  }
}

export async function listTalentOpportunities(
  params: TalentListParams = {}
): Promise<TalentListResult> {
  const supabase = await createClient()
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  const offset = params.offset ?? 0

  let query = supabase
    .from('talent_opportunities')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })

  if (params.jurisdiction) {
    query = query.or(
      `primary_jurisdiction.eq.${params.jurisdiction},jurisdictions.cs.{${params.jurisdiction}}`
    )
  }
  if (params.roleFamily) query = query.eq('role_family', params.roleFamily)
  if (params.locationType) query = query.eq('location_type', params.locationType)
  if (params.seniority) query = query.eq('seniority', params.seniority)
  if (params.employmentType) query = query.eq('employment_type', params.employmentType)
  if (params.minSalary != null) query = query.gte('salary_max', params.minSalary)
  if (params.featuredOnly) query = query.eq('is_featured', true)
  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim().replace(/%/g, '')
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,company_name.ilike.%${q}%`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) {
    console.error('[talentQuery] listTalentOpportunities error', error)
    throw error
  }

  const items = (data ?? []).map(mapRow)
  return {
    items,
    total: count ?? items.length,
    hasMore: (count ?? 0) > offset + items.length,
  }
}

export async function getTalentOpportunity(
  id: string
): Promise<TalentOpportunity | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('talent_opportunities')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('[talentQuery] getTalentOpportunity error', error)
    throw error
  }
  if (!data) return null
  return mapRow(data)
}

export async function incrementTalentViewCount(id: string): Promise<void> {
  const supabase = await createClient()
  try {
    await supabase.rpc('increment_talent_view_count', { opportunity_id: id })
  } catch {
    // RPC may not exist yet; ignore
  }
}
