import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Policy & Standards',
  description:
    'Structured non-promotional resources on regulated access models, quality standards, public-health safeguards and responsible market conduct.',
}

export default function PolicyStandardsPage() {
  return <InstitutionalPage page={hubPages.policy} />
}
