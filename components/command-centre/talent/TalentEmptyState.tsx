'use client';

interface TalentEmptyStateProps {
  jurisdiction?: string | null;
  onClearFilters: () => void;
}

export function TalentEmptyState({
  jurisdiction,
  onClearFilters,
}: TalentEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#12181f] p-6 text-center">
      <p className="text-white/80 font-medium mb-2">
        No open roles
        {jurisdiction ? ` in ${jurisdiction}` : ''} right now
      </p>
      <p className="text-sm text-white/45 mb-5 leading-relaxed">
        Talent opportunities are reviewed and filtered to the active
        jurisdiction. Try broadening filters or set an alert for when new
        roles appear.
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-xl border border-white/15 text-white/80 py-2.5 text-sm hover:bg-white/5"
        >
          Clear filters
        </button>
        {/* Alert CTA can be wired to createTalentAlert later */}
        <button
          type="button"
          className="rounded-xl bg-white/5 text-white/60 py-2.5 text-sm"
          disabled
        >
          Set alert (coming soon)
        </button>
      </div>
    </div>
  );
}
