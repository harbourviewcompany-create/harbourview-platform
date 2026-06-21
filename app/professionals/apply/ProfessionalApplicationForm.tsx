'use client'

import { useActionState } from 'react'
import { submitProfessionalApplication, type ProfessionalApplicationState } from '@/app/actions/submitProfessionalApplication'

const CREDENTIAL_OPTIONS = [
  { value: 'physician', label: 'Physician' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
  { value: 'researcher', label: 'Clinical Researcher' },
  { value: 'pharmacologist', label: 'Pharmacologist' },
  { value: 'lawyer', label: 'Regulatory Lawyer' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'regulator', label: 'Regulatory Specialist' },
  { value: 'educator', label: 'Educator' },
  { value: 'other', label: 'Other' },
]

const initialState: ProfessionalApplicationState = { status: 'idle', message: '' }

export default function ProfessionalApplicationForm() {
  const [state, formAction, isPending] = useActionState(submitProfessionalApplication, initialState)

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
          <span className="af-label">Full name *</span>
          <input type="text" name="full_name" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Title (optional)</span>
          <input type="text" name="title" maxLength={40} placeholder="Dr., Prof., etc." className="af-input" />
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Email *</span>
          <input type="email" name="email" required maxLength={200} className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Credential type *</span>
          <select name="credential_type" required className="af-input" defaultValue="">
            <option value="" disabled>Select…</option>
            {CREDENTIAL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="af-row">
        <label className="af-field">
          <span className="af-label">Institution</span>
          <input type="text" name="institution" maxLength={200} placeholder="Hospital, university, clinic…" className="af-input" />
        </label>
        <label className="af-field">
          <span className="af-label">Institution country (ISO2)</span>
          <input type="text" name="institution_country" maxLength={2} placeholder="e.g. DE" className="af-input" style={{ textTransform: 'uppercase' }} />
        </label>
      </div>

      <label className="af-field af-field--full">
        <span className="af-label">Markets of practice (ISO2, comma-separated) *</span>
        <input type="text" name="countries" required placeholder="DE, GB, CA" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Specialties (comma-separated)</span>
        <input type="text" name="specialties" placeholder="oncology, pain management, neurology" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Clinical focus (comma-separated)</span>
        <input type="text" name="clinical_focus" placeholder="chronic pain, palliative care" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Languages (comma-separated)</span>
        <input type="text" name="languages" placeholder="English, German, French" className="af-input" />
      </label>

      <label className="af-field af-field--full">
        <span className="af-label">Public bio (max 1,200 characters)</span>
        <textarea name="bio_public" maxLength={1200} rows={5} className="af-textarea" placeholder="A short professional summary visible on your public profile." />
      </label>

      <div className="af-checks">
        <label className="af-check">
          <input type="checkbox" name="accepts_referrals" />
          <span>I accept patient/client referrals</span>
        </label>
        <label className="af-check">
          <input type="checkbox" name="consultation_available" />
          <span>I am available for consultations</span>
        </label>
      </div>

      <label className="af-check af-check--consent">
        <input type="checkbox" name="consent" required />
        <span>I confirm this information is accurate and consent to Harbourview reviewing my application and verifying my credentials before publication. *</span>
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
.af-checks { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.af-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: rgba(245,240,232,.55);
  line-height: 1.5;
  cursor: pointer;
}
.af-check input { margin-top: 2px; flex-shrink: 0; }
.af-check--consent { margin-top: 8px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.06); }
.af-submit {
  margin-top: 8px;
  padding: 12px 24px;
  background: #d4a84b;
  color: #050c18;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity .15s;
  align-self: flex-start;
}
.af-submit:hover:not(:disabled) { opacity: .85; }
.af-submit:disabled { opacity: .5; cursor: default; }
.af-success {
  padding: 48px 32px;
  text-align: center;
  border-radius: 16px;
  border: 1px solid rgba(76,175,130,.2);
  background: rgba(76,175,130,.04);
}
.af-success-icon { font-size: 32px; color: #4caf82; margin-bottom: 16px; }
.af-success-title { font-family: 'Georgia', serif; font-size: 22px; font-weight: 400; color: #f5f0e8; margin: 0 0 12px; }
.af-success-body { font-size: 14px; line-height: 1.7; color: rgba(245,240,232,.55); margin: 0; }
`
