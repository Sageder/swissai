"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mountain, Map, Palette, Globe, Settings2, Clock } from "lucide-react"
import { useTime } from "@/lib/time-context"

interface SettingsTabProps {
  onTerrainToggle?: (enabled: boolean, exaggeration?: number) => void
}

export function SettingsTab({ onTerrainToggle }: SettingsTabProps) {
  const [terrainEnabled, setTerrainEnabled] = useState(true)
  const [terrainExaggeration, setTerrainExaggeration] = useState([1.2])
  const [showSky, setShowSky] = useState(true)
  const { isRealTimeEnabled, toggleRealTime, timeOffset, setTimeOffset } = useTime()

  const handleTerrainToggle = (enabled: boolean) => {
    setTerrainEnabled(enabled)
    if (onTerrainToggle) {
      onTerrainToggle(enabled, terrainExaggeration[0])
    }
  }

  const handleExaggerationChange = (value: number[]) => {
    setTerrainExaggeration(value)
    if (terrainEnabled && onTerrainToggle) {
      onTerrainToggle(true, value[0])
    }
  }


  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Map Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map size={16} />
            Map Settings
          </CardTitle>
          <CardDescription>Configure map display and interaction options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Terrain Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mountain size={16} className="text-muted-foreground" />
                <Label htmlFor="terrain-toggle" className="text-sm font-medium">
                  3D Terrain
                </Label>
              </div>
              <Switch id="terrain-toggle" checked={terrainEnabled} onCheckedChange={handleTerrainToggle} />
            </div>

            {terrainEnabled && (
              <div className="space-y-2 pl-6">
                <Label className="text-xs text-muted-foreground">
                  Terrain Exaggeration: {terrainExaggeration[0].toFixed(1)}x
                </Label>
                <Slider
                  value={terrainExaggeration}
                  onValueChange={handleExaggerationChange}
                  max={3.0}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtle (0.5x)</span>
                  <span>Dramatic (3.0x)</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Sky Layer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" />
              <Label htmlFor="sky-toggle" className="text-sm font-medium">
                Atmospheric Sky
              </Label>
            </div>
            <Switch id="sky-toggle" checked={showSky} onCheckedChange={setShowSky} />
          </div>

        </CardContent>
      </Card>

      {/* Timeline Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock size={16} />
            Timeline Settings
          </CardTitle>
          <CardDescription>Configure time progression and display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Real-time Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <Label htmlFor="realtime-toggle" className="text-sm font-medium">
                Real-time Progression
              </Label>
            </div>
            <Switch 
              id="realtime-toggle" 
              checked={isRealTimeEnabled} 
              onCheckedChange={toggleRealTime} 
            />
          </div>

          {/* Auto-progression Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-green-400" />
              <Label className="text-sm font-medium text-green-400">
                Auto-progression (1h/min)
              </Label>
            </div>
            <div className="text-xs text-green-400">Always Active</div>
          </div>

          <Separator />

          {/* Quick Time Controls */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Time Jump</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTimeOffset(0)}
                className={timeOffset === 0 ? "bg-blue-500/20" : ""}
              >
                Now
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTimeOffset(6)}
                className={Math.abs(timeOffset - 6) < 0.1 ? "bg-blue-500/20" : ""}
              >
                +6h
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTimeOffset(12)}
                className={Math.abs(timeOffset - 12) < 0.1 ? "bg-blue-500/20" : ""}
              >
                +12h
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette size={16} />
            Display Settings
          </CardTitle>
          <CardDescription>Customize the dashboard appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="sm">
              Reset View
            </Button>
            <Button variant="outline" size="sm">
              Export Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="ghost" size="sm" className="justify-start">
              Reset All Settings
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Import Configuration
            </Button>
            <Button variant="ghost" size="sm" className="justify-start">
              Export Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
