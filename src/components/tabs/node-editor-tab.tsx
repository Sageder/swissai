"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

export function NodeEditorTab() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)))
  }

  const resetView = () => {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-3 border-b border-border bg-card/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Node Editor Canvas</h3>
            <motion.span
              key={zoom}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground"
            >
              Zoom: {Math.round(zoom * 100)}%
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}>
                <ZoomIn size={16} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}>
                <ZoomOut size={16} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={resetView}>
                <RotateCcw size={16} />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <motion.div
          animate={{
            x: pan.x,
            y: pan.y,
            scale: zoom,
          }}
          transition={{
            type: "tween",
            duration: isDragging ? 0 : 0.3,
            ease: "easeOut",
          }}
          className="absolute inset-0 node-editor-bg"
          style={{
            transformOrigin: "0 0",
          }}
        >
          {/* Grid overlay for better visual reference */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </motion.div>

        {/* Instructions overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute top-4 left-4 right-4 pointer-events-none"
        >
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Node Editor Canvas Ready</strong> - Drag to pan, scroll to zoom. This dotted background provides
                the foundation for your node-based editor with smooth animations.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
