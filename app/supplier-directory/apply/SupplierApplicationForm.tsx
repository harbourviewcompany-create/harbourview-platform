'use client'

import { useActionState } from 'react'
import { submitSupplierApplication, type SupplierApplicationState } from '@/app/actions/submitSupplierApplication'

const SELLER_TYPE_OPTIONS = [
  { value: 'cultivator', label: 'Cultivator / Grower' },
  { value: 'processor', label: 'Processor / Manufacturer' },
  { value: 'distributor', label: 'Distributor / Wholesaler' },
  { value: 'equipment', label: 'Equipment & Technology Provider' },
  { value: 'genetics', label: 'Genetics / Breeder' },
  { value: 'lab_testing', label: 'Testing Lab / Analytics' },
  { value: 'packaging', label: 'Packaging & Compliance' },
  { value: 'services', label: 'Services & Consulting' },
  { value: 'other', label: 'Other' },
]

const initialState: SupplierApplicationState = { status: 'idle', message: '' }

export default function SupplierApplicationForm() {
  const [state, formAction, isPending] = useActionState(submitSupplierApplication, initialState)

  if (state.status === 'success') {
    return (
      <div className="af-success">
        <div className="af-success-icon">✓</div>
        <h2 className="af-success-title">Application received</h2>
        <p className="af-success-body">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="af-form">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="af-honeypot" aria-hidden="true" />

      {state.status === 'error' && (
        <div className="af-error">{state.message}</div>
      )}

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Company name *</span>
          <input type="text" name="company_name" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Your name (contact person) *</span>
          <input type="text" name="contact_name" required maxLength={200} className="af-input" />
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Email *</span>
          <input type="email" name="email" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Your title / role</span>
          <input type="text" name="title" maxLength={100} placeholder="CEO, Sales Director, etc." className="af-input" />
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Business type *</span>
          <select name="seller_type" required className="af-input" defaultValue="">
            <option value="" disabled>Select business type…</option>
            {SELLER_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="af-field">
          <span className="af-label">HQ country (ISO2)</span>
          <input type="text" name="hq_country" maxLength={2} placeholder="e.g. CA" className="af-input" style={{ textTransform: 'uppercase' }} />
        </label>
      </div>

      <label className="af-field af-field--full">
        <span className="af-label">Markets / Regions served (ISO2, comma-separated) *</span>
        <input type="text" name="regions_served" required placeholder="CA, US, DE, GB" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Primary categories (comma-separated)</span>
        <input type="text" name="categories" placeholder="flower, edibles, vapes, concentrates, equipment" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Services offered (comma-separated)</span>
        <input type="text" name="services_offered" placeholder="cultivation consulting, extraction, logistics" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Website</span>
        <input type="url" name="website_url" placeholder="https://yourcompany.com" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Public company description (max 1,500 characters)</span>
        <textarea name="description_public" maxLength={1500} rows={6} className="af-textarea" placeholder="Brief overview of your company, products, and compliance focus. This will be visible on your public profile." />
      </label>

      <label className="af-check af-check--consent">
        <input type="checkbox" name="consent" required />
        <span>I confirm this information is accurate and consent to Harbourview reviewing our company before publication in the Supplier Directory. *</span>
      </label>

      <button type="submit" disabled={isPending} className="af-submit">
        {isPending ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}

export const FORM_CSS = `
.af-form { display: flex; flex-direction: column; gap: 18px; }
.af-honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.af-error {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(224,85,85,.3);
  background: rgba(224,85,85,.06);
  color: #e88;
  font-size: 13px;
}
.af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 560px) { .af-row { grid-template-columns: 1fr; } }
.af-field { display: flex; flex-direction: column; gap: 6px; }
.af-field--full { grid-column: 1 / -1; }
.af-label { font-size: 11px; font-weight: 600; letter-spacing: .04em; color: rgba(245,240,232,.5); }
.af-input, .af-textarea {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.03);
  color: #f5f0e8;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color .15s;
}
.af-input:focus, .af-textarea:focus { border-color: rgba(212,168,75,.5); }
.af-textarea { resize: vertical; }
.af-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: rgba(245,240,232,.55);
  line-height: 1.5;
  cursor: pointer;
}
.af-check input { margin-top: 2px; }
.af-check--consent { margin-top: 8px; }
.af-success {
  text-align: center;
  padding: 48px 24px;
  border: 1px solid rgba(212,168,75,.2);
  border-radius: 12px;
  background: rgba(212,168,75,.04);
}
.af-success-icon { font-size: 48px; color: #d4a84b; margin-bottom: 16px; }
.af-success-title { font-family: 'Georgia', serif; font-size: 24px; color: #f5f0e8; margin: 0 0 12px; }
.af-success-body { color: rgba(245,240,232,.7); max-width: 420px; margin: 0 auto; }
.af-submit {
  margin-top: 8px;
  padding: 14px 28px;
  background: #d4a84b;
  color: #050c18;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.af-submit:hover:not(:disabled) { background: #e8c17a; }
.af-submit:disabled { opacity: 0.6; cursor: not-allowed; }
`;
