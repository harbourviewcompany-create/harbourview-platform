'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABEL, type ProfessionalServiceCategory } from '@/lib/marketplace/professionalServiceTypes'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ProfessionalServiceCategory[]

export function ProfessionalServiceApplicationForm() {
  const [category, setCategory] = useState<ProfessionalServiceCategory>('legal')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [markets, setMarkets] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'signed-out'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage(null)

    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setStatus('signed-out')
      return
    }

    const { error } = await supabase.from('professional_service_provider_applications').insert({
      category,
      name: name.trim(),
      description: description.trim() || null,
      markets_covered: markets
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      website: website.trim() || null,
      contact_email: contactEmail.trim(),
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    setStatus('success')
    setName('')
    setDescription('')
    setMarkets('')
    setWebsite('')
    setContactEmail('')
  }

  if (status === 'success') {
    return (
      <div className="psaf-success">
        <p>Application received. Listings are reviewed before publishing — we&apos;ll follow up at {contactEmail || 'the email you provided'}.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="psaf-form">
      <style>{CSS}</style>

      <label className="psaf-field">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as ProfessionalServiceCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="psaf-field">
        <span>Firm / provider name</span>
        <input
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Northgate Cannabis Counsel LLP"
        />
      </label>

      <label className="psaf-field">
        <span>Description</span>
        <textarea
          maxLength={2000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What you do, jurisdictions you specialize in, cannabis-specific experience."
        />
      </label>

      <label className="psaf-field">
        <span>Markets covered (comma-separated)</span>
        <input
          value={markets}
          onChange={(e) => setMarkets(e.target.value)}
          placeholder="e.g. Germany, Poland, Ohio"
        />
      </label>

      <label className="psaf-field">
        <span>Website</span>
        <input
          type="url"
          maxLength={500}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
        />
      </label>

      <label className="psaf-field">
        <span>Contact email</span>
        <input
          required
          type="email"
          maxLength={320}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="you@firm.com"
        />
      </label>

      {status === 'signed-out' && (
        <p className="psaf-error">
          You need to be signed in to apply. <a href="/login">Sign in</a> and try again.
        </p>
      )}
      {status === 'error' && <p className="psaf-error">{errorMessage ?? 'Something went wrong. Please try again.'}</p>}

      <button type="submit" disabled={status === 'submitting'} className="psaf-submit">
        {status === 'submitting' ? 'Submitting…' : 'Apply to be listed'}
      </button>
    </form>
  )
}

const CSS = `
.psaf-form { display:flex; flex-direction:column; gap:16px; max-width:520px; }
.psaf-field { display:flex; flex-direction:column; gap:6px; font-size:12px; color:rgba(245,240,232,.55); }
.psaf-field input, .psaf-field select, .psaf-field textarea {
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:8px;
  padding:9px 12px; font-size:14px; color:#f5f0e8; font-family:inherit;
}
.psaf-field input:focus, .psaf-field select:focus, .psaf-field textarea:focus {
  outline:none; border-color:rgba(212,168,75,.5);
}
.psaf-submit {
  align-self:flex-start; padding:10px 20px; border-radius:8px; border:none;
  background:linear-gradient(135deg,#d4a84b,#b88c35); color:#0d1117; font-weight:600; font-size:13px;
  cursor:pointer;
}
.psaf-submit:disabled { opacity:.6; cursor:not-allowed; }
.psaf-error { font-size:12px; color:#e28b8b; }
.psaf-success { font-size:13px; color:rgba(245,240,232,.7); line-height:1.7; max-width:480px; }
`
