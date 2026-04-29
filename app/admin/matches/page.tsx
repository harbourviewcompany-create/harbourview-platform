// Deal dashboard (server component)

import { createAdminClient } from '@/lib/supabase/admin';

export default async function MatchesPage() {
  const supabase = createAdminClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Deal Pipeline</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Listing</th>
            <th>Buyer Request</th>
            <th>Fee</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {matches?.map((m: any) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td>{m.id.slice(0, 8)}</td>
              <td>{m.status}</td>
              <td>{m.listing_id?.slice(0, 8) || '-'}</td>
              <td>{m.buyer_request_id?.slice(0, 8) || '-'}</td>
              <td>{m.success_fee_amount || '-'}</td>
              <td>
                <form method="POST" action="/api/admin/matches">
                  <input type="hidden" name="id" value={m.id} />
                  <select name="status" defaultValue={m.status}>
                    <option>proposed</option>
                    <option>disclosure_requested</option>
                    <option>disclosure_approved</option>
                    <option>introduced</option>
                    <option>closed_won</option>
                    <option>closed_lost</option>
                  </select>
                  <button type="submit">Update</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
