/**
 * Utility functions for controlling the application state
 * These functions can be called by AI models or other parts of the application
 */

import { MonitoringStation, Authority, Resource } from '@/types/emergency';
import type { VehicleMovement } from '@/lib/data-context';

// Global state for controlling UI elements
let showTimelineFlag = false;
let showPOIFlag = false;
let currentPOIs: any[] = [];

// Callbacks for notifying components of state changes
const timelineCallbacks: (() => void)[] = [];
const poiCallbacks: (() => void)[] = [];

// Global reference to data context functions (will be set by the app)
let dataContextRef: {
  addVehicleMovement: (movement: Omit<VehicleMovement, 'id' | 'currentPosition' | 'progress' | 'status'>) => void;
} | null = null;

/**
 * Set the data context reference for vehicle movements
 * This should be called by the app to provide access to data context functions
 */
export function setDataContextRef(ref: typeof dataContextRef): void {
  dataContextRef = ref;
}

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
 * Get directions from Mapbox Directions API
 */
async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.warn('Mapbox token not available, using direct route');
      return null;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${mapboxToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting directions:', error);
    return null;
  }
}

/**
 * Send a vehicle from one POI to another POI
 * @param fromPOIId - ID of the source POI
 * @param toPOIId - ID of the destination POI
 * @param vehicleType - Type of vehicle to send
 * @param duration - Duration of the journey in milliseconds (default: 30000 = 30 seconds)
 */
export async function sendVehicle(
  fromPOIId: string, 
  toPOIId: string, 
  vehicleType: VehicleMovement['vehicleType'] = 'fire_truck',
  duration: number = 30000
): Promise<void> {
  if (!dataContextRef) {
    console.error('Data context not available for vehicle movement');
    return;
  }

  // Find the source and destination POIs
  const fromPOI = currentPOIs.find(poi => poi.id === fromPOIId);
  const toPOI = currentPOIs.find(poi => poi.id === toPOIId);

  if (!fromPOI || !toPOI) {
    console.error(`POI not found: from=${fromPOIId}, to=${toPOIId}`);
    return;
  }

  // Get directions from Mapbox
  const route = await getDirections(
    { lat: fromPOI.metadata.coordinates.lat, lng: fromPOI.metadata.coordinates.long },
    { lat: toPOI.metadata.coordinates.lat, lng: toPOI.metadata.coordinates.long }
  );

  let finalDuration = duration;
  let routeData = undefined;

  if (route) {
    // Use Mapbox route data
    routeData = route;
    // Convert duration from seconds to milliseconds, but cap it for demo purposes
    finalDuration = Math.min(route.duration * 1000, 60000); // Max 60 seconds for demo
  } else {
    // Fallback to direct distance calculation
    const distance = calculateDistance(
      fromPOI.metadata.coordinates.lat,
      fromPOI.metadata.coordinates.long,
      toPOI.metadata.coordinates.lat,
      toPOI.metadata.coordinates.long
    );
    finalDuration = duration === 30000 ? Math.max(10000, distance * 72) : duration;
  }

  // Create vehicle movement
  const movement: Omit<VehicleMovement, 'id' | 'currentPosition' | 'progress' | 'status'> = {
    from: {
      lat: fromPOI.metadata.coordinates.lat,
      lng: fromPOI.metadata.coordinates.long,
      name: fromPOI.title
    },
    to: {
      lat: toPOI.metadata.coordinates.lat,
      lng: toPOI.metadata.coordinates.long,
      name: toPOI.title
    },
    startTime: Date.now(),
    duration: finalDuration,
    vehicleType,
    route: routeData
  };

  dataContextRef.addVehicleMovement(movement);
  console.log(`Vehicle (${vehicleType}) sent from ${fromPOI.title} to ${toPOI.title}${route ? ' via roads' : ' via direct route'}`);
}

/**
 * Add Blatten city center as a POI
 */
