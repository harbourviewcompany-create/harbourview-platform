'use client'

import { useActionState } from 'react'
import {
  submitFinancingInquiry,
  type FinancingInquiryState,
} from '@/app/actions/submitFinancingInquiry'

const INITIAL: FinancingInquiryState = { status: 'idle', message: '' }

export default function FinancingInquiryForm() {
  const [state, formAction, pending] = useActionState(submitFinancingInquiry, INITIAL)

  if (state.status === 'success') {
    return (
      <div className="fif-card fif-success">
        <p className="fif-check">✓</p>
        <h2>Inquiry received</h2>
        <p>{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="fif-card" noValidate>
      <style>{FORM_CSS}</style>

      {/* Honeypot */}
      <div className="fif-hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="fif-grid">
        <div className="fif-field">
          <label htmlFor="contact_name">Full name *</label>
          <input id="contact_name" name="contact_name" type="text" required maxLength={200} autoComplete="name" />
        </div>
        <div className="fif-field">
          <label htmlFor="contact_email">Work email *</label>
          <input id="contact_email" name="contact_email" type="email" required maxLength={200} autoComplete="email" />
        </div>
        <div className="fif-field">
          <label htmlFor="contact_company">Company *</label>
          <input id="contact_company" name="contact_company" type="text" required maxLength={200} autoComplete="organization" />
        </div>
        <div className="fif-field">
          <label htmlFor="contact_phone">Phone</label>
          <input id="contact_phone" name="contact_phone" type="tel" maxLength={40} autoComplete="tel" />
        </div>
        <div className="fif-field">
          <label htmlFor="amount">Approximate amount (USD) *</label>
          <input id="amount" name="amount" type="text" required maxLength={40} placeholder="e.g. 250000" />
        </div>
        <div className="fif-field">
          <label htmlFor="currency_pair">Currency / settlement</label>
          <input id="currency_pair" name="currency_pair" type="text" maxLength={40} placeholder="e.g. USD, EUR" />
        </div>
        <div className="fif-field">
          <label htmlFor="purpose">Purpose *</label>
          <select id="purpose" name="purpose" required defaultValue="inventory_purchase">
            <option value="inventory_purchase">Inventory / product purchase</option>
            <option value="equipment">Equipment</option>
            <option value="import_export">Import / export working capital</option>
            <option value="deal_room">Deal-room transaction support</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="fif-field">
          <label htmlFor="timeline">Timeline *</label>
          <select id="timeline" name="timeline" required defaultValue="30_60">
            <option value="immediate">Immediate (0–14 days)</option>
            <option value="30_60">30–60 days</option>
            <option value="60_90">60–90 days</option>
            <option value="90_plus">90+ days</option>
          </select>
        </div>
        <div className="fif-field fif-span">
          <label htmlFor="markets">Markets involved *</label>
          <input
            id="markets"
            name="markets"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. Canada → Germany"
          />
        </div>
        <div className="fif-field fif-span">
          <label htmlFor="deal_context">Deal / listing context</label>
          <input
            id="deal_context"
            name="deal_context"
            type="text"
            maxLength={300}
            placeholder="Listing slug, deal room title, or brief reference"
          />
        </div>
        <div className="fif-field fif-span">
          <label htmlFor="message">Additional context *</label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            maxLength={2000}
            placeholder="Describe the transaction structure, counterparties at a high level, and what financing support you need."
          />
        </div>
      </div>

      <label className="fif-consent">
        <input type="checkbox" name="consent" required />
        <span>
          I confirm this inquiry is for legitimate commercial activity in regulated markets and that I
          am authorized to share this information with Harbourview for review.
        </span>
      </label>

      {state.status === 'error' && <p className="fif-error">{state.message}</p>}

      <button type="submit" className="fif-submit" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit financing inquiry'}
      </button>
    </form>
  )
}

const FORM_CSS = `
.fif-card {
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
  padding: 28px 24px;
}
.fif-success { text-align: center; padding: 48px 24px; }
.fif-success h2 { font-size: 20px; margin: 0 0 10px; color: #f5f0e8; }
.fif-success p { font-size: 14px; color: rgba(245,240,232,.55); line-height: 1.6; margin: 0; }
.fif-check { font-size: 28px; color: #4caf82; margin: 0 0 12px; }
.fif-hp { position: absolute; left: -9999px; height: 0; overflow: hidden; }
.fif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fif-field { display: flex; flex-direction: column; gap: 6px; }
.fif-span { grid-column: 1 / -1; }
.fif-field label { font-size: 11px; font-weight: 600; letter-spacing: .04em; color: rgba(245,240,232,.55); }
.fif-field input, .fif-field select, .fif-field textarea {
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(0,0,0,.28);
  color: #f5f0e8;
  padding: 10px 12px;
  font: inherit;
  font-size: 13px;
  outline: none;
}
.fif-field input:focus, .fif-field select:focus, .fif-field textarea:focus {
  border-color: rgba(212,168,75,.4);
}
.fif-field select option { background: #0b1a2f; }
.fif-consent {
  display: flex; gap: 10px; align-items: flex-start;
  margin: 18px 0 14px; font-size: 12px; line-height: 1.55; color: rgba(245,240,232,.5);
}
.fif-consent input { margin-top: 3px; }
.fif-error {
  margin: 0 0 12px; padding: 10px 12px; border-radius: 8px;
  background: rgba(220,80,80,.1); border: 1px solid rgba(220,80,80,.25);
  color: #e08080; font-size: 13px;
}
.fif-submit {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 22px; border-radius: 6px; border: none; cursor: pointer;
  background: #d4a84b; color: #050c18; font-size: 12px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
}
.fif-submit:disabled { opacity: .55; cursor: default; }
@media (max-width: 640px) {
  .fif-grid { grid-template-columns: 1fr; }
}
`
