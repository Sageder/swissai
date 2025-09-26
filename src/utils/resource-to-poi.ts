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

      // Create super clean, essential-only description
      const getCleanDescription = (resource: Resource): string => {
        const parts = []

        // Just the essential info
        if (resource.location.name) {
          parts.push(resource.location.name)
        }

        // Status (simplified)
        const status = resource.status === 'available' ? 'Operational' :
          resource.status === 'deployed' ? 'Deployed' :
            resource.status === 'emergency_mode' ? 'Emergency' :
              resource.status === 'standby' ? 'Standby' :
                resource.status.replace('_', ' ')
        parts.push(status)

        // Personnel count if available
        if (resource.personnel) {
          parts.push(`${resource.personnel} personnel`)
        }

        return parts.join(' • ')
      }

      const cleanDescription = getCleanDescription(resource);

      return {
        id: resource.resourceId,
        title: resource.location.name || `${resource.type.replace('_', ' ')} - ${resource.resourceId}`,
        description: cleanDescription,
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

      // Create super clean, essential-only description for monitoring stations
      const getCleanSensorDescription = (station: MonitoringStation): string => {
        const parts = []

        // Station name or type
        if (station.location.name) {
          parts.push(station.location.name)
        } else {
          parts.push(station.sensorType.replace('_', ' '))
        }

        // Battery status
        parts.push(`${station.batteryStatus}% battery`)

        // Reading status (simplified)
        const latestReading = station.readings[station.readings.length - 1]
        if (latestReading) {
          const status = latestReading.status === 'normal' ? 'Normal' :
            latestReading.status === 'alert' ? 'Alert' :
              latestReading.status === 'warning' ? 'Warning' :
                latestReading.status === 'critical' ? 'Critical' :
                  latestReading.status
          parts.push(status)
        }

        return parts.join(' • ')
      }

      const cleanDescription = getCleanSensorDescription(station);

      return {
        id: station.sensorId,
        title: station.location.name || `${station.sensorType.replace('_', ' ')} Sensor - ${station.sensorId}`,
        description: cleanDescription,
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
