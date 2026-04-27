// Admin review queue — server component
// Admin authorization must be verified server-side before rendering.
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function getPendingListings(serviceUrl: string) {
  const res = await fetch(`${serviceUrl}/api/admin/marketplace/pending`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.listings ?? [];
}

export default async function AdminReviewPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single();

  if (profile?.platform_role !== 'admin') redirect('/');

  // Fetch pending listings directly via service client query
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  const { data: pending } = await serviceClient
    .from('marketplace_listings')
    .select('id, section, title, slug, description, review_status, created_at')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  const listings = pending ?? [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Marketplace Review Queue</h1>
      <p className="text-sm text-gray-500 mb-8">{listings.length} pending listing(s)</p>

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No pending listings.</div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="border border-gray-200 rounded-lg p-5 bg-white"
              data-status="pending"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1" data-field="section">
                    {listing.section?.replace(/_/g, ' ')}
                  </div>
                  <h2 className="font-semibold text-gray-900" data-field="title">{listing.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form method="POST" action={`/api/admin/marketplace/${listing.id}`}>
                    <input type="hidden" name="review_status" value="approved" />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 text-white rounded text-sm font-medium hover:bg-emerald-800"
                    >
                      Approve
                    </button>
                  </form>
                  <form method="POST" action={`/api/admin/marketplace/${listing.id}`}>
                    <input type="hidden" name="review_status" value="rejected" />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
