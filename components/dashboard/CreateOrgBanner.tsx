import Link from 'next/link'

export default function CreateOrgBanner() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#C6A55A]/30 bg-[#C6A55A]/8 p-5 text-sm text-[#F5F1E8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[#C6A55A]">No organization yet.</span>{' '}
          Create one to start Passport verification, add licenses, and unlock counterparty
          features.
        </div>
        <Link
          href="/dashboard/org/new"
          className="shrink-0 rounded-full bg-[#C6A55A] px-5 py-2.5 text-xs font-semibold text-[#0B1A2F] hover:opacity-90"
        >
          Create Organization
        </Link>
      </div>
    </div>
  )
}
