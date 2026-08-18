import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminSignalReviewSnapshot } from '@/lib/admin/signals/server'
import SignalReviewWorkspace from '@/components/admin/SignalReviewWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>
}) {
  await requireAdminAuth()
  const params = await searchParams
  const snapshot = await getAdminSignalReviewSnapshot()
  return <SignalReviewWorkspace snapshot={snapshot} initialSelectedKey={params.selected} />
}
