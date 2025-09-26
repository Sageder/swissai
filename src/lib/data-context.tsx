"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import type {
  MonitoringStation,
  Authority,
  Resource
} from '@/types/emergency'

interface DataContextType {
  // Core data
  monitoringStations: MonitoringStation[]
  authorities: Authority[]
  resources: Resource[]
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [monitoringStations, setMonitoringStations] = useState<MonitoringStation[]>([])
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load only the three specified JSON files
      const [
        authoritiesResponse,
        resourcesResponse,
        monitoringResponse
      ] = await Promise.all([
        fetch('/data/blatten_simulation_authorities.json'),
        fetch('/data/blatten_simulation_expanded_resources.json'),
        fetch('/data/blatten_simulation_monitoring_stations.json')
      ])

      const [
        authoritiesData,
        resourcesData,
        monitoringData
      ] = await Promise.all([
        authoritiesResponse.json(),
        resourcesResponse.json(),
        monitoringResponse.json()
      ])

      // Set the data
      setAuthorities(authoritiesData)
      setResources(resourcesData)
      setMonitoringStations(monitoringData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Load data on mount only once
  useEffect(() => {
    loadData()
  }, [loadData]) // Only runs when loadData changes

  const value: DataContextType = useMemo(() => ({
    monitoringStations,
    authorities,
    resources,
    isLoading,
    error,
    refreshData
  }), [
    monitoringStations,
    authorities,
    resources,
    isLoading,
    error,
    refreshData
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
