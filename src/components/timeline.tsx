"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTime } from "@/lib/time-context";
import { isTimelineVisible, onTimelineVisibilityChange } from "@/lib/util";

interface TimelineProps {
  className?: string;
}

export function Timeline({ className = "" }: TimelineProps) {
  const { timeOffset, setTimeOffset, getDisplayTime, isRealTimeEnabled } = useTime();
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Listen for timeline visibility changes
  useEffect(() => {
    const unsubscribe = onTimelineVisibilityChange(() => {
      setIsVisible(isTimelineVisible());
    });
    
    // Set initial visibility
    setIsVisible(isTimelineVisible());
    
    return unsubscribe;
  }, []);


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

  // Generate hour markers - each marker shows relative time offset
  const hourMarkers = Array.from({ length: 13 }, (_, i) => {
    const hour = i;
    const position = (hour / 12) * 100;

    return {
      hour,
      position,
      relativeLabel: hour === 0 ? "Now" : `+${hour}h`,
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

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`timeline-container select-none ${className}`}>
      {/* Current Time Display */}
      <div className="mb-3 text-center">
        <div className="text-xs text-gray-400 mb-1">Current Time</div>
        <div className="text-base font-mono text-white">
          {formatTime(getDisplayTime())}
        </div>
        <div className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Auto-progression active (1h/min)
        </div>
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
                  {marker.relativeLabel}
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
          className={`absolute w-5 h-5 bg-green-500 rounded-full shadow-lg cursor-grab select-none transition-transform duration-150 z-10 ${
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
          <div className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-50" />
        </div>
      </div>
    </div>
  );
}
