'use client'

import { useGlobe } from './GlobeProvider'

/**
 * Visible state for a failed or partial globe bootstrap. Without this the globe
 * looks healthy but empty. Countries stay selectable; only live overlays are
 * missing, so the copy says exactly that and offers a Retry.
 */
export function GlobeDataNotice() {
  const { loading, degraded, loadError, liveData, reload } = useGlobe()

  if (loading) return null

  const noCountries = liveData.countries.length === 0
  if (!degraded && !loadError && !noCountries) return null

  const message = liveData.countriesUnavailable
    ? 'Live regulatory data is temporarily unavailable. Country routing remains available on the static globe.'
    : noCountries
      ? 'Live market data could not be loaded. You can still choose a country.'
      : 'Some live signals are temporarily unavailable. The map is showing the latest regulatory data.'

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="globe-data-notice"
      className="pointer-events-auto absolute bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-[#06101d]/90 px-4 py-3 text-xs leading-5 text-amber-100/90 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={reload}
        className="min-h-9 shrink-0 rounded-full border border-[#c6a55a]/40 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f5f1e8]"
      >
        Retry
      </button>
    </div>
  )
}
