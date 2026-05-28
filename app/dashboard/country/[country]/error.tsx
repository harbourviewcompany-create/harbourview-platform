'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) { return <button onClick={reset} className="m-4 border p-2">Retry country dashboard</button> }
