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
  addPolygon: (polygon: any) => void
  removePolygon: (polygonId: string) => void
  updatePolygon: (polygonId: string, updates: Partial<any>) => void
  getMapInstance: () => any
}

interface MapContainerProps {
  onMapLoad?: (map: any) => void
  pois?: POI[]
  onPolygonClick?: (polygon: any, clickPosition: { x: number; y: number }) => void
}

export const MapContainer = forwardRef<MapRef, MapContainerProps>(({ onMapLoad, pois = blattentPOIs, onPolygonClick }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const terrainEnabled = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)
  // Global array to track POI markers - following tutorial pattern
  const [poiMarkers, setPOIMarkers] = useState<any[]>([])
  // Track polygons
  const [polygons, setPolygons] = useState<any[]>([])
  const polygonsRef = useRef<any[]>([])
  const onPolygonClickRef = useRef<((polygon: any, clickPosition: { x: number; y: number }) => void) | undefined>(onPolygonClick)
  const globalClickHandlerAdded = useRef(false)

  // Simple point-in-polygon test
  const pointInPolygon = (point: [number, number], polygon: [number, number][]) => {
    const [x, y] = point
    let inside = false
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i]
      const [xj, yj] = polygon[j]
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    
    return inside
  }
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
    addPolygon: (polygon: any) => {
      if (!map.current) return
      
      console.log("[MapContainer] Adding polygon:", polygon)
      
      // Add polygon source and layer
      const sourceId = `polygon-${polygon.id}`
      const layerId = `polygon-layer-${polygon.id}`
      const outlineLayerId = `polygon-outline-${polygon.id}`
      
      console.log("[MapContainer] Creating layers:", { sourceId, layerId, outlineLayerId })
      
      // Create GeoJSON for the polygon
      const geojson = {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [polygon.vertices.map((vertex: [number, number]) => vertex)]
        },
        properties: {
          id: polygon.id,
          name: polygon.name,
          color: polygon.color,
          fillColor: polygon.fillColor
        }
      }
      
      // Add source
      map.current.addSource(sourceId, {
        type: "geojson",
        data: geojson
      })
      
      // Add fill layer at the very top of the layer stack for maximum click priority
      map.current.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        minzoom: 0,
        maxzoom: 24,
        paint: {
          "fill-color": polygon.fillColor,
          "fill-opacity": 0.3
        }
      }) // No beforeLayer - adds to the very top
      
      // Add outline layer at the very top for maximum click priority
      map.current.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        minzoom: 0,
        maxzoom: 24,
        paint: {
          "line-color": polygon.color,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 5,
            5, 6,
            10, 4,
            15, 4,
            20, 5
          ],
          "line-opacity": 1.0
        }
      }) // No beforeLayer - adds to the very top
      
      // Add a much larger invisible clickable area at the very top for maximum click priority
      const clickableLayerId = `polygon-clickable-${polygon.id}`
      map.current.addLayer({
        id: clickableLayerId,
        type: "fill",
        source: sourceId,
        minzoom: 0,
        maxzoom: 24,
        paint: {
          "fill-color": "rgba(255,0,0,0.01)", // Barely visible red for debugging
          "fill-opacity": 0.01
        }
      }) // No beforeLayer - adds to the very top
      
      // Store polygon data for global click handler
      console.log("[MapContainer] Polygon added, will be handled by global click handler:", polygon.id)
      
      // Change cursor on hover for all layers
      const polygonLayers = [layerId, outlineLayerId, clickableLayerId]
      polygonLayers.forEach((layer: string) => {
        map.current.on('mouseenter', layer, () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        
        map.current.on('mouseleave', layer, () => {
          map.current.getCanvas().style.cursor = ''
        })
      })
      
      setPolygons(prev => {
        const newPolygons = [...prev, polygon]
        console.log("[MapContainer] Updated polygons state:", newPolygons)
        console.log("[MapContainer] Polygon layers created successfully")
        
        // Verify layers exist
        setTimeout(() => {
          const layerExists = map.current.getLayer(layerId)
          const sourceExists = map.current.getSource(sourceId)
          console.log("[MapContainer] Layer verification:", { layerExists: !!layerExists, sourceExists: !!sourceExists })
        }, 100)
        
        return newPolygons
      })
    },
    removePolygon: (polygonId: string) => {
      if (!map.current) return
      
      console.log("[MapContainer] Removing polygon:", polygonId)
      
      const sourceId = `polygon-${polygonId}`
      const layerId = `polygon-layer-${polygonId}`
      const outlineLayerId = `polygon-outline-${polygonId}`
      const clickableLayerId = `polygon-clickable-${polygonId}`
      
      // Remove event handlers first
      const polygonLayersToRemove = [layerId, outlineLayerId, clickableLayerId]
      polygonLayersToRemove.forEach((layer: string) => {
        map.current.off('click', layer)
        map.current.off('mouseenter', layer)
        map.current.off('mouseleave', layer)
      })
      
      // Remove layers and source
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId)
      }
      if (map.current.getLayer(outlineLayerId)) {
        map.current.removeLayer(outlineLayerId)
      }
      if (map.current.getLayer(clickableLayerId)) {
        map.current.removeLayer(clickableLayerId)
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId)
      }
      
      setPolygons(prev => prev.filter(p => p.id !== polygonId))
    },
    updatePolygon: (polygonId: string, updates: Partial<any>) => {
      if (!map.current) return
      
      console.log("[MapContainer] Updating polygon:", polygonId, updates)
      
      setPolygons(prev => prev.map(p => 
        p.id === polygonId ? { ...p, ...updates } : p
      ))
      
      // Update the map source data if needed
      const sourceId = `polygon-${polygonId}`
      if (map.current.getSource(sourceId)) {
        const updatedPolygon = polygons.find(p => p.id === polygonId)
        if (updatedPolygon) {
          const geojson = {
            type: "Feature" as const,
            geometry: {
              type: "Polygon" as const,
              coordinates: [updatedPolygon.vertices.map((vertex: [number, number]) => vertex)]
            },
            properties: {
              id: updatedPolygon.id,
              name: updates.name || updatedPolygon.name,
              color: updates.color || updatedPolygon.color,
              fillColor: updates.fillColor || updatedPolygon.fillColor
            }
          }
          map.current.getSource(sourceId).setData(geojson)
        }
      }
    },
    getMapInstance: () => {
      return map.current
    },
  }))

  // Update refs when props or state change
  useEffect(() => {
    polygonsRef.current = polygons
  }, [polygons])

  useEffect(() => {
    onPolygonClickRef.current = onPolygonClick
  }, [onPolygonClick])

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

            console.log("[v0] Terrain layer added with 1.2x realistic exaggeration")
            console.log("[v0] Building layers added with early visibility (zoom 10+)")

            // Add SIMPLE global click handler that checks polygon geometry directly
            if (!globalClickHandlerAdded.current) {
              map.current.on('click', (e: any) => {
                console.log("[MapContainer] Global click at:", e.lngLat.lng, e.lngLat.lat)
                console.log("[MapContainer] Available polygons:", polygonsRef.current.length)
                console.log("[MapContainer] Polygons data:", polygonsRef.current)
                
                // Check each polygon manually using point-in-polygon
                const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
                
                for (const polygon of polygonsRef.current) {
                  console.log("[MapContainer] Checking polygon:", polygon.id, "vertices:", polygon.vertices)
                  if (pointInPolygon(clickPoint, polygon.vertices)) {
                    console.log("[MapContainer] DIRECT GEOMETRY HIT - Polygon clicked:", polygon.id)
                    if (onPolygonClickRef.current) {
                      onPolygonClickRef.current(polygon, { x: e.point.x, y: e.point.y })
                      return // Stop checking other polygons
                    }
                  }
                }
                
                console.log("[MapContainer] No polygon hit at click point")
              })
              globalClickHandlerAdded.current = true
              console.log("[MapContainer] Global polygon click handler added")
            }

            // Create POI markers after map loads
            if (pois && pois.length > 0) {
              createPOIMarkers(map.current, pois).catch(() => { })
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

    createPOIMarkers(map.current, pois).catch(() => { })
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
        <div key="map-placeholder" className="absolute inset-0 bg-muted flex items-center justify-center">
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

    </div>
  )
})

MapContainer.displayName = "MapContainer"