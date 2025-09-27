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

// Global reference to map controls for programmatic camera moves
let mapControlRef: {
  flyToLocation: (coordinates: [number, number], zoom?: number) => void;
} | null = null;

// Global reference to timeline function (will be set by the app)
let timelineRef: {
  getCurrentTime: () => Date;
} | null = null;

/**
 * Set the data context reference for vehicle movements
 * This should be called by the app to provide access to data context functions
 */
export function setDataContextRef(ref: typeof dataContextRef): void {
  dataContextRef = ref;
}

/**
 * Set the map control reference for camera moves
 */
export function setMapControlRef(ref: typeof mapControlRef): void {
  mapControlRef = ref;
}

/**
 * Set the timeline reference for getting current simulation time
 * This should be called by the app to provide access to timeline functions
 */
export function setTimelineRef(ref: typeof timelineRef): void {
  timelineRef = ref;
}

// Compute center (lng,lat) of a set of POIs with metadata.coordinates {lat,long}
function computePOICenter(pois: Array<{ metadata?: { coordinates?: { lat: number; long: number } } }>): [number, number] | null {
  if (!pois || pois.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  pois.forEach(p => {
    const lat = p?.metadata?.coordinates?.lat;
    const lng = p?.metadata?.coordinates?.long;
    if (typeof lat === 'number' && typeof lng === 'number') {
      sumLat += lat;
      sumLng += lng;
      count += 1;
    }
  });
  if (count === 0) return null;
  return [sumLng / count, sumLat / count];
}

// Helper: robust POI lookup by id or human title (case/format-insensitive)
function normalizeIdentifier(value: string | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findPOIByIdOrTitle(identifier: string): any | undefined {
  if (!identifier) return undefined;
  // 1) Exact id
  let poi = currentPOIs.find(p => p.id === identifier);
  if (poi) return poi;

  // 2) Exact title match (normalized)
  const norm = normalizeIdentifier(identifier);
  poi = currentPOIs.find(p => normalizeIdentifier(p.title) === norm);
  if (poi) return poi;

  // 3) Contains match either way
  poi = currentPOIs.find(p => {
    const t = normalizeIdentifier(p.title);
    return t.includes(norm) || norm.includes(t);
  });
  if (poi) return poi;

  // 4) Special-case: plain "blatten" -> city center if available
  if (norm === 'blatten') {
    poi = currentPOIs.find(p => p.id === 'blatten-city-center' || normalizeIdentifier(p.title) === 'blatten city center');
    if (poi) return poi;
  }

  return undefined;
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
 * Show only monitoring sources (hide all other POIs)
 */
export function showOnlyMonitoringSources(monitoringStations: MonitoringStation[]): void {
  const monitoringPOIs = monitoringStations.map(station => ({
    id: station.sensorId,
    title: station.location.name || `${station.sensorType} Sensor - ${station.sensorId}`,
    description: `${station.sensorType.replace('_', ' ')} sensor - Battery: ${station.batteryStatus}% - ${station.responsibleOrganization}`,
    type: 'sensor' as const,
    severity: station.connectivity === 'online' ? 'low' as const : 'high' as const,
    metadata: {
      coordinates: {
        lat: station.location.lat,
        long: station.location.lng,
      },
      highlight: 'monitoring' as const,
    },
    contact: station.location.address || undefined,
    status: station.connectivity === 'online' ? 'active' as const : 'inactive' as const,
  }));

  currentPOIs = monitoringPOIs;
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Showing only monitoring sources: ${monitoringPOIs.length}`);

  // Slight zoom-out overview to center of monitoring sources
  const center = computePOICenter(monitoringPOIs as any);
  if (mapControlRef && center) {
    try {
      mapControlRef.flyToLocation(center, 10);
    } catch { }
  }
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
 * Show only resource POIs and programmatically fly to each one to highlight them.
 * This is hardcoded behavior and not exposed as a tool.
 */
export async function showResourcesAndTour(resources: Resource[], zoom: number = 11, delayMs: number = 1000): Promise<void> {
  const resourcePOIs = resources.map(resource => {
    const getPOIType = (resourceType: Resource['type']): 'hospital' | 'helicopter' | 'fire_station' | 'shelter' | 'infrastructure' | 'other' => {
      switch (resourceType) {
        case 'hospital':
        case 'medical_center':
          return 'hospital';
        case 'helicopter':
          return 'helicopter';
        case 'fire_station':
          return 'fire_station';
        case 'emergency_shelter':
          return 'shelter';
        case 'power_grid':
        case 'water_system':
        case 'communication':
          return 'infrastructure';
        default:
          return 'other';
      }
    };

    const getSeverity = (status: Resource['status']): 'high' | 'medium' | 'low' => {
      switch (status) {
        case 'deployed':
        case 'emergency_mode':
          return 'high';
        case 'activated':
        case 'en_route':
          return 'medium';
        case 'available':
        case 'standby':
        case 'normal_operations':
        case 'operational':
          return 'low';
        default:
          return 'low';
      }
    };

    return {
      id: resource.resourceId,
      title: resource.location.name || `${resource.type} - ${resource.resourceId}`,
      description: `${resource.type} resource - Status: ${resource.status}${resource.personnel ? ` - Personnel: ${resource.personnel}` : ''}${resource.currentAssignment ? ` - Assignment: ${resource.currentAssignment}` : ''}`,
      type: getPOIType(resource.type),
      severity: getSeverity(resource.status),
      metadata: {
        coordinates: {
          lat: resource.location.lat,
          long: resource.location.lng,
        },
      },
      highlight: 'resource' as const,
      contact: resource.location.address || undefined,
      status:
        resource.status === 'available' || resource.status === 'operational'
          ? ('active' as const)
          : resource.status === 'deployed' || resource.status === 'emergency_mode'
            ? ('active' as const)
            : ('inactive' as const),
    };
  });

  // Replace all POIs with resources only
  currentPOIs = resourcePOIs;
  showPOIFlag = true;
  poiCallbacks.forEach(callback => callback());
  console.log(`Showing only resources: ${resourcePOIs.length}`);

  // Overview: single slight zoom-out to center of resources (no per-resource zoom)
  const center = computePOICenter(resourcePOIs as any);
  if (mapControlRef && center) {
    try {
      mapControlRef.flyToLocation(center, 10);
    } catch { }
  }
}

/**
 * Highlight only resources without any zoom animations (alias for current design)
 */
export function showOnlyResources(resources: Resource[]): void {
  void showResourcesAndTour(resources, 10, 0);
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
  // Try Mapbox first if token exists
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&access_token=${mapboxToken}`;
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
    }
  } catch (error) {
    console.warn('Mapbox routing failed, will try OSRM fallback:', error);
  }

  // Fallback to OSRM public API for road routing if Mapbox unavailable
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration
      };
    }
  } catch (error) {
    console.warn('OSRM routing failed, will use direct line fallback:', error);
  }

  return null;
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

  // Find the source and destination POIs (by id or title)
  const fromPOI = findPOIByIdOrTitle(fromPOIId);
  const toPOI = findPOIByIdOrTitle(toPOIId);

  if (!fromPOI || !toPOI) {
    console.error(`POI not found: from=${fromPOIId}, to=${toPOIId}`);
    return;
  }

  // Get directions using Mapbox/OSRM (roads)
  const route = await getDirections(
    { lat: fromPOI.metadata.coordinates.lat, lng: fromPOI.metadata.coordinates.long },
    { lat: toPOI.metadata.coordinates.lat, lng: toPOI.metadata.coordinates.long }
  );

  // Base vehicle speed (m/s) ~ 50 km/h => 13.89 m/s
  const vehicleSpeedMs = 13.89;
  let finalDuration = duration;
  let routeData = undefined;

  if (route) {
    // Use routed road path and speed-based duration
    routeData = route;
    const distanceMeters = route.distance; // meters
    finalDuration = (distanceMeters / vehicleSpeedMs) * 1000; // ms
    console.log('✅ VEHICLE ROUTE FOUND:', route.coordinates.length, 'points');
  } else {
    // Fallback to direct distance calculation; build a straight-line route (helicopter-style) for vehicles
    const distanceKm = calculateDistance(
      { lat: fromPOI.metadata.coordinates.lat, lng: fromPOI.metadata.coordinates.long },
      { lat: toPOI.metadata.coordinates.lat, lng: toPOI.metadata.coordinates.long }
    );
    const distanceMeters = distanceKm * 1000;
    finalDuration = (distanceMeters / vehicleSpeedMs) * 1000; // ms

    // EXACT SAME LOGIC AS HELICOPTERS - but for ground vehicles
    const numPoints = Math.max(16, Math.ceil(distanceKm * 10)); // Same as helicopter
    const coordinates: [number, number][] = [];

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints;
      const lat = fromPOI.metadata.coordinates.lat + (toPOI.metadata.coordinates.lat - fromPOI.metadata.coordinates.lat) * progress;
      const lng = fromPOI.metadata.coordinates.long + (toPOI.metadata.coordinates.long - fromPOI.metadata.coordinates.long) * progress;

      // Vehicles use 2D coordinates [lng, lat] (no altitude like helicopters)
      coordinates.push([lng, lat]);
    }

    routeData = {
      coordinates,
      distance: distanceMeters,
      duration: finalDuration / 1000
    };

    console.log('⚠️ NO ROUTE API - USING HELICOPTER-STYLE FALLBACK ROUTE:', coordinates.length, 'points', 'First:', coordinates[0], 'Last:', coordinates[coordinates.length - 1]);
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
    startTime: timelineRef?.getCurrentTime().getTime() || Date.now(),
    duration: finalDuration,
    vehicleType,
    route: routeData
  };

  dataContextRef.addVehicleMovement(movement);
  console.log(`Vehicle (${vehicleType}) dispatched via ${route ? 'roads' : 'direct line'}: ${(finalDuration / 1000).toFixed(1)}s, ${(route?.distance ?? 0 / 1000).toFixed(2)}km, route points: ${route?.coordinates?.length || 0}`);
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
 * Cinematic fly-to for Blatten close-up POV
 * Starts from a wide, flat POV and then flies into the close cinematic POV
 */
