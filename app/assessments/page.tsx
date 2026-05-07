import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Assessments',
  description:
    'Controlled intake pathways for market-access readiness, country-route feasibility, supplier documentation and due diligence preparedness.',
}

export default function AssessmentsPage() {
  return <InstitutionalPage page={hubPages.assessments} sectionId="assessment-types" />
}
