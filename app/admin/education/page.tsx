import Link from 'next/link'

const adminRoutes = [
  '/admin/education/tracks',
  '/admin/education/modules',
  '/admin/education/articles',
  '/admin/education/reviews',
  '/admin/education/sources',
  '/admin/education/glossary',
  '/admin/education/requests',
  '/admin/education/countries',
  '/admin/education/audit',
]

export default function AdminEducationPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-slate-100">
      <h1 className="text-4xl font-semibold">Education Admin Console</h1>
      <p className="mt-4 text-slate-300">Foundation workflow surface for controlled publishing, review state handling and provenance operations.</p>
      <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {adminRoutes.map((route) => (
          <li key={route}>
            <Link className="block rounded border border-slate-700 p-4 hover:bg-slate-900" href={route}>
              {route}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
