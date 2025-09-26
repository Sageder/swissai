"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

  const emergencyDataService = new EmergencyDataService()

  const loadAllData = async () => {
    try {
      console.log('🚀 Starting data loading...')
      setIsLoading(true)
      setError(null)

      // Try Firebase first, but fallback to static data if empty
      try {
        console.log('📡 Attempting to load from Firebase...')
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

        console.log('📊 Firebase data loaded:', {
          events: eventsData.length,
          monitoring: monitoringData.length,
          authorities: authoritiesData.length,
          resources: resourcesData.length,
          decisions: decisionsData.length
        })

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
              console.log('✅ Timeline events loaded from Firebase:', timelineData.length)
            } catch (err) {
              console.warn('Could not load timeline events from Firebase:', err)
            }
          }
        } else {
          console.log('⚠️ Firebase is empty, falling back to static data')
          await loadStaticData()
        }
      } catch (firebaseErr) {
        console.warn('❌ Firebase failed, using static data:', firebaseErr)
        await loadStaticData()
      }

    } catch (err) {
      console.error('❌ Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
      console.log('✅ Data loading completed')
    }
  }

  const loadStaticData = async () => {
    try {
      console.log('📁 Loading static data files...')
      
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

      console.log('📄 Parsing static data...')
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

      console.log('📊 Static data loaded:', {
        platformEvents: platformEventsData.length,
        resourceMovements: resourceMovementsData.length,
        activityLogs: activityLogsData.length,
        evacuees: evacueesData.length,
        timelineEvents: timelineEventsData.length,
        mainEvent: mainEventData.eventId,
        authorities: authoritiesData.length,
        resources: resourcesData.length,
        monitoring: monitoringData.length,
        decisions: decisionsData.length
      })

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

      console.log('✅ All static data loaded successfully!')

    } catch (err) {
      console.error('❌ Error loading static data:', err)
      // Don't set error for static data as it's not critical
    }
  }

  const refreshData = async () => {
    await loadAllData()
  }

  const getEventById = (eventId: string) => {
    return events.find(event => event.eventId === eventId)
  }

  const getTimelineEventsForTime = (currentTime: Date) => {
    return timelineEvents.filter(event => {
      const eventTime = new Date(event.timestamp)
      return eventTime <= currentTime
    })
  }

  const getPlatformEventsForTime = (currentTime: Date) => {
    return platformEvents.filter(event => {
      const eventTime = new Date(event.timestamp)
      return eventTime <= currentTime
    })
  }

  const getActivityLogsForTime = (currentTime: Date) => {
    return activityLogs.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime <= currentTime
    })
  }

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const value: DataContextType = {
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
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
