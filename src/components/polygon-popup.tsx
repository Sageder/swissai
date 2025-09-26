"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Pencil, Check, X, Trash2, Edit3, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { PolygonData } from "./polygon-editor"

interface PolygonPopupProps {
  polygon: PolygonData | null
  position: { x: number; y: number } | null
  onClose: () => void
  onUpdateName: (polygonId: string, newName: string) => void
  onEdit: (polygonId: string) => void
  onDelete: (polygonId: string) => void
  onActions?: (polygon: PolygonData) => void
}

export function PolygonPopup({ 
  polygon, 
  position, 
  onClose, 
  onUpdateName, 
  onEdit, 
  onDelete,
  onActions
}: PolygonPopupProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (polygon) {
      setEditedName(polygon.name)
    }
  }, [polygon])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (polygon) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [polygon, onClose])

  const handleSaveName = () => {
    if (polygon && editedName.trim()) {
      onUpdateName(polygon.id, editedName.trim())
      setIsEditingName(false)
    }
  }

  const handleCancelEdit = () => {
    if (polygon) {
      setEditedName(polygon.name)
      setIsEditingName(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  if (!polygon || !position) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        className="absolute z-50 pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%)',
        }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="w-80 bg-background/95 backdrop-blur-sm border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    ref={inputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-sm font-semibold"
                    placeholder="Polygon name..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveName}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-sm truncate">{polygon.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil size={14} />
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 ml-2"
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Polygon Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: polygon.color }}
                  />
                  <span>Color: {polygon.color}</span>
                </div>
                <div>Vertices: {polygon.vertices.length}</div>
                <div>ID: {polygon.id.split('-').pop()}</div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {onActions && (
                  <Button
                    size="sm"
                    onClick={() => onActions(polygon)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                  >
                    <Zap size={14} className="mr-2" />
                    Actions
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(polygon.id)}
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit3 size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(polygon.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
