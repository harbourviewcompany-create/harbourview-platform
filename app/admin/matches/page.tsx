// Deal dashboard upgraded to close desk

import { createAdminClient } from '@/lib/supabase/admin';
import { updateDealAction, addDealNoteAction } from './actions';

const STAGES = [
  'proposed',
  'disclosure_requested',
  'disclosure_approved',
  'introduced',
  'closed_won',
  'closed_lost',
];

export default async function MatchesPage() {
  const supabase = createAdminClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Deal Close Desk</h1>

      {matches?.map((m: any) => (
        <div key={m.id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>ID:</strong> {m.id}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong> {m.status}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Listing:</strong> {m.listing_id || '-'}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Buyer:</strong> {m.buyer_request_id || '-'}
          </div>

          <form action={updateDealAction} style={{ marginBottom: 12 }}>
            <input type="hidden" name="id" value={m.id} />

            <select name="status" defaultValue={m.status}>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input name="success_fee_amount" placeholder="Fee" defaultValue={m.success_fee_amount || ''} />
            <input name="monetization_path" placeholder="Monetization" defaultValue={m.monetization_path || ''} />

            <button type="submit">Save</button>
          </form>

          <form action={addDealNoteAction}>
            <input type="hidden" name="id" value={m.id} />
            <input name="note" placeholder="Add note / next step" />
            <button type="submit">Add Note</button>
          </form>
        </div>
      ))}
    </main>
  );
}
