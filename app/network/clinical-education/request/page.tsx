import { ClinicalEducationDisclaimer } from '@/components/clinical-education/ClinicalEducationComponents'

export default function ClinicalEducationRequestPage() {
  return (
    <section className="bg-white py-16">
      <div className="page-container max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">Harbourview Network / Clinical Education</p>
        <h1 className="text-3xl font-bold text-navy">Request Education Support</h1>
        <p className="mt-4 text-gray-500">
          Submit a professional education request related to product formats, country readiness, documentation or professional education support.
        </p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>Name</li>
            <li>Email</li>
            <li>Organization</li>
            <li>Professional category</li>
            <li>Country</li>
            <li>Topic of interest</li>
            <li>Countries of interest</li>
            <li>Formats of interest</li>
          </ul>
        </div>

        <div className="mt-8">
          <ClinicalEducationDisclaimer type="patient-boundary" />
        </div>
      </div>
    </section>
  )
}
