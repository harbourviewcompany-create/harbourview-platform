import { requestSupportDisclaimer } from '@/lib/compliance/disclaimers'

export default function ComplianceRequestSupportPage() {
  return (
    <div className="page-container py-12 space-y-6">
      <h1 className="text-2xl font-bold text-navy">Request Compliance Support</h1>
      <p className="text-gray-700 max-w-2xl">
        Submit a structured request so Harbourview can assess your compliance requirements and determine whether specialist routing is appropriate.
      </p>

      <form className="grid gap-4 max-w-xl" aria-label="Compliance support intake form">
        <input className="input" name="name" autoComplete="name" placeholder="Name" required />
        <input className="input" name="company" autoComplete="organization" placeholder="Company" required />
        <input className="input" type="email" name="email" autoComplete="email" placeholder="Email" required />
        <input className="input" name="targetCountries" placeholder="Target Countries" required />
        <textarea className="input" name="supportNeeded" placeholder="Support needed" rows={5} required />
        <label className="text-sm">
          <input type="checkbox" name="disclaimerAccepted" required /> I accept the compliance disclaimer
        </label>
        <button className="btn-primary" disabled>
          Submit (intake not yet active)
        </button>
      </form>

      <p className="text-sm text-gray-600">{requestSupportDisclaimer}</p>
    </div>
  )
}
