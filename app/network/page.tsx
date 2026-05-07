import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Harbourview Network',
  description:
    'Controlled commercial network access for regulated cannabis products, suppliers, wanted requests and market-access opportunities.',
}

export default function NetworkPage() {
  return <InstitutionalPage page={hubPages.network} />
}
