'use client'

import { useActionState } from 'react'
import { submitSupplierApplication, type SupplierApplicationState } from '@/app/actions/submitSupplierApplication'

const SELLER_TYPE_OPTIONS = [
  { value: 'licensed_producer', label: 'Licensed Producer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'investor', label: 'Investor' },
  { value: 'other', label: 'Other' },
]

const REGION_OPTIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia_pacific', label: 'Asia-Pacific' },
  { value: 'latin_america', label: 'Latin America' },
  { value: 'middle_east_africa', label: 'Middle East & Africa' },
  { value: 'global', label: 'Global' },
]

const CATEGORY_OPTIONS = [
  { value: 'cultivation_equipment', label: 'Cultivation Equipment' },
  { value: 'processing_equipment', label: 'Processing Equipment' },
  { value: 'consumables', label: 'Consumables & Inputs' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'logistics', label: 'Logistics & Distribution' },
  { value: 'labs_testing', label: 'Labs & Testing' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'services', label: 'Services & Advisory' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'supplier_directory', label: 'General Supply' },
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
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="af-honeypot" aria-hidden="true" />

      {state.status === 'error' && (
        <div className="af-error">{state.message}</div>
      )}

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Company name *</span>
          <input type="text" name="company_name" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Company type *</span>
          <select name="seller_type" required className="af-input" defaultValue="">
            <option value="" disabled>Select…</option>
            {SELLER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Contact name *</span>
          <input type="text" name="contact_name" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Contact email *</span>
          <input type="email" name="contact_email" required maxLength={254} className="af-input" />
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Contact phone (optional)</span>
          <input type="tel" name="contact_phone" maxLength={40} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Primary region *</span>
          <select name="region" required className="af-input" defaultValue="">
            <option value="" disabled>Select…</option>
            {REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="af-field af-field--full af-fieldset">
        <span className="af-label">Supply categories * (select at least one)</span>
        <div className="af-checkgrid">
          {CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="af-check af-check--compact">
              <input type="checkbox" name="categories" value={opt.value} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="af-field af-field--full">
        <span className="af-label">Company description (max 2,000 characters) *</span>
        <textarea
          name="description"
          required
          maxLength={2000}
          rows={6}
          placeholder="What you supply, who you work with, markets served, certifications…"
          className="af-textarea"
        />
      </label>

      <label className="af-check af-check--consent">
        <input type="checkbox" name="consent" required />
        <span>I confirm this information is accurate and consent to Harbourview reviewing this submission before publication. *</span>
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
.af-fieldset { border: none; padding: 0; margin: 0; }
.af-label { font-size: 12px; font-weight: 600; letter-spacing: .03em; color: rgba(245,240,232,.62); }
.af-input, .af-textarea {
  width: 100%; padding: 11px 13px; border-radius: 8px; font-size: 14px;
  border: 1px solid rgba(212,168,75,.16); background: #020814; color: #f5f0e8;
  outline: none; transition: border-color .12s;
}
.af-input:focus, .af-textarea:focus { border-color: rgba(212,168,75,.55); }
.af-textarea { resize: vertical; font-family: inherit; }
.af-checkgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-top: 4px; }
@media (max-width: 560px) { .af-checkgrid { grid-template-columns: 1fr; } }
.af-check { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(245,240,232,.65); cursor: pointer; }
.af-check input { margin-top: 2px; accent-color: #d4a84b; }
.af-check--compact { font-size: 12.5px; }
.af-check--consent { font-size: 12.5px; line-height: 1.6; padding-top: 4px; }
.af-submit {
  padding: 13px 24px; border-radius: 8px; border: none; cursor: pointer;
  background: linear-gradient(135deg,#d4a84b,#b88c35); color: #0d1117;
  font-size: 14px; font-weight: 600; transition: opacity .12s;
}
.af-submit:hover:not(:disabled) { opacity: .88; }
.af-submit:disabled { opacity: .55; cursor: default; }
.af-success { text-align: center; padding: 48px 24px; }
.af-success-icon { font-size: 32px; color: #4caf82; margin-bottom: 16px; }
.af-success-title { font-family: 'Georgia', serif; font-size: 22px; color: #f5f0e8; margin: 0 0 12px; }
.af-success-body { font-size: 14px; line-height: 1.7; color: rgba(245,240,232,.6); max-width: 440px; margin: 0 auto; }
`
