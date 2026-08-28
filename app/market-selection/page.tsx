import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Select Your Market',
  description:
    'Select your market to begin. Harbourview routes regulated cannabis market access, intelligence, and reviewed introductions through a controlled market-first interface.',
  openGraph: {
    title: 'Harbourview | Select Your Market',
    description: 'Controlled market-access intelligence and reviewed commercial routing for regulated markets.',
  },
}

export default function MarketSelectionPage() {
  return (
    <main
      data-testid="candidate-b-market-selection"
      className="relative min-h-[100svh] overflow-hidden bg-[color:var(--hv-bg-950)] text-[color:var(--hv-text-primary)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_30%,rgba(12,27,42,0.88),transparent_70%),linear-gradient(180deg,#03070D_0%,#06101B_60%,#03070D_100%)]"
      />

      <div
        aria-hidden="true"
        data-testid="candidate-b-static-globe"
        className="absolute left-1/2 top-[7svh] z-[1] aspect-square w-[118vw] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-full bg-[radial-gradient(circle_at_36%_24%,rgba(52,78,102,0.28),transparent_18%),radial-gradient(circle_at_44%_34%,rgba(24,39,53,0.92),rgba(6,21,37,0.97)_55%,rgba(3,7,13,1)_100%)] shadow-[0_0_90px_rgba(0,0,0,0.74),inset_0_0_64px_rgba(0,0,0,0.52)]"
      >
        <div className="absolute inset-x-8 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(240,211,154,0.22),transparent)]" />
        <div className="absolute left-[42%] top-[32%] h-9 w-7 rounded-[55%_45%_52%_48%] border border-[color:var(--hv-globe-selected-edge)]/80 bg-[color:var(--hv-globe-selected-fill)] shadow-[0_0_14px_rgba(240,211,154,0.2)]" />
        <div className="absolute left-[24%] top-[27%] h-24 w-32 rounded-[46%_54%_45%_55%] border border-[color:var(--hv-globe-border)]/28 bg-[color:var(--hv-globe-land)]/58" />
        <div className="absolute left-[48%] top-[22%] h-36 w-40 rounded-[48%_52%_58%_42%] border border-[color:var(--hv-globe-border)]/24 bg-[color:var(--hv-globe-land)]/62" />
        <div className="absolute left-[50%] top-[44%] h-40 w-24 rounded-[54%_46%_48%_52%] border border-[color:var(--hv-globe-border)]/18 bg-[color:var(--hv-globe-land)]/42" />
      </div>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-8">
        <div
          className="pointer-events-auto text-[19px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hv-champagne-300)] [text-shadow:0_12px_28px_rgba(0,0,0,0.5)]"
          aria-label="HARBOURVIEW"
        >
          HARBOURVIEW
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--hv-panel-border-warm)] bg-[rgba(5,10,16,0.52)] text-[color:var(--hv-champagne-300)] shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[color:var(--hv-champagne-300)]/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
        >
          <span className="sr-only">Open navigation menu</span>
          <span aria-hidden="true" className="flex flex-col gap-1.5">
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
          </span>
        </button>
      </header>

      <div className="pointer-events-none fixed inset-0 z-20">
        <div
          data-testid="candidate-b-country-label"
          className="absolute left-1/2 top-[26svh] hidden -translate-x-1/2 rounded-full border border-[color:var(--hv-champagne-300)]/30 bg-[rgba(5,10,16,0.48)] px-4 py-2 text-sm font-medium tracking-[0.08em] text-[color:var(--hv-champagne-300)] opacity-0 shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-md sm:block"
          aria-hidden="true"
        >
          Germany
        </div>
      </div>

      <section
        aria-label="Select your country to begin."
        data-testid="candidate-b-country-sheet"
        className="pointer-events-auto fixed inset-x-4 bottom-5 z-30 flex max-h-none flex-col rounded-[28px] border border-[color:var(--hv-panel-border-warm)] bg-[linear-gradient(180deg,rgba(11,24,38,0.92),rgba(5,12,21,0.94))] p-6 pb-[max(1.375rem,env(safe-area-inset-bottom))] text-[color:var(--hv-text-primary)] shadow-[0_28px_80px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px] sm:left-1/2 sm:w-[430px] sm:-translate-x-1/2"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[color:var(--hv-champagne-300)]/48" aria-hidden="true" />
        <h1 className="font-serif text-[clamp(2rem,8vw,2.45rem)] leading-[1.08] tracking-[-0.025em] text-[color:var(--hv-text-primary)]">
          Select your country <span className="text-[color:var(--hv-champagne-muted)]">to begin.</span>
        </h1>

        <div className="mt-5 grid gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--hv-text-muted)]" aria-hidden="true">
              ⌕
            </span>
            <input
              aria-label="Search countries"
              placeholder="Search countries"
              className="h-[60px] w-full rounded-[18px] border border-[color:var(--hv-panel-border-warm)] bg-white/[0.035] pl-11 pr-4 text-base text-[color:var(--hv-text-primary)] outline-none placeholder:text-[color:var(--hv-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-[56px] min-w-0 items-center justify-center gap-2 rounded-2xl border border-[color:var(--hv-panel-border-warm)] bg-white/[0.035] px-3 text-center text-[13px] font-medium leading-tight text-[color:var(--hv-text-secondary)] transition hover:border-[color:var(--hv-champagne-300)]/30 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
            >
              <span aria-hidden="true" className="text-[color:var(--hv-champagne-300)]">?</span>
              <span>I’m not sure yet</span>
            </button>

            <button
              type="button"
              className="flex h-[56px] min-w-0 items-center justify-center gap-2 rounded-2xl border border-[color:var(--hv-panel-border-warm)] bg-white/[0.035] px-3 text-center text-[13px] font-medium leading-tight text-[color:var(--hv-text-secondary)] transition hover:border-[color:var(--hv-champagne-300)]/30 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
            >
              <span aria-hidden="true" className="text-[color:var(--hv-champagne-300)]">○</span>
              <span>This is multi-market</span>
            </button>
          </div>

          <div className="flex h-[62px] items-center gap-3 rounded-2xl border border-[color:var(--hv-champagne-300)]/20 bg-[color:var(--hv-champagne-300)]/5 px-4">
            <span aria-hidden="true" className="shrink-0 text-[color:var(--hv-champagne-400)]">✓</span>
            <div aria-live="polite">
              <span className="text-base font-medium text-[color:var(--hv-champagne-300)]">Germany</span>
              <span className="text-base text-[color:var(--hv-text-secondary)]"> selected</span>
            </div>
          </div>

          <button
            type="button"
            className="mt-1 flex h-[64px] w-full items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,var(--hv-champagne-300)_0%,var(--hv-gold)_100%)] px-5 text-center text-[20px] font-semibold text-[color:var(--hv-navy-deep)] shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:brightness-[1.02] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)]"
          >
            Continue
          </button>
        </div>
      </section>
    </main>
  )
}
