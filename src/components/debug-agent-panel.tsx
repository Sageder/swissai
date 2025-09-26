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
  sendVehicle,
  sendHelicopter,
  addBlatten,
  createTestAlert,
  initializeCrisisNodes,
  createSampleCrisisScenario,
  clearCrisisNodes,
  getCrisisNodes,
  getCrisisConnections,
  addCrisisNode,
  addCrisisConnection,
  createCrisisGraphFromLLM,
  createCrisisWorkflow,
  createCrisisHierarchy,
  validateLLMGraphData
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
  Car,
  Building,
  Bell,
  Network,
  Plus,
  Link
} from 'lucide-react';

interface DebugAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  liveMode: boolean;
  onLiveModeToggle: () => void;
}

export function DebugAgentPanel({ isOpen, onClose, liveMode, onLiveModeToggle }: DebugAgentPanelProps) {
  const { monitoringStations, authorities, resources, vehicleMovements, isLoading } = useData();
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
    addAllPOIs({
      monitoringStations,
      resources,
      authorities
    });
  };

  const handleAddBlatten = () => {
    addBlatten();
  };

  const handleSendVehicle = async () => {
    // First add Blatten if not already added
    addBlatten();

    // Get current POIs to find one to send vehicle from
    const currentPOIs = getCurrentPOIs();
    if (currentPOIs.length === 0) {
      alert('No POIs available. Please add some POIs first.');
      return;
    }

    // Find Blatten POI
    const blattenPOI = currentPOIs.find(poi => poi.id === 'blatten-city-center');
    if (!blattenPOI) {
      alert('Blatten POI not found. Please add Blatten first.');
      return;
    }

    // Find another POI to send vehicle from (prefer research station)
    const fromPOI = currentPOIs.find(poi => poi.id === 'blatten-research-station') || currentPOIs[0];

    // Send vehicle from the other POI to Blatten
    await sendVehicle(fromPOI.id, blattenPOI.id, 'fire_truck', 15000); // 15 second journey
  };

  const handleSendHelicopter = async () => {
    // Check if data is loaded
    if (isLoading) {
      alert('Please wait for data to load before sending helicopter.');
      return;
    }

    // First add Blatten if not already added
    addBlatten();

    // Get current POIs to find one to send helicopter from
    const currentPOIs = getCurrentPOIs();
    if (currentPOIs.length === 0) {
      alert('No POIs available. Please add some POIs first.');
      return;
    }

    // Find Blatten POI
    const blattenPOI = currentPOIs.find(poi => poi.id === 'blatten-city-center');
    if (!blattenPOI) {
      alert('Blatten POI not found. Please add Blatten first.');
      return;
    }

    // Find another POI to send helicopter from (prefer research station)
    const fromPOI = currentPOIs.find(poi => poi.id === 'blatten-research-station') || currentPOIs[0];

    try {
      // Send helicopter from the other POI to Blatten
      await sendHelicopter(fromPOI.id, blattenPOI.id, 10000); // 10 second journey
    } catch (error) {
      console.error('Failed to send helicopter:', error);
      alert('Failed to send helicopter. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
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
          {/* Live Mode Toggle */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Live Mode:</div>
            <Button
              onClick={onLiveModeToggle}
              size="sm"
              className={`w-full ${liveMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${liveMode ? 'bg-red-300' : 'bg-gray-400'}`}></div>
                {liveMode ? 'LIVE MODE ACTIVE' : 'Enable Live Mode'}
              </div>
            </Button>
          </div>

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
              <Badge variant={vehicleMovements.length > 0 ? "default" : "secondary"} className="text-xs">
                Vehicles: {vehicleMovements.length}
              </Badge>
              <Badge variant={liveMode ? "destructive" : "secondary"} className="text-xs">
                Live: {liveMode ? 'ON' : 'OFF'}
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

          {/* Vehicle Controls */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Vehicle Controls:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddBlatten}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Building className="w-4 h-4 mr-1" />
                Add Blatten
              </Button>
              <Button
                onClick={handleSendVehicle}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Car className="w-4 h-4 mr-1" />
                Send Vehicle
              </Button>
              <Button
                onClick={handleSendHelicopter}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 col-span-2"
                disabled={isLoading}
              >
                🚁 Send Helicopter
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

          {/* Crisis Node Editor Controls */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">Crisis Node Editor:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={initializeCrisisNodes}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Network className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              <Button
                onClick={createSampleCrisisScenario}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Sample Scenario
              </Button>
              <Button
                onClick={() => {
                  const nodeId = addCrisisNode({
                    type: 'alert',
                    title: 'New Alert',
                    description: 'Custom alert',
                    status: 'active',
                    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
                    severity: 'medium'
                  });
                  console.log('Added new crisis node:', nodeId);
                }}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Node
              </Button>
              <Button
                onClick={() => {
                  const nodes = getCrisisNodes();
                  const connections = getCrisisConnections();
                  if (nodes.length > 1) {
                    const fromNode = nodes[0];
                    const toNode = nodes[1];
                    const connId = addCrisisConnection({
                      from: fromNode.id,
                      to: toNode.id,
                      type: 'data_flow',
                      status: 'active',
                      label: 'Connection'
                    });
                    console.log('Added new crisis connection:', connId);
                  } else {
                    console.log('Need at least 2 nodes to create connection');
                  }
                }}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Link className="w-4 h-4 mr-1" />
                Add Connection
              </Button>
              <Button
                onClick={clearCrisisNodes}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 col-span-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All Nodes
              </Button>
            </div>
          </div>

          {/* LLM Graph Creation Functions */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">LLM Graph Creation:</div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => {
                  // Test LLM graph creation with sample data
                  const sampleLLMData = {
                    nodes: [
                      {
                        id: 'llm_alert_1',
                        type: 'alert' as const,
                        title: 'LLM Generated Alert',
                        description: 'AI-detected crisis',
                        status: 'active',
                        severity: 'high' as const,
                        position: { x: 100, y: 100 }
                      },
                      {
                        id: 'llm_response_1',
                        type: 'response' as const,
                        title: 'LLM Response Plan',
                        description: 'AI-generated response',
                        status: 'pending',
                        severity: 'medium' as const,
                        position: { x: 300, y: 100 }
                      },
                      {
                        id: 'llm_resource_1',
                        type: 'resource' as const,
                        title: 'LLM Resource',
                        description: 'AI-allocated resource',
                        status: 'available',
                        severity: 'low' as const,
                        position: { x: 200, y: 250 }
                      }
                    ],
                    connections: [
                      {
                        from: 'llm_alert_1',
                        to: 'llm_response_1',
                        type: 'response' as const,
                        label: 'TRIGGERS'
                      },
                      {
                        from: 'llm_response_1',
                        to: 'llm_resource_1',
                        type: 'coordination' as const,
                        label: 'DEPLOYS'
                      }
                    ]
                  };

                  const validation = validateLLMGraphData(sampleLLMData);
                  if (validation.valid) {
                    createCrisisGraphFromLLM(sampleLLMData);
                    console.log('Created LLM graph successfully');
                  } else {
                    console.error('LLM graph validation failed:', validation.errors);
                  }
                }}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Network className="w-4 h-4 mr-1" />
                Test LLM Graph
              </Button>

              <Button
                onClick={() => {
                  // Test crisis workflow creation
                  createCrisisWorkflow({
                    alert: {
                      title: 'Earthquake Alert',
                      description: 'Magnitude 6.2 detected',
                      severity: 'high'
                    },
                    monitoring: [
                      { title: 'Seismic Monitor', description: 'Real-time tracking', position: { x: 50, y: 200 } },
                      { title: 'GPS Tracker', description: 'Location monitoring', position: { x: 150, y: 200 } }
                    ],
                    responses: [
                      { title: 'Emergency Response', description: 'Immediate action', position: { x: 100, y: 300 } },
                      { title: 'Evacuation Plan', description: 'Zone A & B', position: { x: 250, y: 300 } }
                    ],
                    resources: [
                      { title: 'Fire Department', description: '3 Units', position: { x: 50, y: 400 } },
                      { title: 'Medical Teams', description: '2 Units', position: { x: 200, y: 400 } }
                    ],
                    authorities: [
                      { title: 'Crisis Commander', description: 'Overall coordination', position: { x: 300, y: 200 } }
                    ]
                  });
                  console.log('Created crisis workflow');
                }}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Crisis Workflow
              </Button>

              <Button
                onClick={() => {
                  // Test crisis hierarchy creation
                  createCrisisHierarchy({
                    root: {
                      title: 'Crisis Command Center',
                      description: 'Central coordination hub',
                      type: 'authority'
                    },
                    levels: [
                      {
                        level: 0,
                        nodes: [
                          {
                            title: 'Emergency Response Team',
                            description: 'First responders',
                            type: 'response',
                            connections: ['root']
                          },
                          {
                            title: 'Medical Team',
                            description: 'Healthcare response',
                            type: 'response',
                            connections: ['root']
                          }
                        ]
                      },
                      {
                        level: 1,
                        nodes: [
                          {
                            title: 'Fire Department',
                            description: 'Fire suppression',
                            type: 'resource',
                            connections: ['level_0_node_0']
                          },
                          {
                            title: 'Police Department',
                            description: 'Security and order',
                            type: 'resource',
                            connections: ['level_0_node_0']
                          }
                        ]
                      }
                    ]
                  });
                  console.log('Created crisis hierarchy');
                }}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Network className="w-4 h-4 mr-1" />
                Crisis Hierarchy
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
                <div>• Vehicle Movements: {vehicleMovements.length}</div>
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
