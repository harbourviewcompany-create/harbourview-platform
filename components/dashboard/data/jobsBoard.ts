export type JobType = 'full-time' | 'part-time' | 'contract' | 'consulting' | 'advisory'
export type JobSector = 'cultivation' | 'manufacturing' | 'regulatory' | 'medical' | 'legal' | 'finance' | 'logistics' | 'research' | 'technology' | 'sales' | 'executive'

export type JobListing = {
  id: string
  title: string
  company: string
  country: string
  city: string
  type: JobType
  sector: JobSector
  roles: string[]
  salary?: string
  description: string
  requirements: string[]
  posted: string
  closes?: string
  featured?: boolean
  remote?: boolean
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
  contract: 'Contract',
  consulting: 'Consulting',
  advisory: 'Advisory Board',
}

export const JOB_TYPE_COLORS: Record<JobType, string> = {
  'full-time': '#10b981',
  'part-time': '#6366f1',
  contract: '#d4a84b',
  consulting: '#8b5cf6',
  advisory: '#f97316',
}

export const JOB_SECTOR_LABELS: Record<JobSector, string> = {
  cultivation: 'Cultivation & Genetics',
  manufacturing: 'Manufacturing & QA',
  regulatory: 'Regulatory Affairs',
  medical: 'Medical & Clinical',
  legal: 'Legal & Compliance',
  finance: 'Finance & Investment',
  logistics: 'Logistics & Supply Chain',
  research: 'Research & Science',
  technology: 'Technology & Data',
  sales: 'Sales & BD',
  executive: 'Executive Leadership',
}

/**
 * Legacy Command fixture contract retained only so old typed consumers compile
 * during the P0 cutover. Production Talent results are exclusively loaded from
 * canonical `/api/talent/*` contracts; no fixture row remains eligible to render.
 * TAL-084 / TAC-030.
 */
export const JOB_LISTINGS: JobListing[] = []
