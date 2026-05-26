'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type DashboardRole = 'commercial_operator' | 'medical_professional' | 'regulatory_legal'

export interface DashboardCtx {
  countryIso2: string
  countryName: string
  role: DashboardRole
  setCountry: (iso2: string, name: string) => void
  setRole: (role: DashboardRole) => void
}

const Ctx = createContext<DashboardCtx | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [countryIso2, setCountryIso2] = useState('CA')
  const [countryName, setCountryName] = useState('Canada')
  const [role, setRoleState] = useState<DashboardRole>('commercial_operator')

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
