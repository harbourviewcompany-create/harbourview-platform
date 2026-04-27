'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const GOLD = '#C6A55A'

function LoginForm() {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      })
      if (!res.ok) { setError('Invalid credentials'); setLoading(false); return }
      router.replace(from)
    } catch { setError('Network error'); setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#060F1C' }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '48px 32px', backgroundColor: '#0A1628', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '4px' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: GOLD, margin: '0 0 28px', letterSpacing: '0.06em' }}>HARBOURVIEW ADMIN</p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Admin secret"
          style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '2px', color: '#F5F1E8', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
        />
        {error && <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#EF5350', marginBottom: '12px' }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '11px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '2px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
