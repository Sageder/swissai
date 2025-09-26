"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTime } from "@/lib/time-context";
import { useData } from "@/lib/data-context";
import { motion } from "framer-motion";

interface TimelineProps {
  className?: string;
}

export function Timeline({ className = "" }: TimelineProps) {
  const { timeOffset, setTimeOffset, getDisplayTime, isRealTimeEnabled, currentTime } = useTime();
  const { 
    timelineEvents, 
    platformEvents, 
    activityLogs, 
    isLoading 
  } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [baseTime] = useState(new Date('2025-05-17T06:23:00Z')); // Blatten simulation start time
  const timelineRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    // Timeline data state tracking
  }, [isLoading, timelineEvents.length, platformEvents.length, activityLogs.length])

  // Convert time offset (0-12 hours) to position percentage (0-100%)
  const getSliderPosition = () => {
    return (timeOffset / 12) * 100;
  };

  // Convert position percentage to time offset
  const getTimeOffsetFromPosition = (positionPercent: number) => {
    return Math.max(0, Math.min(12, (positionPercent / 100) * 12));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateTimeFromMousePosition(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateTimeFromMousePosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateTimeFromMousePosition = (e: MouseEvent | React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const positionPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newTimeOffset = getTimeOffsetFromPosition(positionPercent);
    setTimeOffset(newTimeOffset);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    // Always update position when clicking anywhere on the timeline
    updateTimeFromMousePosition(e);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // Generate hour markers - each marker shows what time would be displayed if slider was at that position
  const hourMarkers = Array.from({ length: 13 }, (_, i) => {
    const hour = i;
    const position = (hour / 12) * 100;
    // Calculate what getDisplayTime() would return if timeOffset was set to this hour value
    const baseTimeToUse = isRealTimeEnabled ? currentTime : baseTime;
    const markerTime = new Date(baseTimeToUse.getTime() + hour * 60 * 60 * 1000);
    const displayHour = markerTime.getHours();

    return {
      hour,
      position,
      displayHour,
      isCurrentHour: Math.abs(timeOffset - hour) < 0.1,
    };
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Helper function to get time at any offset (for debugging alignment)
  const getTimeAtOffset = (offsetHours: number) => {
    const baseTimeToUse = isRealTimeEnabled ? currentTime : baseTime;
    return new Date(baseTimeToUse.getTime() + offsetHours * 60 * 60 * 1000);
  };

  // Get all events that should be visible on the timeline
  const getAllEventsForTimeline = () => {
    const currentDisplayTime = getDisplayTime()
    const allEvents: Array<{
      type: 'timeline' | 'platform' | 'activity'
      time: Date
      [key: string]: any
    }> = []

    // Get events for timeline

    // Add timeline events
    timelineEvents.forEach(event => {
      const eventTime = new Date(event.timestamp)
      if (eventTime <= currentDisplayTime) {
        allEvents.push({
          ...event,
          type: 'timeline',
          time: eventTime
        })
      }
    })

    // Add platform events
    platformEvents.forEach(event => {
      const eventTime = new Date(event.timestamp)
      if (eventTime <= currentDisplayTime) {
        allEvents.push({
          ...event,
          type: 'platform',
          time: eventTime
        })
      }
    })

    // Add activity logs
    activityLogs.forEach(log => {
      const logTime = new Date(log.timestamp)
      if (logTime <= currentDisplayTime) {
        allEvents.push({
          ...log,
          type: 'activity',
          time: logTime
        })
      }
    })

    // Sort by timestamp
    return allEvents.sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  // Get event position on timeline (0-100%)
  const getEventPosition = (eventTime: Date) => {
    const startTime = baseTime.getTime()
    const endTime = startTime + (12 * 60 * 60 * 1000) // 12 hours from start
    const eventTimeMs = eventTime.getTime()
    
    if (eventTimeMs < startTime) return 0
    if (eventTimeMs > endTime) return 100
    
    return ((eventTimeMs - startTime) / (endTime - startTime)) * 100
  }

  return (
    <div className={`timeline-container select-none ${className}`}>
      {/* Current Time Display */}
      <div className="mb-3 text-center">
        <div className="text-xs text-gray-400 mb-1">Current Time</div>
        <div className="text-base font-mono text-white">
          {formatTime(getDisplayTime())}
        </div>
        {isLoading && (
          <div className="text-xs text-blue-400 mt-1">
            Loading simulation data...
          </div>
        )}
      </div>

      {/* Timeline Track */}
      <div
        ref={timelineRef}
        className="relative w-full h-8 cursor-pointer timeline-track select-none"
        onClick={handleTimelineClick}
      >
        {/* Base Timeline Track */}
        <div className="absolute inset-0 bg-gray-700 rounded-full shadow-inner">
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, #C7E9FF 20%, #6CABEB 100%)",
            }}
          />

          {/* Hour Markers */}
          {hourMarkers.map((marker) => (
            <div
              key={marker.hour}
              className="absolute top-0 bottom-0 flex flex-col justify-center"
              style={{ left: `${marker.position}%` }}
            >
              {/* Hour Line */}
              <div
                className={`w-px h-full ${
                  marker.hour % 3 === 0 ? "bg-white/60" : "bg-white/30"
                }`}
                style={{ marginLeft: "-0.5px" }}
              />

              {/* Hour Label */}
              {marker.hour % 3 === 0 && (
                <div
                  className="absolute top-full mt-1 text-xs text-gray-300 font-mono select-none"
                  style={{
                    left: "50%",
                    transform: "translateX(-50%)",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {marker.displayHour.toString().padStart(2, "0")}:00
                </div>
              )}
            </div>
          ))}

          {/* Event Markers */}
          {!isLoading && getAllEventsForTimeline().map((event, index) => {
            const position = getEventPosition(event.time)
            const getEventColor = () => {
              switch (event.type) {
                case 'timeline':
                  return event.severity === 'critical' ? '#ef4444' : 
                         event.severity === 'alert' ? '#f59e0b' : '#3b82f6'
                case 'platform':
                  return '#8b5cf6'
                case 'activity':
                  return event.severity === 'critical' ? '#dc2626' :
                         event.severity === 'warning' ? '#d97706' : '#059669'
                default:
                  return '#6b7280'
              }
            }

            return (
              <div
                key={`${event.type}-${index}`}
                className="absolute top-0 bottom-0 flex flex-col justify-center"
                style={{ left: `${position}%` }}
              >
                {/* Event Marker */}
                <div
                  className="w-2 h-2 rounded-full shadow-lg border border-white/20"
                  style={{ 
                    backgroundColor: getEventColor(),
                    marginLeft: "-4px"
                  }}
                />
                
                {/* Event Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap max-w-xs">
                    <div className="font-semibold">
                      {event.type === 'timeline' ? event.description :
                       event.type === 'platform' ? event.title :
                       event.title}
                    </div>
                    <div className="text-gray-300">
                      {formatTime(event.time)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress Fill */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-blue-700/40 rounded-l-full transition-all duration-150"
          style={{ width: `${getSliderPosition()}%` }}
        />

        {/* Time Slider */}
        <div
          ref={sliderRef}
          className={`absolute w-5 h-5 bg-blue-500 rounded-full shadow-lg cursor-grab select-none transition-transform duration-150 z-10 ${
            isDragging ? "cursor-grabbing scale-110" : "hover:scale-105"
          }`}
          style={{
            left: `${getSliderPosition()}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Inner Dot */}
          <div className="absolute inset-1 bg-white rounded-full" />

          {/* Glow Effect */}
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm opacity-50" />
        </div>
      </div>
    </div>
  );
}
