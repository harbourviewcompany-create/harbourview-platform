// Listing and wanted request submission form

const SECTIONS = [
  { value: 'new_products', label: 'New Products' },
  { value: 'used_surplus', label: 'Used & Surplus' },
  { value: 'cannabis_inventory', label: 'Cannabis Inventory' },
  { value: 'wanted_requests', label: 'Wanted Requests' },
  { value: 'services', label: 'Services' },
  { value: 'business_opportunities', label: 'Business Opportunities' },
  { value: 'supplier_directory', label: 'Supplier Directory' },
];

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isWanted = type === 'wanted';

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <a href="/marketplace" className="text-sm text-gray-500 hover:underline mb-6 block">← Back to Marketplace</a>

      <h1 className="text-2xl font-bold mb-2">
        {isWanted ? 'Post a Wanted Request' : 'Submit a Listing'}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        All submissions are reviewed before going public. You will be notified once reviewed.
      </p>

      <form action="/api/marketplace/submit" method="POST" className="space-y-5">
        {isWanted && <input type="hidden" name="type" value="wanted" />}

        {!isWanted && (
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select id="section" name="section" required className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">Select a section</option>
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input id="title" name="title" type="text" required minLength={3} maxLength={200} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea id="description" name="description" rows={5} required minLength={10} maxLength={5000} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>

        {isWanted ? (
          <>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input id="category" name="category" type="text" maxLength={100} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
              <input id="budget_range" name="budget_range" type="text" maxLength={100} placeholder="e.g. $50,000–$100,000 CAD" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price_amount" className="block text-sm font-medium text-gray-700 mb-1">Price (optional)</label>
                <input id="price_amount" name="price_amount" type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="price_currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input id="price_currency" name="price_currency" type="text" maxLength={3} placeholder="CAD" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="location_country" className="block text-sm font-medium text-gray-700 mb-1">Country (2-letter code)</label>
              <input id="location_country" name="location_country" type="text" maxLength={2} placeholder="CA" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </>
        )}

        <button type="submit" className="w-full px-6 py-3 bg-emerald-700 text-white rounded font-medium text-sm hover:bg-emerald-800">
          Submit for Review
        </button>
      </form>
    </main>
  );
}
