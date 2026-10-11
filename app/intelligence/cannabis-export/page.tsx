import type { Metadata } from 'next'

import { requireAdminAuth } from '@/lib/admin-auth'
import CannabisExportWorkspace from './CannabisExportWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Cannabis Export OS | Harbourview',
  description: 'Private Harbourview workspace for international medical-cannabis buyers, suppliers, RFQs, deal economics and execution.',
}

export default async function CannabisExportPage() {
  await requireAdminAuth()

  return <CannabisExportWorkspace />
}
