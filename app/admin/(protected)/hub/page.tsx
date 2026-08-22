import { Suspense } from 'react'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import HarbourviewAdmin from './HubPanel'

export const dynamic = 'force-dynamic'

function HubFallback() {
  return (
    <div style={{ padding: 24, color: '#6A7E9B', fontSize: 13 }}>
      Loading control surface…
    </div>
  )
}

export default async function HubPage() {
  await requireAdminAuth()
  return (
    <Suspense fallback={<HubFallback />}>
      <HarbourviewAdmin />
    </Suspense>
  )
}
