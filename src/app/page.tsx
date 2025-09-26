"use client"

import { useState, useRef } from "react"
import { MapContainer, type MapRef } from "@/components/map-container"
import { Sidebar } from "@/components/sidebar"
import { BottomDock } from "@/components/bottom-dock"
import { motion } from "framer-motion"

export default function Dashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [dockHeight, setDockHeight] = useState(33) // percentage
  const [activeView, setActiveView] = useState("map")
  const mapRef = useRef<MapRef>(null)

  const handleTerrainToggle = (enabled: boolean, exaggeration?: number) => {
    if (mapRef.current) {
      mapRef.current.toggleTerrain(enabled, exaggeration)
    }
  }


  const handleViewChange = (view: string) => {
    setActiveView(view)
    console.log(`[v0] Switched to ${view} view`)
  }

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden dark">
      {/* Main Layout Container */}
      <div className="relative h-full flex">
        {/* Main Content Area - Full Width */}
        <div className="flex-1 relative">
          {/* Full-screen Map */}
          <motion.div
            animate={{
              bottom: `${dockHeight}%`,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <MapContainer ref={mapRef} />
          </motion.div>

          {/* Bottom Dock - Positioned to not overlap with sidebar */}
          <motion.div
            animate={{
              height: `${dockHeight}%`,
              left: sidebarExpanded ? "320px" : "60px",
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-0 right-0"
          >
            <BottomDock height={dockHeight} onHeightChange={setDockHeight} onTerrainToggle={handleTerrainToggle} />
          </motion.div>
        </div>

        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
          activeView={activeView}
          onViewChange={handleViewChange}
        />
      </div>
    </div>
  )
}
