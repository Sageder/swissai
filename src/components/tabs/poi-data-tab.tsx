"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useData } from "@/lib/data-context"
import { convertResourcesToPOIs, convertMonitoringStationsToPOIs } from "@/utils/resource-to-poi"
import { blattentPOIs, getPOIColor, getPOIIcon } from "@/data/pois"
import { Database, Server, Cloud, Wifi, MapPin, Activity } from "lucide-react"

export function POIDataTab() {
  const { resources, monitoringStations, isLoading } = useData()

  // Convert data to POIs
  const resourcePOIs = convertResourcesToPOIs(resources)
  const monitoringPOIs = convertMonitoringStationsToPOIs(monitoringStations)
  
  // Categorize POIs
  const resourcePOIsList = [...blattentPOIs.filter(poi => poi.type !== 'sensor' && poi.type !== 'research'), ...resourcePOIs]
  const dataSourcePOIs = [...blattentPOIs.filter(poi => poi.type === 'sensor' || poi.type === 'research'), ...monitoringPOIs]

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300'
      case 'inactive': return 'bg-yellow-500/20 text-yellow-300'
      case 'maintenance': return 'bg-blue-500/20 text-blue-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-300'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300'
      case 'low': return 'bg-green-500/20 text-green-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="p-4 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-6">
          {/* Resources Section */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-lg">Resources</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {resourcePOIsList.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {resourcePOIsList.map((poi, index) => (
                    <div key={poi.id} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/50">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: getPOIColor(poi.type) + '20', color: getPOIColor(poi.type) }}
                        >
                          {getPOIIcon(poi.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{poi.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(poi.status)}`}>
                            {poi.status || 'unknown'}
                          </Badge>
                          {poi.severity && (
                            <Badge className={`text-xs ${getSeverityColor(poi.severity)}`}>
                              {poi.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {poi.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>📍 {poi.metadata.coordinates.lat.toFixed(4)}, {poi.metadata.coordinates.long.toFixed(4)}</span>
                          {poi.contact && <span>📞 {poi.contact}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {resourcePOIsList.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No resources available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Separator />

          {/* Data Sources Section */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-green-400" />
                <CardTitle className="text-lg">Data Sources</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {dataSourcePOIs.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {dataSourcePOIs.map((poi, index) => (
                    <div key={poi.id} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/50">
                      <div className="flex-shrink-0">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: getPOIColor(poi.type) + '20', color: getPOIColor(poi.type) }}
                        >
                          {getPOIIcon(poi.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{poi.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(poi.status)}`}>
                            {poi.status || 'unknown'}
                          </Badge>
                          {poi.severity && (
                            <Badge className={`text-xs ${getSeverityColor(poi.severity)}`}>
                              {poi.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {poi.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>📍 {poi.metadata.coordinates.lat.toFixed(4)}, {poi.metadata.coordinates.long.toFixed(4)}</span>
                          {poi.contact && <span>📞 {poi.contact}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {dataSourcePOIs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No data sources available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">POI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{resourcePOIsList.length}</div>
                  <div className="text-sm text-muted-foreground">Resources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{dataSourcePOIs.length}</div>
                  <div className="text-sm text-muted-foreground">Data Sources</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
