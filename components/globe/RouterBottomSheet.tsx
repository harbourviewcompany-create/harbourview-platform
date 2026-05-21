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
    role: 'max-h-[48svh]',
    intent: 'max-h-[62svh]',
    search: 'max-h-[72svh]',
  }[size]

  return (
    <section
      aria-label={title}
      aria-modal="false"
      className={`pointer-events-auto fixed inset-x-3 bottom-3 z-30 rounded-[28px] border border-[#c6a55a]/28 bg-[#030b16]/92 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:w-[440px] ${sizeClass}`}
    >
      {/* aria-modal=false because the globe remains active visual context; focus is manually managed inside sheet controls; screen-reader users can complete the same flow through DOM/fallback controls. */}
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#c6a55a]/34" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c6a55a]/74">{eyebrow}</p> : null}
          <h2 className="mt-1 font-serif text-2xl leading-tight tracking-[-0.035em] text-[#f5f1e8]">{title}</h2>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 rounded-full border border-[#c6a55a]/25 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5f1e8]/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8be76] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030b16]"
          >
            Back
          </button>
        ) : null}
      </div>

      <div className="mt-4 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
        {children}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  )
}
