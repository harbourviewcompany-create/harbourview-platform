// app/admin/marketplace/listings/page.tsx — server component, admin only

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import AdminListingActions from './actions';

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('platform_role').eq('id', user.id).single();
  if (profile?.platform_role !== 'admin') return null;
  return user;
}

const SECTION_LABELS: Record<string, string> = {
  new_products: 'New Products', used_surplus: 'Used & Surplus', cannabis_inventory: 'Cannabis Inventory',
  wanted_requests: 'Wanted Requests', services: 'Services', business_opportunities: 'Business Opportunities',
  supplier_directory: 'Supplier Directory',
};

interface PageProps { searchParams: Promise<{ status?: string }>; }

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const params = await searchParams;
  const activeStatus = params.status ?? 'pending';
  const statuses = ['pending', 'approved', 'rejected', 'archived'];

  const service = createServiceClient();
  const { data: listings } = await service
    .from('marketplace_listings')
    .select('id, section, title, slug, description, location_country, review_status, public_visibility, is_featured, created_at')
    .eq('review_status', activeStatus)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Listing Manager</h1>
            <p className="text-sm text-gray-500">Review, approve and manage marketplace listings</p>
          </div>
          <Link href="/admin/marketplace/review" className="text-sm text-gray-500 hover:text-green-700">← Review Queue</Link>
        </div>

        <div className="flex gap-2 mb-6">
          {statuses.map(s => (
            <Link key={s} href={`/admin/marketplace/listings?status=${s}`}
              className={`px-3 py-1.5 text-sm rounded-md capitalize ${activeStatus === s ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {s}
            </Link>
          ))}
        </div>

        {!listings?.length ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">No {activeStatus} listings.</div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{SECTION_LABELS[listing.section] ?? listing.section}</span>
                      {listing.is_featured && <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">Featured</span>}
                    </div>
                    <h2 className="text-sm font-medium text-gray-900 truncate">{listing.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{listing.location_country} · {new Date(listing.created_at).toLocaleDateString('en-CA')}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                  </div>
                  <AdminListingActions listingId={listing.id} currentStatus={listing.review_status} isFeatured={listing.is_featured} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
