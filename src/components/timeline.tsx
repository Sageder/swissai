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
    monitoringStations,
    authorities,
    resources,
    isLoading 
  } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [baseTime] = useState(new Date('2025-05-17T06:23:00Z')); // Blatten simulation start time
  const timelineRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    // Timeline data state tracking
  }, [isLoading, monitoringStations.length, authorities.length, resources.length])

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
