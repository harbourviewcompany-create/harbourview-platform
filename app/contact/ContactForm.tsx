'use client'

import { useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'

type FormState = 'idle' | 'submitting' | 'success'

export default function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')) errs.name = 'Name is required.'
    if (!data.get('email')) errs.email = 'Email is required.'
    if (!data.get('message')) errs.message = 'Message is required.'
    return errs
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setState('submitting')

    const subject = encodeURIComponent(
      `Contact: ${data.get('subject') || 'General Enquiry'}`
    )
    const body = encodeURIComponent(
      [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        '',
        `${data.get('message')}`,
      ].join('\n')
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="card p-8 text-center sm:p-10">
        <p className="mb-4 text-4xl text-gold">✓</p>
        <h2 className="mb-2 text-xl font-bold text-navy">Message Prepared</h2>
        <p className="mx-auto max-w-md text-sm leading-7 text-gray-600">
          Your email client has been opened with your message pre-filled. Send the email to
          complete your enquiry.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8" noValidate>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-dark">
          Confidential Contact Form
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-navy">Send a reviewed inquiry</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
          Include enough context for Harbourview to assess fit before follow-up. Required fields are marked.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-sm border border-gray-300 bg-white px-3.5 py-3 text-sm text-navy shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-sm border border-gray-300 bg-white px-3.5 py-3 text-sm text-navy shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="Market access inquiry, reviewed opportunity, intelligence request, or general contact"
          className="w-full rounded-sm border border-gray-300 bg-white px-3.5 py-3 text-sm text-navy shadow-sm transition placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={7}
          placeholder="Describe who you are, the nature of the opportunity or request, relevant market context, and the type of follow-up you are seeking."
          className="min-h-[190px] w-full resize-y rounded-sm border border-gray-300 bg-white px-3.5 py-3 text-sm leading-7 text-navy shadow-sm transition placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>}
      </div>

      <p className="rounded-sm border border-gold/15 bg-gold/5 px-4 py-3 text-xs leading-6 text-gray-600">
        Submissions are reviewed before follow-up. Do not include information you are not authorized
        to share.
      </p>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn-primary w-full justify-center py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
      >
        {state === 'submitting' ? 'Opening email…' : 'Send Message'}
      </button>
    </form>
  )
}
