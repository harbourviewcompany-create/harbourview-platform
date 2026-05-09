import { createGeneticsRoutingRecord } from '@/lib/introduction-routing/geneticsExecution'

export default function GeneticsRoutingAdminPage() {
  const sample = createGeneticsRoutingRecord({
    profileSlug: 'andes-origin',
    dropId: 'sierra',
    company: 'Sample Import Co',
    contactName: 'Test User',
    email: 'test@company.com',
    country: 'Germany',
    intent: 'territory_discussion',
    targetMarket: 'Germany',
    licenceStatus: 'licensed',
    targetUse: 'Commercial rollout',
    quantityOrScale: 'large',
    timeline: '2026',
    canShareInquiryWithGeneticsHolder: true,
  })

  return (
    <main className="p-6 text-sm">
      <h1 className="text-xl font-semibold">Genetics Routing Queue (V1)</h1>
      <pre className="mt-4 bg-black text-green-400 p-4 rounded">
        {JSON.stringify(sample, null, 2)}
      </pre>
    </main>
  )
}
