import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Institutional Partnerships',
  description:
    'Collaboration pathways for regulators, associations, universities, labs, pharmacy groups and standards stakeholders.',
}

export default function InstitutionalPartnershipsPage() {
  return <InstitutionalPage page={hubPages.institutional} />
}
