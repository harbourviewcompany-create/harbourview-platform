'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const PORTAL_ATTR = 'data-hvm-portal-open'

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

function resolvePortalTarget(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return (
    document.getElementById('hvm-portal-root') ??
    document.body
  )
}

type AppPortalProps = {
  open: boolean
  children: ReactNode
  /** Called when the user presses Escape */
  onEscape?: () => void
}

/**
 * Renders children into document.body (or #hvm-portal-root when present)
 * so overlays escape app-shell stacking contexts (secondary nav, bottom nav).
 */
export function AppPortal({ open, children, onEscape }: AppPortalProps) {
  useBodyScrollLock(open)
  useEscapeToClose(open, onEscape)

  if (!open) return null

  const target = resolvePortalTarget()
  if (!target) return null

  return createPortal(children, target)
}
