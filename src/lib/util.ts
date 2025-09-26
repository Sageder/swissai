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
    id: station.sensorId,
    title: station.location.name || `${station.sensorType} Sensor - ${station.sensorId}`,
    description: `${station.sensorType.replace('_', ' ')} sensor - Battery: ${station.batteryStatus}% - ${station.responsibleOrganization}`,
    type: 'sensor' as const,
    severity: station.connectivity === 'online' ? 'low' as const : 'high' as const,
    metadata: {
      coordinates: {
        lat: station.location.lat,
        long: station.location.lng
      }
    },
    contact: station.location.address || undefined,
    status: station.connectivity === 'online' ? 'active' as const : 'inactive' as const
  }));

  // Remove existing monitoring POIs and add new ones
  currentPOIs = currentPOIs.filter(poi => poi.type !== 'sensor');
  currentPOIs = [...currentPOIs, ...monitoringPOIs];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Added ${monitoringPOIs.length} monitoring sources to POI display`);
}

/**
 * Add all resources to POI display
 */
export function addResources(resources: Resource[]): void {
  const resourcePOIs = resources.map(resource => {
    // Map resource type to POI type
    const getPOIType = (resourceType: Resource['type']): 'hospital' | 'helicopter' | 'fire_station' | 'shelter' | 'infrastructure' | 'other' => {
      switch (resourceType) {
        case 'hospital':
        case 'medical_center':
          return 'hospital'
        case 'helicopter':
          return 'helicopter'
        case 'fire_station':
          return 'fire_station'
        case 'emergency_shelter':
          return 'shelter'
        case 'power_grid':
        case 'water_system':
        case 'communication':
          return 'infrastructure'
        default:
          return 'other'
      }
    }

    // Map resource status to severity
    const getSeverity = (status: Resource['status']): 'high' | 'medium' | 'low' => {
      switch (status) {
        case 'deployed':
        case 'emergency_mode':
          return 'high'
        case 'activated':
        case 'en_route':
          return 'medium'
        case 'available':
        case 'standby':
        case 'normal_operations':
        case 'operational':
          return 'low'
        default:
          return 'low'
      }
    }

    return {
      id: resource.resourceId,
      title: resource.location.name || `${resource.type} - ${resource.resourceId}`,
      description: `${resource.type} resource - Status: ${resource.status}${resource.personnel ? ` - Personnel: ${resource.personnel}` : ''}${resource.currentAssignment ? ` - Assignment: ${resource.currentAssignment}` : ''}`,
      type: getPOIType(resource.type),
      severity: getSeverity(resource.status),
      metadata: {
        coordinates: {
          lat: resource.location.lat,
          long: resource.location.lng
        }
      },
      contact: resource.location.address || undefined,
      status: resource.status === 'available' || resource.status === 'operational' ? 'active' as const :
        resource.status === 'deployed' || resource.status === 'emergency_mode' ? 'active' as const : 'inactive' as const
    }
  });

  // Remove existing resource POIs and add new ones
  currentPOIs = currentPOIs.filter(poi => !['hospital', 'helicopter', 'fire_station', 'shelter', 'infrastructure', 'other'].includes(poi.type));
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
    id: authority.authorityId,
    title: authority.name,
    description: `${authority.type} - Level: ${authority.level} - Status: ${authority.currentStatus} - Jurisdiction: ${authority.jurisdiction}`,
    type: 'emergency' as const,
    severity: authority.currentStatus === 'activated' || authority.currentStatus === 'deployed' ? 'high' as const :
      authority.currentStatus === 'coordinating' ? 'medium' as const : 'low' as const,
    metadata: {
      coordinates: {
        lat: authority.headquarters?.lat || 46.5197,
        long: authority.headquarters?.lng || 7.8725
      }
    },
    contact: authority.contact?.phone || undefined,
    status: authority.currentStatus === 'activated' || authority.currentStatus === 'deployed' ? 'active' as const : 'inactive' as const
  }));

  // Remove existing authority POIs and add new ones
  currentPOIs = currentPOIs.filter(poi => poi.type !== 'emergency');
  currentPOIs = [...currentPOIs, ...authorityPOIs];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Added ${authorityPOIs.length} authorities to POI display`);
}

/**
 * Only show selected resources, remove all other POIs
 */
export function onlyShowSelectedResources(resources: Resource[]): void {
  // Use the same logic as addResources but replace all POIs
  const resourcePOIs = resources.map(resource => {
    // Map resource type to POI type
    const getPOIType = (resourceType: Resource['type']): 'hospital' | 'helicopter' | 'fire_station' | 'shelter' | 'infrastructure' | 'other' => {
      switch (resourceType) {
        case 'hospital':
        case 'medical_center':
          return 'hospital'
        case 'helicopter':
          return 'helicopter'
        case 'fire_station':
          return 'fire_station'
        case 'emergency_shelter':
          return 'shelter'
        case 'power_grid':
        case 'water_system':
        case 'communication':
          return 'infrastructure'
        default:
          return 'other'
      }
    }

    // Map resource status to severity
    const getSeverity = (status: Resource['status']): 'high' | 'medium' | 'low' => {
      switch (status) {
        case 'deployed':
        case 'emergency_mode':
          return 'high'
        case 'activated':
        case 'en_route':
          return 'medium'
        case 'available':
        case 'standby':
        case 'normal_operations':
        case 'operational':
          return 'low'
        default:
          return 'low'
      }
    }

    return {
      id: resource.resourceId,
      title: resource.location.name || `${resource.type} - ${resource.resourceId}`,
      description: `${resource.type} resource - Status: ${resource.status}${resource.personnel ? ` - Personnel: ${resource.personnel}` : ''}${resource.currentAssignment ? ` - Assignment: ${resource.currentAssignment}` : ''}`,
      type: getPOIType(resource.type),
      severity: getSeverity(resource.status),
      metadata: {
        coordinates: {
          lat: resource.location.lat,
          long: resource.location.lng
        }
      },
      contact: resource.location.address || undefined,
      status: resource.status === 'available' || resource.status === 'operational' ? 'active' as const :
        resource.status === 'deployed' || resource.status === 'emergency_mode' ? 'active' as const : 'inactive' as const
    }
  });

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
 * Add all types of POIs at once (monitoring, resources, authorities)
 */
export function addAllPOIs(data: {
  monitoringStations: MonitoringStation[];
  resources: Resource[];
  authorities: Authority[];
}): void {
  // Clear all existing POIs first
  currentPOIs = [];

  // Add monitoring sources
  if (data.monitoringStations && data.monitoringStations.length > 0) {
    addMonitoringSources(data.monitoringStations);
  }

  // Add resources
  if (data.resources && data.resources.length > 0) {
    addResources(data.resources);
  }

  // Add authorities
  if (data.authorities && data.authorities.length > 0) {
    addAuthorities(data.authorities);
  }

  console.log(`Added all POI types: ${data.monitoringStations?.length || 0} monitoring, ${data.resources?.length || 0} resources, ${data.authorities?.length || 0} authorities`);
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

/**
 * Create a test alert for debugging purposes
 */
export const createTestAlert = (): void => {
  // Import alert service dynamically to avoid circular dependencies
  import('@/lib/alert-service').then(({ createAlert }) => {
    createAlert({
      title: 'Debug Test Alert',
      message: 'This is a test alert created from the debug panel',
      type: 'info',
      severity: 'medium',
      category: 'system',
      source: 'Debug Panel',
      actions: [
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'secondary',
          action: () => console.log('Alert dismissed')
        }
      ]
    });
  }).catch((error) => {
    console.error('Failed to create test alert:', error);
  });
};