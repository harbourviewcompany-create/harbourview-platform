import { requireAdminAuth } from '@/lib/auth/adminGuard'
import HarbourviewAdmin from './HubPanel'

// Force dynamic: admin content must never be statically cached
export const dynamic = 'force-dynamic'

export default async function HubPage() {
  await requireAdminAuth()
  return <HarbourviewAdmin />
}
