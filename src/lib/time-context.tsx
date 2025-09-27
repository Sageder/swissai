"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface TimeContextType {
  currentTime: Date
  timeOffset: number // Hours from current time (0-12)
  isRealTimeEnabled: boolean
  setTimeOffset: (offset: number) => void
  toggleRealTime: (enabled: boolean) => void
  getDisplayTime: () => Date
}

const TimeContext = createContext<TimeContextType | undefined>(undefined)

export function TimeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with Blatten simulation start time: 2025-05-17T06:23:00Z
  const [baseTime] = useState(new Date('2025-05-17T06:23:00Z'))
  const [timeOffset, setTimeOffset] = useState(0) // Hours offset from base time
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date('2025-05-17T06:23:00Z'))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoProgressionRef = useRef<NodeJS.Timeout | null>(null)

  // Update current time when real-time is enabled
  useEffect(() => {
    if (isRealTimeEnabled) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000) // Update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRealTimeEnabled])

  // Auto-progression: 60x speed (1 hour per minute) - always enabled
  useEffect(() => {
    // Reset time offset to 0 when component mounts
    setTimeOffset(0)
    
    autoProgressionRef.current = setInterval(() => {
      // Only auto-progress when real-time is disabled
      if (!isRealTimeEnabled) {
        setTimeOffset(prev => {
          const newOffset = prev + (1/60) // Add 1/60 hour (1 minute) per second = 1 hour per minute
          return newOffset > 12 ? 12 : newOffset // Cap at 12 hours
        })
      }
    }, 1000) // Update every second for smooth movement

    return () => {
      if (autoProgressionRef.current) {
        clearInterval(autoProgressionRef.current)
      }
    }
  }, [isRealTimeEnabled])

  const getDisplayTime = () => {
    const baseTimeToUse = isRealTimeEnabled ? currentTime : baseTime
    const offsetMs = timeOffset * 60 * 60 * 1000 // Convert hours to milliseconds
    return new Date(baseTimeToUse.getTime() + offsetMs)
  }

  const toggleRealTime = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled)
    if (!enabled) {
      // When disabling real-time, update base time to current time
      setCurrentTime(new Date())
    }
  }

  const value: TimeContextType = {
    currentTime,
    timeOffset,
    isRealTimeEnabled,
    setTimeOffset,
    toggleRealTime,
    getDisplayTime,
  }

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>
}

export function useTime() {
  const context = useContext(TimeContext)
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider')
  }
  return context
}
