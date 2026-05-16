'use client'

import { useState } from 'react'
import {
  Button,
  Field,
  FormErrorSummary,
  FormSection,
  SelectField,
  TextareaField,
} from '@/components/design-system/Institutional'
import { CONTACT_EMAIL } from '@/lib/contact'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const discussionTypes = [
  'Acquisition or Investment Opportunity',
  'Sell-Side Advisory',
  'Buy-Side Advisory',
  'Counterparty Introduction',
  'Strategic Partnership',
  'Market Intelligence Request',
  'General Enquiry',
]

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function buildIntakeMessage(fields: {
  discussionType: string
  message: string
}) {
  return [
    'Harbourview confidential intake',
    '',
    `Purpose of Discussion: ${fields.discussionType || 'General Enquiry'}`,
    '',
    'Details:',
    fields.message,
  ].join('\n')
}

export default function ConfidentialIntakeForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!readFormString(data, 'name')) errs.name = 'Name is required.'
    if (!readFormString(data, 'email')) errs.email = 'Email is required.'
    if (!readFormString(data, 'message')) errs.message = 'Please describe the nature of your enquiry.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setState('submitting')
    setErrorMessage('')

    const name = readFormString(data, 'name')
    const email = readFormString(data, 'email').toLowerCase()
    const company = readFormString(data, 'company') || null
    const discussionType = readFormString(data, 'discussionType')
    const message = readFormString(data, 'message')

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company,
        contact_phone: null,
        inquiry_type: 'sourcing_mandate',
        message: buildIntakeMessage({ discussionType, message }),
        status: 'received',
      },
      'Confidential intake received. Harbourview will review it and respond directly. [CAPTURE_OK]',
      'CONFIDENTIAL_INTAKE'
    )

    if (result.ok) {
      setState('success')
      form.reset()
      return
    }

    setState('error')
    setErrorMessage(result.message)
  }

  if (state === 'success') {
    return (
      <div className="rounded-[1.75rem] border border-[#d7caa9]/55 bg-[#fbf7ed] p-8 text-center text-[#061527]">
        <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#a9873c]/35 text-2xl text-[#8f7130]">✓</p>
        <h2 className="mt-5 font-serif text-2xl tracking-[-0.03em]">Intake received for confidential review</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#435066]">
          Harbourview will review the inquiry and respond directly. Submission details are handled in confidence and are not published to public routes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormErrorSummary errors={errors} />

      <FormSection
        eyebrow="Contact"
        title="Responsible contact"
        note="Use the person Harbourview should contact for review. Contact details are not public."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="name" name="name" type="text" autoComplete="name" label="Full name" required error={errors.name} />
          <Field id="email" name="email" type="email" autoComplete="email" label="Email address" required error={errors.email} />
        </div>
        <Field id="company" name="company" type="text" label="Company / organisation" />
      </FormSection>

      <FormSection
        eyebrow="Situation"
        title="Confidential review context"
        note="Provide enough context for review. Avoid uploading or pasting raw confidential documents, privileged legal material or uncontrolled source evidence here."
      >
        <SelectField id="discussionType" name="discussionType" label="Purpose of discussion">
          <option value="">— Select if applicable —</option>
          {discussionTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </SelectField>
        <TextareaField
          id="message"
          name="message"
          rows={7}
          label="Review details"
          required
          error={errors.message}
          placeholder="Describe the commercial situation, jurisdiction, relevant parties at a high level, timing, and what Harbourview should review before any follow-up."
        />
      </FormSection>

      <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/54">
        Submissions are reviewed and handled in confidence. Harbourview does not share intake details or publish submitted context without explicit review and consent.
      </p>

      {state === 'error' ? (
        <p role="alert" className="rounded-2xl border border-[#9f2f2f]/30 bg-[#fff4f0] px-4 py-3 text-sm text-[#7f2626]">
          {errorMessage}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
            Contact Harbourview directly
          </a>{' '}
          if the issue persists.
        </p>
      ) : null}

      <Button type="submit" disabled={state === 'submitting'} className="w-full disabled:opacity-60">
        {state === 'submitting' ? 'Submitting…' : 'Submit Confidential Intake'}
      </Button>
    </form>
  )
}
