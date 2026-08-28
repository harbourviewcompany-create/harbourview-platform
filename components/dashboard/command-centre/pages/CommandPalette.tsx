'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CommandPage } from '../types'
import { NAV_ITEMS_FLAT } from '../navConfig'

export function CommandPalette({
  open, onClose, onNavigate, query: initialQuery = '',
}: {
  open: boolean
  onClose: () => void
  onNavigate: (page: CommandPage) => void
  query?: string
}) {
  const [q, setQ] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ(initialQuery)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initialQuery])

  const items = useMemo(() => {
    const list = NAV_ITEMS_FLAT ?? []
    if (!q.trim()) return list.slice(0, 16)
    const qq = q.toLowerCase()
    return list.filter(i =>
      i.label.toLowerCase().includes(qq) || i.id.toLowerCase().includes(qq)
    ).slice(0, 16)
  }, [q])

  if (!open) return null

  return (
    <div className="cc-palette-overlay" onClick={onClose}>
      <div className="cc-palette" onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <input
          ref={inputRef}
          className="cc-palette-input"
          placeholder="Jump to page…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter' && items[0]) {
              onNavigate(items[0].id)
              onClose()
            }
          }}
        />
        <ul className="cc-palette-list">
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className="cc-palette-item"
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
              >
                <span className="cc-palette-icon">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="cc-muted">No matches</li>}
        </ul>
      </div>
    </div>
  )
}
