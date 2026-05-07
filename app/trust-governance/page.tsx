import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Trust, Safety & Governance',
  description:
    'Claim discipline, source review, confidentiality, evidence standards, product safety principles and controlled information handling.',
}

export default function TrustGovernancePage() {
  return <InstitutionalPage page={hubPages.trust} />
}
