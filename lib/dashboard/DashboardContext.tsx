'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseDashboardGlobeRouteContext, type DashboardRole, type DashboardRouteContext } from './globeRouteContext'

export type { DashboardRole } from './globeRouteContext'

export interface DashboardCtx {
  countryIso2?: string
  countryName?: string
  role: DashboardRole
  setCountry: (iso2: string, name: string) => void
  routeContext?: DashboardRouteContext
  setRole: (role: DashboardRole) => void
}

const Ctx = createContext<DashboardCtx | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const searchParamSnapshot = searchParams.toString()
  const initialContext = useMemo(
    () => parseDashboardGlobeRouteContext(new URLSearchParams(searchParamSnapshot)),
    [searchParamSnapshot],
  )
  const [countryIso2, setCountryIso2] = useState<string | undefined>(initialContext.countryIso2)
  const [countryName, setCountryName] = useState<string | undefined>(initialContext.countryName)
  const [role, setRoleState] = useState<DashboardRole>(initialContext.role)
  const [routeContext, setRouteContext] = useState<DashboardRouteContext | undefined>(initialContext.source ? initialContext : undefined)

  useEffect(() => {
    if (!initialContext.source) return
    setCountryIso2(initialContext.countryIso2)
    setCountryName(initialContext.countryName)
    setRoleState(initialContext.role)
    setRouteContext(initialContext)
  }, [initialContext])

  function setCountry(iso2: string, name: string) {
    setCountryIso2(iso2)
    setCountryName(name)
    setRouteContext(undefined)
  }
  function setRole(r: DashboardRole) {
    setRoleState(r)
    setRouteContext((current) => current ? { ...current, role: r } : undefined)
  }

  return (
    <Ctx.Provider value={{ countryIso2, countryName, role, routeContext, setCountry, setRole }}>
      {children}
    </Ctx.Provider>
  )
}

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