export function addBlatten(): void {
  const blattenPOI = {
    id: 'blatten-city-center',
    title: 'Blatten City Center - HAZARD ZONE',
    description: 'Main administrative and commercial center of Blatten village - Currently under landslide threat',
    type: 'hazard' as const,
    severity: 'high' as const,
    metadata: {
      coordinates: {
        lat: 46.4208,
        long: 7.8219
      }
    },
    contact: 'blatten@valais.ch',
    status: 'active' as const
  };

  // Remove existing Blatten POI if it exists
  currentPOIs = currentPOIs.filter(poi => poi.id !== 'blatten-city-center');
  currentPOIs = [...currentPOIs, blattenPOI];
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log('Added Blatten city center to POI display');
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

/**
 * Send a helicopter from one POI to another POI
 * Helicopters move in a straight line (no road routing)
 * @param fromPOIId - ID of the source POI
 * @param toPOIId - ID of the destination POI
 * @param duration - Duration of the journey in milliseconds (default: 20000 = 20 seconds)
 */
export async function sendHelicopter(
  fromPOIId: string, 
  toPOIId: string, 
  duration: number = 20000
): Promise<void> {
  if (!dataContextRef) {
    console.error('Data context not available for helicopter movement. Please wait for the app to fully load.');
    return;
  }

  // Find the source and destination POIs
  const fromPOI = currentPOIs.find(poi => poi.id === fromPOIId);
  const toPOI = currentPOIs.find(poi => poi.id === toPOIId);

  if (!fromPOI || !toPOI) {
    console.error(`POI not found: from=${fromPOIId}, to=${toPOIId}`);
    return;
  }

  // Calculate direct distance for helicopter
  const distance = calculateDistance(
    fromPOI.metadata.coordinates.lat,
    fromPOI.metadata.coordinates.long,
    toPOI.metadata.coordinates.lat,
    toPOI.metadata.coordinates.long
  );

  // Helicopters are faster - adjust duration based on distance
  // Base speed: 100 km/h = 27.78 m/s
  const helicopterSpeed = 27.78; // meters per second
  const calculatedDuration = Math.max(10000, (distance * 1000) / helicopterSpeed * 1000); // Convert to milliseconds
  const finalDuration = Math.min(calculatedDuration, duration);

  // Create direct route coordinates for helicopter (straight line in the air)
  const numPoints = Math.max(3, Math.ceil(distance * 2)); // More points for longer distances
  const coordinates: [number, number, number][] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const lat = fromPOI.metadata.coordinates.lat + (toPOI.metadata.coordinates.lat - fromPOI.metadata.coordinates.lat) * progress;
    const lng = fromPOI.metadata.coordinates.long + (toPOI.metadata.coordinates.long - fromPOI.metadata.coordinates.long) * progress;
    
    // Add altitude to coordinates (Mapbox expects [lng, lat, altitude])
    coordinates.push([lng, lat, 500]); // 500 meters altitude
  }

  const directRoute = {
    coordinates,
    distance: distance * 1000, // Convert to meters
    duration: finalDuration / 1000 // Convert to seconds
  };

  // Create helicopter movement
  const movement: Omit<VehicleMovement, 'id' | 'currentPosition' | 'progress' | 'status'> = {
    from: {
      lat: fromPOI.metadata.coordinates.lat,
      lng: fromPOI.metadata.coordinates.long,
      name: fromPOI.title
    },
    to: {
      lat: toPOI.metadata.coordinates.lat,
      lng: toPOI.metadata.coordinates.long,
      name: toPOI.title
    },
    startTime: Date.now(),
    duration: finalDuration,
    vehicleType: 'helicopter',
    route: directRoute
  };

  dataContextRef.addVehicleMovement(movement);
  console.log(`Helicopter sent from ${fromPOI.title} to ${toPOI.title} via direct route (${distance.toFixed(1)}km)`);
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
