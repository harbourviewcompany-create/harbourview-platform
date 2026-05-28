import { redirect } from 'next/navigation';
import { requireAdminAuth } from '@/lib/auth/adminGuard';

export default async function AdminRootPage() {
  await requireAdminAuth();
  redirect('/admin/hub');
}
