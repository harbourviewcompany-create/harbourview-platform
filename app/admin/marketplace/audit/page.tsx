// app/admin/marketplace/audit/page.tsx — read-only. No mutations. Append-only at DB level.

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

export default async function AdminAuditPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const service = createServiceClient();
  const { data: events } = await service
    .from('audit_events')
    .select('id, entity_type, entity_id, action, actor_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">Immutable record of all marketplace actions. No edits or deletions possible.</p>
        </div>

        {!events?.length ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">No audit events yet.</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {events.map(evt => (
                  <tr key={evt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(evt.created_at).toISOString().replace('T', ' ').slice(0, 19)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{evt.action}</span></td>
                    <td className="px-4 py-3 text-gray-500"><span className="text-gray-400">{evt.entity_type}/</span>{(evt.entity_id as string).slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-400">{evt.actor_id ? (evt.actor_id as string).slice(0, 8) + '…' : 'system'}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{evt.payload ? JSON.stringify(evt.payload).slice(0, 60) : '—'}</td>
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
