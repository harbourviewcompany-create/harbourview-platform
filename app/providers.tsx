"use client"

import { ReactNode } from 'react'

// Placeholder — @tanstack/react-query not yet installed.
// When adding it: npm install @tanstack/react-query, restore QueryClientProvider wrapper.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
    },
  }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
