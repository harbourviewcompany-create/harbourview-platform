'use client';

import { useActionState, useState } from 'react';
import { submitMarketplaceInquiry, type InquiryActionState } from '@/app/actions/submitInquiry';

type InquiryFormProps = {
  listingSlug: string;
  listingTitle: string;
  ctaLabel: string;
};

const MAX_MESSAGE_LENGTH = 2500;
const initialState: InquiryActionState = { status: 'idle', message: '' };

export function InquiryForm({ listingSlug, listingTitle, ctaLabel }: InquiryFormProps) {
  const [state, formAction, isPending] = useActionState(submitMarketplaceInquiry, initialState);
  const [messageLength, setMessageLength] = useState(0);
  const isNearLimit = messageLength >= MAX_MESSAGE_LENGTH * 0.9;

  return (
    <section id="inquiry" className="mt-8 rounded-2xl border border-[#C6A55A]/25 bg-black/20 p-5">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold text-[#F5F1E8]">Request Harbourview review</h2>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/70">
          Use this form to request verification, seller contact, quote routing or a similar equipment search. Harbourview reviews requests before any introduction is made.
        </p>
      </div>

      <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="listing_slug" value={listingSlug} />
        <input type="hidden" name="listing_title" value={listingTitle} />

        <label className="text-sm text-[#F5F1E8]/75">
          Name
          <input required name="name" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Business email
          <input required type="email" name="email" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Company
          <input required name="company" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Country / market
          <input required name="country" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Phone optional
          <input name="phone" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Request type
          <select name="inquiry_type" defaultValue="listing_verification" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
            <option value="listing_verification">Verify this listing</option>
            <option value="seller_contact">Request seller contact</option>
            <option value="quote_routing">Request quote path</option>
            <option value="similar_equipment">Request similar equipment</option>
            <option value="sourcing_mandate">Discuss sourcing mandate</option>
          </select>
        </label>

        <label className="text-sm text-[#F5F1E8]/75 md:col-span-2">
          Message
          <textarea
            required
            name="message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={5}
            onChange={(event) => setMessageLength(event.currentTarget.value.length)}
            placeholder="Describe what you need verified, sourced or introduced. Include location, timing, quantity, budget range or equipment requirements where relevant."
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 placeholder:text-[#F5F1E8]/35 focus:ring-2"
          />
          <span className={isNearLimit ? 'mt-2 block text-xs text-[#D8BC73]' : 'mt-2 block text-xs text-[#F5F1E8]/45'}>
            {messageLength}/{MAX_MESSAGE_LENGTH} characters
          </span>
        </label>

        <label className="flex gap-3 text-sm leading-6 text-[#F5F1E8]/70 md:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
          I consent to Harbourview reviewing this inquiry and contacting me about marketplace, sourcing or intelligence services.
        </label>

        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
          <button type="submit" disabled={isPending} className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? 'Submitting...' : ctaLabel}
          </button>
          {state.message ? (
            <p data-testid="inquiry-diagnostic-message" className={state.status === 'success' ? 'text-sm text-[#D8BC73]' : 'text-sm text-red-200'}>{state.message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
