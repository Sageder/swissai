"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  showTimeline,
  hideTimeline,
  addMonitoringSources,
  addResources,
  addAuthorities,
  addAllPOIs,
  onlyShowSelectedResources,
  clearAllPOIs,
  getStateSummary,
  isTimelineVisible,
  shouldShowPOIs,
  getCurrentPOIs,
  onPOIVisibilityChange,
  onTimelineVisibilityChange,
  createTestAlert
} from '@/lib/util';
import { useData } from '@/lib/data-context';
import {
  Play,
  Square,
  Eye,
  EyeOff,
  MapPin,
  Trash2,
  Activity,
  Shield,
  Truck,
  Target,
  Bell
} from 'lucide-react';

interface DebugAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugAgentPanel({ isOpen, onClose }: DebugAgentPanelProps) {
  const { monitoringStations, authorities, resources } = useData();
  const [state, setState] = useState(getStateSummary());
  const [isExpanded, setIsExpanded] = useState(false);

  // Update state when utility functions are called
  useEffect(() => {
    const updateState = () => {
      setState(getStateSummary());
    };

    // Listen for POI changes using the callback system
    const unsubscribePOI = onPOIVisibilityChange(updateState);
    const unsubscribeTimeline = onTimelineVisibilityChange(updateState);

    // Set initial state
    updateState();

    return () => {
      unsubscribePOI();
      unsubscribeTimeline();
    };
  }, []);

  const handleShowTimeline = () => {
    showTimeline();
  };

  const handleHideTimeline = () => {
    hideTimeline();
  };

  const handleAddMonitoringSources = () => {
    addMonitoringSources(monitoringStations);
  };

  const handleAddResources = () => {
    addResources(resources);
  };

  const handleAddAuthorities = () => {
    addAuthorities(authorities);
  };

  const handleShowOnlySelectedResources = () => {
    // Show only the first 2 resources as an example
    const selectedResources = resources.slice(0, 2);
    onlyShowSelectedResources(selectedResources);
  };

  const handleClearAllPOIs = () => {
    clearAllPOIs();
  };

  const handleEmergencySetup = () => {
    showTimeline();
    addAllPOIs([...monitoringStations, ...resources, ...authorities]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Debug Agent
              <span className="text-xs text-gray-400 font-normal">(Ctrl+D)</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white"
              >
                {isExpanded ? '−' : '+'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* State Display */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Current State:</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={state.timelineVisible ? "default" : "secondary"} className="text-xs">
                Timeline: {state.timelineVisible ? 'ON' : 'OFF'}
              </Badge>
              <Badge variant={state.poisVisible ? "default" : "secondary"} className="text-xs">
                POIs: {state.poiCount}
              </Badge>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Timeline Controls:</div>
            <div className="flex gap-2">
              <Button
                onClick={handleShowTimeline}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                Show
              </Button>
              <Button
                onClick={handleHideTimeline}
                size="sm"
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </Button>
            </div>
          </div>

          {/* POI Controls */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">POI Controls:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddMonitoringSources}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={monitoringStations.length === 0}
              >
                <MapPin className="w-4 h-4 mr-1" />
                Monitoring
              </Button>
              <Button
                onClick={handleAddResources}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={resources.length === 0}
              >
                <Truck className="w-4 h-4 mr-1" />
                Resources
              </Button>
              <Button
                onClick={handleAddAuthorities}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={authorities.length === 0}
              >
                <Shield className="w-4 h-4 mr-1" />
                Authorities
              </Button>
              <Button
                onClick={handleShowOnlySelectedResources}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
                disabled={resources.length === 0}
              >
                <Target className="w-4 h-4 mr-1" />
                Selected
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Quick Actions:</div>
            <div className="flex gap-2">
              <Button
                onClick={handleEmergencySetup}
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Emergency Setup
              </Button>
              <Button
                onClick={handleClearAllPOIs}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createTestAlert}
                size="sm"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Bell className="w-4 h-4 mr-1" />
                Test Alert
              </Button>
            </div>
          </div>

          {/* Expanded Info */}
          {isExpanded && (
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <div>Data Available:</div>
                <div>• Monitoring Stations: {monitoringStations.length}</div>
                <div>• Resources: {resources.length}</div>
                <div>• Authorities: {authorities.length}</div>
                <div className="pt-2 text-gray-500">
                  Use these buttons to test the utility functions that AI models can call.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