export function blattenClose(): void {
  try {
    if (typeof window === 'undefined') return;
    const mapInstance = (window as any).debugMapInstance;
    if (!mapInstance || typeof mapInstance.flyTo !== 'function') {
      console.warn('Map instance not available for blattenClose()');
      return;
    }

    const start = {
      center: [7.822202, 46.422625] as [number, number],
      zoom: 10.9,
      pitch: 0,
      bearing: -113.7
    };

    const final = {
      center: [7.816784, 46.41891] as [number, number],
      zoom: 15.26,
      pitch: 78.2,
      bearing: -112.9
    };

    // Step 1: Set the starting wide POV (shorter duration)
    mapInstance.flyTo({
      center: start.center,
      zoom: start.zoom,
      pitch: start.pitch,
      bearing: start.bearing,
      duration: 1500,
      essential: true
    });

    // Step 2: After the first move ends, perform a long cinematic fly to final POV
    const handler = () => {
      try {
        mapInstance.off('moveend', handler);
        mapInstance.flyTo({
          center: final.center,
          zoom: final.zoom,
          pitch: final.pitch,
          bearing: final.bearing,
          duration: 5000,
          essential: true
        });
      } catch (e) {
        // no-op
      }
    };
    mapInstance.on('moveend', handler);
  } catch (err) {
    console.error('Failed to execute blattenClose():', err);
  }
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

  // Find the source and destination POIs (by id or title)
  const fromPOI = findPOIByIdOrTitle(fromPOIId);
  const toPOI = findPOIByIdOrTitle(toPOIId);

  if (!fromPOI || !toPOI) {
    console.error(`POI not found: from=${fromPOIId}, to=${toPOIId}`);
    return;
  }

  // Calculate direct distance for helicopter
  const distance = calculateDistance(
    { lat: fromPOI.metadata.coordinates.lat, lng: fromPOI.metadata.coordinates.long },
    { lat: toPOI.metadata.coordinates.lat, lng: toPOI.metadata.coordinates.long }
  );

  // Helicopters are 3x faster than vehicles
  const vehicleSpeedMs = 13.89; // ~50 km/h
  const helicopterSpeed = vehicleSpeedMs * 3; // ~150 km/h
  const finalDuration = ((distance * 1000) / helicopterSpeed) * 1000; // ms

  // Create direct route coordinates for helicopter (straight line in the air)
  const numPoints = Math.max(16, Math.ceil(distance * 10)); // Densify for smoother animation
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
    startTime: timelineRef?.getCurrentTime().getTime() || Date.now(),
    duration: finalDuration,
    vehicleType: 'helicopter',
    route: directRoute
  };

  dataContextRef.addVehicleMovement(movement);
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

