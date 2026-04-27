'use client';
// app/admin/marketplace/listings/actions.tsx

import { useState } from 'react';

interface Props { listingId: string; currentStatus: string; isFeatured: boolean; }

export default function AdminListingActions({ listingId, currentStatus, isFeatured }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [featured, setFeatured] = useState(isFeatured);
  const [loading, setLoading] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketplace/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (payload.review_status) setStatus(payload.review_status as string);
        if (payload.is_featured !== undefined) setFeatured(payload.is_featured as boolean);
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      {status === 'pending' && (<>
        <button onClick={() => patch({ review_status: 'approved' })} disabled={loading} className="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-40">Approve</button>
        <button onClick={() => patch({ review_status: 'rejected' })} disabled={loading} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40">Reject</button>
      </>)}
      {status === 'approved' && (<>
        <button onClick={() => patch({ is_featured: !featured })} disabled={loading}
          className={`px-3 py-1 text-xs rounded border disabled:opacity-40 ${featured ? 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          {featured ? 'Unfeature' : 'Feature'}
        </button>
        <button onClick={() => patch({ review_status: 'archived' })} disabled={loading} className="px-3 py-1 text-xs border border-gray-200 text-gray-500 rounded hover:bg-gray-50 disabled:opacity-40">Archive</button>
      </>)}
      {(status === 'rejected' || status === 'archived') && <span className="text-xs text-gray-400 capitalize">{status}</span>}
    </div>
  );
}
