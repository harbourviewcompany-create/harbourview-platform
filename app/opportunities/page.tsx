import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Opportunities',
  description:
    'Reviewed commercial openings, distribution mandates, strategic partnerships and country access opportunities.',
}

export default function OpportunitiesPage() {
  return <InstitutionalPage page={hubPages.opportunities} />
}
