// Attention dashboard

import { createAdminClient } from '@/lib/supabase/admin';

export default async function AttentionPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('marketplace_deal_attention_view')
    .select('*')
    .eq('needs_attention', true)
    .order('next_action_due_at', { ascending: true });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Deals Requiring Attention</h1>

      {data?.map((d: any) => (
        <div key={d.id} style={{ border: '1px solid red', padding: 16, marginBottom: 12 }}>
          <div><strong>ID:</strong> {d.id}</div>
          <div><strong>Status:</strong> {d.status}</div>
          <div><strong>Priority:</strong> {d.priority}</div>
          <div><strong>Owner:</strong> {d.owner_name || 'MISSING'}</div>
          <div><strong>Next Action:</strong> {d.next_action || 'MISSING'}</div>
          <div><strong>Due:</strong> {d.next_action_due_at || 'MISSING'}</div>
          <div><strong>Reason:</strong> {d.attention_reason}</div>
          <div><strong>Fee:</strong> {d.success_fee_amount || '-'}</div>
        </div>
      ))}
    </main>
  );
}
