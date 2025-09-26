"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { POI, getPOICoordinates, getPOIColor, getPOIIcon, blattentPOIs } from "@/data/pois"
import { useData } from "@/lib/data-context"
import type { VehicleMovement } from "@/lib/data-context"
import { VehicleTrackingService } from "@/services/vehicle-tracking.service"
import "mapbox-gl/dist/mapbox-gl.css"

export interface MapRef {
  toggleTerrain: (enabled: boolean, exaggeration?: number) => void
  flyToLocation: (coordinates: [number, number], zoom?: number, boundingBox?: [number, number, number, number]) => void
}

interface MapContainerProps {
  onMapLoad?: (map: any) => void
  pois?: POI[]
}

export const MapContainer = forwardRef<MapRef, MapContainerProps>(({ onMapLoad, pois = blattentPOIs }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const terrainEnabled = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)
  // Global array to track POI markers - following tutorial pattern
  const [poiMarkers, setPOIMarkers] = useState<any[]>([])
  // Global map to track vehicle markers by movement ID
  const [vehicleMarkers, setVehicleMarkers] = useState<Map<string, any>>(new Map())
  // Track which routes have been added to prevent re-adding
  const [addedRoutes, setAddedRoutes] = useState<Set<string>>(new Set())
  // Vehicle tracking service
  const [vehicleTrackingService, setVehicleTrackingService] = useState<VehicleTrackingService | null>(null)
  
  // Get vehicle movements from data context
  const { vehicleMovements, updateVehicleMovement } = useData()

  useImperativeHandle(ref, () => ({
    toggleTerrain: (enabled: boolean, exaggeration = 1.2) => {
      if (map.current) {
        if (enabled) {
          map.current.setTerrain({ source: "mapbox-dem", exaggeration })
        } else {
          map.current.setTerrain(null)
        }
        terrainEnabled.current = enabled
      }
    },
    flyToLocation: (coordinates: [number, number], zoom = 14, boundingBox) => {
      if (!map.current) {
        return
      }

      if (boundingBox) {
        // Fit to bounding box if provided
        map.current.fitBounds(boundingBox, {
          padding: 50,
          maxZoom: 16,
          duration: 2000
        })
      } else {
        // Fly to specific coordinates
        map.current.flyTo({
          center: coordinates,
          zoom: zoom,
          duration: 2000,
          essential: true
        })
      }
    },
  }))

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null
    setMapboxToken(token)
    
    // Initialize vehicle tracking service when token is available
    if (token) {
      const service = new VehicleTrackingService({
        mapboxToken: token,
        onPositionUpdate: (vehicleId, position, progress) => {
          updateVehicleMovement(vehicleId, {
            currentPosition: position,
            progress
          })
        },
        onRouteUpdate: (vehicleId, route) => {
          updateVehicleMovement(vehicleId, {
            route: {
              coordinates: route.coordinates,
              distance: route.distance,
              duration: route.duration
            }
          })
        },
        onVehicleArrived: (vehicleId) => {
          updateVehicleMovement(vehicleId, {
            status: 'arrived',
            progress: 1,
            currentPosition: vehicleMovements.find(m => m.id === vehicleId)?.to || { lat: 0, lng: 0 }
          })
        }
      })
      setVehicleTrackingService(service)
    }
  }, [])

  // Function to create POI markers - following tutorial pattern exactly
  const createPOIMarkers = async (mapInstance: any, poisData: POI[]) => {
    // Remove existing markers
    poiMarkers.forEach(marker => marker.remove())
    setPOIMarkers([])

    const coords = getPOICoordinates(poisData)
    const newMarkers: any[] = []

    // Import mapboxgl dynamically
    const mapboxgl = await import("mapbox-gl")

    coords.forEach(({ lat, long }: { lat: number, long: number }, idx: number) => {
      if (typeof lat === 'number' && typeof long === 'number') {
        const poi = poisData[idx]
        const color = getPOIColor(poi.type)
        const icon = getPOIIcon(poi.type)

        // Create custom marker element - following tutorial pattern
        const el = document.createElement('div')
        el.className = 'poi-marker'
        el.innerHTML = `
          <svg viewBox="0 0 26 26" width="26" height="26">
            <circle cx="13" cy="13" r="12" fill="${color}" stroke="#ffffff" stroke-width="2"/>
            <text x="13" y="18" text-anchor="middle"
                  font-size="12" font-weight="700" fill="#ffffff"
                  font-family="Arial, sans-serif">${icon}</text>
          </svg>
        `

        // Add click handler - following tutorial pattern
        el.style.cursor = "pointer"
        el.onclick = () => {
          // Handle POI click - could open modal, show details, etc.
          alert(`${poi.title}\n${poi.description}`)
        }

        // Create and add marker to map - following tutorial pattern
        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([long, lat]) // Note: Mapbox expects [lng, lat]
          .addTo(mapInstance)

        newMarkers.push(marker)
      }
    })

    setPOIMarkers(newMarkers)
  }

  // Function to create vehicle markers and route lines
  const createVehicleMarkers = async (mapInstance: any, movements: VehicleMovement[]) => {
    if (!mapInstance || movements.length === 0) return

    const mapboxgl = await import("mapbox-gl")
    const newMarkers = new Map<string, any>()
    const newAddedRoutes = new Set<string>()

    // Only process new movements that don't have markers yet
    movements.forEach((movement) => {
      if (movement.status === 'traveling' && !vehicleMarkers.has(movement.id)) {
        const vehicleIcon = getVehicleIcon(movement.vehicleType)
        const vehicleColor = getVehicleColor(movement.vehicleType)

        // Create vehicle marker element
        const el = document.createElement('div')
        el.className = 'vehicle-marker'
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="${vehicleColor}" stroke="#ffffff" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle"
                  font-size="10" font-weight="700" fill="#ffffff"
                  font-family="Arial, sans-serif">${vehicleIcon}</text>
          </svg>
        `

        // Add pulsing animation for moving vehicles
        el.style.animation = 'pulse 2s infinite'
        el.style.cursor = "pointer"

        // Add click handler
        el.onclick = () => {
          const routeInfo = movement.route ? 
            `\nRoute: ${(movement.route.distance / 1000).toFixed(1)}km, ${Math.round(movement.route.duration / 60)}min` : 
            '\nRoute: Direct path'
          alert(`Vehicle: ${movement.vehicleType}\nFrom: ${movement.from.name}\nTo: ${movement.to.name}\nProgress: ${Math.round(movement.progress * 100)}%${routeInfo}`)
        }

        // Create and add marker to map
        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([movement.currentPosition.lng, movement.currentPosition.lat])
          .addTo(mapInstance)

        newMarkers.set(movement.id, marker)

        // Add route line if available and not already added
        if (movement.route && movement.route.coordinates.length > 0 && !addedRoutes.has(movement.id)) {
          addRouteToMap(mapInstance, movement.id, movement.route.coordinates, vehicleColor)
          newAddedRoutes.add(movement.id)
        }
      } else if (vehicleMarkers.has(movement.id)) {
        // Keep existing marker
        newMarkers.set(movement.id, vehicleMarkers.get(movement.id))
        if (addedRoutes.has(movement.id)) {
          newAddedRoutes.add(movement.id)
        }
      }
    })

    // Remove markers for movements that no longer exist
    vehicleMarkers.forEach((marker, id) => {
      if (!movements.find(m => m.id === id)) {
        marker.remove()
      }
    })

    setVehicleMarkers(newMarkers)
    setAddedRoutes(newAddedRoutes)
  }

  // Function to add a single route to the map
  const addRouteToMap = (mapInstance: any, movementId: string, coordinates: [number, number][], color: string) => {
    const sourceId = `route-${movementId}`
    const layerId = `route-layer-${movementId}`

    // Add source for this specific route
    mapInstance.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { color },
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    })

    // Add layer for this specific route
    mapInstance.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1890ff', // Blue color
        'line-width': 2, // Thinner line
        'line-opacity': 0.8
        // Removed line-dasharray to make it a solid line
      }
    })
  }

  // Get vehicle icon based on type
  const getVehicleIcon = (vehicleType: VehicleMovement['vehicleType']): string => {
    const icons = {
      ambulance: '🚑',
      fire_truck: '🚒',
      police: '🚔',
      helicopter: '🚁',
      evacuation_bus: '🚌'
    }
    return icons[vehicleType] || '🚗'
  }

  // Get vehicle color based on type
  const getVehicleColor = (vehicleType: VehicleMovement['vehicleType']): string => {
    const colors = {
      ambulance: '#ff4d4f',
      fire_truck: '#ff7a00',
      police: '#1890ff',
      helicopter: '#722ed1',
      evacuation_bus: '#52c41a'
    }
    return colors[vehicleType] || '#faad14'
  }

  useEffect(() => {
    // Initialize Mapbox when token is provided
    const initializeMap = async () => {

      if (typeof window !== "undefined" && mapContainer.current && !map.current) {
        try {
          // Dynamic import of mapbox-gl
          const mapboxgl = await import("mapbox-gl")

          // Check if token is available
          if (!mapboxToken) {
            return
          }


          mapboxgl.default.accessToken = mapboxToken

          map.current = new mapboxgl.default.Map({
            container: mapContainer.current,
            style: "mapbox://styles/x123654/cmg0n9qml00j401qy4a4ugyml",
            center: [7.8219, 46.4208], // Centered on Blatten - [longitude, latitude]
            zoom: 12, // Closer zoom to see POIs
            pitch: 60,
            bearing: -17.6,
            attributionControl: false,
          })

          map.current.on("load", () => {
            // Add terrain source
            map.current.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            })

            map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 })

            // Add sky layer for better 3D effect
            map.current.addLayer({
              id: "sky",
              type: "sky",
              paint: {
                "sky-type": "atmosphere",
                "sky-atmosphere-sun": [0.0, 0.0],
                "sky-atmosphere-sun-intensity": 15,
              },
            })

            // Add building layers with lower zoom thresholds for earlier visibility
            // First add the building source
            map.current.addSource("mapbox-buildings", {
              type: "vector",
              url: "mapbox://mapbox.mapbox-streets-v8"
            })

            map.current.addLayer({
              id: "buildings-3d",
              type: "fill-extrusion",
              source: "mapbox-buildings",
              "source-layer": "building",
              minzoom: 10, // Show buildings starting at zoom level 10 (much earlier)
              paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10, 0,
                  15, ["get", "height"]
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10, 0,
                  15, ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.6
              }
            })

            // Add building outlines for better definition
            map.current.addLayer({
              id: "building-outline",
              type: "line",
              source: "mapbox-buildings",
              "source-layer": "building",
              minzoom: 10, // Show outlines starting at zoom level 10
              paint: {
                "line-color": "#666",
                "line-width": 0.5,
                "line-opacity": 0.8
              }
            })

            // Create POI markers after map loads
            if (pois && pois.length > 0) {
              createPOIMarkers(map.current, pois).catch(() => {})
            }

            if (onMapLoad) {
              onMapLoad(map.current)
            }
          })

          // Add navigation controls at bottom-right
          map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")
        } catch (error) {
          // Silently handle map initialization errors
        }
      }
    }

    initializeMap()

    return () => {
      // Cleanup POI markers
      poiMarkers.forEach(marker => marker.remove())
      // Cleanup vehicle markers
      vehicleMarkers.forEach(marker => marker.remove())
      // Cleanup vehicle tracking service
      if (vehicleTrackingService) {
        vehicleTrackingService.cleanup()
      }
      // Cleanup vehicle routes
      if (map.current) {
        addedRoutes.forEach(movementId => {
          const sourceId = `route-${movementId}`
          const layerId = `route-layer-${movementId}`
          if (map.current.getLayer(layerId)) {
            map.current.removeLayer(layerId)
          }
          if (map.current.getSource(sourceId)) {
            map.current.removeSource(sourceId)
          }
        })
        map.current.remove()
      }
    }
  }, [onMapLoad, mapboxToken, isClient])

  // Update POI markers when pois change - following tutorial pattern
  useEffect(() => {
    if (!map.current || !pois) return

    createPOIMarkers(map.current, pois).catch(() => {})
  }, [pois])

  // Handle vehicle movements with the tracking service
  useEffect(() => {
    if (!vehicleTrackingService || !map.current) return

    // Start tracking new vehicles
    vehicleMovements.forEach(movement => {
      if (movement.status === 'traveling' && !vehicleMarkers.has(movement.id)) {
        vehicleTrackingService.startVehicleTracking(movement)
      }
    })

    // Create/update markers for all vehicles
    createVehicleMarkers(map.current, vehicleMovements).catch(() => {})
  }, [vehicleMovements, vehicleTrackingService])

  // Update vehicle marker positions when movements change
  useEffect(() => {
    if (!map.current) return
    
    updateVehicleMarkerPositions(map.current, vehicleMovements)
  }, [vehicleMovements])

  // Function to update vehicle marker positions without recreating them
  const updateVehicleMarkerPositions = (mapInstance: any, movements: VehicleMovement[]) => {
    movements.forEach((movement) => {
      if (movement.status === 'traveling') {
        const marker = vehicleMarkers.get(movement.id)
        if (marker) {
          marker.setLngLat([
            movement.currentPosition.lng,
            movement.currentPosition.lat
          ])
        }
      }
    })
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: "100%" }} />

      {/* Placeholder when no token */}
      {!mapboxToken && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Mapbox Integration Ready</h3>
            <p className="text-muted-foreground max-w-md">
              Add your <code className="bg-accent px-2 py-1 rounded text-sm">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>{" "}
              environment variable to display the interactive map with 3D terrain.
            </p>
          </div>
        </div>
      )}

      {/* POI Legend - Moved to right side below search */}
      {mapboxToken && pois && pois.length > 0 && (
        <div className="absolute top-20 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-sm mb-2">Points of Interest</h4>
          <div className="space-y-1 text-xs">
            {pois.map((poi: POI) => (
              <div key={poi.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: getPOIColor(poi.type) }}
                />
                <span>{poi.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

MapContainer.displayName = "MapContainer"