'use client'

import type { ReactNode } from 'react'

export function RouterBottomSheet({
  title,
  eyebrow,
  children,
  footer,
  size = 'role',
  onBack,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'confirm' | 'role' | 'intent' | 'search'
  onBack?: () => void
}) {
  const sizeClass = {
    confirm: 'max-h-[24svh]',
    role: 'max-h-[64svh]',
    intent: 'max-h-[62svh]',
    search: 'max-h-[72svh]',
  }[size]

  return (
    <section
      aria-label={title}
      className={`pointer-events-auto fixed inset-x-3 bottom-3 z-30 flex flex-col rounded-[28px] border border-[#e0c77f]/36 bg-[#020913]/94 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-[0_32px_110px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[460px] sm:-translate-x-1/2 sm:-translate-y-1/2 ${sizeClass}`}
    >
      {/* aria-modal=false because the globe remains active visual context; focus is manually managed inside sheet controls; screen-reader users can complete the same flow through DOM/fallback controls. */}
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#f1dfaa]/48" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f0d98f]/84">{eyebrow}</p> : null}
          <h2 className="mt-1 font-serif text-2xl leading-tight tracking-[-0.035em] text-[#fff8e6]">{title}</h2>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 min-w-24 rounded-full border border-[#f1dfaa]/38 bg-white/[0.06] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#fff8e6] shadow-[0_0_24px_rgba(0,0,0,0.28)] transition hover:border-[#f1dfaa]/70 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dfaa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020913]"
          >
            Back
          </button>
        ) : null}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:#d7bd72_rgba(2,9,19,0.92)] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {children}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  )
}
