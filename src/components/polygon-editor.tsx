"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Pentagon, Move, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface PolygonPoint {
  id: string
  coordinates: [number, number] // [lng, lat]
  screenPosition?: { x: number; y: number }
}

export interface PolygonData {
  id: string
  name: string
  vertices: [number, number][] // Array of [lng, lat] coordinates
  color: string
  fillColor: string
  completed: boolean
}

interface PolygonEditorProps {
  onPolygonComplete: (polygon: PolygonData) => void
  onPolygonUpdate?: (polygonId: string, polygon: PolygonData) => void
  mapRef?: React.RefObject<any>
  editingPolygon?: PolygonData | null
  sidebarExpanded?: boolean
}

export function PolygonEditor({ onPolygonComplete, onPolygonUpdate, mapRef, editingPolygon, sidebarExpanded = false }: PolygonEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<PolygonPoint[]>([])
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null)
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)
  const [isDraggingPoint, setIsDraggingPoint] = useState(false)
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [hasDraggedPoint, setHasDraggedPoint] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Generate random colors for polygons
  const generateColors = () => {
    const colors = [
      { stroke: "#3B82F6", fill: "#3B82F6" }, // Blue
      { stroke: "#EF4444", fill: "#EF4444" }, // Red
      { stroke: "#10B981", fill: "#10B981" }, // Green
      { stroke: "#F59E0B", fill: "#F59E0B" }, // Yellow
      { stroke: "#8B5CF6", fill: "#8B5CF6" }, // Purple
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const startEditing = useCallback(() => {
    setIsEditing(true)
    setCurrentPoints([])
    setEditingPolygonId(null)
    console.log("[PolygonEditor] Started polygon creation mode")
  }, [])

  const startEditingExisting = useCallback((polygon: PolygonData) => {
    setIsEditing(true)
    setEditingPolygonId(polygon.id)
    
    // Convert polygon vertices to editable points with screen positions
    const mapInstance = mapRef?.current?.getMapInstance()
    if (mapInstance) {
      const points: PolygonPoint[] = polygon.vertices.map((vertex, index) => {
        const screenPos = mapInstance.project(vertex)
        return {
          id: `edit-point-${polygon.id}-${index}`,
          coordinates: vertex,
          screenPosition: { x: screenPos.x, y: screenPos.y }
        }
      })
      setCurrentPoints(points)
      console.log("[PolygonEditor] Started editing existing polygon:", polygon.id, "with", points.length, "points")
    }
  }, [mapRef])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setCurrentPoints([])
    setDraggedPointId(null)
    setHoveredPointId(null)
    console.log("[PolygonEditor] Exited polygon creation mode")
  }, [])

  const completePolygon = useCallback((points: PolygonPoint[]) => {
    if (points.length < 3) {
      console.warn("[PolygonEditor] Need at least 3 points to create a polygon")
      return
    }

    if (editingPolygonId && onPolygonUpdate && editingPolygon) {
      // Update existing polygon - preserve original name and colors
      const updatedPolygonData: PolygonData = {
        id: editingPolygonId,
        name: editingPolygon.name, // Keep original name
        vertices: points.map(p => p.coordinates),
        color: editingPolygon.color, // Keep original color
        fillColor: editingPolygon.fillColor, // Keep original fill color
        completed: true
      }

      console.log("[PolygonEditor] Polygon updated:", updatedPolygonData)
      onPolygonUpdate(editingPolygonId, updatedPolygonData)
    } else {
      // Create new polygon
      const colors = generateColors()
      const polygonData: PolygonData = {
        id: `polygon-${Date.now()}`,
        name: `Polygon ${Date.now()}`,
        vertices: points.map(p => p.coordinates),
        color: colors.stroke,
        fillColor: colors.fill,
        completed: true
      }

      console.log("[PolygonEditor] Polygon completed:", polygonData)
      onPolygonComplete(polygonData)
    }
    
    stopEditing()
  }, [editingPolygonId, editingPolygon, onPolygonUpdate, onPolygonComplete, stopEditing])

  const addPoint = useCallback((coordinates: [number, number], screenPosition: { x: number; y: number }) => {
    const newPoint: PolygonPoint = {
      id: `point-${Date.now()}-${Math.random()}`,
      coordinates,
      screenPosition
    }

    setCurrentPoints(prev => {
      console.log("[PolygonEditor] Added point:", newPoint)
      return [...prev, newPoint]
    })
  }, [])

  const removePoint = useCallback((pointId: string) => {
    setCurrentPoints(prev => prev.filter(p => p.id !== pointId))
    console.log("[PolygonEditor] Removed point:", pointId)
  }, [])

  const updatePointPosition = useCallback((pointId: string, newCoordinates: [number, number], newScreenPosition: { x: number; y: number }) => {
    setCurrentPoints(prev => prev.map(p => 
      p.id === pointId 
        ? { ...p, coordinates: newCoordinates, screenPosition: newScreenPosition }
        : p
    ))
  }, [])

  const handlePointClick = useCallback((pointId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Only complete polygon if we're NOT in editing mode, it's the first point, and it wasn't dragged
    if (!editingPolygonId && !hasDraggedPoint) {
      const isFirstPoint = currentPoints.length > 0 && currentPoints[0].id === pointId
      const canComplete = currentPoints.length >= 3
      
      if (isFirstPoint && canComplete) {
        console.log("[PolygonEditor] Clicked first point to complete polygon")
        completePolygon(currentPoints)
        return
      }
    }
    
    console.log("[PolygonEditor] Point clicked:", pointId)
  }, [currentPoints, completePolygon, editingPolygonId, hasDraggedPoint])

  const handlePointMouseDown = useCallback((pointId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Record start position and reset drag flag
    setDragStartPosition({ x: e.clientX, y: e.clientY })
    setHasDraggedPoint(false)
    
    // All points are draggable in both creation and editing modes
    setDraggedPointId(pointId)
    setIsDraggingPoint(true)
    console.log("[PolygonEditor] Started dragging point:", pointId)
  }, [])

  const handlePointDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingPoint || !draggedPointId || !mapRef?.current) return

    // Check if mouse has moved significantly (more than 5 pixels)
    if (dragStartPosition) {
      const deltaX = Math.abs(e.clientX - dragStartPosition.x)
      const deltaY = Math.abs(e.clientY - dragStartPosition.y)
      if (deltaX > 5 || deltaY > 5) {
        setHasDraggedPoint(true)
      }
    }

    const mapInstance = mapRef.current.getMapInstance()
    if (!mapInstance || typeof mapInstance.getContainer !== 'function' || typeof mapInstance.unproject !== 'function') return
    
    const rect = mapInstance.getContainer().getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newCoordinates = mapInstance.unproject([x, y])
    const newScreenPosition = { x, y }
    
    updatePointPosition(draggedPointId, [newCoordinates.lng, newCoordinates.lat], newScreenPosition)
  }, [isDraggingPoint, draggedPointId, mapRef, updatePointPosition, dragStartPosition])

  const handlePointMouseUp = useCallback(() => {
    if (isDraggingPoint) {
      setIsDraggingPoint(false)
      setDraggedPointId(null)
      setDragStartPosition(null)
      console.log("[PolygonEditor] Stopped dragging point")
    }
  }, [isDraggingPoint])

  // Add global mouse event listeners for point dragging
  useEffect(() => {
    if (isDraggingPoint) {
      document.addEventListener('mousemove', handlePointDrag)
      document.addEventListener('mouseup', handlePointMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handlePointDrag)
        document.removeEventListener('mouseup', handlePointMouseUp)
      }
    }
  }, [isDraggingPoint, handlePointDrag, handlePointMouseUp])

  // Auto-start editing when editingPolygon is provided
  useEffect(() => {
    if (editingPolygon && !isEditing) {
      startEditingExisting(editingPolygon)
    }
  }, [editingPolygon, isEditing, startEditingExisting])

  // Handle map clicks when in editing mode
  useEffect(() => {
    if (!isEditing || !mapRef?.current) return

    const handleMapClick = (e: any) => {
      console.log("[PolygonEditor] Map click intercepted in editing mode")
      e.stopPropagation?.()
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const screenPosition = { x: e.point.x, y: e.point.y }
      addPoint(coordinates, screenPosition)
    }

    const mapInstance = mapRef.current.getMapInstance()
    
    // Check if map is properly initialized and has the 'on' method
    if (mapInstance && typeof mapInstance.on === 'function' && mapInstance.isStyleLoaded && mapInstance.isStyleLoaded()) {
      // Add click handler with higher priority (earlier in the event chain)
      mapInstance.on('click', handleMapClick)
      
      return () => {
        if (mapInstance && typeof mapInstance.off === 'function') {
          mapInstance.off('click', handleMapClick)
        }
      }
    } else {
      // If map is not ready, wait for it to load
      const checkMapReady = () => {
        const currentMap = mapRef.current?.getMapInstance()
        if (currentMap && typeof currentMap.on === 'function' && currentMap.isStyleLoaded && currentMap.isStyleLoaded()) {
          currentMap.on('click', handleMapClick)
        } else {
          setTimeout(checkMapReady, 100)
        }
      }
      checkMapReady()
      
      return () => {
        const currentMap = mapRef.current?.getMapInstance()
        if (currentMap && typeof currentMap.off === 'function') {
          currentMap.off('click', handleMapClick)
        }
      }
    }
  }, [isEditing, mapRef, addPoint])

  // Update screen positions when map moves
  useEffect(() => {
    if (!isEditing || !mapRef?.current || currentPoints.length === 0) return

    const updateScreenPositions = () => {
      const mapInstance = mapRef.current?.getMapInstance()
      setCurrentPoints(prev => prev.map(point => {
        const screenPos = mapInstance?.project(point.coordinates)
        return {
          ...point,
          screenPosition: screenPos ? { x: screenPos.x, y: screenPos.y } : point.screenPosition
        }
      }))
    }

    const mapInstance = mapRef.current.getMapInstance()
    if (mapInstance && typeof mapInstance.on === 'function') {
      mapInstance.on('move', updateScreenPositions)
      mapInstance.on('zoom', updateScreenPositions)
    }

    return () => {
      if (mapInstance && typeof mapInstance.off === 'function') {
        mapInstance.off('move', updateScreenPositions)
        mapInstance.off('zoom', updateScreenPositions)
      }
    }
  }, [isEditing, mapRef, currentPoints.length])

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="absolute bottom-6 z-40"
        style={{ left: sidebarExpanded ? 336 : 76 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isEditing ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={stopEditing}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
            >
              <Trash2 size={24} />
            </Button>
            <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
              {editingPolygonId ? "Cancel Edit" : "Cancel"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={startEditing}
              className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
            >
              <Pentagon size={24} />
            </Button>
            <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
              Create Polygon
            </span>
          </div>
        )}
      </motion.div>

      {/* Editing UI */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Instructions */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
            {editingPolygonId ? (
              <div className="flex items-center gap-2">
                <span>Edit polygon: drag points to move, right-click to remove</span>
                <button 
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs pointer-events-auto"
                  onClick={() => completePolygon(currentPoints)}
                >
                  Save Changes
                </button>
              </div>
            ) : 
             currentPoints.length === 0 ? "Click on the map to start creating a polygon" :
             currentPoints.length < 3 ? `Added ${currentPoints.length} point${currentPoints.length > 1 ? 's' : ''}. Need ${3 - currentPoints.length} more.` :
             "Click on the first point to complete the polygon"}
          </div>

          {/* Polygon outline */}
          {currentPoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                points={currentPoints.map(p => `${p.screenPosition?.x || 0},${p.screenPosition?.y || 0}`).join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {/* Line back to first point if we have enough points */}
              {currentPoints.length >= 3 && currentPoints[0].screenPosition && currentPoints[currentPoints.length - 1].screenPosition && (
                <line
                  x1={currentPoints[currentPoints.length - 1].screenPosition?.x || 0}
                  y1={currentPoints[currentPoints.length - 1].screenPosition?.y || 0}
                  x2={currentPoints[0].screenPosition?.x || 0}
                  y2={currentPoints[0].screenPosition?.y || 0}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
              )}
            </svg>
          )}

          {/* Points */}
          {currentPoints.map((point, index) => (
            <motion.div
              key={point.id}
              className={cn(
                "absolute w-4 h-4 rounded-full border-2 border-white pointer-events-auto cursor-pointer",
                index === 0 && currentPoints.length >= 3 && !editingPolygonId
                  ? "bg-green-500 hover:bg-green-600" // Green for completion in creation mode (still clickable to complete)
                  : "bg-blue-500 hover:bg-blue-600", // Blue for all other points and all points in editing mode
                hoveredPointId === point.id && "scale-125"
              )}
              style={{
                left: (point.screenPosition?.x || 0) - 8,
                top: (point.screenPosition?.y || 0) - 8,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: hoveredPointId === point.id ? 1.25 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onMouseEnter={() => setHoveredPointId(point.id)}
              onMouseLeave={() => setHoveredPointId(null)}
              onClick={(e) => handlePointClick(point.id, e)}
              onMouseDown={(e) => handlePointMouseDown(point.id, e)}
              onContextMenu={(e) => {
                e.preventDefault()
                removePoint(point.id)
              }}
            >
              {/* Point number */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/60 px-1 rounded">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  )
}
