'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'
import StaticGlobeFallback from './StaticGlobeFallback'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Harbourview globe render failed', error)
  }

  render() {
    if (this.state.hasError) {
      return <StaticGlobeFallback />
    }

    return this.props.children
  }
}
