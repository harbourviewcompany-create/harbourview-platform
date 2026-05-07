import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { createLiveSourceIntake } from '@/app/actions/createLiveSourceIntake';
import { CONSUMABLES_CATEGORY, CONSUMABLES_LISTING_TYPES, CONSUMABLES_SUBCATEGORIES, PUBLIC_CONSUMABLES_LABELS } from '@/lib/marketplace/consumables';

export const dynamic = 'force-dynamic';

export default async function NewSourcePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireAdminAuth();
  const params = await searchParams;

  return (
    <section>
      <Link href="/admin/sources" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">Back to sources</Link>
      <div className="mt-6 max-w-4xl">
        <h2 className="text-2xl font-semibold">Manual source intake</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          V0 stores a private URL, manual snapshot text and a private marketplace candidate. It does not fetch, crawl or publish.
        </p>
      </div>

      {params?.error ? (
        <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {params.error}
        </div>
      ) : null}

      <form action={createLiveSourceIntake} className="mt-6 grid gap-5 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 text-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-[#F5F1E8]/70">Source URL</span>
            <input required name="source_url" type="url" placeholder="https://example.com/source-page" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Source name</span>
            <input name="source_name" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Source type</span>
            <select name="source_type" defaultValue="supplier_website" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
              <option value="supplier_website">Supplier website</option>
              <option value="marketplace_source">Marketplace source</option>
              <option value="auction_source">Auction source</option>
              <option value="manual_submission">Manual submission</option>
            </select>
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Jurisdiction</span>
            <input name="jurisdiction" placeholder="Canada, US, EU or regional note" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-[#F5F1E8]/70">Category</span>
            <input readOnly name="marketplace_category" value={CONSUMABLES_CATEGORY} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]/70" />
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Subcategory</span>
            <select name="subcategory" defaultValue="Packaging" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
              {CONSUMABLES_SUBCATEGORIES.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
            </select>
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Listing type</span>
            <select name="listing_type" defaultValue="Supply Listing" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
              {CONSUMABLES_LISTING_TYPES.map((listingType) => <option key={listingType} value={listingType}>{listingType}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-[#F5F1E8]/70">Manual source title</span>
            <input name="captured_title" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
          </label>
          <label>
            <span className="text-[#F5F1E8]/70">Public draft title</span>
            <input name="title_public_draft" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
          </label>
        </div>

        <label>
          <span className="text-[#F5F1E8]/70">Manual captured text</span>
          <textarea name="captured_text" rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
        </label>

        <label>
          <span className="text-[#F5F1E8]/70">Public draft description</span>
          <textarea name="description_public_draft" rows={4} placeholder={PUBLIC_CONSUMABLES_LABELS[2]} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label><span className="text-[#F5F1E8]/70">Supply type</span><input name="supply_type" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" /></label>
          <label><span className="text-[#F5F1E8]/70">Region available</span><input name="region_available" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" /></label>
          <label><span className="text-[#F5F1E8]/70">Lead time</span><input name="lead_time_text" placeholder="Inquiry Required" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" /></label>
        </div>

        <div className="flex flex-wrap gap-5 text-[#F5F1E8]/75">
          <label className="flex items-center gap-2"><input type="checkbox" name="bulk_available" /> Bulk supply category</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="recurring_supply_available" /> Recurring supply category</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="restricted_item" /> Restricted in V0</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="requires_license_review" /> Requires licence review</label>
        </div>

        <button type="submit" className="w-fit rounded-full bg-[#C6A55A] px-5 py-2 font-medium text-[#081423]">
          Create private candidate
        </button>
      </form>
    </section>
  );
}
