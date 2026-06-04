"use client"

// FixtureBanner — renders when admin pages are showing fixture data
// instead of live DB records. Server components pass isFixture prop.
export function FixtureBanner({ isFixture }: { isFixture: boolean }) {
  if (!isFixture) return null
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-amber-800/40 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-300">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
      <span>
        Showing <strong>fixture data</strong> — live Supabase tables are empty or the service-role key is not configured.
        Data is placeholder only and does not reflect real intelligence records.
      </span>
    </div>
  )
}