// ============================================================================
// CRISIS MANAGEMENT NODE EDITOR FUNCTIONS
// ============================================================================

// Node and connection data structures
interface CrisisNode {
  id: string;
  type: 'alert' | 'monitoring' | 'response' | 'resource' | 'authority' | 'custom';
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  position: { x: number; y: number };
  severity?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

interface CrisisConnection {
  id: string;
  from: string;
  to: string;
  type: 'data_flow' | 'response' | 'coordination' | 'dependency';
  status: 'active' | 'inactive' | 'pending';
  label?: string;
}

// Global state for crisis nodes and connections
let crisisNodes: CrisisNode[] = [];
let crisisConnections: CrisisConnection[] = [];
let nodeEditorCallbacks: Array<() => void> = [];

// Callback system for node editor updates
export const onNodeEditorChange = (callback: () => void) => {
  nodeEditorCallbacks.push(callback);
  return () => {
    nodeEditorCallbacks = nodeEditorCallbacks.filter(cb => cb !== callback);
  };
};

const notifyNodeEditorChange = () => {
  nodeEditorCallbacks.forEach(callback => callback());
};

// -------------------------------
// Layout Helpers (no external deps)
// -------------------------------
const NODE_WIDTH = 240;   // approximate visual width (tighter)
const NODE_HEIGHT = 110;  // approximate visual height
const COL_GAP = 48;       // reduced column gap to bring columns closer, esp. alert -> next
const ROW_GAP = 56;

function gridPosition(col: number, row: number): { x: number; y: number } {
  return { x: col * (NODE_WIDTH + COL_GAP), y: row * (NODE_HEIGHT + ROW_GAP) };
}

function resolveOverlaps(spacingX = 24, spacingY = 16): void {
  // Naive O(n^2) collision resolution; shifts nodes down if overlapping
  for (let i = 0; i < crisisNodes.length; i++) {
    const a = crisisNodes[i];
    for (let j = 0; j < crisisNodes.length; j++) {
      if (i === j) continue;
      const b = crisisNodes[j];
      const ax1 = a.position.x, ay1 = a.position.y;
      const ax2 = ax1 + NODE_WIDTH, ay2 = ay1 + NODE_HEIGHT;
      const bx1 = b.position.x, by1 = b.position.y;
      const bx2 = bx1 + NODE_WIDTH, by2 = by1 + NODE_HEIGHT;
      const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
      const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
      if (overlapX > 0 && overlapY > 0) {
        // Shift the lower-priority node (later index) downward and to the right slightly
        b.position = { x: b.position.x + spacingX, y: b.position.y + overlapY + spacingY };
      }
    }
  }
}

export function autoLayoutCrisisGraph(): void {
  // Group nodes by type for a simple, readable plan layout
  const groups: Record<string, CrisisNode[]> = {
    alert: [], monitoring: [], response: [], authority: [], resource: [], custom: []
  } as any;
  crisisNodes.forEach(n => {
    (groups[n.type] ?? groups.custom).push(n);
  });

  // Column order: Alert -> Monitoring -> Response -> Authority -> Resource
  const columns: Array<[keyof typeof groups, CrisisNode[]]> = [
    ['alert', groups.alert],
    ['monitoring', groups.monitoring],
    ['response', groups.response],
    ['authority', groups.authority],
    ['resource', groups.resource],
  ];

  let col = 0;
  columns.forEach(([, nodes], idx) => {
    nodes.forEach((node, row) => {
      node.position = gridPosition(col, row);
    });
    col += 1;
  });

  // Pass 2: resolve any overlaps due to varying group sizes/content
  resolveOverlaps();
}

// Initialize empty crisis nodes (clear all)
export const initializeCrisisNodes = () => {
  crisisNodes = [];
  crisisConnections = [];
  notifyNodeEditorChange();
  console.log('Crisis nodes initialized - cleared all nodes and connections');
};

// Get all crisis nodes
export const getCrisisNodes = (): CrisisNode[] => {
  return [...crisisNodes];
};

// Get all crisis connections
export const getCrisisConnections = (): CrisisConnection[] => {
  return [...crisisConnections];
};

// Add a new crisis node
export const addCrisisNode = (node: Omit<CrisisNode, 'id'>): string => {
  const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newNode: CrisisNode = {
    id,
    ...node
  };

  crisisNodes.push(newNode);
  notifyNodeEditorChange();
  console.log('Added crisis node:', newNode.title);
  return id;
};

// Update an existing crisis node
export const updateCrisisNode = (id: string, updates: Partial<CrisisNode>): boolean => {
  const nodeIndex = crisisNodes.findIndex(node => node.id === id);
  if (nodeIndex === -1) {
    console.warn('Crisis node not found:', id);
    return false;
  }

  crisisNodes[nodeIndex] = { ...crisisNodes[nodeIndex], ...updates };
  notifyNodeEditorChange();
  console.log('Updated crisis node:', id);
  return true;
};

// Remove a crisis node
export const removeCrisisNode = (id: string): boolean => {
  const nodeIndex = crisisNodes.findIndex(node => node.id === id);
  if (nodeIndex === -1) {
    console.warn('Crisis node not found:', id);
    return false;
  }

  // Remove all connections involving this node
  crisisConnections = crisisConnections.filter(conn => conn.from !== id && conn.to !== id);

  crisisNodes.splice(nodeIndex, 1);
  notifyNodeEditorChange();
  console.log('Removed crisis node:', id);
  return true;
};

// Add a new crisis connection
export const addCrisisConnection = (connection: Omit<CrisisConnection, 'id'>): string => {
  const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newConnection: CrisisConnection = {
    id,
    ...connection
  };

  // Validate that both nodes exist
  const fromNode = crisisNodes.find(node => node.id === connection.from);
  const toNode = crisisNodes.find(node => node.id === connection.to);

  if (!fromNode || !toNode) {
    console.warn('Cannot create connection: one or both nodes not found');
    return '';
  }

  crisisConnections.push(newConnection);
  notifyNodeEditorChange();
  console.log('Added crisis connection:', newConnection.label || `${connection.from} -> ${connection.to}`);
  return id;
};

// Remove a crisis connection
export const removeCrisisConnection = (id: string): boolean => {
  const connIndex = crisisConnections.findIndex(conn => conn.id === id);
  if (connIndex === -1) {
    console.warn('Crisis connection not found:', id);
    return false;
  }

  crisisConnections.splice(connIndex, 1);
  notifyNodeEditorChange();
  console.log('Removed crisis connection:', id);
  return true;
};

// Clear all crisis nodes and connections
export const clearCrisisNodes = () => {
  crisisNodes = [];
  crisisConnections = [];
  notifyNodeEditorChange();
  console.log('Cleared all crisis nodes and connections');
};

// Create a sample crisis scenario
export const createSampleCrisisScenario = () => {
  clearCrisisNodes();

  // Add alert node
  const alertId = addCrisisNode({
    type: 'alert',
    title: 'Earthquake Alert',
    description: 'Magnitude 6.2',
    status: 'active',
    position: { x: 50, y: 50 },
    severity: 'high'
  });

  // Add monitoring nodes
  const seismicId = addCrisisNode({
    type: 'monitoring',
    title: 'Seismic Network',
    description: '15 Stations',
    status: 'active',
    position: { x: 200, y: 50 },
    severity: 'medium'
  });

  const gpsId = addCrisisNode({
    type: 'monitoring',
    title: 'GPS Network',
    description: '8 Stations',
    status: 'active',
    position: { x: 350, y: 50 },
    severity: 'medium'
  });

  // Add response nodes
  const emergencyId = addCrisisNode({
    type: 'response',
    title: 'Emergency Response',
    description: 'Activated',
    status: 'active',
    position: { x: 50, y: 200 },
    severity: 'high'
  });

  const evacuationId = addCrisisNode({
    type: 'response',
    title: 'Evacuation Plan',
    description: 'Zone A & B',
    status: 'pending',
    position: { x: 200, y: 200 },
    severity: 'high'
  });

  // Add resource nodes
  const fireDeptId = addCrisisNode({
    type: 'resource',
    title: 'Fire Department',
    description: '3 Units',
    status: 'active',
    position: { x: 50, y: 350 },
    severity: 'low'
  });

  const medicalId = addCrisisNode({
    type: 'resource',
    title: 'Medical Teams',
    description: '2 Units',
    status: 'active',
    position: { x: 200, y: 350 },
    severity: 'low'
  });

  // Add connections
  addCrisisConnection({
    from: alertId,
    to: seismicId,
    type: 'data_flow',
    status: 'active',
    label: 'Triggers'
  });

  addCrisisConnection({
    from: alertId,
    to: gpsId,
    type: 'data_flow',
    status: 'active',
    label: 'Triggers'
  });

  addCrisisConnection({
    from: alertId,
    to: emergencyId,
    type: 'response',
    status: 'active',
    label: 'Activates'
  });

  addCrisisConnection({
    from: emergencyId,
    to: evacuationId,
    type: 'coordination',
    status: 'active',
    label: 'Coordinates'
  });

  addCrisisConnection({
    from: emergencyId,
    to: fireDeptId,
    type: 'coordination',
    status: 'active',
    label: 'Deploys'
  });

  addCrisisConnection({
    from: emergencyId,
    to: medicalId,
    type: 'coordination',
    status: 'active',
    label: 'Deploys'
  });

  console.log('Created sample crisis scenario with', crisisNodes.length, 'nodes and', crisisConnections.length, 'connections');
};

// LLM-friendly graph creation functions
// These functions are designed for programmatic graph creation by LLMs
// They provide structured interfaces for creating complex crisis response graphs
export interface LLMNodeData {
  id: string;
  type: 'alert' | 'monitoring' | 'response' | 'resource' | 'authority';
  title: string;
  description: string;
  status: string;
  severity?: 'low' | 'medium' | 'high';
  position: { x: number; y: number };
}

export interface LLMConnectionData {
  from: string;
  to: string;
  type: 'data_flow' | 'response' | 'coordination' | 'dependency';
  label?: string;
  status?: string;
}

export interface LLMGraphData {
  nodes: LLMNodeData[];
  connections: LLMConnectionData[];
}

/**
 * Creates a complete crisis response graph from LLM-structured data
 * This function is designed to be called by LLMs with structured JSON input
 */
export const createCrisisGraphFromLLM = (graphData: LLMGraphData) => {
  console.log('Creating crisis graph from LLM data:', graphData);

  // Clear existing graph
  crisisNodes = [];
  crisisConnections = [];

  // Add all nodes and keep a map from provided ids -> generated ids
  const providedIdToGeneratedId: Record<string, string> = {};
  const nodeIds: string[] = [];
  graphData.nodes.forEach((nodeData) => {
    const generatedId = addCrisisNode({
      type: nodeData.type,
      title: nodeData.title,
      description: nodeData.description,
      status: nodeData.status as 'active' | 'inactive' | 'pending' | 'completed',
      position: nodeData.position,
      severity: nodeData.severity,
    });
    if (generatedId) {
      nodeIds.push(generatedId);
      if (nodeData.id) {
        providedIdToGeneratedId[nodeData.id] = generatedId;
      }
    }
  });

  // Add all connections
  const connectionIds: string[] = [];
  graphData.connections.forEach((connectionData) => {
    const mappedFrom = providedIdToGeneratedId[connectionData.from] || connectionData.from;
    const mappedTo = providedIdToGeneratedId[connectionData.to] || connectionData.to;
    const connectionId = addCrisisConnection({
      from: mappedFrom,
      to: mappedTo,
      type: connectionData.type,
      status: (connectionData.status as 'active' | 'inactive' | 'pending') || 'active',
      label: connectionData.label || connectionData.type.replace('_', ' ').toUpperCase(),
    });
    if (connectionId) {
      connectionIds.push(connectionId);
    }
  });

  // If positions are missing or appear defaulted, apply auto layout
  const missingPositions = crisisNodes.some(n => !n.position || (n.position.x === 0 && n.position.y === 0));
  if (missingPositions) {
    autoLayoutCrisisGraph();
  } else {
    // Even if positions provided, ensure no overlaps
    resolveOverlaps();
  }

  // Notify UI of changes
  notifyNodeEditorChange();

  console.log(`Created graph with ${nodeIds.length} nodes and ${connectionIds.length} connections`);
  return { nodeIds, connectionIds };
};

/**
 * Creates a crisis response workflow graph
 * Perfect for LLM-generated crisis scenarios
 */
export const createCrisisWorkflow = (scenario: {
  alert: { title: string; description: string; severity: 'low' | 'medium' | 'high' };
  monitoring: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  responses: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  resources: Array<{ title: string; description: string; position: { x: number; y: number } }>;
  authorities: Array<{ title: string; description: string; position: { x: number; y: number } }>;
}) => {
  console.log('Creating crisis workflow:', scenario);

  // Clear existing graph
  crisisNodes = [];
  crisisConnections = [];

  const nodeIds: { [key: string]: string } = {};

  // Create alert node
  const alertId = addCrisisNode({
    type: 'alert',
    title: scenario.alert.title,
    description: scenario.alert.description,
    status: 'active',
    position: { x: 100, y: 100 },
    severity: scenario.alert.severity
  });
  if (alertId) nodeIds.alert = alertId;

  // Create monitoring nodes
  scenario.monitoring.forEach((monitor, index) => {
    const id = addCrisisNode({
      type: 'monitoring',
      title: monitor.title,
      description: monitor.description,
      status: 'active',
      position: monitor.position,
      severity: 'low'
    });
    if (id) nodeIds[`monitor_${index}`] = id;
  });

  // Create response nodes
  scenario.responses.forEach((response, index) => {
    const id = addCrisisNode({
      type: 'response',
      title: response.title,
      description: response.description,
      status: 'pending',
      position: response.position,
      severity: 'high'
    });
    if (id) nodeIds[`response_${index}`] = id;
  });

  // Create resource nodes
  scenario.resources.forEach((resource, index) => {
    const id = addCrisisNode({
      type: 'resource',
      title: resource.title,
      description: resource.description,
      status: 'active',
      position: resource.position,
      severity: 'low'
    });
    if (id) nodeIds[`resource_${index}`] = id;
  });

  // Create authority nodes
  scenario.authorities.forEach((authority, index) => {
    const id = addCrisisNode({
      type: 'authority',
      title: authority.title,
      description: authority.description,
      status: 'active',
      position: authority.position,
      severity: 'medium'
    });
    if (id) nodeIds[`authority_${index}`] = id;
  });

  // Create connections: Alert triggers monitoring
  Object.keys(nodeIds).forEach(key => {
    if (key.startsWith('monitor_') && nodeIds.alert) {
      addCrisisConnection({
        from: nodeIds.alert,
        to: nodeIds[key],
        type: 'data_flow',
        status: 'active',
        label: 'TRIGGERS'
      });
    }
  });

  // Create connections: Alert triggers responses
  Object.keys(nodeIds).forEach(key => {
    if (key.startsWith('response_') && nodeIds.alert) {
      addCrisisConnection({
        from: nodeIds.alert,
        to: nodeIds[key],
        type: 'response',
        status: 'active',
        label: 'ACTIVATES'
      });
    }
  });

  // Create connections: Responses coordinate resources
  Object.keys(nodeIds).forEach(responseKey => {
    if (responseKey.startsWith('response_')) {
      Object.keys(nodeIds).forEach(resourceKey => {
        if (resourceKey.startsWith('resource_')) {
          addCrisisConnection({
            from: nodeIds[responseKey],
            to: nodeIds[resourceKey],
            type: 'coordination',
            status: 'active',
            label: 'DEPLOYS'
          });
        }
      });
    }
  });

  // Create connections: Authorities coordinate responses
  Object.keys(nodeIds).forEach(authorityKey => {
    if (authorityKey.startsWith('authority_')) {
      Object.keys(nodeIds).forEach(responseKey => {
        if (responseKey.startsWith('response_')) {
          addCrisisConnection({
            from: nodeIds[authorityKey],
            to: nodeIds[responseKey],
            type: 'coordination',
            status: 'active',
            label: 'COORDINATES'
          });
        }
      });
    }
  });

  notifyNodeEditorChange();
  console.log('Created crisis workflow with', Object.keys(nodeIds).length, 'nodes');
  return nodeIds;
};

/**
 * Creates a hierarchical crisis management structure
 * Perfect for organizational crisis response charts
 */
export const createCrisisHierarchy = (hierarchy: {
  root: { title: string; description: string; type: 'authority' | 'response' };
  levels: Array<{
    level: number;
    nodes: Array<{
      title: string;
      description: string;
      type: 'alert' | 'monitoring' | 'response' | 'resource' | 'authority';
      connections: string[]; // IDs of nodes to connect to
    }>;
  }>;
}) => {
  console.log('Creating crisis hierarchy:', hierarchy);

  // Clear existing graph
  crisisNodes = [];
  crisisConnections = [];

  const nodeIds: { [key: string]: string } = {};
  const levelSpacing = 200;
  const nodeSpacing = 150;

  // Create root node
  const rootId = addCrisisNode({
    type: hierarchy.root.type,
    title: hierarchy.root.title,
    description: hierarchy.root.description,
    status: 'active',
    position: { x: 400, y: 50 },
    severity: 'high'
  });
  if (rootId) nodeIds.root = rootId;

  // Create nodes for each level
  hierarchy.levels.forEach((level, levelIndex) => {
    const y = 100 + (levelIndex + 1) * levelSpacing;
    const startX = 100;

    level.nodes.forEach((node, nodeIndex) => {
      const x = startX + nodeIndex * nodeSpacing;
      const id = addCrisisNode({
        type: node.type,
        title: node.title,
        description: node.description,
        status: 'active',
        position: { x, y },
        severity: levelIndex === 0 ? 'high' : levelIndex === 1 ? 'medium' : 'low'
      });

      if (id) {
        nodeIds[`level_${levelIndex}_node_${nodeIndex}`] = id;

        // Create connections based on node.connections
        node.connections.forEach(connectionTarget => {
          if (nodeIds[connectionTarget]) {
            addCrisisConnection({
              from: nodeIds[connectionTarget],
              to: id,
              type: 'coordination',
              status: 'active',
              label: 'MANAGES'
            });
          }
        });
      }
    });
  });

  notifyNodeEditorChange();
  console.log('Created crisis hierarchy with', Object.keys(nodeIds).length, 'nodes');
  return nodeIds;
};

/**
 * Validates LLM graph data before creation
 * Ensures data integrity for LLM-generated graphs
 */
export const validateLLMGraphData = (graphData: LLMGraphData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate nodes
  if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
    errors.push('Nodes must be an array');
  } else {
    graphData.nodes.forEach((node, index) => {
      if (!node.id) errors.push(`Node ${index} missing id`);
      if (!node.type) errors.push(`Node ${index} missing type`);
      if (!node.title) errors.push(`Node ${index} missing title`);
      if (!node.position) errors.push(`Node ${index} missing position`);
      if (!['alert', 'monitoring', 'response', 'resource', 'authority'].includes(node.type)) {
        errors.push(`Node ${index} has invalid type: ${node.type}`);
      }
    });
  }

