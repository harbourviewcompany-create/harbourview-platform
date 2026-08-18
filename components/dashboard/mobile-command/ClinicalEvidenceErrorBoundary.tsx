'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Isolates Evidence Explorer render failures so the rest of Clinical Command stays usable.
 */
export default class ClinicalEvidenceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Clinical Evidence Explorer failed', error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-3"
          role="alert"
          aria-live="assertive"
        >
          <strong className="text-sm text-rose-100">Evidence workspace unavailable</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-rose-100/80">
            The mobile evidence explorer failed to render. Use primary authority links below and retry later.
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-[#d4a853]"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry explorer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
