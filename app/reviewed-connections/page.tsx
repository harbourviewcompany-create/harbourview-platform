import type { Metadata } from 'next'
import InstitutionalPage from '@/components/institutional/InstitutionalPage'
import { hubPages } from '@/lib/institutional/content'

export const metadata: Metadata = {
  title: 'Reviewed Connections',
  description:
    'Protected routing for qualified introductions, buyer and seller matching, exporter and importer review, equipment sourcing, distressed asset access and protected dealroom orientation.',
}

export default function ReviewedConnectionsPage() {
  return <InstitutionalPage page={hubPages.reviewedConnections} />
}
