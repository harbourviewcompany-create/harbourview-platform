import type { ComplianceServiceCategory } from './types'

export const complianceServiceCategories: ComplianceServiceCategory[] = [
  {
    slug: 'regulatory-strategy',
    name: 'Regulatory Strategy',
    whoItHelps: 'Operators planning entry or expansion',
    typicalIssues: ['Jurisdiction selection', 'Pathway uncertainty'],
    relatedRegions: ['europe','latin-america','asia-pacific'],
    ctaHref: '/compliance/request-support',
  },
  {
    slug: 'gmp-readiness',
    name: 'EU GMP Readiness',
    whoItHelps: 'Manufacturers and exporters',
    typicalIssues: ['Documentation gaps','Process validation'],
    relatedRegions: ['europe'],
    ctaHref: '/compliance/request-support',
  },
]