  // Validate connections
  if (!graphData.connections || !Array.isArray(graphData.connections)) {
    errors.push('Connections must be an array');
  } else {
    const nodeIds = graphData.nodes.map(n => n.id);
    graphData.connections.forEach((connection, index) => {
      if (!connection.from) errors.push(`Connection ${index} missing from`);
      if (!connection.to) errors.push(`Connection ${index} missing to`);
      if (!nodeIds.includes(connection.from)) {
        errors.push(`Connection ${index} references non-existent source node: ${connection.from}`);
      }
      if (!nodeIds.includes(connection.to)) {
        errors.push(`Connection ${index} references non-existent target node: ${connection.to}`);
      }
      if (!['data_flow', 'response', 'coordination', 'dependency'].includes(connection.type)) {
        errors.push(`Connection ${index} has invalid type: ${connection.type}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// POI Context Functions for LLM Integration
export interface POIContext {
  id: string;
  title: string;
  description: string;
  type: 'monitoring' | 'resource' | 'authority' | 'alert' | 'other';
  category: 'monitoring' | 'resource' | 'authority';
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'pending' | 'completed';
  coordinates: {
    lat: number;
    lng: number;
  };
  location: {
    name: string;
    address?: string;
  };
  metadata: {
    organization?: string;
    personnel?: number;
    equipment?: string[];
    specializations?: string[];
    responseTime?: string;
    capacity?: any;
    currentAssignment?: string;
    batteryStatus?: number;
    connectivity?: string;
    jurisdiction?: string;
    level?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    radio?: string;
    emergency?: string;
  };
}

export interface POIFilterOptions {
  categories?: ('monitoring' | 'resource' | 'authority')[];
  types?: string[];
  status?: ('active' | 'inactive' | 'pending' | 'completed')[];
  severity?: ('low' | 'medium' | 'high')[];
  location?: {
    center: { lat: number; lng: number };
    radius: number; // in kilometers
  };
  organization?: string[];
  specialization?: string[];
}

/**
 * Get all Points of Interest with optional filtering
 * This function provides comprehensive POI data for LLM context
 */
export const getPOIsWithContext = (
  monitoringStations: MonitoringStation[] = [],
  authorities: Authority[] = [],
  resources: Resource[] = [],
  filterOptions?: POIFilterOptions
): POIContext[] => {
  const allPOIs: POIContext[] = [];

  // Convert monitoring stations to POI context
  monitoringStations.forEach(station => {
    // Add null checks for all properties
    const poi: POIContext = {
      id: station?.sensorId || 'unknown',
      title: station?.location?.name || 'Unknown Station',
      description: `${station?.sensorType || 'unknown'} monitoring station - ${station?.responsibleOrganization || 'unknown'}`,
      type: 'monitoring',
      category: 'monitoring',
      severity: station?.readings?.some(r => ['alert', 'critical', 'emergency'].includes(r?.status)) ? 'high' :
        station?.readings?.some(r => ['warning'].includes(r?.status)) ? 'medium' : 'low',
      status: station?.connectivity === 'online' ? 'active' : 'inactive',
      coordinates: {
        lat: station?.location?.lat || 0,
        lng: station?.location?.lng || 0
      },
      location: {
        name: station?.location?.name || 'Unknown Station',
        address: station?.location?.address || 'No address'
      },
      metadata: {
        organization: station?.responsibleOrganization || 'unknown',
        batteryStatus: station?.batteryStatus || 0,
        connectivity: station?.connectivity || 'offline',
        specializations: [station?.sensorType || 'unknown']
      }
    };
    allPOIs.push(poi);
  });

  // Convert authorities to POI context
  authorities.forEach(authority => {
    // Add null checks for all properties
    const poi: POIContext = {
      id: authority?.authorityId || 'unknown',
      title: authority?.name || 'Unknown Authority',
      description: `${authority?.type || 'unknown'} authority - ${authority?.level || 'unknown'} level - ${authority?.specialization?.join(', ') || 'no specializations'}`,
      type: 'authority',
      category: 'authority',
      severity: authority?.currentStatus === 'activated' || authority?.currentStatus === 'deployed' ? 'high' :
        authority?.currentStatus === 'coordinating' ? 'medium' : 'low',
      status: authority?.currentStatus === 'available' ? 'active' :
        authority?.currentStatus === 'activated' || authority?.currentStatus === 'coordinating' ? 'pending' : 'inactive',
      coordinates: {
        lat: authority?.headquarters?.lat || 0,
        lng: authority?.headquarters?.lng || 0
      },
      location: {
        name: authority?.name || 'Unknown Authority',
        address: authority?.contact?.phone || 'No contact'
      },
      metadata: {
        organization: authority?.type || 'unknown',
        personnel: authority?.personnelCount || 0,
        specializations: authority?.specialization || [],
        jurisdiction: authority?.jurisdiction || 'unknown',
        level: authority?.level || 'unknown',
        responseTime: authority?.responseTime || 'unknown',
        equipment: authority?.equipmentInventory || []
      },
      contact: {
        phone: authority?.contact?.phone || 'No phone',
        email: authority?.contact?.email || 'No email',
        radio: authority?.contact?.radio || 'No radio',
        emergency: authority?.contact?.emergency || 'No emergency contact'
      }
    };
    allPOIs.push(poi);
  });

  // Convert resources to POI context
  resources.forEach(resource => {
    // Add null checks for all properties
    const poi: POIContext = {
      id: resource?.resourceId || 'unknown',
      title: resource?.location?.name || `${resource?.type || 'unknown'} - ${resource?.resourceId || 'unknown'}`,
      description: `${resource?.type || 'unknown'} resource - Status: ${resource?.status || 'unknown'}${resource?.personnel ? ` - Personnel: ${resource.personnel}` : ''}${resource?.currentAssignment ? ` - Assignment: ${resource.currentAssignment}` : ''}`,
      type: 'resource',
      category: 'resource',
      severity: resource?.status === 'emergency_mode' || resource?.status === 'deployed' ? 'high' :
        resource?.status === 'activated' || resource?.status === 'standby' ? 'medium' : 'low',
      status: resource?.status === 'available' || resource?.status === 'operational' ? 'active' :
        resource?.status === 'deployed' || resource?.status === 'emergency_mode' ? 'pending' : 'inactive',
      coordinates: {
        lat: resource?.location?.lat || 0,
        lng: resource?.location?.lng || 0
      },
      location: {
        name: resource?.location?.name || 'Unknown Location',
        address: resource?.location?.address || 'No address'
      },
      metadata: {
        organization: resource?.type || 'unknown',
        personnel: resource?.personnel || 0,
        equipment: resource?.equipment || [],
        specializations: resource?.specializations || [],
        responseTime: resource?.responseTime || 'unknown',
        capacity: resource?.capacity || null,
        currentAssignment: resource?.currentAssignment || 'None'
      }
    };
    allPOIs.push(poi);
  });

  // Apply filters if provided
  let filteredPOIs = allPOIs;

  if (filterOptions) {
    // Filter by categories
    if (filterOptions.categories && filterOptions.categories.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi => filterOptions.categories!.includes(poi.category));
    }

    // Filter by types
    if (filterOptions.types && filterOptions.types.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi => filterOptions.types!.includes(poi.type));
    }

    // Filter by status
    if (filterOptions.status && filterOptions.status.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi => filterOptions.status!.includes(poi.status));
    }

    // Filter by severity
    if (filterOptions.severity && filterOptions.severity.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi => filterOptions.severity!.includes(poi.severity));
    }

    // Filter by location (radius)
    if (filterOptions.location) {
      const { center, radius } = filterOptions.location;
      filteredPOIs = filteredPOIs.filter(poi => {
        const distance = calculateDistance(center, poi.coordinates);
        return distance <= radius;
      });
    }

    // Filter by organization
    if (filterOptions.organization && filterOptions.organization.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi =>
        poi.metadata.organization && filterOptions.organization!.includes(poi.metadata.organization)
      );
    }

    // Filter by specialization
    if (filterOptions.specialization && filterOptions.specialization.length > 0) {
      filteredPOIs = filteredPOIs.filter(poi =>
        poi.metadata.specializations &&
        poi.metadata.specializations.some(spec => filterOptions.specialization!.includes(spec))
      );
    }
  }

  console.log(`Retrieved ${filteredPOIs.length} POIs (${allPOIs.length} total available)`);
  return filteredPOIs;
};

/**
 * Get POIs by specific category (convenience functions)
 */
export const getMonitoringPOIs = (monitoringStations: MonitoringStation[] = []): POIContext[] => {
  return getPOIsWithContext(monitoringStations, [], [], { categories: ['monitoring'] });
};

export const getResourcePOIs = (resources: Resource[] = []): POIContext[] => {
  return getPOIsWithContext([], [], resources, { categories: ['resource'] });
};

export const getAuthorityPOIs = (authorities: Authority[] = []): POIContext[] => {
  return getPOIsWithContext([], authorities, [], { categories: ['authority'] });
};

/**
 * Get active POIs only (status: 'active')
 */
export const getActivePOIs = (
  monitoringStations: MonitoringStation[] = [],
  authorities: Authority[] = [],
  resources: Resource[] = []
): POIContext[] => {
  return getPOIsWithContext(monitoringStations, authorities, resources, { status: ['active'] });
};

/**
 * Get high severity POIs only
 */
export const getHighSeverityPOIs = (
  monitoringStations: MonitoringStation[] = [],
  authorities: Authority[] = [],
  resources: Resource[] = []
): POIContext[] => {
  return getPOIsWithContext(monitoringStations, authorities, resources, { severity: ['high'] });
};

/**
 * Get POIs within a specific radius of a location
 */
export const getPOIsNearLocation = (
  center: { lat: number; lng: number },
  radiusKm: number,
  monitoringStations: MonitoringStation[] = [],
  authorities: Authority[] = [],
  resources: Resource[] = []
): POIContext[] => {
  return getPOIsWithContext(monitoringStations, authorities, resources, {
    location: { center, radius: radiusKm }
  });
};

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
