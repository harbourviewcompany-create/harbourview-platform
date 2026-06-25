# Harbourview UI Migration & Enhancements - Implementation Guide

## 1. Create /components/ui/ Folder & Migrate Components

### Steps:
1. Copy the entire `components/ui/` folder from this migration into your repo's `components/ui/`.
2. Create or update `lib/utils.ts` with the `cn` utility:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

3. Install dependencies if not present:
```bash
npm install class-variance-authority clsx tailwind-merge
```

4. (Optional but recommended) Install Shadcn/ui primitives later for full Dialog, etc.:
```bash
npx shadcn@latest init
npx shadcn@latest add dialog table
```

### Usage Example:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Button variant="outline" size="sm">Click me</Button>
```

---

## 2. Add GlobeProvider + Suspense Boundaries

### Steps:
1. Copy `components/globe/GlobeProvider.tsx` into your repo.
2. Wrap your globe usage (likely in a page or layout that uses the globe) like this:

```tsx
import { GlobeProvider } from "@/components/globe/GlobeProvider"
import { Suspense } from "react"
import { HarbourviewSovereignPlateGlobe } from "@/components/globe/HarbourviewSovereignPlateGlobe" // your main globe component

export default function GlobePage() {
  return (
    <GlobeProvider>
      <Suspense fallback={<div className="h-[600px] flex items-center justify-center">Loading Globe...</div>}>
        <HarbourviewSovereignPlateGlobe />
      </Suspense>
    </GlobeProvider>
  )
}
```

3. Update any globe-related components to use the context:
```tsx
import { useGlobe } from "@/components/globe/GlobeProvider"

function CountrySelector() {
  const { selectedCountry, setSelectedCountry } = useGlobe()
  // ...
}
```

---

## 3. Introduce TanStack Query

### Steps:
1. Install the package:
```bash
npm install @tanstack/react-query
```

2. Copy `app/providers.tsx` into your project.
3. Wrap your root layout or a high-level layout with the Providers:

```tsx
// app/layout.tsx (or a client layout)
import { Providers } from "./providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

4. Use the example in `app/signals/page-with-tanstack-query.tsx` as a reference. Replace the fetch logic with your actual Supabase query.

### Recommended Query Pattern (with Supabase):
```ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

async function getSignals() {
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

const { data } = useQuery({
  queryKey: ['signals'],
  queryFn: getSignals,
})
```

---

## Next Recommended Steps
- Gradually replace existing card usages with the new `Card` component.
- Add more Shadcn primitives as needed.
- Add loading states and error boundaries.
- Consider adding `sonner` for nice toasts later.

These changes will significantly improve consistency, maintainability, and performance.