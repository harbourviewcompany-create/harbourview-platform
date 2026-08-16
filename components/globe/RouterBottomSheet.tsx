'use client'

import type { ReactNode } from 'react'
import {
  HarbourviewBottomSheet,
  type HarbourviewBottomSheetSize,
} from '@/components/ui/HarbourviewPanel'

/**
 * Market-routing bottom sheet — thin wrapper over the shared institutional
 * HarbourviewBottomSheet so existing imports keep working.
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
  children?: ReactNode
  footer?: ReactNode
  size?: HarbourviewBottomSheetSize
  onBack?: () => void
}) {
  return (
    <HarbourviewBottomSheet
      title={title}
      eyebrow={eyebrow}
      footer={footer}
      size={size}
      onBack={onBack}
    >
      {children}
    </HarbourviewBottomSheet>
  )
}
