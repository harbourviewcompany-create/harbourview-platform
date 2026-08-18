import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import { requireAdminAuth } from '@/lib/auth/adminGuard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Harbourview Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = (await requireAdminAuth())!
  return (
    <AdminShell
      actorLabel={auth.user.email || auth.user.id}
      actorRoles={auth.roles}
    >
      {children}
    </AdminShell>
  )
}
