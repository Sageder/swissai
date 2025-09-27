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
  status: 'traveling' | 'arrived';
  vehicleType: 'ambulance' | 'fire_truck' | 'police' | 'helicopter' | 'evacuation_bus';
  route?: {
    coordinates: [number, number][] | [number, number, number][]; // Route coordinates from Mapbox Directions API (2D or 3D)
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
  getVehiclesWithCurrentPositions: (currentTime: number) => VehicleMovement[]
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

  // Calculate vehicle position based on current time
  const calculateVehiclePosition = useCallback((movement: VehicleMovement, currentTime: number) => {
    // If time is before start time, stay at start position
    if (currentTime < movement.startTime) {
      return {
        position: movement.from,
        progress: 0,
        status: 'traveling' as const
      }
    }

    const elapsed = currentTime - movement.startTime
    const progress = Math.min(elapsed / movement.duration, 1)
    
    // If progress >= 1, stay at end position
    if (progress >= 1) {
      return {
        position: movement.to,
        progress: 1,
        status: 'arrived' as const
      }
    }

    // Calculate position based on route type with smooth interpolation
    let position: { lat: number; lng: number }
    
    if (movement.vehicleType === 'helicopter' && movement.route) {
      // Helicopter: move along 3D route coordinates with smooth interpolation
      const routeCoords = movement.route.coordinates as [number, number, number][]
      const totalDistance = movement.route.distance // Total distance in meters
      const currentDistance = progress * totalDistance // Current distance traveled
      
      // Find the current segment based on cumulative distance
      let cumulativeDistance = 0
      let currentSegmentIndex = 0
      
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const segmentDistance = calculateDistance3D(routeCoords[i], routeCoords[i + 1])
        if (cumulativeDistance + segmentDistance >= currentDistance) {
          currentSegmentIndex = i
          break
        }
        cumulativeDistance += segmentDistance
        currentSegmentIndex = i
      }
      
      if (currentSegmentIndex >= routeCoords.length - 1) {
        position = { lat: movement.to.lat, lng: movement.to.lng }
      } else {
        const currentPoint = routeCoords[currentSegmentIndex]
        const nextPoint = routeCoords[currentSegmentIndex + 1]
        const segmentDistance = calculateDistance3D(currentPoint, nextPoint)
        const segmentProgress = Math.max(0, (currentDistance - cumulativeDistance) / segmentDistance)
        
        position = {
          lat: currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress,
          lng: currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress
        }
      }
    } else if (movement.route && movement.route.coordinates.length > 0) {
      // Ground vehicle: move along 2D route coordinates with smooth interpolation
      const routeCoords = movement.route.coordinates as [number, number][]
      const totalDistance = movement.route.distance // Total distance in meters
      const currentDistance = progress * totalDistance // Current distance traveled
      
      // Find the current segment based on cumulative distance
      let cumulativeDistance = 0
      let currentSegmentIndex = 0
      
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const segmentDistance = calculateDistance2D(routeCoords[i], routeCoords[i + 1])
        if (cumulativeDistance + segmentDistance >= currentDistance) {
          currentSegmentIndex = i
          break
        }
        cumulativeDistance += segmentDistance
        currentSegmentIndex = i
      }
      
      if (currentSegmentIndex >= routeCoords.length - 1) {
        position = { lat: movement.to.lat, lng: movement.to.lng }
      } else {
        const currentPoint = routeCoords[currentSegmentIndex]
        const nextPoint = routeCoords[currentSegmentIndex + 1]
        const segmentDistance = calculateDistance2D(currentPoint, nextPoint)
        const segmentProgress = Math.max(0, (currentDistance - cumulativeDistance) / segmentDistance)
        
        position = {
          lat: currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress,
          lng: currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress
        }
      }
    } else {
      // Direct route (fallback) - smooth linear interpolation
      position = {
        lat: movement.from.lat + (movement.to.lat - movement.from.lat) * progress,
        lng: movement.from.lng + (movement.to.lng - movement.from.lng) * progress
      }
    }

    return {
      position,
      progress,
      status: 'traveling' as const
    }
  }, []) // Empty dependency array since this function doesn't depend on any external state

  // Helper function to calculate distance between 2D coordinates
  const calculateDistance2D = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180
    const dLng = (coord2[0] - coord1[0]) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Helper function to calculate distance between 3D coordinates (ignoring altitude)
  const calculateDistance3D = (coord1: [number, number, number], coord2: [number, number, number]): number => {
    return calculateDistance2D([coord1[0], coord1[1]], [coord2[0], coord2[1]])
  }

  // Get vehicles with current positions
  const getVehiclesWithCurrentPositions = useCallback((currentTime: number) => {
    return vehicleMovements.map(movement => {
      const { position, progress, status } = calculateVehiclePosition(movement, currentTime)
      return {
        ...movement,
        currentPosition: position,
        progress,
        status
      }
    })
  }, [vehicleMovements, calculateVehiclePosition])

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
    removeVehicleMovement,
    getVehiclesWithCurrentPositions
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
    removeVehicleMovement,
    getVehiclesWithCurrentPositions
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
