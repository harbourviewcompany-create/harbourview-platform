// Public marketplace directory page
import { Suspense } from 'react';

const SECTIONS = [
  { key: 'equipment', label: 'Equipment' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'wanted_requests', label: 'Wanted Requests' },
  { key: 'supplier_directory', label: 'Supplier Directory' },
];

async function getListings(section?: string) {
  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const url = section
    ? `${baseUrl}/api/marketplace?section=${section}`
    : `${baseUrl}/api/marketplace`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.listings ?? [];
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const listings = await getListings(section);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Harbourview Marketplace</h1>
      <p className="text-gray-500 mb-8">
        Equipment, consumables, wanted requests and supplier discovery for regulated cannabis operators.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/marketplace"
          className={`px-4 py-2 rounded border text-sm font-medium ${!section ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          All
        </a>
        {SECTIONS.map((s) => (
          <a
            key={s.key}
            href={`/marketplace?section=${s.key}`}
            data-section={s.key}
            className={`px-4 py-2 rounded border text-sm font-medium ${section === s.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <a
          href="/marketplace/submit"
          className="px-5 py-2 bg-emerald-700 text-white rounded font-medium text-sm hover:bg-emerald-800"
        >
          Submit Equipment / Consumables
        </a>
        <a
          href="/marketplace/submit?type=wanted"
          className="px-5 py-2 border border-gray-300 rounded font-medium text-sm hover:bg-gray-50"
        >
          Post a Wanted Request
        </a>
      </div>

      <Suspense fallback={<p className="text-gray-400">Loading listings...</p>}>
        {listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No listings found in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: {
              id: string;
              slug: string;
              section: string;
              title: string;
              description: string;
              price_amount?: number;
              price_currency?: string;
              location_country?: string;
              is_featured: boolean;
              condition?: string;
              brand?: string;
              model?: string;
              quantity?: number;
              unit?: string;
            }) => (
              <a
                key={listing.id}
                href={`/marketplace/${listing.slug}`}
                data-section={listing.section}
                className={`block rounded-lg border p-5 hover:shadow-md transition ${listing.is_featured ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}
              >
                {listing.is_featured && (
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 block">Featured</span>
                )}
                <h2 className="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-3 mb-3">{listing.description}</p>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  {(listing.brand || listing.model) && <div>{[listing.brand, listing.model].filter(Boolean).join(' ')}</div>}
                  {listing.condition && <div>Condition: {listing.condition}</div>}
                  {listing.quantity && <div>Quantity: {listing.quantity} {listing.unit ?? ''}</div>}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{listing.location_country ?? '—'}</span>
                  {listing.price_amount && (
                    <span className="font-medium text-gray-700">
                      {listing.price_currency ?? 'USD'} {listing.price_amount.toLocaleString()}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </Suspense>
    </main>
  );
}
