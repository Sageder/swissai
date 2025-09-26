"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react"

export function AnalyticsTab() {
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(0)

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(Date.now())
  }, [])
  const metrics = [
    { label: "Active Users", value: "2,847", change: "+12%", icon: Users },
    { label: "Data Points", value: "45.2K", change: "+8%", icon: Activity },
    { label: "Processing Rate", value: "98.5%", change: "+2%", icon: TrendingUp },
    { label: "System Load", value: "67%", change: "-5%", icon: BarChart3 },
  ]

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-primary">{metric.change}</p>
                </div>
                <metric.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Real-time Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Data processing event #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground">
                      {isClient ? new Date(currentTime - i * 30000).toLocaleTimeString() : "--:--:--"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-mono">245ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Connections</span>
                <span className="text-sm font-mono">12/50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-mono">4.2GB/8GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-mono">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
