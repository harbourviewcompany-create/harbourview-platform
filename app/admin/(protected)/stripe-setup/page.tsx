import SetupForm from './SetupForm'

export default function StripeSetupPage() {
  return (
    <div className="min-h-screen bg-[#07111F] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C6A55A]/60 mb-2">Admin Setup</p>
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Activate Stripe Payments</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/50">
            Creates Intel Plus and Operator products in Stripe, then sets all env vars in Vercel automatically.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  )
}
