export function EducationRouteShell({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-3">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p>{description}</p>
      <p className="text-sm">Educational content only. Not medical, legal, or prescribing advice.</p>
    </main>
  )
}
