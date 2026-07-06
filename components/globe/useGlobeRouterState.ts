'use client'

import { useReducer } from 'react'
import type { GlobeRouterAction, GlobeRouterState } from '@/types/globe-router'

export const initialGlobeRouterState: GlobeRouterState = {
  step: 'country',
  mode: 'single_market',
  selectedCountryIso2s: [],
  roleSearchQuery: '',
  routeStatus: 'idle',
  activeLayerId: 'country_select',
}

export function globeRouterReducer(
  state: GlobeRouterState,
  action: GlobeRouterAction,
): GlobeRouterState {
  switch (action.type) {
    case 'COUNTRY_FOCUS':
      return { ...state, focusedCountryIso2: action.countryIso2 }
    case 'COUNTRY_SELECT':
    case 'COUNTRY_SEARCH_SELECT':
      return {
        ...state,
        step: 'market_overview',
        mode: 'single_market',
        selectedCountryIso2: action.countryIso2,
        selectedCountryIso2s: [action.countryIso2],
        selectedRoleId: undefined,
        selectedIntentId: undefined,
        roleSearchQuery: '',
        routeStatus: 'idle',
        inlineNotice: undefined,
      }
    case 'MARKET_ENTER':
      return {
        ...state,
        step: 'routing',
        routeStatus: 'resolving',
        // Honors a caller-supplied role (e.g. the session-remembered role
        // picker in GlobeSameScreenRouterLanding). Falls back to 'importer'
        // when no roleId is given, preserving prior behavior for any caller
        // that dispatches a bare MARKET_ENTER.
        selectedRoleId: action.roleId ?? 'importer',
      }
    case 'COUNTRY_CLEAR':
      return { ...initialGlobeRouterState }
    case 'MULTI_MARKET_ENABLE':
      return {
        ...state,
        step: 'market_overview',
        mode: 'multi_market',
        selectedCountryIso2s: state.selectedCountryIso2 ? [state.selectedCountryIso2] : state.selectedCountryIso2s,
        inlineNotice: undefined,
      }
    case 'MULTI_MARKET_ADD': {
      if (state.selectedCountryIso2s.includes(action.countryIso2)) return state
      if (state.selectedCountryIso2s.length >= 5) {
        return { ...state, inlineNotice: 'Maximum 5 markets selected' }
      }

      const selectedCountryIso2s = [...state.selectedCountryIso2s, action.countryIso2]

      return {
        ...state,
        mode: 'multi_market',
        step: 'market_overview',
        selectedCountryIso2s,
        selectedCountryIso2: action.countryIso2,
        inlineNotice: undefined,
      }
    }
    case 'MULTI_MARKET_REMOVE': {
      const selectedCountryIso2s = state.selectedCountryIso2s.filter(
        (countryIso2) => countryIso2 !== action.countryIso2,
      )

      return {
        ...state,
        selectedCountryIso2s,
        selectedCountryIso2: selectedCountryIso2s[0],
        mode: selectedCountryIso2s.length > 1 ? 'multi_market' : 'single_market',
        inlineNotice: undefined,
      }
    }
    case 'MULTI_MARKET_CONFIRM':
      return { ...state, step: 'market_overview', mode: 'multi_market', inlineNotice: undefined }
    case 'NOT_SURE_COUNTRY':
      // No country known — route immediately to intake via the fallback path
      return {
        ...state,
        step: 'routing',
        routeStatus: 'resolving',
        mode: 'not_sure',
        selectedCountryIso2: undefined,
        selectedCountryIso2s: [],
        selectedRoleId: 'not_sure',
        selectedIntentId: undefined,
      }
    case 'ROLE_SELECT':
    case 'ROLE_SEARCH_SELECT':
      // Role selection is the final user action — fire the resolver immediately
      return {
        ...state,
        step: 'routing',
        routeStatus: 'resolving',
        selectedRoleId: action.roleId,
        selectedIntentId: undefined,
        roleSearchQuery: '',
      }
    case 'ROLE_SEARCH_QUERY':
      return { ...state, roleSearchQuery: action.query }
    case 'NOT_SURE_ROLE':
      return {
        ...state,
        step: 'routing',
        routeStatus: 'resolving',
        selectedRoleId: 'not_sure',
        selectedIntentId: undefined,
      }
    // INTENT_SELECT and CONTINUE are kept for legacy compatibility but no longer
    // reachable from the primary flow (intent step removed).
    case 'INTENT_SELECT':
      return { ...state, selectedIntentId: action.intentId, routeStatus: 'idle' }
    case 'CONTINUE':
      return { ...state, step: 'routing', routeStatus: 'resolving' }
    case 'ROUTE_RESOLVED':
      return { ...state, routeStatus: 'resolved', resolvedHref: action.href }
    case 'ROUTE_MISSING':
      return {
        ...state,
        step: 'fallback',
        routeStatus: 'missing',
        resolvedHref: action.href,
        requestedPath: action.requestedPath,
      }
    case 'BACK':
      if (state.step === 'market_overview') {
        if (state.mode === 'multi_market') return { ...state, step: 'country', selectedRoleId: undefined, selectedCountryIso2: undefined }
        return { ...state, step: 'country', selectedRoleId: undefined, selectedCountryIso2: undefined, selectedCountryIso2s: [] }
      }
      if (state.step === 'role') return { ...state, step: 'market_overview', selectedRoleId: undefined }
      if (state.step === 'fallback' || state.step === 'routing') return { ...state, step: 'market_overview', routeStatus: 'idle' }
      return { ...initialGlobeRouterState }
    case 'ESCAPE':
      if (state.roleSearchQuery) return { ...state, roleSearchQuery: '' }
      if (state.step === 'market_overview') return { ...state, step: 'country', selectedCountryIso2: undefined, selectedCountryIso2s: [] }
      if (state.step !== 'country') return { ...state, step: 'country' }
      return { ...initialGlobeRouterState }
    case 'RESET':
      return { ...initialGlobeRouterState }
    default:
      return state
  }
}

export function useGlobeRouterState() {
  return useReducer(globeRouterReducer, initialGlobeRouterState)
}

