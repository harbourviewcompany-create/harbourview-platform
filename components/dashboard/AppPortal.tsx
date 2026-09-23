'use client'

import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

const PORTAL_ATTR = 'data-hvm-portal-open'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Locks document scroll while any AppPortal is open.
 * Uses a ref-count via data-attribute so nested/stacked portals don't unlock early.
 */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return

    const root = document.documentElement
    const prevCount = Number(root.getAttribute(PORTAL_ATTR) || '0')
    root.setAttribute(PORTAL_ATTR, String(prevCount + 1))

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      const next = Math.max(0, Number(root.getAttribute(PORTAL_ATTR) || '1') - 1)
      if (next === 0) {
        root.removeAttribute(PORTAL_ATTR)
        document.body.style.overflow = previousOverflow
        document.body.style.touchAction = previousTouchAction
      } else {
        root.setAttribute(PORTAL_ATTR, String(next))
      }
    }
  }, [locked])
}

function useEscapeToClose(open: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!open || !onEscape) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onEscape])
}

/** Keep Tab cycling inside the portal layer while open. */
function useFocusTrap(open: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const root = containerRef.current
      if (!root) return

      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      )
      if (nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (!active || active === first || !root.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (!active || active === last || !root.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, containerRef])
}

export function resolvePortalTarget(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.getElementById('hvm-portal-root') ?? document.body
}

type AppPortalProps = {
  open: boolean
  children: ReactNode
  /** Called when the user presses Escape */
  onEscape?: () => void
}

/**
 * Renders children into #hvm-portal-root (or document.body)
 * so overlays escape app-shell stacking contexts (secondary nav, bottom nav).
 */
export function AppPortal({ open, children, onEscape }: AppPortalProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useEscapeToClose(open, onEscape)
  useFocusTrap(open, layerRef)

  if (!open) return null

  const target = resolvePortalTarget()
  if (!target) return null

  return createPortal(
    <div ref={layerRef} className="hvm-portal-layer" data-hvm-portal-layer="">
      {children}
    </div>,
    target,
  )
}
