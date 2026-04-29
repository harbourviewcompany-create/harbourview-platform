// Listing and wanted request submission form

const SECTIONS = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumables', label: 'Consumables' },
];

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const isWanted = type === 'wanted';

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <a href="/marketplace" className="text-sm text-gray-500 hover:underline mb-6 block">← Back</a>

      <h1 className="text-2xl font-bold mb-2">
        {isWanted ? 'Post Wanted Request' : 'Submit Listing'}
      </h1>

      <form action="/api/marketplace/submit" method="POST" className="space-y-5">
        {!isWanted && (
          <select name="section" required className="w-full border p-2">
            <option value="">Select type</option>
            {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}

        <input name="title" placeholder="Title" required className="w-full border p-2" />
        <textarea name="description" placeholder="Description" required className="w-full border p-2" />

        {!isWanted && (
          <>
            <input name="brand" placeholder="Brand" className="w-full border p-2" />
            <input name="model" placeholder="Model" className="w-full border p-2" />
            <input name="condition" placeholder="Condition" className="w-full border p-2" />
            <input name="quantity" type="number" placeholder="Quantity" className="w-full border p-2" />
            <input name="price_amount" type="number" placeholder="Price" className="w-full border p-2" />
            <input name="location_country" placeholder="Country" className="w-full border p-2" />
          </>
        )}

        <button className="w-full bg-black text-white p-3">Submit</button>
      </form>
    </main>
  );
}
