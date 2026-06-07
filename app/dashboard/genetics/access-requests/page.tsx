import { getInternalCultivarPassports } from '@/lib/genetics/demoData'

export default function GeneticsAccessRequestsPage() {
  const requests = getInternalCultivarPassports().flatMap((passport) => passport.accessRequests.map((request) => ({ ...request, cultivar: passport.displayName })))
  return <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10"><section className="mx-auto max-w-5xl space-y-4"><h1 className="text-3xl font-semibold">Access requests</h1>{requests.map((request) => <div key={request.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"><p className="text-sm font-semibold">{request.cultivar} · {request.request_type.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-[#F5F1E8]/55">{request.status.replace(/_/g, ' ')} · NDA: {request.requires_nda ? 'required' : 'not required'} · licence review: {request.requires_licence_review ? 'required' : 'not required'}</p></div>)}</section></main>
}
