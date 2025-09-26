// POI (Points of Interest) data structure
// Following the tutorial format for coordinates and metadata

export interface POI {
  id: string;
  title: string;
  description: string;
  type: "research" | "sensor" | "emergency" | "hospital" | "army" | "fire_station" | "helicopter" | "shelter" | "infrastructure" | "hazard" | "other";
  severity?: "high" | "medium" | "low";
  metadata: {
    coordinates: {
      lat: number;  // Latitude as number
      long: number; // Longitude as number
    };
  };
  // Additional POI properties
  contact?: string;
  status?: "active" | "inactive" | "maintenance";
}

// Example POIs in Blatten, Switzerland
// Blatten coordinates: approximately 46.4208° N, 7.8219° E
// To add new POIs, simply add objects to this array following the POI interface
export const blattentPOIs: POI[] = [
  {
    id: "blatten-research-station",
    title: "ETH Zurich Alpine Research Station",
    description: "High-altitude research facility studying climate change and glaciology in the Swiss Alps",
    type: "research",
    severity: "high",
    metadata: {
      coordinates: {
        lat: 46.4215,
        long: 7.8225
      }
    },
    contact: "research@ethz.ch",
    status: "active"
  },
  {
    id: "blatten-environmental-sensor",
    title: "Environmental Monitoring Sensor",
    description: "Automated weather and environmental data collection point for avalanche prediction",
    type: "sensor",
    severity: "medium",
    metadata: {
      coordinates: {
        lat: 46.4202,
        long: 7.8210
      }
    },
    contact: "sensors@swissmet.ch",
    status: "active"
  }
];

// Helper function to extract coordinates from POIs array
// Following the tutorial pattern exactly
export function getPOICoordinates(pois: POI[]): Array<{lat: number, long: number}> {
  return pois
    .filter(poi => 
      poi.metadata && 
      poi.metadata.coordinates &&
      typeof poi.metadata.coordinates.lat === 'number' &&
      typeof poi.metadata.coordinates.long === 'number'
    )
    .map(poi => ({
      lat: poi.metadata.coordinates.lat,
      long: poi.metadata.coordinates.long
    }));
}

// Get POI marker color based on type
export function getPOIColor(type: POI['type']): string {
  const colors = {
    research: '#1890ff',    // Blue for research
    sensor: '#52c41a',      // Green for sensors
    emergency: '#ff4d4f',   // Red for emergency
    hospital: '#f5222d',    // Dark red for hospitals
    army: '#722ed1',        // Purple for army
    fire_station: '#ff7a00', // Orange for fire stations
    helicopter: '#ff1744',   // Bright red for helicopters
    shelter: '#4caf50',      // Green for shelters
    infrastructure: '#9c27b0', // Purple for infrastructure
    hazard: '#ff0000',      // Bright red for hazard points
    other: '#faad14'        // Orange for other
  };
  
  return colors[type] || colors.other;
}

// Get POI icon symbol based on type
export function getPOIIcon(type: POI['type']): string {
  const icons = {
    research: '🔬',
    sensor: '📡',
    emergency: '🚁',
    hospital: '🏥',
    army: '⚔️',
    fire_station: '🚒',
    helicopter: '🚁',
    shelter: '🏠',
    infrastructure: '⚡',
    hazard: '⚠️',
    other: '📍'
  };
  
  return icons[type] || icons.other;
}
