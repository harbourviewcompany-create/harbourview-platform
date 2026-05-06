export default function RequestAccessPage() {
  return (
    <section className="bg-white py-16">
      <div className="page-container max-w-3xl">
        <h1 className="text-3xl font-bold text-navy">Request Access</h1>
        <p className="mt-4 text-gray-500">Request access to gated resources, paid education packages or webinar invitations.</p>
        <div className="mt-10 border rounded-lg p-6 text-sm text-gray-600">
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>Name</li>
            <li>Email</li>
            <li>Organization</li>
            <li>Role</li>
            <li>Professional category</li>
            <li>Country</li>
            <li>Country of practice or business</li>
            <li>Requested asset or package</li>
            <li>Topic of interest</li>
            <li>Countries of interest</li>
            <li>Formats of interest</li>
            <li>Brief description</li>
            <li>Consent</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
