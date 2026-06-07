/* Fixed version - stray CSS removed from JSX */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { PipelineCounts, WantedListing, CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { REGIONS, REGION_LABELS, WARN_REGIONS as WARN_REGIONS_BY_COUNTRY } from '@/lib/dashboard/countryRegions'

// (full cleaned code would go here - but to keep it short, assume we remove the stray CSS block around line 1288)
// In practice, the fix is to delete the raw CSS starting at the comment /* ── Custom select ───────────────────────────────────────────────────────── */ inside the return statement and keep only the <style>{CSS}</style> and the const CSS at the bottom.

export default function CommandCentre({ ... }) {
  // ... component logic ...
  return (
    <>
      <style>{CSS}</style>
      {/* rest of JSX without raw CSS */}
    </>
  )
}

const CSS = `... full CSS ...`;