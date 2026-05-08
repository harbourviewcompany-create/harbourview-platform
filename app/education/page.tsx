import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Education',
  description:
    'Non-promotional professional education for clinical, pharmacy, quality, commercial, regulatory and institutional stakeholders.',
}

export default function EducationPage() {
  return <InstitutionalPage page={hubPages.education} sectionId="education-tracks" />
}
