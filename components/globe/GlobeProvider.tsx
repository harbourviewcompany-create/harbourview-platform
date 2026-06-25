"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface GlobeContextType {
  selectedCountry: string | null
  setSelectedCountry: (country: string | null) => void
  filters: Record<string, any>
  setFilters: (filters: Record<string, any>) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const GlobeContext = createContext<GlobeContextType | undefined>(undefined)

export function GlobeProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)

  return (
    <GlobeContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        filters,
        setFilters,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </GlobeContext.Provider>
  )
}

export function useGlobe() {
  const context = useContext(GlobeContext)
  if (context === undefined) {
    throw new Error('useGlobe must be used within a GlobeProvider')
  }
  return context
}