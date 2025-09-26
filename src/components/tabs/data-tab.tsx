"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Cloud, Wifi } from "lucide-react"

export function DataTab() {
  const dataSources = [
    {
      name: "Primary Database",
      type: "PostgreSQL",
      status: "Connected",
      icon: Database,
      records: "2.4M",
      lastSync: "2 minutes ago",
    },
    {
      name: "Analytics API",
      type: "REST API",
      status: "Connected",
      icon: Server,
      records: "156K",
      lastSync: "5 minutes ago",
    },
    {
      name: "Cloud Storage",
      type: "S3 Bucket",
      status: "Connected",
      icon: Cloud,
      records: "89GB",
      lastSync: "1 hour ago",
    },
    {
      name: "IoT Sensors",
      type: "MQTT",
      status: "Disconnected",
      icon: Wifi,
      records: "0",
      lastSync: "Never",
    },
  ]

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataSources.map((source, index) => (
          <Card key={index} className="bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <source.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{source.name}</CardTitle>
                </div>
                <Badge variant={source.status === "Connected" ? "default" : "destructive"} className="text-xs">
                  {source.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{source.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Records:</span>
                  <span className="font-mono">{source.records}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span>{source.lastSync}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Data Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2.6M</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">89GB</div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3/4</div>
              <div className="text-sm text-muted-foreground">Sources Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
