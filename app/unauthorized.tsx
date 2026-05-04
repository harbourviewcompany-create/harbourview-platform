export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-16 text-[#f5efe2]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c6a86b]">
          Admin access
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Admin sign-in required</h1>
        <p className="mt-4 text-base leading-7 text-[#d8d2c5]">
          Sign in with an authorized Harbourview admin or operator account to continue.
        </p>
      </div>
    </main>
  );
}
