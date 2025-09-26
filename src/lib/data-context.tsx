"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import type {
  MonitoringStation,
  Authority,
  Resource
} from '@/types/emergency'

// Vehicle movement types
export interface VehicleMovement {
  id: string;
  from: {
    lat: number;
    lng: number;
    name?: string;
  };
  to: {
    lat: number;
    lng: number;
    name?: string;
  };
  startTime: number;
  duration: number; // in milliseconds
  currentPosition: {
    lat: number;
    lng: number;
  };
  progress: number; // 0 to 1
  status: 'traveling' | 'arrived' | 'cancelled';
  vehicleType: 'ambulance' | 'fire_truck' | 'police' | 'helicopter' | 'evacuation_bus';
  route?: {
    coordinates: [number, number][]; // Route coordinates from Mapbox Directions API
    distance: number; // Total distance in meters
    duration: number; // Total duration in seconds
  };
}

interface DataContextType {
  // Core data
  monitoringStations: MonitoringStation[]
  authorities: Authority[]
  resources: Resource[]
  
  // Vehicle movements
  vehicleMovements: VehicleMovement[]
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshData: () => Promise<void>
  addVehicleMovement: (movement: Omit<VehicleMovement, 'id' | 'currentPosition' | 'progress' | 'status'>) => void
  updateVehicleMovement: (id: string, updates: Partial<VehicleMovement>) => void
  removeVehicleMovement: (id: string) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [monitoringStations, setMonitoringStations] = useState<MonitoringStation[]>([])
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [vehicleMovements, setVehicleMovements] = useState<VehicleMovement[]>([])
  
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

  // Vehicle movement functions
  const addVehicleMovement = useCallback((movement: Omit<VehicleMovement, 'id' | 'currentPosition' | 'progress' | 'status'>) => {
    const id = `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMovement: VehicleMovement = {
      ...movement,
      id,
      currentPosition: movement.from,
      progress: 0,
      status: 'traveling'
    }
    setVehicleMovements(prev => [...prev, newMovement])
  }, [])

  const updateVehicleMovement = useCallback((id: string, updates: Partial<VehicleMovement>) => {
    setVehicleMovements(prev => 
      prev.map(movement => 
        movement.id === id ? { ...movement, ...updates } : movement
      )
    )
  }, [])

  const removeVehicleMovement = useCallback((id: string) => {
    setVehicleMovements(prev => prev.filter(movement => movement.id !== id))
  }, [])

  // Load data on mount only once
  useEffect(() => {
    loadData()
  }, [loadData]) // Only runs when loadData changes

  const value: DataContextType = useMemo(() => ({
    monitoringStations,
    authorities,
    resources,
    vehicleMovements,
    isLoading,
    error,
    refreshData,
    addVehicleMovement,
    updateVehicleMovement,
    removeVehicleMovement
  }), [
    monitoringStations,
    authorities,
    resources,
    vehicleMovements,
    isLoading,
    error,
    refreshData,
    addVehicleMovement,
    updateVehicleMovement,
    removeVehicleMovement
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
