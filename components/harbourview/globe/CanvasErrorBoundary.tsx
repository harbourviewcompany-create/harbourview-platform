'use client'

import type { ReactNode } from 'react'
import { Component, createRef } from 'react'
import React from 'react'
import { HarbourviewGlobeClientLoader } from './HarbourviewGlobeClientLoader'

type Props = {
  children?: ReactNode
  onError?: (error: unknown) => void
}

type State = {
  hasError: boolean
}

export default class CanvasErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>
  state: State = { hasError: false }

  private fallbackRef = createRef<HTMLDivElement>()

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error)

    if (process.env.NODE_ENV !== 'production') {
      console.error('Harbourview globe render failed — showing WebGL fallback', error)
    }
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (!prevState.hasError && this.state.hasError) {
      this.fallbackRef.current?.focus()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          ref={this.fallbackRef}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          tabIndex={-1}
          aria-label="Interactive globe unavailable. Showing fallback globe."
          className="absolute inset-0"
        >
          <HarbourviewGlobeClientLoader />
        </div>
      )
    }

    return this.props.children
  }
}
