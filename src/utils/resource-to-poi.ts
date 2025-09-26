import type { Resource, MonitoringStation } from '@/types/emergency'
import type { POI } from '@/data/pois'

/**
 * Converts Firebase resources to POI format for map display
 */
export function convertResourcesToPOIs(resources: Resource[]): POI[] {
  return resources
    .filter(resource => 
      resource.location && 
      typeof resource.location.lat === 'number' && 
      typeof resource.location.lng === 'number'
    )
    .map(resource => {
      // Map resource type to POI type
      const getPOIType = (resourceType: Resource['type']): POI['type'] => {
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
      const getSeverity = (status: Resource['status']): POI['severity'] => {
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
        status: resource.status === 'available' || resource.status === 'operational' ? 'active' : 
                resource.status === 'deployed' || resource.status === 'emergency_mode' ? 'active' : 'inactive'
      }
    })
}

/**
 * Converts monitoring stations to POI format for map display
 */
export function convertMonitoringStationsToPOIs(monitoringStations: MonitoringStation[]): POI[] {
  return monitoringStations
    .filter(station => 
      station.location && 
      typeof station.location.lat === 'number' && 
      typeof station.location.lng === 'number'
    )
    .map(station => {
      // Map sensor type to POI type
      const getPOIType = (sensorType: MonitoringStation['sensorType']): POI['type'] => {
        switch (sensorType) {
          case 'glacier_movement':
          case 'glacier_stress':
          case 'seismic':
          case 'water_level':
          case 'weather':
            return 'sensor'
          default:
            return 'sensor'
        }
      }

      // Map connectivity and readings to severity
      const getSeverity = (station: MonitoringStation): POI['severity'] => {
        if (station.connectivity === 'offline') return 'high'
        
        // Check latest reading status
        const latestReading = station.readings[station.readings.length - 1]
        if (latestReading) {
          switch (latestReading.status) {
            case 'critical':
            case 'emergency':
            case 'failure_imminent':
            case 'major_event':
              return 'high'
            case 'alert':
            case 'warning':
            case 'flood_risk':
              return 'medium'
            case 'normal':
            case 'aftershock':
            default:
              return 'low'
          }
        }
        
        return station.connectivity === 'degraded' ? 'medium' : 'low'
      }

      // Get latest reading for description
      const latestReading = station.readings[station.readings.length - 1]
      const readingInfo = latestReading ? 
        `Latest: ${latestReading.value} ${latestReading.unit} (${latestReading.status})` : 
        'No recent readings'

      return {
        id: station.sensorId,
        title: station.location.name || `${station.sensorType} Sensor - ${station.sensorId}`,
        description: `${station.sensorType.replace('_', ' ')} sensor - ${readingInfo} - Battery: ${station.batteryStatus}% - ${station.responsibleOrganization}`,
        type: getPOIType(station.sensorType),
        severity: getSeverity(station),
        metadata: {
          coordinates: {
            lat: station.location.lat,
            long: station.location.lng
          }
        },
        contact: station.location.address || undefined,
        status: station.connectivity === 'online' ? 'active' : 
                station.connectivity === 'degraded' ? 'inactive' : 'inactive'
      }
    })
}

/**
 * Combines static POIs with resource POIs and monitoring station POIs
 */
export function combinePOIs(staticPOIs: POI[], resourcePOIs: POI[], monitoringPOIs: POI[] = []): POI[] {
  return [...staticPOIs, ...resourcePOIs, ...monitoringPOIs]
}
