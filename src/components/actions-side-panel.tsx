"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Users, 
  Phone, 
  Truck, 
  MapPin,
  Zap,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PolygonData } from "./polygon-editor";
import { generateTextWithFirebaseData } from "@/lib/agent";

interface ActionsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  polygon: PolygonData | null;
}

interface EmergencyAction {
  id: string;
  category: "evacuation" | "medical" | "communication" | "resources" | "coordination";
  title: string;
  description: string;
  priority: "immediate" | "high" | "medium" | "low";
  timeline: string;
  resources?: string[];
}

interface EmergencyResponse {
  situation: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  actions: EmergencyAction[];
  timeline: {
    immediate: EmergencyAction[];
    shortTerm: EmergencyAction[];
    longTerm: EmergencyAction[];
  };
  nearbyResources: string[];
}

const categoryIcons = {
  evacuation: Users,
  medical: AlertTriangle,
  communication: Phone,
  resources: Truck,
  coordination: MapPin,
};

const priorityColors = {
  immediate: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-green-500 text-white",
};

const riskLevelColors = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-orange-600 bg-orange-100",
  critical: "text-red-600 bg-red-100",
};

export function ActionsSidePanel({ isOpen, onClose, polygon }: ActionsSidePanelProps) {
  const [response, setResponse] = useState<EmergencyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && polygon) {
      generateEmergencyResponse(polygon);
    }
  }, [isOpen, polygon]);

  const generateEmergencyResponse = async (polygonData: PolygonData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = `Analyze this emergency polygon area and generate comprehensive emergency response recommendations:

Polygon Details:
- Name: ${polygonData.name}
- Area ID: ${polygonData.id}
- Vertices: ${polygonData.vertices.length} points
- Coordinates: ${JSON.stringify(polygonData.vertices)}

Please provide:
1. Situation assessment and risk level
2. Prioritized emergency actions by category (evacuation, medical, communication, resources, coordination)
3. Timeline breakdown (immediate, short-term, long-term actions)
4. Nearby resource recommendations

Format as JSON with the structure:
{
  "situation": "brief assessment",
  "riskLevel": "low|medium|high|critical",
  "actions": [array of action objects],
  "timeline": {
    "immediate": [actions for 0-1 hour],
    "shortTerm": [actions for 1-24 hours], 
    "longTerm": [actions for 1+ days]
  },
  "nearbyResources": [list of recommended resources]
}`;

      const result = await generateTextWithFirebaseData(prompt);
      const resultText = typeof result === 'string' ? result : result.text || JSON.stringify(result);
      
      // Try to parse JSON response
      let parsedResponse: EmergencyResponse;
      try {
        parsedResponse = JSON.parse(resultText);
      } catch {
        // Fallback to mock data if parsing fails
        parsedResponse = generateMockResponse(polygonData);
      }
      
      setResponse(parsedResponse);
    } catch (err) {
      console.error("Error generating emergency response:", err);
      setError("Failed to generate emergency response");
      // Use mock data as fallback
      setResponse(generateMockResponse(polygonData));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (polygonData: PolygonData): EmergencyResponse => {
    return {
      situation: `Emergency response analysis for ${polygonData.name}. Area requires immediate assessment and potential evacuation procedures.`,
      riskLevel: "high",
      actions: [
        {
          id: "1",
          category: "evacuation",
          title: "Establish Evacuation Routes",
          description: "Set up primary and secondary evacuation routes from the affected area",
          priority: "immediate",
          timeline: "0-30 minutes",
          resources: ["Emergency vehicles", "Traffic control personnel"]
        },
        {
          id: "2",
          category: "medical",
          title: "Deploy Medical Teams",
          description: "Position medical response teams at strategic locations",
          priority: "immediate",
          timeline: "0-15 minutes",
          resources: ["Ambulances", "Medical personnel", "First aid stations"]
        },
        {
          id: "3",
          category: "communication",
          title: "Alert Residents",
          description: "Issue emergency alerts to all residents in the affected area",
          priority: "immediate",
          timeline: "0-10 minutes",
          resources: ["Emergency broadcast system", "Mobile alerts"]
        },
        {
          id: "4",
          category: "resources",
          title: "Resource Mobilization",
          description: "Deploy emergency resources and equipment to the area",
          priority: "high",
          timeline: "30-60 minutes",
          resources: ["Heavy machinery", "Emergency supplies", "Personnel"]
        }
      ],
      timeline: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      },
      nearbyResources: [
        "Blatten Fire Station (2.1 km)",
        "Regional Hospital (15.3 km)",
        "Police Station (8.7 km)",
        "Emergency Shelter (5.2 km)"
      ]
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l shadow-2xl z-50"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">Emergency Actions</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Analyzing emergency response...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : response ? (
              <div className="space-y-4">
                {/* Situation Assessment */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Situation Assessment</CardTitle>
                      <Badge className={riskLevelColors[response.riskLevel]}>
                        {response.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {response.situation}
                    </p>
                  </CardContent>
                </Card>

                {/* Emergency Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Priority Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {response.actions.map((action) => {
                      const IconComponent = categoryIcons[action.category];
                      return (
                        <div key={action.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} className="text-gray-600 mt-0.5" />
                              <h4 className="text-sm font-medium">{action.title}</h4>
                            </div>
                            <Badge 
                              className={`text-xs ${priorityColors[action.priority]}`}
                            >
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">
                            {action.description}
                          </p>
                          <div className="flex items-center gap-4 pl-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {action.timeline}
                            </div>
                          </div>
                          {action.resources && action.resources.length > 0 && (
                            <div className="pl-6">
                              <div className="flex flex-wrap gap-1">
                                {action.resources.map((resource, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {resource}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Nearby Resources */}
                {response.nearbyResources.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Nearby Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {response.nearbyResources.map((resource, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-gray-500" />
                          <span>{resource}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
