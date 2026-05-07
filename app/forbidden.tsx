export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-16 text-[#f5efe2]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c6a86b]">
          Admin access
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Admin access restricted</h1>
        <p className="mt-4 text-base leading-7 text-[#d8d2c5]">
          This account does not have the admin or operator role required for this route.
        </p>
      </div>
    </main>
  );
}
