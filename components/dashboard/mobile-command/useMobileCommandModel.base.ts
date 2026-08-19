'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { JOB_LISTINGS } from '../data/jobsBoard'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import type { RoleId } from '@/types/globe-router'
import type { MobileCommandCentreProps } from './props'
import {
  PAGE_TO_SECTION,
  SECTION_GROUPS,
  SECTION_TO_GROUP,
  SECTION_TO_DESKTOP_PAGE,
  MOBILE_COMMAND_COPY,
  NON_SUPPLY_VIEWS,
  asRecord,
  confidenceFractionToPercent,
  formatMetricValue,
  formatStatus,
  matchesQuery,
  normalizeListing,
  parseMobileCommandTool,
  readString,
  titleCase,
  type MobileCommandTool,
  type NormalizedListing,
  type SectionId,
  type PrimarySectionId,
  type NextAction,
  type DirectoryRecord,
  type SubmissionRecord,
} from './contracts'
import type { MarketView } from '../CommandCentre'

// NOTE: This file was truncated in a prior push error recovery path.
// Re-fetch full original from main and re-apply only openTool/closeTool patches.
// Temporary minimal stub would break production — do not ship.
export function useMobileCommandModel(_props: MobileCommandCentreProps): never {
  throw new Error('useMobileCommandModel.base was corrupted during patch; restore from main')
}
