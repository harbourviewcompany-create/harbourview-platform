import type { Metadata } from 'next';
import AdminHubClient from '@/components/admin/AdminHubClient';
import { requireAdminAuth } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Harbourview Intelligence Operations Hub',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHubPage() {
  const auth = await requireAdminAuth();

  return <AdminHubClient userEmail={auth.user.email || 'admin/operator'} />;
}
