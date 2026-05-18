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
        step: 'role',
        mode: 'single_market',
        selectedCountryIso2: action.countryIso2,
        selectedCountryIso2s: [action.countryIso2],
        selectedRoleId: undefined,
        selectedIntentId: undefined,
        roleSearchQuery: '',
        routeStatus: 'idle',
        inlineNotice: undefined,
      }
    case 'COUNTRY_CLEAR':
      return { ...initialGlobeRouterState }
    case 'MULTI_MARKET_ENABLE':
      return {
        ...state,
        step: 'role',
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
        step: 'role',
        selectedCountryIso2s,
        selectedCountryIso2: selectedCountryIso2s[0],
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
      return { ...state, step: 'role', mode: 'multi_market', inlineNotice: undefined }
    case 'NOT_SURE_COUNTRY':
      return {
        ...state,
        step: 'intent',
        mode: 'not_sure',
        selectedCountryIso2: undefined,
        selectedCountryIso2s: [],
        selectedRoleId: 'not_sure',
        selectedIntentId: undefined,
        routeStatus: 'idle',
      }
    case 'ROLE_SELECT':
    case 'ROLE_SEARCH_SELECT':
      return {
        ...state,
        step: 'intent',
        selectedRoleId: action.roleId,
        selectedIntentId: undefined,
        roleSearchQuery: '',
        routeStatus: 'idle',
      }
    case 'ROLE_SEARCH_QUERY':
      return { ...state, roleSearchQuery: action.query }
    case 'NOT_SURE_ROLE':
      return { ...state, step: 'intent', selectedRoleId: 'not_sure', selectedIntentId: undefined }
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
      if (state.step === 'intent') {
        if (state.mode === 'not_sure') return { ...initialGlobeRouterState }
        return { ...state, step: 'role', selectedIntentId: undefined }
      }
      if (state.step === 'role') return { ...state, step: 'country', selectedRoleId: undefined }
      if (state.step === 'fallback' || state.step === 'routing') return { ...state, step: 'intent', routeStatus: 'idle' }
      return { ...initialGlobeRouterState }
    case 'ESCAPE':
      if (state.roleSearchQuery) return { ...state, roleSearchQuery: '' }
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
