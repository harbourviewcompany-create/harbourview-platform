// app/admin/marketplace/inquiries/page.tsx — admin only

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('platform_role').eq('id', user.id).single();
  return profile?.platform_role === 'admin' ? user : null;
}

interface PageProps { searchParams: Promise<{ status?: string }>; }

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const params = await searchParams;
  const activeStatus = params.status ?? 'new';
  const statuses = ['new', 'in_progress', 'closed'];

  const service = createServiceClient();
  const { data: inquiries } = await service
    .from('marketplace_inquiries')
    .select('id, listing_id, buyer_name, buyer_email, buyer_company, message, status, created_at')
    .eq('status', activeStatus)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Inquiry Manager</h1>
          <p className="text-sm text-gray-500">Buyer inquiries submitted via the marketplace</p>
        </div>

        <div className="flex gap-2 mb-6">
          {statuses.map(s => (
            <a key={s} href={`/admin/marketplace/inquiries?status=${s}`}
              className={`px-3 py-1.5 text-sm rounded-md capitalize ${activeStatus === s ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {s.replace('_', ' ')}
            </a>
          ))}
        </div>

        {!inquiries?.length ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">No {activeStatus} inquiries.</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Received</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map(inq => (
                  <tr key={inq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="font-medium text-xs text-gray-900">{inq.buyer_name}</div><div className="text-gray-400 text-xs">{inq.buyer_email}</div></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inq.buyer_company ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{inq.message}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(inq.created_at).toLocaleDateString('en-CA')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${inq.status === 'new' ? 'bg-blue-50 text-blue-700' : inq.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {inq.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
