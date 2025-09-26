"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnalyticsTab } from "@/components/tabs/analytics-tab"
import { NodeEditorTab } from "@/components/tabs/node-editor-tab"
import { DataTab } from "@/components/tabs/data-tab"
import { LogsTab } from "@/components/tabs/logs-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"
import { motion, AnimatePresence } from "framer-motion"

interface BottomDockProps {
  height: number
  onHeightChange: (height: number) => void
  onTerrainToggle?: (enabled: boolean, exaggeration?: number) => void
}

export function BottomDock({ height, onHeightChange, onTerrainToggle }: BottomDockProps) {
  const [activeTab, setActiveTab] = useState("analytics")
  const [isExpanded, setIsExpanded] = useState(true)

  const tabs = [
    { id: "analytics", label: "Analytics", component: AnalyticsTab },
    { id: "node-editor", label: "Node Editor", component: NodeEditorTab },
    { id: "data", label: "Data Sources", component: DataTab },
    { id: "logs", label: "System Logs", component: LogsTab },
    { id: "settings", label: "Settings", component: SettingsTab },
  ]

  const toggleSize = () => {
    const newHeight = height === 33 ? 90 : 33
    onHeightChange(newHeight)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    onHeightChange(isExpanded ? 5 : 33)
  }

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || AnalyticsTab

  return (
    <motion.div layout transition={{ duration: 0.3, ease: "easeInOut" }} className="h-full">
      <Card className="h-full bg-card border-t border-border rounded-none">
        {/* Dock Header */}
        <motion.div layout className="flex items-center justify-between p-3 border-b border-border bg-card/50">
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
              onClick={toggleSize}
              className="text-muted-foreground hover:text-foreground"
            >
              <motion.div animate={{ rotate: height === 90 ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {height === 90 ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </motion.div>
            </Button>
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
        </motion.div>

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
                className="h-full"
              >
                {activeTab === "settings" ? <SettingsTab onTerrainToggle={onTerrainToggle} /> : <ActiveComponent />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
