import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Harbourview Professionals',
  description:
    'Role-specific public entry points for clinicians, pharmacists, lawyers, compliance advisors, QA professionals, researchers, policymakers, regulators, educators, advocates, investors and associations.',
}

export default function ProfessionalsPage() {
  return <InstitutionalPage page={hubPages.professionals} />
}
