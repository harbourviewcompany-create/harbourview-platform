// Listing detail page — server component, no private fields
import { notFound } from 'next/navigation';

async function getListing(slug: string) {
  const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/marketplace/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.listing ?? null;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <a href="/marketplace" className="text-sm text-gray-500 hover:underline mb-6 block">← Back to Marketplace</a>

      <h1 className="text-3xl font-bold mb-2" data-field="title">{listing.title}</h1>
      <div className="text-sm text-gray-500 mb-6" data-field="section">
        {listing.section?.replace(/_/g, ' ')}
        {listing.location_country && ` · ${listing.location_country}`}
      </div>

      <p className="text-gray-700 leading-relaxed mb-8" data-field="description">{listing.description}</p>

      {listing.price_amount && (
        <div className="text-lg font-semibold text-gray-900 mb-8" data-field="price">
          {listing.price_currency ?? 'USD'} {listing.price_amount.toLocaleString()}
        </div>
      )}

      {/* Inquiry form */}
      <section className="border border-gray-200 rounded-lg p-6" aria-label="inquiry" data-testid="inquiry-form">
        <h2 className="text-xl font-semibold mb-4">Send an Inquiry</h2>
        <form action="/api/marketplace/inquire" method="POST" className="space-y-4">
          <input type="hidden" name="listing_id" value={listing.id} />
          <div>
            <label htmlFor="buyer_name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input id="buyer_name" name="buyer_name" type="text" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="buyer_email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="buyer_email" name="buyer_email" type="email" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="message" name="message" rows={4} required minLength={10} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="px-6 py-2 bg-emerald-700 text-white rounded font-medium text-sm hover:bg-emerald-800">
            Send Inquiry
          </button>
        </form>
      </section>
    </main>
  );
}
