'use client';

import React, { useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

export function SimulationDemo() {
  const {
    state,
    events,
    isLoading,
    error,
    start,
    pause,
    stop,
    setSpeed,
    setTime,
    loadData,
    clearEvents,
    formatTime,
    getTimeProgress
  } = useSimulation();

  const [speed, setSpeedValue] = useState(1);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setSpeedValue(newSpeed);
    setSpeed(newSpeed);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'detection': return 'bg-blue-500';
      case 'escalation': return 'bg-yellow-500';
      case 'evacuation': return 'bg-orange-500';
      case 'response': return 'bg-red-500';
      case 'recovery': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sensor_alert': return '📡';
      case 'authority_status_changed': return '👮';
      case 'resource_deployed': return '🚁';
      case 'evacuation_started': return '🚨';
      case 'livestock_evacuation_started': return '🐄';
      case 'disaster_event': return '💥';
      default: return '📋';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Swiss Emergency Management Simulation</h1>
        <Badge className={`${getPhaseColor(state.phase)} text-white`}>
          {state.phase.toUpperCase()}
        </Badge>
      </div>

      {/* Simulation Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Simulation Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Time</label>
            <p className="text-lg font-mono">{formatTime(state.currentTime)}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Progress</label>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getTimeProgress()}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{getTimeProgress().toFixed(1)}%</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Speed</label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[speed]}
                onValueChange={handleSpeedChange}
                max={10}
                min={0.1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12">{speed}x</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={start} 
            disabled={state.isRunning || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            ▶️ Start
          </Button>
          <Button 
            onClick={pause} 
            disabled={!state.isRunning}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            ⏸️ Pause
          </Button>
          <Button 
            onClick={stop} 
            disabled={!state.isRunning}
            className="bg-red-600 hover:bg-red-700"
          >
            ⏹️ Stop
          </Button>
          <Button 
            onClick={loadData} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '⏳ Loading...' : '📊 Load Data'}
          </Button>
          <Button 
            onClick={clearEvents}
            variant="outline"
          >
            🗑️ Clear Events
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}
      </Card>

      {/* Event Log */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Event Log</h2>
          <Badge variant="outline">{events.length} events</Badge>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events yet. Start the simulation to see events.</p>
          ) : (
            events.slice(-20).reverse().map((event, index) => (
              <div 
                key={`${event.timestamp}-${index}`}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-2xl">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{event.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {JSON.stringify(event.data, null, 2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Simulation Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Simulation Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Blatten Glacier Collapse Scenario</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• 320 residents evacuated</li>
              <li>• 45 tourists relocated</li>
              <li>• 607 livestock rescued</li>
              <li>• 6 authorities involved</li>
              <li>• 12 resources deployed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Timeline</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• May 17: Initial detection</li>
              <li>• May 19: Evacuation orders</li>
              <li>• May 20: Livestock rescue</li>
              <li>• May 28: Glacier collapse</li>
              <li>• Ongoing: Recovery operations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
