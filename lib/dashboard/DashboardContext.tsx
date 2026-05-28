'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { defaultDashboardInitialState, type DashboardInitialState } from './globeRouteContext'

export type DashboardRole = 'commercial_operator' | 'medical_professional' | 'regulatory_legal'

export interface DashboardCtx {
  countryIso2: string
  countryName: string
  role: DashboardRole
  setCountry: (iso2: string, name: string) => void
  setRole: (role: DashboardRole) => void
}

const Ctx = createContext<DashboardCtx | null>(null)

export function DashboardProvider({ children, initialState = defaultDashboardInitialState }: { children: ReactNode; initialState?: DashboardInitialState }) {
  const [countryIso2, setCountryIso2] = useState(initialState.countryIso2)
  const [countryName, setCountryName] = useState(initialState.countryName)
  const [role, setRoleState] = useState<DashboardRole>(initialState.role)

  useEffect(() => {
    setCountryIso2(initialState.countryIso2)
    setCountryName(initialState.countryName)
    setRoleState(initialState.role)
  }, [initialState.countryIso2, initialState.countryName, initialState.role])

  function setCountry(iso2: string, name: string) {
    setCountryIso2(iso2)
    setCountryName(name)
  }
  function setRole(r: DashboardRole) { setRoleState(r) }

  return (
    <Ctx.Provider value={{ countryIso2, countryName, role, setCountry, setRole }}>
      {children}
    </Ctx.Provider>
  )
}

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
