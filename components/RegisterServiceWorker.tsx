'use client'

import { useEffect } from 'react'

/** Registers public/sw.js when supported. No-op on unsupported browsers. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_SW !== '1') {
      return
    }
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* silent — PWA is progressive enhancement */
      })
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])
  return null
}
