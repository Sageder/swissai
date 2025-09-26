"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { EmergencyDataService } from '@/services/emergency-data.service'
import type {
  EmergencyEvent,
  MonitoringStation,
  Authority,
  Resource,
  Evacuee,
  Decision,
  TimelineEvent,
  PlatformEvent,
  ResourceMovement,
  ActivityLog
} from '@/types/emergency'

interface DataContextType {
  // Core data
  events: EmergencyEvent[]
  monitoringStations: MonitoringStation[]
  authorities: Authority[]
  resources: Resource[]
  evacuees: Evacuee[]
  decisions: Decision[]
  timelineEvents: TimelineEvent[]
  platformEvents: PlatformEvent[]
  resourceMovements: ResourceMovement[]
  activityLogs: ActivityLog[]
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshData: () => Promise<void>
  getEventById: (eventId: string) => EmergencyEvent | undefined
  getTimelineEventsForTime: (currentTime: Date) => TimelineEvent[]
  getPlatformEventsForTime: (currentTime: Date) => PlatformEvent[]
  getActivityLogsForTime: (currentTime: Date) => ActivityLog[]
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EmergencyEvent[]>([])
  const [monitoringStations, setMonitoringStations] = useState<MonitoringStation[]>([])
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [evacuees, setEvacuees] = useState<Evacuee[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [platformEvents, setPlatformEvents] = useState<PlatformEvent[]>([])
  const [resourceMovements, setResourceMovements] = useState<ResourceMovement[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStaticData = useCallback(async () => {
    try {
      // Load static data files
      const [
        platformEventsResponse,
        resourceMovementsResponse,
        activityLogsResponse,
        evacueesResponse,
        timelineEventsResponse,
        mainEventResponse,
        authoritiesResponse,
        resourcesResponse,
        monitoringResponse,
        decisionsResponse
      ] = await Promise.all([
        fetch('/data/blatten_simulation_platform_events.json'),
        fetch('/data/blatten_simulation_resource_movements.json'),
        fetch('/data/blatten_simulation_activity_log.json'),
        fetch('/data/blatten_simulation_evacuees.json'),
        fetch('/data/blatten_simulation_timeline_events.json'),
        fetch('/data/blatten_simulation_main_event.json'),
        fetch('/data/blatten_simulation_authorities.json'),
        fetch('/data/blatten_simulation_expanded_resources.json'),
        fetch('/data/blatten_simulation_monitoring_stations.json'),
        fetch('/data/blatten_simulation_decision_log.json')
      ])

      const [
        platformEventsData,
        resourceMovementsData,
        activityLogsData,
        evacueesData,
        timelineEventsData,
        mainEventData,
        authoritiesData,
        resourcesData,
        monitoringData,
        decisionsData
      ] = await Promise.all([
        platformEventsResponse.json(),
        resourceMovementsResponse.json(),
        activityLogsResponse.json(),
        evacueesResponse.json(),
        timelineEventsResponse.json(),
        mainEventResponse.json(),
        authoritiesResponse.json(),
        resourcesResponse.json(),
        monitoringResponse.json(),
        decisionsResponse.json()
      ])

      // Set all the data
      setEvents([mainEventData])
      setPlatformEvents(platformEventsData)
      setResourceMovements(resourceMovementsData)
      setActivityLogs(activityLogsData)
      setEvacuees(evacueesData)
      setTimelineEvents(timelineEventsData)
      setAuthorities(authoritiesData)
      setResources(resourcesData)
      setMonitoringStations(monitoringData)
      setDecisions(decisionsData)

    } catch (err) {
      // Don't set error for static data as it's not critical
    }
  }, [])

  const loadAllData = useCallback(async () => {
    const emergencyDataService = new EmergencyDataService()
    try {
      setIsLoading(true)
      setError(null)

      // Try Firebase first, but fallback to static data if empty
      try {
        const [
          eventsData,
          monitoringData,
          authoritiesData,
          resourcesData,
          decisionsData
        ] = await Promise.all([
          emergencyDataService.getEvents(),
          emergencyDataService.getMonitoringStations(),
          emergencyDataService.getAuthorities(),
          emergencyDataService.getResources(),
          emergencyDataService.getDecisions()
        ])

        // Only use Firebase data if we actually got some
        if (eventsData.length > 0) {
          setEvents(eventsData)
          setMonitoringStations(monitoringData)
          setAuthorities(authoritiesData)
          setResources(resourcesData)
          setDecisions(decisionsData)

          // Load timeline events for the main event
          const mainEvent = eventsData.find(e => e.eventId === 'blatten-glacier-2025-05-28')
          if (mainEvent) {
            try {
              const timelineData = await emergencyDataService.getTimelineEvents(mainEvent.eventId)
              setTimelineEvents(timelineData)
            } catch (err) {
              // Silently fallback to static data
            }
          }
        } else {
          await loadStaticData()
        }
      } catch (firebaseErr) {
        await loadStaticData()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await loadAllData()
  }, [loadAllData])

  const getEventById = useCallback((eventId: string) => {
    return events.find(event => event.eventId === eventId)
  }, [events])

  const getTimelineEventsForTime = useCallback((currentTime: Date) => {
    return timelineEvents.filter(event => {
      const eventTime = new Date(event.timestamp)
      return eventTime <= currentTime
    })
  }, [timelineEvents])

  const getPlatformEventsForTime = useCallback((currentTime: Date) => {
    return platformEvents.filter(event => {
      const eventTime = new Date(event.timestamp)
      return eventTime <= currentTime
    })
  }, [platformEvents])

  const getActivityLogsForTime = useCallback((currentTime: Date) => {
    return activityLogs.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime <= currentTime
    })
  }, [activityLogs])

  // Load data on mount only once
  useEffect(() => {
    loadAllData()
  }, [loadAllData]) // Only runs when loadAllData changes

  const value: DataContextType = useMemo(() => ({
    events,
    monitoringStations,
    authorities,
    resources,
    evacuees,
    decisions,
    timelineEvents,
    platformEvents,
    resourceMovements,
    activityLogs,
    isLoading,
    error,
    refreshData,
    getEventById,
    getTimelineEventsForTime,
    getPlatformEventsForTime,
    getActivityLogsForTime
  }), [
    events,
    monitoringStations,
    authorities,
    resources,
    evacuees,
    decisions,
    timelineEvents,
    platformEvents,
    resourceMovements,
    activityLogs,
    isLoading,
    error,
    refreshData,
    getEventById,
    getTimelineEventsForTime,
    getPlatformEventsForTime,
    getActivityLogsForTime
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
