'use client'
import React from 'react'
export function CommandPalette(p: { open?: boolean; onClose?: () => void; country?: unknown; role?: string; onPage?: (p: string) => void }) {
  if (!p.open) return null
  return <div className="cc-palette" role="dialog">Command palette</div>
}
