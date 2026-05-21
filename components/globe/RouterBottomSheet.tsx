'use client'

import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'

export const ROUTER_BOTTOM_SHEET_FOCUS_LIFECYCLE = {
  entryTarget: 'first interactive element inside the sheet',
  tabBounds: 'tab and shift+tab are cycled within the sheet',
  escapeBackBehavior: 'Escape triggers the Back action when onBack is provided',
  focusReturn: 'focus returns to the previously active element on unmount',
} as const

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Focus lifecycle contract for the globe bottom sheet:
 * 1) Entry focus target: first interactive element inside the sheet.
 * 2) Tab order bounds: tab/shift+tab cycle inside the sheet.
 * 3) Escape/back behavior: Escape triggers onBack when available.
 * 4) Focus return: focus goes back to the element active before mount.
 */

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
  const sheetRef = useRef<HTMLElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const container = sheetRef.current
    if (!container) return undefined

    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const entryTarget = focusables[0] ?? container
    if (entryTarget !== document.activeElement) {
      entryTarget.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onBack) {
          event.preventDefault()
          onBack()
        }
        return
      }

      if (event.key !== 'Tab') return

      const currentFocusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (currentFocusables.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = currentFocusables[0]
      const last = currentFocusables[currentFocusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [onBack])

  const sizeClass = {
    confirm: 'max-h-[24svh]',
    role: 'max-h-[48svh]',
    intent: 'max-h-[62svh]',
    search: 'max-h-[72svh]',
  }[size]

  return (
    <section
      ref={sheetRef}
      aria-label={title}
      aria-labelledby={titleId}
      aria-modal="false"
      tabIndex={-1}
      className={`pointer-events-auto fixed inset-x-3 bottom-3 z-30 rounded-[28px] border border-[#c6a55a]/28 bg-[#030b16]/92 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:w-[440px] ${sizeClass}`}
    >
      {/* aria-modal=false because the globe remains active visual context; focus is manually managed inside sheet controls; screen-reader users can complete the same flow through DOM/fallback controls. */}
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-[#c6a55a]/34" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c6a55a]/74">{eyebrow}</p> : null}
          <h2 id={titleId} className="mt-1 font-serif text-2xl leading-tight tracking-[-0.035em] text-[#f5f1e8]">{title}</h2>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 rounded-full border border-[#c6a55a]/25 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5f1e8]/72"
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
