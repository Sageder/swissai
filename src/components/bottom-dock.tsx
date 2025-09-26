"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronUp, ChevronDown, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { NodeEditorTab } from "@/components/tabs/node-editor-tab"
import { DataTab } from "@/components/tabs/data-tab"
import { POIDataTab } from "@/components/tabs/poi-data-tab"
import { LogsTab } from "@/components/tabs/logs-tab"
import { ChatTab } from "@/components/tabs/chat-tab"
import { motion, AnimatePresence } from "framer-motion"

interface BottomDockProps {
  height: number
  onHeightChange: (height: number) => void
  onTerrainToggle?: (enabled: boolean, exaggeration?: number) => void
}

export function BottomDock({ height, onHeightChange, onTerrainToggle }: BottomDockProps) {
  const [activeTab, setActiveTab] = useState("node-editor")
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number>(0)
  const dragStartHeight = useRef<number>(0)

  const tabs = [
    { id: "node-editor", label: "Graph Editor", component: NodeEditorTab },
    { id: "data", label: "Data Sources", component: DataTab },
    { id: "poi-data", label: "POI Data", component: POIDataTab },
    { id: "chat", label: "AI Assistant", component: ChatTab },
    { id: "logs", label: "System Logs", component: LogsTab },
  ]

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = height
    
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }, [height])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaY = dragStartY.current - e.clientY
    const viewportHeight = window.innerHeight
    const deltaPercentage = (deltaY / viewportHeight) * 100
    const newHeight = Math.max(8, Math.min(90, dragStartHeight.current + deltaPercentage))
    
    // Auto-collapse if dragged very small
    if (newHeight <= 12) {
      setIsExpanded(false)
      onHeightChange(8)
    } else {
      setIsExpanded(true)
      onHeightChange(newHeight)
    }
  }, [isDragging, onHeightChange])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [isDragging])

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    // When collapsed, keep enough height for the header (about 60px = ~8% on 1080p screen)
    onHeightChange(isExpanded ? 8 : 33)
  }

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || NodeEditorTab

  return (
    <motion.div layout transition={{ duration: 0.3, ease: "easeInOut" }} className="h-full">
      <Card className="h-full bg-card border-t border-border rounded-none relative">
        {/* Resize Handle */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-2 cursor-ns-resize group hover:bg-blue-500/20 transition-colors",
            isDragging && "bg-blue-500/30"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <GripHorizontal 
              size={16} 
              className={cn(
                "text-muted-foreground group-hover:text-blue-400 transition-colors",
                isDragging && "text-blue-400"
              )} 
            />
          </div>
        </div>

        {/* Dock Header - Always Visible */}
        <div className={cn(
          "flex items-center justify-between p-3 bg-card/50 min-h-[60px] mt-2",
          isExpanded ? "border-b border-border" : "border-b-2 border-blue-500/30"
        )}>
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex gap-1">
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Button
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn("text-xs", activeTab === tab.id && "bg-accent text-accent-foreground")}
                  >
                    {tab.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-muted-foreground hover:text-foreground"
            >
              <motion.div animate={{ rotate: isExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 overflow-hidden"
            >
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <ActiveComponent />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
