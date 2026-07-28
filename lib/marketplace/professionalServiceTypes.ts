export type ProfessionalServiceCategory =
  | 'legal'
  | 'accounting'
  | 'insurance'
  | 'banking'
  | 'compliance-consulting'

export const CATEGORY_LABEL: Record<ProfessionalServiceCategory, string> = {
  legal: 'Legal Counsel',
  accounting: 'Accounting & Tax',
  insurance: 'Insurance',
  banking: 'Banking & Financing',
  'compliance-consulting': 'Compliance Consulting',
}

export type ProfessionalServiceProvider = {
  id: string
  category: ProfessionalServiceCategory
  name: string
  description: string | null
  markets_covered: string[]
  website: string | null
  created_at: string
}
