import type { NetworkAdminReviewItem } from '@/lib/network/adminReview'

export function NetworkReviewCard({ item }: { item: NetworkAdminReviewItem }) {
  return (
    <article className="rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">
            {item.objectType.replaceAll('_', ' ')}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#F5F1E8]">{item.title}</h2>
        </div>

        <div className="rounded-full border border-[#C6A55A]/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
          {item.reviewStatus.replaceAll('_', ' ')}
        </div>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-[#F5F1E8]/45">Country</dt>
          <dd className="mt-2 text-sm text-[#F5F1E8]">{item.countryLabel}</dd>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-[#F5F1E8]/45">Category</dt>
          <dd className="mt-2 text-sm text-[#F5F1E8]">{item.categoryLabel}</dd>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-[#F5F1E8]/45">Claim risk</dt>
          <dd className="mt-2 text-sm text-[#F5F1E8]">{item.claimRisk}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-2xl border border-[#C6A55A]/15 bg-[#081423] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Public preview</p>
            <h3 className="mt-2 text-lg font-semibold text-[#F5F1E8]">{item.publicPreview.name}</h3>
          </div>

          <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#F5F1E8]/70">
            DTO projection
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
          {item.publicPreview.publicSummary}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {item.suppressedFieldLabels.map((field) => (
          <span
            key={field}
            className="rounded-full border border-red-400/20 bg-red-950/20 px-3 py-1 text-xs text-red-100"
          >
            suppressed: {field}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#C6A55A]/15 bg-[#C6A55A]/10 p-4 text-sm text-[#F5F1E8]/85">
        Next review action: {item.nextActionLabel}
      </div>
    </article>
  )
}
