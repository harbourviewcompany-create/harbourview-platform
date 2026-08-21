/**
 * Harbourview Talent — shared types
 */

export type TalentStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'closed'
  | 'archived';

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'internship';

export type LocationType = 'onsite' | 'hybrid' | 'remote';

export type Seniority =
  | 'entry'
  | 'mid'
  | 'senior'
  | 'director'
  | 'executive';

export type SalaryPeriod = 'year' | 'month' | 'hour' | 'day';

export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'shortlisted'
  | 'rejected'
  | 'withdrawn'
  | 'hired';

export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export type RoleFamily =
  | 'regulatory_affairs'
  | 'compliance_licensing'
  | 'quality_gxp'
  | 'clinical_medical'
  | 'cultivation_genetics'
  | 'extraction_manufacturing'
  | 'supply_chain_logistics'
  | 'commercial_market_access'
  | 'finance_ops_legal'
  | 'other_specialist';

export interface TalentOpportunity {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  role_family: RoleFamily;
  seniority: Seniority | null;
  employment_type: EmploymentType;
  location_type: LocationType;
  primary_jurisdiction: string | null;
  jurisdictions: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: SalaryPeriod;
  application_url: string | null;
  application_email: string | null;
  status: TalentStatus;
  is_featured: boolean;
  published_at: string | null;
  closes_at: string | null;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;

  // Joined / enriched (optional)
  organization_name?: string;
  organization_slug?: string;
  organization_location?: string | null;
}

export interface TalentApplication {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  resume_url: string | null;
  professional_profile_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TalentSavedJob {
  user_id: string;
  opportunity_id: string;
  created_at: string;
}

export interface TalentAlert {
  id: string;
  user_id: string;
  name: string | null;
  jurisdictions: string[];
  role_families: RoleFamily[];
  location_types: LocationType[];
  min_salary: number | null;
  frequency: AlertFrequency;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentListParams {
  jurisdiction?: string | null;
  roleFamily?: RoleFamily | null;
  locationType?: LocationType | null;
  seniority?: Seniority | null;
  employmentType?: EmploymentType | null;
  minSalary?: number | null;
  query?: string | null;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface TalentListResult {
  items: TalentOpportunity[];
  total: number;
  hasMore: boolean;
}
