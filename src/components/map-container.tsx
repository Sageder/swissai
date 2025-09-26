"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { POI, getPOICoordinates, getPOIColor, getPOIIcon, blattentPOIs } from "@/data/pois"
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

  useImperativeHandle(ref, () => ({
    toggleTerrain: (enabled: boolean, exaggeration = 1.2) => {
      if (map.current) {
        if (enabled) {
          map.current.setTerrain({ source: "mapbox-dem", exaggeration })
          console.log(`[v0] Terrain enabled with ${exaggeration}x exaggeration`)
        } else {
          map.current.setTerrain(null)
          console.log("[v0] Terrain disabled")
        }
        terrainEnabled.current = enabled
      }
    },
    flyToLocation: (coordinates: [number, number], zoom = 14, boundingBox) => {
      if (!map.current) {
        console.warn('Map not initialized, cannot fly to location')
        return
      }

      console.log('Flying to location:', coordinates, 'zoom:', zoom, 'boundingBox:', boundingBox)

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
    console.log('Mapbox token loaded:', token ? 'Token found' : 'No token')
    setMapboxToken(token)
  }, [])

  // Function to create POI markers - following tutorial pattern exactly
  const createPOIMarkers = async (mapInstance: any, poisData: POI[]) => {
    console.log('Creating POI markers for:', poisData.length, 'POIs')

    // Remove existing markers
    poiMarkers.forEach(marker => marker.remove())
    setPOIMarkers([])

    const coords = getPOICoordinates(poisData)
    console.log('POI coordinates:', coords)
    const newMarkers: any[] = []

    // Import mapboxgl dynamically
    const mapboxgl = await import("mapbox-gl")

    coords.forEach(({ lat, long }: { lat: number, long: number }, idx: number) => {
      if (typeof lat === 'number' && typeof long === 'number') {
        const poi = poisData[idx]
        const color = getPOIColor(poi.type)
        const icon = getPOIIcon(poi.type)

        console.log(`Creating marker for ${poi.title} at [${long}, ${lat}] with color ${color}`)

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
          console.log('POI clicked:', poi)
          // Handle POI click - could open modal, show details, etc.
          alert(`${poi.title}\n${poi.description}`)
        }

        // Create and add marker to map - following tutorial pattern
        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([long, lat]) // Note: Mapbox expects [lng, lat]
          .addTo(mapInstance)

        console.log('Added marker:', marker)
        newMarkers.push(marker)
      }
    })

    console.log('Total markers created:', newMarkers.length)
    setPOIMarkers(newMarkers)
  }

  useEffect(() => {
    // Initialize Mapbox when token is provided
    const initializeMap = async () => {
      console.log('Initializing map...', {
        window: typeof window,
        container: !!mapContainer.current,
        existingMap: !!map.current,
        token: !!mapboxToken
      })

      if (typeof window !== "undefined" && mapContainer.current && !map.current) {
        try {
          // Dynamic import of mapbox-gl
          const mapboxgl = await import("mapbox-gl")
          console.log('Mapbox GL imported successfully')

          // Check if token is available
          if (!mapboxToken) {
            console.log(
              "Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.",
            )
            return
          }

          console.log('Creating Mapbox map with token...')

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

          console.log('Mapbox map created successfully:', map.current)

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

            // Create POI markers after map loads
            if (pois && pois.length > 0) {
              createPOIMarkers(map.current, pois).catch(console.error)
            }

            if (onMapLoad) {
              onMapLoad(map.current)
            }
          })

          // Add navigation controls at bottom-right
          map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")
        } catch (error) {
          console.error("Error initializing Mapbox:", error)
          console.error("Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          })
        }
      }
    }

    initializeMap()

    return () => {
      // Cleanup POI markers
      poiMarkers.forEach(marker => marker.remove())
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onMapLoad, mapboxToken, isClient])

  // Update POI markers when pois change - following tutorial pattern
  useEffect(() => {
    if (!map.current || !pois) return

    createPOIMarkers(map.current, pois).catch(console.error)
  }, [pois])

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