import type { Metadata } from 'next'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { AdminControlShell } from '@/components/admin/AdminControlShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Harbourview Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAuth()
  return <AdminControlShell>{children}</AdminControlShell>
}
