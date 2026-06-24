'use client';

import { useState, useTransition } from 'react';
import { promoteInquiryToListing } from '@/app/actions/promoteToListing';
import { LISTING_CATEGORIES, LISTING_SELLER_TYPES, SUPPLY_REGIONS } from '@/lib/marketplace/formOptions';

const CATEGORIES   = LISTING_CATEGORIES;
const SELLER_TYPES = LISTING_SELLER_TYPES;
const REGIONS      = SUPPLY_REGIONS;

type Props = {
  inquiryId: string;
  prefillName?: string | null;
  prefillMessage?: string | null;
};

export function PromoteToListingForm({ inquiryId, prefillName, prefillMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await promoteInquiryToListing(inquiryId, fd);
      if (res.ok) {
        setResult({ ok: true, message: `Published — slug: ${res.slug}` });
        setOpen(false);
      } else {
        setResult({ ok: false, message: res.error });
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-sm text-emerald-200">
        ✓ {result.message}
        <a href="/marketplace/listings" target="_blank" rel="noopener noreferrer"
           className="ml-3 underline underline-offset-4 hover:text-emerald-100">
          View on marketplace →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#C6A55A]/40 bg-[#0B1A2F] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[#F5F1E8]">Publish as listing</h3>
          <p className="mt-1 text-xs text-[#F5F1E8]/55">
            Creates a live approved listing and closes this inquiry.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
        >
          {open ? 'Cancel' : 'Publish listing'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-[#F5F1E8]/75 md:col-span-2">
            Listing title *
            <input
              required name="title"
              defaultValue={prefillName ?? ''}
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
            />
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Category *
            <select name="category" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
              {CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Seller type
            <select name="seller_type" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
              {SELLER_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Seller / company name *
            <input
              required name="seller_name"
              defaultValue={prefillName ?? ''}
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
            />
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Region
            <select name="region" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
              {REGIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Country (optional)
            <input name="location_country" maxLength={100}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
            />
          </label>

          <label className="text-sm text-[#F5F1E8]/75">
            Product type (optional)
            <input name="product_type" placeholder="e.g. EU-GMP flower, CO2 oil" maxLength={200}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-[#F5F1E8]/75">
              Price (optional)
              <input name="price_amount" type="number" min="0" step="0.01"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
              />
            </label>
            <label className="text-sm text-[#F5F1E8]/75">
              Currency
              <select name="price_currency" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </label>
          </div>

          <label className="text-sm text-[#F5F1E8]/75 md:col-span-2">
            Description *
            <textarea
              required name="description"
              defaultValue={prefillMessage ?? ''}
              rows={5}
              maxLength={2000}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2"
            />
          </label>

          {result && !result.ok && (
            <p className="text-sm text-red-300 md:col-span-2">{result.message}</p>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-60"
            >
              {isPending ? 'Publishing...' : 'Publish live listing'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
