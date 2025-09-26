"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"

export interface MapRef {
  toggleTerrain: (enabled: boolean, exaggeration?: number) => void
}

interface MapContainerProps {
  onMapLoad?: (map: any) => void
}

export const MapContainer = forwardRef<MapRef, MapContainerProps>(({ onMapLoad }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const terrainEnabled = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)

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
  }))

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    setMapboxToken(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null)
  }, [])

  useEffect(() => {
    // Initialize Mapbox when token is provided
    const initializeMap = async () => {
      if (typeof window !== "undefined" && mapContainer.current && !map.current) {
        try {
          // Dynamic import of mapbox-gl
          const mapboxgl = await import("mapbox-gl")

          // Check if token is available
          if (!mapboxToken) {
            console.log(
              "Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.",
            )
            return
          }

          mapboxgl.default.accessToken = mapboxToken

          map.current = new mapboxgl.default.Map({
            container: mapContainer.current,
            style: "mapbox://styles/x123654/cmg0n9qml00j401qy4a4ugyml",
            center: [-119.5, 37.5], // Yosemite area with significant elevation
            zoom: 10,
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

            console.log("[v0] Terrain layer added with 1.2x realistic exaggeration")

            if (onMapLoad) {
              onMapLoad(map.current)
            }
          })

          // Add navigation controls
          map.current.addControl(new mapboxgl.default.NavigationControl(), "top-right")
        } catch (error) {
          console.error("Error initializing Mapbox:", error)
        }
      }
    }

    initializeMap()

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onMapLoad, mapboxToken, isClient])

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
    </div>
  )
})

MapContainer.displayName = "MapContainer"
