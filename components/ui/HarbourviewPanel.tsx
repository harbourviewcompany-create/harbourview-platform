'use client'

import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Shared institutional surface language for sheets, command cards, public cards,
 * and section panels. Colours from styles/design-tokens.css (--hv-*).
 *
 * Use across every product area so Command, Marketplace, Intel, Clinical, and
 * public marketing share one launch-quality material language.
 */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export const hvPanelSurfaceClass =
  'border border-[color:var(--hv-panel-border-warm)] bg-[color:var(--hv-panel-strong)] text-[color:var(--hv-ivory)] shadow-[0_32px_110px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl'

export const hvPanelHairlineClass = 'h-1 w-12 rounded-full bg-[color:var(--hv-champagne-300)]/48'

export const hvPanelEyebrowClass =
  'text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hv-gold-light)]/84'

export const hvPanelTitleClass =
  'mt-1 font-serif text-2xl leading-tight tracking-[-0.035em] text-[color:var(--hv-ivory)]'

export const hvPanelBodyClass = 'text-sm leading-6 text-[color:var(--hv-text-secondary)]'

export const hvPanelBackButtonClass =
  'min-h-12 min-w-24 rounded-full border border-[color:var(--hv-champagne-300)]/38 bg-white/[0.06] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hv-ivory)] shadow-[0_0_24px_rgba(0,0,0,0.28)] transition hover:border-[color:var(--hv-champagne-300)]/70 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hv-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hv-black)]'

export const hvPanelPrimaryCtaClass =
  'flex min-h-12 w-full items-center justify-center rounded-full bg-[color:var(--hv-gold)] px-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--hv-navy-deep)] shadow-[0_0_34px_rgba(198,165,90,0.18)] transition hover:brightness-105 disabled:opacity-40'

/** Default command / marketplace tile — token-backed border + navy field. */
export const hvCardSurfaceClass =
  'rounded-[18px] border border-[color:var(--hv-panel-border-warm)] bg-[color:var(--hv-panel-strong)] p-[19px] text-[color:var(--hv-ivory)] shadow-[0_16px_50px_rgba(0,0,0,0.18)]'

/** Priority / attention emphasis without neon. */
export const hvCardPriorityClass =
  'rounded-[18px] border border-[color:var(--hv-gold)]/26 bg-[linear-gradient(145deg,rgba(45,37,21,0.72),rgba(12,20,31,0.96))] p-[19px] text-[color:var(--hv-ivory)]'

/** Public marketing card (sm radius, soft gold edge). */
export const hvCardPublicClass =
  'rounded-sm border border-[color:var(--hv-gold)]/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] text-[color:var(--hv-ivory)] shadow-[0_18px_44px_rgba(0,0,0,0.24)]'

export type HarbourviewCardTone = 'default' | 'priority' | 'public' | 'bare'

export type HarbourviewCardAs = 'article' | 'div' | 'section'

const CARD_TONE_CLASS: Record<HarbourviewCardTone, string> = {
  default: hvCardSurfaceClass,
  priority: hvCardPriorityClass,
  public: hvCardPublicClass,
  /** Surface only via className / external CSS (e.g. hvm2-command-brief). */
  bare: 'text-[color:var(--hv-ivory)]',
}

export function HarbourviewPanel({
  children,
  className,
  elevated = false,
  ...rest
}: {
  children: ReactNode
  elevated?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        elevated ? hvCardSurfaceClass : `rounded-[28px] p-4 ${hvPanelSurfaceClass}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export type HarbourviewBottomSheetSize = 'confirm' | 'role' | 'intent' | 'search'

const SHEET_SIZE_CLASS: Record<HarbourviewBottomSheetSize, string> = {
  confirm: 'max-h-[24svh]',
  role: 'max-h-[64svh]',
  intent: 'max-h-[62svh]',
  search: 'max-h-[72svh]',
}

/**
 * Bottom sheet (mobile) / centred modal (desktop) used by market routing.
 * Globe remains visible behind the sheet — not a full-screen modal trap.
 */
export function HarbourviewBottomSheet({
  title,
  eyebrow,
  children,
  footer,
  size = 'role',
  onBack,
  className,
}: {
  title: string
  eyebrow?: string
  children?: ReactNode
  footer?: ReactNode
  size?: HarbourviewBottomSheetSize
  onBack?: () => void
  className?: string
}) {
  return (
    <section
      aria-label={title}
      className={cx(
        'pointer-events-auto fixed inset-x-3 bottom-3 z-30 flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[460px] sm:-translate-x-1/2 sm:-translate-y-1/2',
        'rounded-[28px] p-4',
        hvPanelSurfaceClass,
        SHEET_SIZE_CLASS[size],
        className,
      )}
    >
      <div className={cx('mx-auto mb-3', hvPanelHairlineClass)} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className={hvPanelEyebrowClass}>{eyebrow}</p> : null}
          <h2 className={hvPanelTitleClass}>{title}</h2>
        </div>
        {onBack ? (
          <button type="button" onClick={onBack} className={hvPanelBackButtonClass}>
            Back
          </button>
        ) : null}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:var(--hv-gold)_rgba(2,9,19,0.92)] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {children}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  )
}

/** Compact section / marketplace / intel card surface. */
export function HarbourviewCard({
  children,
  className,
  tone = 'default',
  as = 'article',
  ...rest
}: {
  children: ReactNode
  className?: string
  tone?: HarbourviewCardTone
  /** Intrinsic element only — avoids ElementType × HTMLAttributes children: never. */
  as?: HarbourviewCardAs
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const Comp = as
  return (
    <Comp className={cx(CARD_TONE_CLASS[tone], className)} {...rest}>
      {children}
    </Comp>
  )
}

/**
 * Standard section chrome: eyebrow + title + description + optional action.
 * Use for public pages and any non-hvm2 section that needs the same hierarchy.
 */
export function HarbourviewSectionHeader({
  eyebrow,
  title,
  children,
  action,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? <p className={cx(hvPanelEyebrowClass, 'mb-3 tracking-[0.26em]')}>{eyebrow}</p> : null}
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[color:var(--hv-ivory)] sm:text-4xl">
          {title}
        </h2>
        {children ? (
          <div className="mt-4 text-sm leading-7 text-[color:var(--hv-text-secondary)] sm:text-base">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
