/**
 * Utility functions for controlling the application state
 * These functions can be called by AI models or other parts of the application
 */

import { MonitoringStation, Authority, Resource } from '@/types/emergency';

// Global state for controlling UI elements
let showTimelineFlag = false;
let showPOIFlag = false;
let currentPOIs: any[] = [];

// Callbacks for notifying components of state changes
const timelineCallbacks: (() => void)[] = [];
const poiCallbacks: (() => void)[] = [];

/**
 * Show the timeline component
 */
export function showTimeline(): void {
  showTimelineFlag = true;
  timelineCallbacks.forEach(callback => callback());
  console.log('Timeline is now visible');
}

/**
 * Hide the timeline component
 */
export function hideTimeline(): void {
  showTimelineFlag = false;
  timelineCallbacks.forEach(callback => callback());
  console.log('Timeline is now hidden');
}

/**
 * Check if timeline should be shown
 */
export function isTimelineVisible(): boolean {
  return showTimelineFlag;
}

/**
 * Add all monitoring sources to POI display
 */
export function addMonitoringSources(monitoringStations: MonitoringStation[]): void {
  const monitoringPOIs = monitoringStations.map(station => ({
    id: `monitoring-${station.sensorId}`,
    type: 'monitoring',
    name: station.name,
    location: station.location,
    data: station,
    icon: '📡',
    color: '#3b82f6'
  }));
  
  currentPOIs = [...currentPOIs, ...monitoringPOIs];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Added ${monitoringPOIs.length} monitoring sources to POI display`);
}

/**
 * Add all resources to POI display
 */
export function addResources(resources: Resource[]): void {
  const resourcePOIs = resources.map(resource => ({
    id: `resource-${resource.resourceId}`,
    type: 'resource',
    name: resource.location.name,
    location: resource.location,
    data: resource,
    icon: '🚁',
    color: resource.status === 'active' ? '#10b981' : '#6b7280'
  }));
  
  currentPOIs = [...currentPOIs, ...resourcePOIs];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Added ${resourcePOIs.length} resources to POI display`);
}

/**
 * Add all authorities to POI display
 */
export function addAuthorities(authorities: Authority[]): void {
  const authorityPOIs = authorities.map(authority => ({
    id: `authority-${authority.authorityId}`,
    type: 'authority',
    name: authority.name,
    location: authority.location,
    data: authority,
    icon: '🏛️',
    color: authority.currentStatus === 'active' ? '#f59e0b' : '#6b7280'
  }));
  
  currentPOIs = [...currentPOIs, ...authorityPOIs];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Added ${authorityPOIs.length} authorities to POI display`);
}

/**
 * Only show selected resources, remove all other POIs
 */
export function onlyShowSelectedResources(resources: Resource[]): void {
  const resourcePOIs = resources.map(resource => ({
    id: `resource-${resource.resourceId}`,
    type: 'resource',
    name: resource.location.name,
    location: resource.location,
    data: resource,
    icon: '🚁',
    color: resource.status === 'active' ? '#10b981' : '#6b7280'
  }));
  
  currentPOIs = resourcePOIs;
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Showing only ${resourcePOIs.length} selected resources`);
}

/**
 * Clear all POIs
 */
export function clearAllPOIs(): void {
  currentPOIs = [];
  showPOIFlag = false;
  poiCallbacks.forEach(callback => callback());
  console.log('All POIs cleared');
}

/**
 * Check if POIs should be shown
 */
export function shouldShowPOIs(): boolean {
  return showPOIFlag && currentPOIs.length > 0;
}

/**
 * Get current POIs
 */
export function getCurrentPOIs(): any[] {
  return currentPOIs;
}

/**
 * Subscribe to timeline visibility changes
 */
export function onTimelineVisibilityChange(callback: () => void): () => void {
  timelineCallbacks.push(callback);
  return () => {
    const index = timelineCallbacks.indexOf(callback);
    if (index > -1) {
      timelineCallbacks.splice(index, 1);
    }
  };
}

/**
 * Subscribe to POI visibility changes
 */
export function onPOIVisibilityChange(callback: () => void): () => void {
  poiCallbacks.push(callback);
  return () => {
    const index = poiCallbacks.indexOf(callback);
    if (index > -1) {
      poiCallbacks.splice(index, 1);
    }
  };
}

/**
 * Get current state summary
 */
export function getStateSummary(): {
  timelineVisible: boolean;
  poisVisible: boolean;
  poiCount: number;
} {
  return {
    timelineVisible: showTimelineFlag,
    poisVisible: showPOIFlag,
    poiCount: currentPOIs.length
  };
}
