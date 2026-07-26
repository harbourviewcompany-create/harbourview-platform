'use client'

import { useRef, useState, useTransition } from 'react'

type FormErrors = Record<string, string>
type ApplyState = { status: 'idle' | 'success' | 'error'; message: string }

const initialState: ApplyState = { status: 'idle', message: '' }

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export default function TalentApplyForm({ jobId }: { jobId: string }) {
  const [state, setState] = useState<ApplyState>(initialState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function validate(data: FormData) {
    const errs: FormErrors = {}
    if (!readFormString(data, 'name')) errs.name = 'Name is required.'
    if (!readFormString(data, 'email')) errs.email = 'Email is required.'
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

    startTransition(async () => {
      let response: Response
      try {
        response = await fetch('/api/talent/apply', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            name: readFormString(data, 'name'),
            email: readFormString(data, 'email'),
            phone: readFormString(data, 'phone') || null,
            resume_url: readFormString(data, 'resume_url') || null,
            cover_note: readFormString(data, 'cover_note') || null,
            website: readFormString(data, 'website'),
          }),
        })
      } catch {
        setState({ status: 'error', message: 'Application could not be sent. Please try again shortly.' })
        return
      }

      let body: { message?: string } | null = null
      try {
        body = await response.json()
      } catch {
        body = null
      }

      if (!response.ok) {
        setState({
          status: 'error',
          message: body?.message || 'Application could not be sent. Please try again shortly.',
        })
        return
      }

      setState({ status: 'success', message: body?.message || 'Application sent.' })
      formRef.current?.reset()
    })
  }

  if (state.status === 'success') {
    return (
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Application sent</h2>
        <p className="text-gray-500 text-sm">{state.message}</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h2 className="text-navy font-semibold text-lg border-b pb-3">Apply for this role</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input id="name" name="name" type="text" autoComplete="name" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
        <input id="phone" name="phone" type="text" autoComplete="tel" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
      </div>

      <div>
        <label htmlFor="resume_url" className="block text-sm font-medium text-gray-700 mb-1">Resume link</label>
        <input id="resume_url" name="resume_url" type="text" placeholder="Drive, LinkedIn, or portfolio URL" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
      </div>

      <div>
        <label htmlFor="cover_note" className="block text-sm font-medium text-gray-700 mb-1">A couple sentences on why this role (optional)</label>
        <textarea id="cover_note" name="cover_note" rows={4} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
      </div>

      <p className="text-xs text-gray-400">
        Your application goes directly to the hiring operator. Harbourview does not screen applicants on their behalf.
      </p>

      {state.status === 'error' && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full py-3 text-base disabled:opacity-60">
        {isPending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
