"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function LogsTab() {
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(0)

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(Date.now())
  }, [])

  const logs = [
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 2).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Map tiles loaded successfully",
      source: "MapContainer",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 5).toISOString() : new Date(0).toISOString(),
      level: "WARN",
      message: "Mapbox token not found in environment variables",
      source: "MapContainer",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 8).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Bottom dock resized to 90% height",
      source: "BottomDock",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 12).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Sidebar expanded",
      source: "Sidebar",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 15).toISOString() : new Date(0).toISOString(),
      level: "ERROR",
      message: "Failed to connect to IoT sensor endpoint",
      source: "DataSource",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 18).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Analytics data refreshed",
      source: "AnalyticsTab",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 22).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Node editor canvas initialized",
      source: "NodeEditorTab",
    },
    {
      timestamp: isClient ? new Date(currentTime - 1000 * 60 * 25).toISOString() : new Date(0).toISOString(),
      level: "INFO",
      message: "Dashboard application started",
      source: "System",
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "destructive"
      case "WARN":
        return "secondary"
      case "INFO":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <div className="p-4 h-full">
      <Card className="h-full bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">System Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] px-4">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <Badge variant={getLevelColor(log.level) as any} className="text-xs min-w-[50px] justify-center">
                    {log.level}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-muted-foreground">[{log.source}]</span>
                    </div>
                    <p className="text-sm text-foreground">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
