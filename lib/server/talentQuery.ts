/**
 * Harbourview Talent — read query layer
 * Follows existing Command / clinical query patterns (session-aware client).
 */

import { createClient } from '@/lib/supabase/server'; // adjust import to actual path
import type {
  TalentListParams,
  TalentListResult,
  TalentOpportunity,
} from '@/types/talent';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * List published talent opportunities with optional filters.
 * Respects RLS (only published rows are visible to non-org users).
 */
export async function listTalentOpportunities(
  params: TalentListParams = {}
): Promise<TalentListResult> {
  const supabase = await createClient();
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = params.offset ?? 0;

  let query = supabase
    .from('talent_opportunities')
    .select(
      `
      *,
      organizations!inner (
        id,
        name,
        slug,
        primary_location
      )
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false });

  if (params.jurisdiction) {
    query = query.or(
      `primary_jurisdiction.eq.${params.jurisdiction},jurisdictions.cs.{${params.jurisdiction}}`
    );
  }

  if (params.roleFamily) {
    query = query.eq('role_family', params.roleFamily);
  }

  if (params.locationType) {
    query = query.eq('location_type', params.locationType);
  }

  if (params.seniority) {
    query = query.eq('seniority', params.seniority);
  }

  if (params.employmentType) {
    query = query.eq('employment_type', params.employmentType);
  }

  if (params.minSalary != null) {
    query = query.gte('salary_max', params.minSalary);
  }

  if (params.featuredOnly) {
    query = query.eq('is_featured', true);
  }

  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim();
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[talentQuery] listTalentOpportunities error', error);
    throw error;
  }

  const items: TalentOpportunity[] = (data ?? []).map((row: any) => ({
    id: row.id,
    organization_id: row.organization_id,
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
    organization_name: row.organizations?.name,
    organization_slug: row.organizations?.slug,
    organization_location: row.organizations?.primary_location ?? null,
  }));

  return {
    items,
    total: count ?? items.length,
    hasMore: (count ?? 0) > offset + items.length,
  };
}

/**
 * Fetch a single published opportunity by id.
 */
export async function getTalentOpportunity(
  id: string
): Promise<TalentOpportunity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('talent_opportunities')
    .select(
      `
      *,
      organizations!inner (
        id,
        name,
        slug,
        primary_location
      )
    `
    )
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[talentQuery] getTalentOpportunity error', error);
    throw error;
  }

  if (!data) return null;

  const row = data as any;
  return {
    id: row.id,
    organization_id: row.organization_id,
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
    organization_name: row.organizations?.name,
    organization_slug: row.organizations?.slug,
    organization_location: row.organizations?.primary_location ?? null,
  };
}

/**
 * Increment view_count (fire-and-forget safe).
 */
export async function incrementTalentViewCount(id: string): Promise<void> {
  const supabase = await createClient();
  // Prefer an RPC if one is added later; for now a simple update is fine.
  await supabase.rpc('increment_talent_view_count', { opportunity_id: id }).maybeSingle();
  // Fallback if RPC does not exist yet — ignore error.
}
