"use client"

import { Button } from "@/components/ui/button"
import { PanelLeftOpen, PanelLeftClose, Map, Layers, Settings, Database, BarChart3, Users, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
  activeView?: string
  onViewChange?: (view: string) => void
}

const townPreviews = [
  { id: "town-1", name: "Downtown", previewUrl: "/downtown-cityscape.jpg" },
  { id: "town-2", name: "Harbor District", previewUrl: "/harbor-waterfront.jpg" },
  { id: "town-3", name: "Industrial Zone", previewUrl: "/industrial-buildings.jpg" },
  { id: "town-4", name: "Residential", previewUrl: "/residential-neighborhood.jpg" },
  { id: "town-5", name: "Tech Campus", previewUrl: "/modern-tech-campus.png" },
  { id: "town-6", name: "Historic Quarter", previewUrl: "/historic-buildings.jpg" },
]

export function Sidebar({ expanded, onToggle, activeView = "map", onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "map", icon: Map, label: "Map View" },
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "data", icon: Database, label: "Data Sources" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "collaboration", icon: Users, label: "Collaboration" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  const handleMenuClick = (itemId: string) => {
    if (onViewChange) {
      onViewChange(itemId)
    }
  }

  return (
    <motion.div
      animate={{ width: expanded ? 320 : 60 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute left-0 top-0 bottom-0 z-50 glass-sidebar"
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Affected Areas</h2>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white/80 hover:text-white hover:bg-white/10 border-0"
          >
            <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Town Previews Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-4 border-b border-white/10"
          >
            <h3 className="text-sm font-medium text-white/90 mb-3">Town Previews</h3>
            <div className="town-preview-grid">
              {townPreviews.map((town, index) => (
                <motion.div
                  key={town.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="town-preview-card cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="town-preview-image">
                    <img
                      src={town.previewUrl || "/placeholder.svg"}
                      alt={town.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div className="town-preview-label">{town.name}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-3"
            >
              <h3 className="text-xs font-medium text-white/60 px-2 mb-2 uppercase tracking-wider">Navigation</h3>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-white/80 border-0",
                  !expanded && "px-2",
                  activeView === item.id 
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200" 
                    : "hover:text-white hover:bg-white/10",
                )}
                onClick={() => handleMenuClick(item.id)}
              >
                <item.icon size={18} />
                <AnimatePresence mode="wait">
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-white/50"
            >
              Dashboard v1.0
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-2 h-2 bg-blue-400 rounded-full mx-auto"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
