"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { POI, getPOICoordinates, getPOIColor, getPOIIcon, getPOIIconName, blattentPOIs } from "@/data/pois"
import { useTime } from "@/lib/time-context"
import {
  Microscope, Radio, AlertTriangle, Cross, Shield, Flame,
  Plane, Home, Zap, AlertCircle, MapPin
} from "lucide-react"
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

// Helper function to get Lucide React icon component
const getLucideIcon = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Microscope,
    Radio,
    AlertTriangle,
    Cross,
    Shield,
    Flame,
    Plane,
    Home,
    Zap,
    AlertCircle,
    MapPin
  };
  return iconMap[iconName] || MapPin;
};

// Helper function to get SVG paths for Lucide icons
const getIconSVGPath = (iconName: string): string => {
  const iconPaths: { [key: string]: string } = {
    Microscope: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 9a7 7 0 0 0-7 7"/><path d="M17 9a7 7 0 0 1 7 7"/><path d="M10 2v2"/><path d="M14 2v2"/><path d="M12 6v2"/>',
    Radio: '<path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/>',
    AlertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    Cross: '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2Z"/>',
    Shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    Flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    Plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1.1.4 1.3L9 12l-2 3H4l-1 1 3 2 2-3h2l3-3 3.5 5.5c.2.5.8.6 1.3.4l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>',
    Zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>',
    AlertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    MapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  };
  return iconPaths[iconName] || iconPaths.MapPin;
};

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
  // State for POI hover info
  const [hoveredPOI, setHoveredPOI] = useState<POI | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  // Get timeline context
  const { getDisplayTime, timeOffset, isRealTimeEnabled } = useTime()

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
        const iconName = getPOIIconName(poi.type)

        // Create dark liquid glass marker element
        const el = document.createElement('div')
        el.className = 'poi-marker-dark-glass'
        el.innerHTML = `
          <div class="poi-marker-container" style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
              0 4px 16px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          ">
            <div class="liquid-glass-overlay" style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
              border-radius: 50%;
              pointer-events: none;
            "></div>
            <div style="
              color: ${color === '#ef4444' ? '#ef4444' : '#94a3b8'};
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                ${getIconSVGPath(iconName)}
              </svg>
            </div>
          </div>
        `

        // Add hover and click handlers - following tutorial pattern
        el.style.cursor = "pointer"

        // Add hover handlers
        el.onmouseenter = (e) => {
          setHoveredPOI(poi)
          setHoverPosition({ x: e.clientX, y: e.clientY })
        }

        el.onmouseleave = () => {
          setHoveredPOI(null)
          setHoverPosition(null)
        }

        el.onmousemove = (e) => {
          setHoverPosition({ x: e.clientX, y: e.clientY })
        }

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
      // Cleanup map
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onMapLoad, mapboxToken, isClient])

  // Update POI markers when pois change - following tutorial pattern
  useEffect(() => {
    if (!map.current || !pois) return

    createPOIMarkers(map.current, pois).catch(() => { })
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

      {/* Dark Liquid Glass POI Hover Info Box */}
      {hoveredPOI && hoverPosition && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: hoverPosition.x + 20,
            top: hoverPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div
            className="poi-hover-dark-glass"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              padding: '20px',
              color: '#e2e8f0',
              fontSize: '13px',
              minWidth: "280px",
              maxWidth: "360px",
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Liquid glass overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent)',
              borderRadius: '16px',
              pointerEvents: 'none'
            }}></div>

            <div className="flex items-center gap-4 mb-4" style={{ position: 'relative', zIndex: 1 }}>
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: getPOIColor(hoveredPOI.type) === '#ef4444' ? '#ef4444' : '#94a3b8'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: getIconSVGPath(getPOIIconName(hoveredPOI.type)) }}>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-slate-100">{hoveredPOI.title}</h3>
                <p className="text-xs text-slate-400 capitalize">{hoveredPOI.type}</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-4" style={{ position: 'relative', zIndex: 1 }}>
              {hoveredPOI.description}
            </p>

            <div className="flex items-center justify-between" style={{ position: 'relative', zIndex: 1 }}>
              {hoveredPOI.severity && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: hoveredPOI.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                      hoveredPOI.severity === 'medium' ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(34, 197, 94, 0.2)',
                    color: hoveredPOI.severity === 'high' ? '#fca5a5' :
                      hoveredPOI.severity === 'medium' ? '#fbbf24' :
                        '#86efac',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                >
                  {hoveredPOI.severity}
                </span>
              )}
              {hoveredPOI.contact && (
                <span className="text-xs text-slate-400">
                  {hoveredPOI.contact}
                </span>
              )}
            </div>
          </div>
        </div>
      )}


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